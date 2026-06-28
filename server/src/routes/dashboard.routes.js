/**
 * Dashboard Routes — Aggregated KPIs for dashboard page
 */
import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { prisma } from "../utils/prisma.js";

const router = Router();
router.use(authenticate);

router.get("/kpis", asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalRevenue, todayOrders, pendingOrders, completedOrders,
    totalAdvance, totalPendingBalance, todayCollection,
    recentOrders, upcomingDues, recentActivities,
  ] = await Promise.all([
    // Total revenue
    prisma.bulkOrder.aggregate({ where: { deletedAt: null }, _sum: { grandTotal: true } }),
    // Today's orders
    prisma.bulkOrder.count({ where: { orderDate: { gte: today }, deletedAt: null } }),
    // Pending orders
    prisma.bulkOrder.count({ where: { status: { in: ["pending", "confirmed", "in_production"] }, deletedAt: null } }),
    // Completed orders
    prisma.bulkOrder.count({ where: { status: "completed", deletedAt: null } }),
    // Total advance collected
    prisma.advancePayment.aggregate({ where: { deletedAt: null }, _sum: { amount: true } }),
    // Total pending balance
    prisma.bulkOrder.aggregate({ where: { deletedAt: null, balanceAmount: { gt: 0 } }, _sum: { balanceAmount: true } }),
    // Today's collection
    Promise.all([
      prisma.advancePayment.aggregate({ where: { receivedDate: { gte: today }, deletedAt: null }, _sum: { amount: true } }),
      prisma.balancePayment.aggregate({ where: { paidDate: { gte: today }, deletedAt: null }, _sum: { amount: true } }),
    ]).then(([a, b]) => (parseFloat(a._sum.amount) || 0) + (parseFloat(b._sum.amount) || 0)),
    // Recent orders
    prisma.bulkOrder.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: { select: { name: true } } },
    }),
    // Upcoming due dates
    prisma.bulkOrder.findMany({
      where: {
        deletedAt: null,
        paymentDueDate: { gte: today },
        balanceAmount: { gt: 0 },
      },
      orderBy: { paymentDueDate: "asc" },
      take: 5,
      include: { customer: { select: { name: true } } },
    }),
    // Recent activities
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  // Wallet balance
  const walletBalance = await prisma.wallet.aggregate({ _sum: { balance: true } });

  res.json({
    success: true,
    data: {
      kpis: {
        totalRevenue: parseFloat(totalRevenue._sum.grandTotal) || 0,
        todayOrders,
        pendingOrders,
        completedOrders,
        totalAdvance: parseFloat(totalAdvance._sum.amount) || 0,
        totalPendingBalance: parseFloat(totalPendingBalance._sum.balanceAmount) || 0,
        walletBalance: parseFloat(walletBalance._sum.balance) || 0,
        todayCollection,
      },
      recentOrders,
      upcomingDues,
      recentActivities,
    },
  });
}));

export default router;
