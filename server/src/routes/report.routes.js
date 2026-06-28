/**
 * Report Routes — CSV/PDF export endpoints
 */
import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { prisma } from "../utils/prisma.js";

const router = Router();
router.use(authenticate);

// Revenue report data
router.get("/revenue", asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const where = { deletedAt: null };
  if (from || to) {
    where.orderDate = {};
    if (from) where.orderDate.gte = new Date(from);
    if (to) where.orderDate.lte = new Date(to);
  }

  const orders = await prisma.bulkOrder.findMany({
    where,
    select: {
      orderNumber: true, orderDate: true, grandTotal: true, paidAmount: true,
      balanceAmount: true, advanceAmount: true, status: true, paymentStatus: true,
      customer: { select: { name: true } },
    },
    orderBy: { orderDate: "desc" },
  });

  const summary = orders.reduce((acc, o) => ({
    totalRevenue: acc.totalRevenue + (parseFloat(o.grandTotal) || 0),
    totalCollected: acc.totalCollected + (parseFloat(o.paidAmount) || 0),
    totalPending: acc.totalPending + (parseFloat(o.balanceAmount) || 0),
    totalAdvance: acc.totalAdvance + (parseFloat(o.advanceAmount) || 0),
  }), { totalRevenue: 0, totalCollected: 0, totalPending: 0, totalAdvance: 0 });

  res.json({ success: true, data: { orders, summary } });
}));

// Export CSV
router.get("/export/csv/:type", asyncHandler(async (req, res) => {
  const { type } = req.params;
  let rows = [];
  let headers = [];

  if (type === "orders") {
    headers = ["Order#", "Customer", "Date", "Total", "Paid", "Balance", "Status"];
    const orders = await prisma.bulkOrder.findMany({
      where: { deletedAt: null },
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    rows = orders.map(o => [
      o.orderNumber, o.customer.name, o.orderDate?.toISOString().split("T")[0],
      o.grandTotal, o.paidAmount, o.balanceAmount, o.status,
    ]);
  } else if (type === "payments") {
    headers = ["Ref", "Order#", "Customer", "Amount", "Method", "Date", "Type"];
    const advances = await prisma.advancePayment.findMany({
      where: { deletedAt: null },
      include: { bulkOrder: { include: { customer: { select: { name: true } } } } },
    });
    const balances = await prisma.balancePayment.findMany({
      where: { deletedAt: null },
      include: { bulkOrder: { include: { customer: { select: { name: true } } } } },
    });
    rows = [
      ...advances.map(a => [a.referenceNumber || "", a.bulkOrder.orderNumber, a.bulkOrder.customer.name, a.amount, a.paymentMethod, a.receivedDate?.toISOString().split("T")[0], "Advance"]),
      ...balances.map(b => [b.referenceNumber || "", b.bulkOrder.orderNumber, b.bulkOrder.customer.name, b.amount, b.paymentMethod, b.paidDate?.toISOString().split("T")[0], "Balance"]),
    ];
  } else if (type === "customers") {
    headers = ["Name", "Phone", "Email", "City", "Total Orders", "Total Spent"];
    const customers = await prisma.customer.findMany({ where: { deletedAt: null } });
    rows = customers.map(c => [c.name, c.phone, c.email || "", c.city || "", c.totalOrders, c.totalSpent]);
  }

  // Build CSV string
  const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=report-${type}-${Date.now()}.csv`);
  res.send(csv);
}));

// Pending balance report
router.get("/pending-balance", asyncHandler(async (req, res) => {
  const orders = await prisma.bulkOrder.findMany({
    where: { deletedAt: null, balanceAmount: { gt: 0 } },
    include: { customer: { select: { name: true, phone: true } } },
    orderBy: { balanceAmount: "desc" },
  });
  res.json({ success: true, data: orders });
}));

// Advance collection report
router.get("/advance-collection", asyncHandler(async (req, res) => {
  const payments = await prisma.advancePayment.findMany({
    where: { deletedAt: null },
    include: {
      bulkOrder: { select: { orderNumber: true, grandTotal: true, customer: { select: { name: true } } } },
    },
    orderBy: { receivedDate: "desc" },
  });
  res.json({ success: true, data: payments });
}));

// Monthly report
router.get("/monthly", asyncHandler(async (req, res) => {
  const year = parseInt(req.query.year) || new Date().getFullYear();
  const monthlyData = [];

  for (let month = 0; month < 12; month++) {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59);

    const [orderCount, revenue, collected] = await Promise.all([
      prisma.bulkOrder.count({ where: { orderDate: { gte: start, lte: end }, deletedAt: null } }),
      prisma.bulkOrder.aggregate({ where: { orderDate: { gte: start, lte: end }, deletedAt: null }, _sum: { grandTotal: true } }),
      prisma.bulkOrder.aggregate({ where: { orderDate: { gte: start, lte: end }, deletedAt: null }, _sum: { paidAmount: true } }),
    ]);

    monthlyData.push({
      month: start.toLocaleString("default", { month: "short" }),
      orders: orderCount,
      revenue: parseFloat(revenue._sum.grandTotal) || 0,
      collected: parseFloat(collected._sum.paidAmount) || 0,
    });
  }

  res.json({ success: true, data: monthlyData });
}));

export default router;
