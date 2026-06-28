/**
 * Invoice Routes
 */
import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { prisma } from "../utils/prisma.js";
import { parsePagination, paginatedResponse } from "../utils/pagination.js";
import { v4 as uuidv4 } from "uuid";

const router = Router();
router.use(authenticate);

// List invoices
router.get("/", asyncHandler(async (req, res) => {
  const { skip, take, page, limit } = parsePagination(req.query);
  const where = { deletedAt: null };
  if (req.query.status) where.status = req.query.status;

  const [data, total] = await Promise.all([
    prisma.invoice.findMany({
      where, skip, take,
      orderBy: { createdAt: "desc" },
      include: {
        bulkOrder: {
          select: { orderNumber: true, customer: { select: { name: true, phone: true } } },
        },
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  res.json(paginatedResponse(data, total, page, limit));
}));

// Get invoice by ID
router.get("/:id", asyncHandler(async (req, res) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: parseInt(req.params.id), deletedAt: null },
    include: {
      bulkOrder: {
        include: {
          customer: true,
          orderItems: { where: { deletedAt: null } },
          advancePayments: { where: { deletedAt: null } },
          balancePayments: { where: { deletedAt: null } },
        },
      },
    },
  });
  if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found." });
  res.json({ success: true, data: invoice });
}));

// Generate invoice from bulk order
router.post("/generate/:orderId", asyncHandler(async (req, res) => {
  const orderId = parseInt(req.params.orderId);
  const order = await prisma.bulkOrder.findFirst({
    where: { id: orderId, deletedAt: null },
  });

  if (!order) return res.status(404).json({ success: false, message: "Order not found." });

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const invoiceNumber = `INV-${date}-${uuidv4().slice(0, 4).toUpperCase()}`;

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      bulkOrderId: orderId,
      subtotal: order.totalAmount,
      taxAmount: order.taxAmount,
      discountAmount: order.discountAmount,
      totalAmount: order.grandTotal,
      paidAmount: order.paidAmount,
      dueAmount: order.balanceAmount,
      status: parseFloat(order.balanceAmount) <= 0 ? "paid" : "sent",
      dueDate: order.paymentDueDate,
    },
    include: {
      bulkOrder: { include: { customer: true, orderItems: true } },
    },
  });

  res.status(201).json({ success: true, data: invoice });
}));

export default router;
