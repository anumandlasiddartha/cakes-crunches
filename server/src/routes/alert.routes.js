/**
 * Alert Routes — System alerts for payment dues, overdue, etc.
 */
import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { prisma } from "../utils/prisma.js";
import { parsePagination, paginatedResponse } from "../utils/pagination.js";

const router = Router();
router.use(authenticate);

// Get all alerts
router.get("/", asyncHandler(async (req, res) => {
  const { skip, take, page, limit } = parsePagination(req.query);
  const where = {};
  if (req.query.type) where.type = req.query.type;
  if (req.query.severity) where.severity = req.query.severity;
  if (req.query.isRead === "false") where.isRead = false;
  if (req.query.isRead === "true") where.isRead = true;

  const [data, total] = await Promise.all([
    prisma.alert.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
    prisma.alert.count({ where }),
  ]);

  res.json(paginatedResponse(data, total, page, limit));
}));

// Get unread count
router.get("/unread-count", asyncHandler(async (req, res) => {
  const count = await prisma.alert.count({ where: { isRead: false, isDismissed: false } });
  res.json({ success: true, data: { count } });
}));

// Mark as read
router.patch("/:id/read", asyncHandler(async (req, res) => {
  await prisma.alert.update({
    where: { id: parseInt(req.params.id) },
    data: { isRead: true, readAt: new Date() },
  });
  res.json({ success: true, message: "Alert marked as read." });
}));

// Mark all as read
router.patch("/read-all", asyncHandler(async (req, res) => {
  await prisma.alert.updateMany({
    where: { isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  res.json({ success: true, message: "All alerts marked as read." });
}));

// Dismiss alert
router.patch("/:id/dismiss", asyncHandler(async (req, res) => {
  await prisma.alert.update({
    where: { id: parseInt(req.params.id) },
    data: { isDismissed: true, isRead: true },
  });
  res.json({ success: true, message: "Alert dismissed." });
}));

export default router;
