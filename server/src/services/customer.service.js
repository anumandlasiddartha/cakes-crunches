/**
 * ═══════════════════════════════════════════════════════════════
 * Customer Service — CRUD + analytics for customer management
 * ═══════════════════════════════════════════════════════════════
 */

import { prisma } from "../utils/prisma.js";
import { parsePagination, parseSorting, buildSearchFilter, paginatedResponse } from "../utils/pagination.js";

export const customerService = {
  async getAll(query) {
    const { skip, take, page, limit } = parsePagination(query);
    const orderBy = parseSorting(query.sortBy, query.sortOrder);
    const search = buildSearchFilter(query.search, ["name", "phone", "email", "city"]);

    const where = { deletedAt: null, ...(search || {}) };

    const [data, total] = await Promise.all([
      prisma.customer.findMany({ where, skip, take, orderBy, include: { wallet: true } }),
      prisma.customer.count({ where }),
    ]);

    return paginatedResponse(data, total, page, limit);
  },

  async getById(id) {
    const customer = await prisma.customer.findFirst({
      where: { id, deletedAt: null },
      include: {
        wallet: true,
        bulkOrders: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { orderItems: true },
        },
      },
    });
    if (!customer) throw Object.assign(new Error("Customer not found."), { statusCode: 404 });
    return customer;
  },

  async create(data) {
    const customer = await prisma.customer.create({ data });

    // Auto-create wallet for new customer
    await prisma.wallet.create({
      data: { customerId: customer.id, balance: 0 },
    });

    return customer;
  },

  async update(id, data) {
    await this.getById(id); // Validate existence
    return prisma.customer.update({ where: { id }, data });
  },

  async delete(id) {
    await this.getById(id);
    return prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  },

  async getPaymentHistory(customerId) {
    const orders = await prisma.bulkOrder.findMany({
      where: { customerId, deletedAt: null },
      include: {
        advancePayments: { where: { deletedAt: null } },
        balancePayments: { where: { deletedAt: null } },
      },
      orderBy: { createdAt: "desc" },
    });
    return orders;
  },

  async getStats(customerId) {
    const stats = await prisma.bulkOrder.aggregate({
      where: { customerId, deletedAt: null },
      _sum: { totalAmount: true, paidAmount: true, balanceAmount: true },
      _count: true,
    });
    return {
      totalOrders: stats._count,
      totalAmount: stats._sum.totalAmount || 0,
      totalPaid: stats._sum.paidAmount || 0,
      totalBalance: stats._sum.balanceAmount || 0,
    };
  },
};
