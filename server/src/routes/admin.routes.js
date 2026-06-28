/**
 * Admin Routes — Settings, audit logs, user management
 */
import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { prisma } from "../utils/prisma.js";
import { parsePagination, paginatedResponse } from "../utils/pagination.js";

const router = Router();
router.use(authenticate);

// ── Settings ─────────────────────────────────────────
router.get("/settings", asyncHandler(async (req, res) => {
  const settings = await prisma.setting.findMany({ orderBy: { category: "asc" } });
  res.json({ success: true, data: settings });
}));

router.put("/settings/:key", authorize("admin"), asyncHandler(async (req, res) => {
  const { value } = req.body;
  const setting = await prisma.setting.upsert({
    where: { key: req.params.key },
    update: { value: String(value) },
    create: { key: req.params.key, value: String(value), description: req.body.description },
  });
  res.json({ success: true, data: setting });
}));

// ── Audit Logs ───────────────────────────────────────
router.get("/audit-logs", authorize("admin"), asyncHandler(async (req, res) => {
  const { skip, take, page, limit } = parsePagination(req.query);
  const where = {};
  if (req.query.tableName) where.tableName = req.query.tableName;
  if (req.query.action) where.action = req.query.action;
  if (req.query.userId) where.userId = parseInt(req.query.userId);

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where, skip, take,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  res.json(paginatedResponse(data, total, page, limit));
}));

// ── Activity Logs ────────────────────────────────────
router.get("/activity-logs", asyncHandler(async (req, res) => {
  const { skip, take, page, limit } = parsePagination(req.query);
  const where = {};
  if (req.query.userId) where.userId = parseInt(req.query.userId);

  const [data, total] = await Promise.all([
    prisma.activityLog.findMany({
      where, skip, take,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { firstName: true, lastName: true, email: true, role: true } } },
    }),
    prisma.activityLog.count({ where }),
  ]);

  res.json(paginatedResponse(data, total, page, limit));
}));

// ── System Stats ─────────────────────────────────────
router.get("/system-stats", authorize("admin"), asyncHandler(async (req, res) => {
  const [users, customers, orders, payments, alerts] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.customer.count({ where: { deletedAt: null } }),
    prisma.bulkOrder.count({ where: { deletedAt: null } }),
    prisma.advancePayment.count({ where: { deletedAt: null } }),
    prisma.alert.count({ where: { isRead: false } }),
  ]);

  res.json({
    success: true,
    data: { users, customers, orders, payments, unreadAlerts: alerts },
  });
}));

export default router;
