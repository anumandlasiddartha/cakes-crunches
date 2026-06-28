/**
 * Notification Routes
 */
import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { prisma } from "../utils/prisma.js";
import { parsePagination, paginatedResponse } from "../utils/pagination.js";

const router = Router();
router.use(authenticate);

router.get("/", asyncHandler(async (req, res) => {
  const { skip, take, page, limit } = parsePagination(req.query);
  const where = { userId: req.user.id };
  if (req.query.isRead === "false") where.isRead = false;

  const [data, total] = await Promise.all([
    prisma.notification.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
    prisma.notification.count({ where }),
  ]);

  res.json(paginatedResponse(data, total, page, limit));
}));

router.get("/unread-count", asyncHandler(async (req, res) => {
  const count = await prisma.notification.count({
    where: { userId: req.user.id, isRead: false },
  });
  res.json({ success: true, data: { count } });
}));

router.patch("/:id/read", asyncHandler(async (req, res) => {
  await prisma.notification.update({
    where: { id: parseInt(req.params.id) },
    data: { isRead: true, readAt: new Date() },
  });
  res.json({ success: true, message: "Notification read." });
}));

router.patch("/read-all", asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  res.json({ success: true, message: "All notifications read." });
}));

export default router;
