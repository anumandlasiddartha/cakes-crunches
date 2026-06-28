/**
 * ═══════════════════════════════════════════════════════════════
 * Payment Service — Advance & Balance payment processing
 *
 * Implements payment recording, balance calculations, ledger
 * entries, and payment status workflow updates.
 * ═══════════════════════════════════════════════════════════════
 */

import { prisma } from "../utils/prisma.js";
import { parsePagination, paginatedResponse } from "../utils/pagination.js";
import { v4 as uuidv4 } from "uuid";

export const paymentService = {
  /**
   * Generate transaction reference: TXN-YYYYMMDD-XXXX
   */
  _generateRef() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `TXN-${date}-${uuidv4().slice(0, 4).toUpperCase()}`;
  },

  /**
   * Record an advance payment for a bulk order.
   * Business rules:
   *   - Updates advanceAmount, paidAmount, balanceAmount on the order
   *   - Creates a ledger entry
   *   - Updates payment status (unpaid → partial → paid)
   *   - Creates alert if advance is below minimum threshold
   */
  async recordAdvancePayment({ bulkOrderId, amount, paymentMethod, referenceNumber, notes, receivedBy }) {
    const order = await prisma.bulkOrder.findFirst({
      where: { id: bulkOrderId, deletedAt: null },
      include: { customer: true },
    });

    if (!order) throw Object.assign(new Error("Bulk order not found."), { statusCode: 404 });

    const amountVal = parseFloat(amount);
    if (amountVal <= 0) throw Object.assign(new Error("Amount must be positive."), { statusCode: 400 });

    const currentPaid = parseFloat(order.paidAmount) || 0;
    const grandTotal = parseFloat(order.grandTotal) || 0;
    const remaining = grandTotal - currentPaid;

    if (amountVal > remaining) {
      throw Object.assign(
        new Error(`Payment exceeds remaining balance of ₹${remaining.toFixed(2)}.`),
        { statusCode: 400 }
      );
    }

    // Create advance payment record
    const payment = await prisma.advancePayment.create({
      data: {
        bulkOrderId,
        amount: amountVal,
        paymentMethod,
        referenceNumber,
        notes,
        receivedBy,
      },
    });

    // Update order financial fields
    const newPaidAmount = currentPaid + amountVal;
    const newAdvanceAmount = (parseFloat(order.advanceAmount) || 0) + amountVal;
    const newBalanceAmount = grandTotal - newPaidAmount;
    const paymentStatus = newBalanceAmount <= 0 ? "paid" : "partial";

    await prisma.bulkOrder.update({
      where: { id: bulkOrderId },
      data: {
        advanceAmount: newAdvanceAmount,
        paidAmount: newPaidAmount,
        balanceAmount: Math.max(0, newBalanceAmount),
        paymentStatus,
      },
    });

    // Create ledger entry
    const lastLedger = await prisma.ledgerEntry.findFirst({
      orderBy: { createdAt: "desc" },
    });
    const runningBalance = (parseFloat(lastLedger?.runningBalance) || 0) + amountVal;

    await prisma.ledgerEntry.create({
      data: {
        transactionRef: this._generateRef(),
        type: "advance_received",
        debit: 0,
        credit: amountVal,
        runningBalance,
        description: `Advance payment for order ${order.orderNumber} from ${order.customer.name}`,
        advancePaymentId: payment.id,
        createdBy: receivedBy,
      },
    });

    // Update customer total spent
    await prisma.customer.update({
      where: { id: order.customerId },
      data: { totalSpent: { increment: amountVal } },
    });

    // Check advance percentage and create alert if low
    const advancePercent = (newAdvanceAmount / grandTotal) * 100;
    if (advancePercent < 30 && paymentStatus !== "paid") {
      await prisma.alert.create({
        data: {
          type: "low_advance",
          severity: "warning",
          title: "Low Advance Payment",
          message: `Order ${order.orderNumber} has only ${advancePercent.toFixed(1)}% advance (₹${newAdvanceAmount.toLocaleString()} of ₹${grandTotal.toLocaleString()}).`,
          entityType: "bulk_order",
          entityId: bulkOrderId,
        },
      });
    }

    return {
      payment,
      orderUpdate: { paidAmount: newPaidAmount, balanceAmount: Math.max(0, newBalanceAmount), paymentStatus },
    };
  },

  /**
   * Record a balance payment for a bulk order.
   */
  async recordBalancePayment({ bulkOrderId, amount, paymentMethod, referenceNumber, notes, receivedBy }) {
    const order = await prisma.bulkOrder.findFirst({
      where: { id: bulkOrderId, deletedAt: null },
      include: { customer: true },
    });

    if (!order) throw Object.assign(new Error("Bulk order not found."), { statusCode: 404 });

    const amountVal = parseFloat(amount);
    if (amountVal <= 0) throw Object.assign(new Error("Amount must be positive."), { statusCode: 400 });

    const currentPaid = parseFloat(order.paidAmount) || 0;
    const grandTotal = parseFloat(order.grandTotal) || 0;
    const remaining = grandTotal - currentPaid;

    if (amountVal > remaining + 0.01) { // Small tolerance for floating point
      throw Object.assign(
        new Error(`Payment exceeds remaining balance of ₹${remaining.toFixed(2)}.`),
        { statusCode: 400 }
      );
    }

    const payment = await prisma.balancePayment.create({
      data: {
        bulkOrderId,
        amount: amountVal,
        paymentMethod,
        referenceNumber,
        notes,
        receivedBy,
      },
    });

    const newPaidAmount = currentPaid + amountVal;
    const newBalanceAmount = grandTotal - newPaidAmount;
    const paymentStatus = newBalanceAmount <= 0.01 ? "paid" : "partial";

    await prisma.bulkOrder.update({
      where: { id: bulkOrderId },
      data: {
        paidAmount: newPaidAmount,
        balanceAmount: Math.max(0, newBalanceAmount),
        paymentStatus,
      },
    });

    // Ledger entry
    const lastLedger = await prisma.ledgerEntry.findFirst({
      orderBy: { createdAt: "desc" },
    });
    const runningBalance = (parseFloat(lastLedger?.runningBalance) || 0) + amountVal;

    await prisma.ledgerEntry.create({
      data: {
        transactionRef: this._generateRef(),
        type: "balance_received",
        debit: 0,
        credit: amountVal,
        runningBalance,
        description: `Balance payment for order ${order.orderNumber} from ${order.customer.name}`,
        balancePaymentId: payment.id,
        createdBy: receivedBy,
      },
    });

    // Update customer total spent
    await prisma.customer.update({
      where: { id: order.customerId },
      data: { totalSpent: { increment: amountVal } },
    });

    return {
      payment,
      orderUpdate: { paidAmount: newPaidAmount, balanceAmount: Math.max(0, newBalanceAmount), paymentStatus },
    };
  },

  /**
   * Get all payments (advance + balance) with pagination.
   */
  async getAllPayments(query) {
    const { skip, take, page, limit } = parsePagination(query);

    const [advances, balances, totalAdvances, totalBalances] = await Promise.all([
      prisma.advancePayment.findMany({
        where: { deletedAt: null },
        skip, take,
        orderBy: { receivedDate: "desc" },
        include: { bulkOrder: { include: { customer: { select: { name: true, phone: true } } } } },
      }),
      prisma.balancePayment.findMany({
        where: { deletedAt: null },
        skip, take,
        orderBy: { paidDate: "desc" },
        include: { bulkOrder: { include: { customer: { select: { name: true, phone: true } } } } },
      }),
      prisma.advancePayment.count({ where: { deletedAt: null } }),
      prisma.balancePayment.count({ where: { deletedAt: null } }),
    ]);

    // Merge and sort
    const combined = [
      ...advances.map((a) => ({ ...a, paymentType: "advance" })),
      ...balances.map((b) => ({ ...b, paymentType: "balance", receivedDate: b.paidDate })),
    ].sort((a, b) => new Date(b.receivedDate) - new Date(a.receivedDate));

    return paginatedResponse(combined, totalAdvances + totalBalances, page, limit);
  },

  /**
   * Get payments for a specific order.
   */
  async getOrderPayments(bulkOrderId) {
    const [advances, balances] = await Promise.all([
      prisma.advancePayment.findMany({
        where: { bulkOrderId, deletedAt: null },
        orderBy: { receivedDate: "desc" },
      }),
      prisma.balancePayment.findMany({
        where: { bulkOrderId, deletedAt: null },
        orderBy: { paidDate: "desc" },
      }),
    ]);

    return { advances, balances };
  },

  /**
   * Get payment statistics.
   */
  async getPaymentStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [dailyAdv, dailyBal, weeklyAdv, weeklyBal, monthlyAdv, monthlyBal, totalAdv, totalBal] =
      await Promise.all([
        prisma.advancePayment.aggregate({ where: { receivedDate: { gte: today }, deletedAt: null }, _sum: { amount: true } }),
        prisma.balancePayment.aggregate({ where: { paidDate: { gte: today }, deletedAt: null }, _sum: { amount: true } }),
        prisma.advancePayment.aggregate({ where: { receivedDate: { gte: weekAgo }, deletedAt: null }, _sum: { amount: true } }),
        prisma.balancePayment.aggregate({ where: { paidDate: { gte: weekAgo }, deletedAt: null }, _sum: { amount: true } }),
        prisma.advancePayment.aggregate({ where: { receivedDate: { gte: monthStart }, deletedAt: null }, _sum: { amount: true } }),
        prisma.balancePayment.aggregate({ where: { paidDate: { gte: monthStart }, deletedAt: null }, _sum: { amount: true } }),
        prisma.advancePayment.aggregate({ where: { deletedAt: null }, _sum: { amount: true } }),
        prisma.balancePayment.aggregate({ where: { deletedAt: null }, _sum: { amount: true } }),
      ]);

    return {
      daily: (parseFloat(dailyAdv._sum.amount) || 0) + (parseFloat(dailyBal._sum.amount) || 0),
      weekly: (parseFloat(weeklyAdv._sum.amount) || 0) + (parseFloat(weeklyBal._sum.amount) || 0),
      monthly: (parseFloat(monthlyAdv._sum.amount) || 0) + (parseFloat(monthlyBal._sum.amount) || 0),
      totalAdvance: parseFloat(totalAdv._sum.amount) || 0,
      totalBalance: parseFloat(totalBal._sum.amount) || 0,
      total: (parseFloat(totalAdv._sum.amount) || 0) + (parseFloat(totalBal._sum.amount) || 0),
    };
  },

  /**
   * Get orders with outstanding balances.
   */
  async getOutstandingBalances(query) {
    const { skip, take, page, limit } = parsePagination(query);
    const where = {
      deletedAt: null,
      balanceAmount: { gt: 0 },
      paymentStatus: { in: ["unpaid", "partial", "overdue"] },
    };

    const [data, total] = await Promise.all([
      prisma.bulkOrder.findMany({
        where, skip, take,
        orderBy: { paymentDueDate: "asc" },
        include: { customer: { select: { id: true, name: true, phone: true } } },
      }),
      prisma.bulkOrder.count({ where }),
    ]);

    return paginatedResponse(data, total, page, limit);
  },
};
