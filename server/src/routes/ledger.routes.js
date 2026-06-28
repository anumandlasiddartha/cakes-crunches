/**
 * Ledger Routes — Payment ledger / transaction history
 */
import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { prisma } from "../utils/prisma.js";
import { parsePagination, paginatedResponse } from "../utils/pagination.js";

const router = Router();
router.use(authenticate);

// Get all ledger entries with pagination
router.get("/", asyncHandler(async (req, res) => {
  const { skip, take, page, limit } = parsePagination(req.query);
  const where = {};
  if (req.query.type) where.type = req.query.type;

  const [data, total] = await Promise.all([
    prisma.ledgerEntry.findMany({
      where, skip, take,
      orderBy: { createdAt: "desc" },
      include: {
        advancePayment: { select: { bulkOrderId: true, amount: true } },
        balancePayment: { select: { bulkOrderId: true, amount: true } },
        walletTransaction: { select: { walletId: true, amount: true, type: true } },
      },
    }),
    prisma.ledgerEntry.count({ where }),
  ]);

  res.json(paginatedResponse(data, total, page, limit));
}));

// Get ledger summary
router.get("/summary", asyncHandler(async (req, res) => {
  const totals = await prisma.ledgerEntry.aggregate({
    _sum: { debit: true, credit: true },
    _count: true,
  });

  const lastEntry = await prisma.ledgerEntry.findFirst({
    orderBy: { createdAt: "desc" },
  });

  res.json({
    success: true,
    data: {
      totalDebit: parseFloat(totals._sum.debit) || 0,
      totalCredit: parseFloat(totals._sum.credit) || 0,
      totalEntries: totals._count,
      currentBalance: parseFloat(lastEntry?.runningBalance) || 0,
    },
  });
}));

export default router;
