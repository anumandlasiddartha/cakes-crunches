/**
 * User Routes — User management
 */
import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { prisma } from "../utils/prisma.js";
import { parsePagination, paginatedResponse } from "../utils/pagination.js";
import bcrypt from "bcryptjs";

const router = Router();
router.use(authenticate);

// List all users (admin/manager only)
router.get("/", authorize("admin", "manager"), asyncHandler(async (req, res) => {
  const { skip, take, page, limit } = parsePagination(req.query);
  const where = { deletedAt: null };
  if (req.query.roleId) where.roleId = parseInt(req.query.roleId);

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where, skip, take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, email: true, firstName: true, lastName: true, phone: true,
        roleId: true, isActive: true, lastLoginAt: true, createdAt: true,
        role: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  res.json(paginatedResponse(data, total, page, limit));
}));

// Get user by ID
router.get("/:id", asyncHandler(async (req, res) => {
  const user = await prisma.user.findFirst({
    where: { id: parseInt(req.params.id), deletedAt: null },
    select: {
      id: true, email: true, firstName: true, lastName: true, phone: true,
      roleId: true, isActive: true, lastLoginAt: true, createdAt: true,
      role: true, avatar: true,
    },
  });
  if (!user) return res.status(404).json({ success: false, message: "User not found." });
  res.json({ success: true, data: user });
}));

// Update user profile
router.put("/:id", asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, avatar } = req.body;
  const user = await prisma.user.update({
    where: { id: parseInt(req.params.id) },
    data: { firstName, lastName, phone, avatar },
    select: {
      id: true, email: true, firstName: true, lastName: true, phone: true,
      roleId: true, isActive: true, role: true, avatar: true,
    },
  });
  res.json({ success: true, data: user });
}));

// Toggle user active status (admin only)
router.patch("/:id/toggle-active", authorize("admin"), asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!user) return res.status(404).json({ success: false, message: "User not found." });

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { isActive: !user.isActive },
  });
  res.json({ success: true, data: { isActive: updated.isActive } });
}));

// Delete user (soft delete, admin only)
router.delete("/:id", authorize("admin"), asyncHandler(async (req, res) => {
  await prisma.user.update({
    where: { id: parseInt(req.params.id) },
    data: { deletedAt: new Date(), isActive: false },
  });
  res.json({ success: true, message: "User deleted." });
}));

// Get roles list
router.get("/meta/roles", asyncHandler(async (req, res) => {
  const roles = await prisma.role.findMany({ where: { isActive: true } });
  res.json({ success: true, data: roles });
}));

export default router;
