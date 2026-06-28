/**
 * ═══════════════════════════════════════════════════════════════
 * Bulk Order Service — Core order management business logic
 *
 * Implements order lifecycle, status workflow, auto-calculations,
 * and integration with payment and alert systems.
 * ═══════════════════════════════════════════════════════════════
 */

import { prisma } from "../utils/prisma.js";
import { parsePagination, parseSorting, paginatedResponse } from "../utils/pagination.js";
import { v4 as uuidv4 } from "uuid";

// Order status flow
const STATUS_FLOW = [
  "pending", "confirmed", "in_production", "ready",
  "out_for_delivery", "delivered", "completed", "cancelled",
];

export const bulkOrderService = {
  /**
   * Generate unique order number: ORD-YYYYMMDD-XXXX
   */
  _generateOrderNumber() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const suffix = uuidv4().slice(0, 4).toUpperCase();
    return `ORD-${date}-${suffix}`;
  },

  /**
   * List all bulk orders with pagination, filtering, sorting.
   */
  async getAll(query) {
    const { skip, take, page, limit } = parsePagination(query);
    const orderBy = parseSorting(query.sortBy || "createdAt", query.sortOrder);

    const where = { deletedAt: null };

    // Status filter
    if (query.status) where.status = query.status;
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
    if (query.customerId) where.customerId = parseInt(query.customerId);
    if (query.priority) where.priority = query.priority;

    // Search
    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search } },
        { customer: { name: { contains: query.search } } },
      ];
    }

    // Date range
    if (query.fromDate || query.toDate) {
      where.orderDate = {};
      if (query.fromDate) where.orderDate.gte = new Date(query.fromDate);
      if (query.toDate) where.orderDate.lte = new Date(query.toDate);
    }

    const [data, total] = await Promise.all([
      prisma.bulkOrder.findMany({
        where, skip, take, orderBy,
        include: {
          customer: { select: { id: true, name: true, phone: true, email: true } },
          orderItems: true,
          _count: { select: { advancePayments: true, balancePayments: true } },
        },
      }),
      prisma.bulkOrder.count({ where }),
    ]);

    return paginatedResponse(data, total, page, limit);
  },

  /**
   * Get single bulk order with all related data.
   */
  async getById(id) {
    const order = await prisma.bulkOrder.findFirst({
      where: { id, deletedAt: null },
      include: {
        customer: true,
        orderItems: { where: { deletedAt: null } },
        advancePayments: { where: { deletedAt: null }, orderBy: { receivedDate: "desc" } },
        balancePayments: { where: { deletedAt: null }, orderBy: { paidDate: "desc" } },
        invoices: { where: { deletedAt: null } },
        reminders: { orderBy: { reminderDate: "asc" } },
        attachments: { where: { deletedAt: null } },
        orderHistory: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!order) throw Object.assign(new Error("Bulk order not found."), { statusCode: 404 });
    return order;
  },

  /**
   * Create a new bulk order with items, auto-calculations, and alerts.
   */
  async create(data, userId) {
    const {
      customerId, eventDate, eventType, eventVenue, deliveryAddress,
      items, discountAmount, taxAmount, notes, internalNotes, priority,
      paymentDueDate,
    } = data;

    // Verify customer exists
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, deletedAt: null },
    });
    if (!customer) throw Object.assign(new Error("Customer not found."), { statusCode: 404 });

    // Calculate totals from items
    let totalAmount = 0;
    const orderItems = (items || []).map((item) => {
      const itemTotal = item.quantity * item.unitPrice;
      totalAmount += itemTotal;
      return {
        itemName: item.itemName,
        description: item.description,
        category: item.category,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: itemTotal,
        weight: item.weight,
        flavor: item.flavor,
        customization: item.customization,
        notes: item.notes,
      };
    });

    const discount = parseFloat(discountAmount) || 0;
    const tax = parseFloat(taxAmount) || 0;
    const grandTotal = totalAmount - discount + tax;

    const order = await prisma.bulkOrder.create({
      data: {
        orderNumber: this._generateOrderNumber(),
        customerId,
        eventDate: eventDate ? new Date(eventDate) : null,
        eventType,
        eventVenue,
        deliveryAddress,
        totalAmount,
        discountAmount: discount,
        taxAmount: tax,
        grandTotal,
        balanceAmount: grandTotal, // Initially entire amount is balance
        advanceAmount: 0,
        paidAmount: 0,
        status: "pending",
        paymentStatus: "unpaid",
        priority: priority || "normal",
        paymentDueDate: paymentDueDate ? new Date(paymentDueDate) : null,
        notes,
        internalNotes,
        createdBy: userId,
        orderItems: { create: orderItems },
      },
      include: {
        customer: true,
        orderItems: true,
      },
    });

    // Create order history entry
    await prisma.orderHistory.create({
      data: {
        bulkOrderId: order.id,
        toStatus: "pending",
        changedBy: userId,
        notes: "Order created",
      },
    });

    // Update customer order count
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        totalOrders: { increment: 1 },
      },
    });

    // Create auto-reminder if event date is set
    if (eventDate) {
      const reminderDate = new Date(eventDate);
      reminderDate.setDate(reminderDate.getDate() - 3); // 3 days before event
      if (reminderDate > new Date()) {
        await prisma.reminder.create({
          data: {
            bulkOrderId: order.id,
            reminderDate,
            type: "payment_due",
            message: `Payment reminder for order ${order.orderNumber} — event in 3 days.`,
          },
        });
      }
    }

    // Create alert for high-value orders
    if (grandTotal >= 50000) {
      await prisma.alert.create({
        data: {
          type: "high_value_order",
          severity: "warning",
          title: "High Value Order Created",
          message: `Order ${order.orderNumber} worth ₹${grandTotal.toLocaleString()} created for ${customer.name}.`,
          entityType: "bulk_order",
          entityId: order.id,
        },
      });
    }

    return order;
  },

  /**
   * Update bulk order details.
   */
  async update(id, data, userId) {
    const existing = await this.getById(id);

    // Recalculate if items are provided
    if (data.items) {
      // Delete existing items and recreate
      await prisma.orderItem.deleteMany({ where: { bulkOrderId: id } });

      let totalAmount = 0;
      const orderItems = data.items.map((item) => {
        const itemTotal = item.quantity * item.unitPrice;
        totalAmount += itemTotal;
        return {
          bulkOrderId: id,
          itemName: item.itemName,
          description: item.description,
          category: item.category,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: itemTotal,
          weight: item.weight,
          flavor: item.flavor,
          customization: item.customization,
          notes: item.notes,
        };
      });

      await prisma.orderItem.createMany({ data: orderItems });

      const discount = parseFloat(data.discountAmount) || parseFloat(existing.discountAmount) || 0;
      const tax = parseFloat(data.taxAmount) || parseFloat(existing.taxAmount) || 0;
      const grandTotal = totalAmount - discount + tax;
      const paidAmount = parseFloat(existing.paidAmount) || 0;

      data.totalAmount = totalAmount;
      data.grandTotal = grandTotal;
      data.balanceAmount = grandTotal - paidAmount;
      data.discountAmount = discount;
      data.taxAmount = tax;

      delete data.items;
    }

    // Convert dates
    if (data.eventDate) data.eventDate = new Date(data.eventDate);
    if (data.paymentDueDate) data.paymentDueDate = new Date(data.paymentDueDate);

    data.updatedBy = userId;

    const order = await prisma.bulkOrder.update({
      where: { id },
      data,
      include: { customer: true, orderItems: true },
    });

    return order;
  },

  /**
   * Update order status with workflow validation.
   */
  async updateStatus(id, newStatus, userId, notes) {
    const order = await this.getById(id);
    const currentIndex = STATUS_FLOW.indexOf(order.status);
    const newIndex = STATUS_FLOW.indexOf(newStatus);

    // Allow cancel from any status
    if (newStatus !== "cancelled") {
      if (newIndex < 0) {
        throw Object.assign(new Error(`Invalid status: ${newStatus}`), { statusCode: 400 });
      }

      // Must have advance payment before production
      if (newStatus === "in_production" && parseFloat(order.advanceAmount) <= 0) {
        throw Object.assign(
          new Error("Advance payment is required before starting production."),
          { statusCode: 400 }
        );
      }

      // Must be fully paid before marking completed
      if (newStatus === "completed" && parseFloat(order.balanceAmount) > 0) {
        throw Object.assign(
          new Error("Full payment is required before marking order as completed."),
          { statusCode: 400 }
        );
      }
    }

    // Record status change
    await prisma.orderHistory.create({
      data: {
        bulkOrderId: id,
        fromStatus: order.status,
        toStatus: newStatus,
        changedBy: userId,
        notes,
      },
    });

    const updated = await prisma.bulkOrder.update({
      where: { id },
      data: { status: newStatus, updatedBy: userId },
    });

    return updated;
  },

  /**
   * Soft delete bulk order.
   */
  async delete(id, userId) {
    await this.getById(id);
    return prisma.bulkOrder.update({
      where: { id },
      data: { deletedAt: new Date(), status: "cancelled", updatedBy: userId },
    });
  },

  /**
   * Get order statistics.
   */
  async getOrderStats() {
    const [total, pending, confirmed, inProduction, delivered, completed, cancelled] = await Promise.all([
      prisma.bulkOrder.count({ where: { deletedAt: null } }),
      prisma.bulkOrder.count({ where: { deletedAt: null, status: "pending" } }),
      prisma.bulkOrder.count({ where: { deletedAt: null, status: "confirmed" } }),
      prisma.bulkOrder.count({ where: { deletedAt: null, status: "in_production" } }),
      prisma.bulkOrder.count({ where: { deletedAt: null, status: "delivered" } }),
      prisma.bulkOrder.count({ where: { deletedAt: null, status: "completed" } }),
      prisma.bulkOrder.count({ where: { deletedAt: null, status: "cancelled" } }),
    ]);

    return { total, pending, confirmed, inProduction, delivered, completed, cancelled };
  },
};
