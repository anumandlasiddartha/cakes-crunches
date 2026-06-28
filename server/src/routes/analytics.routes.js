/**
 * Analytics Routes — Chart data for the frontend
 */
import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { prisma } from "../utils/prisma.js";

const router = Router();
router.use(authenticate);

// Revenue trend (last 12 months)
router.get("/revenue-trend", asyncHandler(async (req, res) => {
  const months = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

    const revenue = await prisma.bulkOrder.aggregate({
      where: { orderDate: { gte: start, lte: end }, deletedAt: null },
      _sum: { grandTotal: true, paidAmount: true },
      _count: true,
    });

    months.push({
      month: start.toLocaleString("default", { month: "short", year: "2-digit" }),
      revenue: parseFloat(revenue._sum.grandTotal) || 0,
      collected: parseFloat(revenue._sum.paidAmount) || 0,
      orders: revenue._count,
    });
  }

  res.json({ success: true, data: months });
}));

// Order status distribution (pie chart)
router.get("/order-distribution", asyncHandler(async (req, res) => {
  const statuses = ["pending", "confirmed", "in_production", "ready", "delivered", "completed", "cancelled"];
  const distribution = await Promise.all(
    statuses.map(async (status) => ({
      status,
      count: await prisma.bulkOrder.count({ where: { status, deletedAt: null } }),
    }))
  );
  res.json({ success: true, data: distribution });
}));

// Payment method distribution
router.get("/payment-methods", asyncHandler(async (req, res) => {
  const advances = await prisma.advancePayment.groupBy({
    by: ["paymentMethod"],
    where: { deletedAt: null },
    _sum: { amount: true },
    _count: true,
  });

  res.json({ success: true, data: advances });
}));

// Top customers by revenue
router.get("/top-customers", asyncHandler(async (req, res) => {
  const customers = await prisma.customer.findMany({
    where: { deletedAt: null, totalOrders: { gt: 0 } },
    orderBy: { totalSpent: "desc" },
    take: 10,
    select: { id: true, name: true, totalOrders: true, totalSpent: true },
  });
  res.json({ success: true, data: customers });
}));

// Collection rate trend
router.get("/collection-rate", asyncHandler(async (req, res) => {
  const months = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

    const data = await prisma.bulkOrder.aggregate({
      where: { orderDate: { gte: start, lte: end }, deletedAt: null },
      _sum: { grandTotal: true, paidAmount: true },
    });

    const total = parseFloat(data._sum.grandTotal) || 0;
    const collected = parseFloat(data._sum.paidAmount) || 0;
    const rate = total > 0 ? ((collected / total) * 100).toFixed(1) : 0;

    months.push({
      month: start.toLocaleString("default", { month: "short" }),
      rate: parseFloat(rate),
      total,
      collected,
    });
  }

  res.json({ success: true, data: months });
}));

// Daily orders heatmap data (last 90 days)
router.get("/orders-heatmap", asyncHandler(async (req, res) => {
  const days = [];
  const now = new Date();

  for (let i = 89; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const count = await prisma.bulkOrder.count({
      where: { orderDate: { gte: date, lt: nextDay }, deletedAt: null },
    });

    days.push({ date: date.toISOString().split("T")[0], count });
  }

  res.json({ success: true, data: days });
}));

export default router;
