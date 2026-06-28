/**
 * ═══════════════════════════════════════════════════════════════
 * Wallet Service — Customer credit/debit wallet engine
 * ═══════════════════════════════════════════════════════════════
 */

import { prisma } from "../utils/prisma.js";
import { v4 as uuidv4 } from "uuid";

export const walletService = {
  _generateRef() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `WLT-${date}-${uuidv4().slice(0, 4).toUpperCase()}`;
  },

  async getByCustomerId(customerId) {
    let wallet = await prisma.wallet.findUnique({ where: { customerId } });
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { customerId, balance: 0 },
      });
    }
    return wallet;
  },

  async credit(customerId, amount, description, userId) {
    const amountVal = parseFloat(amount);
    if (amountVal <= 0) throw Object.assign(new Error("Amount must be positive."), { statusCode: 400 });

    const wallet = await this.getByCustomerId(customerId);
    const newBalance = parseFloat(wallet.balance) + amountVal;

    const txn = await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "credit",
        amount: amountVal,
        balanceAfter: newBalance,
        description,
        reference: this._generateRef(),
        createdBy: userId,
      },
    });

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: newBalance,
        totalCredit: { increment: amountVal },
      },
    });

    // Ledger entry
    const lastLedger = await prisma.ledgerEntry.findFirst({ orderBy: { createdAt: "desc" } });
    await prisma.ledgerEntry.create({
      data: {
        transactionRef: `TXN-${Date.now().toString(36).toUpperCase()}`,
        type: "wallet_credit",
        debit: 0,
        credit: amountVal,
        runningBalance: (parseFloat(lastLedger?.runningBalance) || 0) + amountVal,
        description: `Wallet credit: ${description}`,
        walletTransId: txn.id,
        createdBy: userId,
      },
    });

    return { wallet: { ...wallet, balance: newBalance }, transaction: txn };
  },

  async debit(customerId, amount, description, userId) {
    const amountVal = parseFloat(amount);
    if (amountVal <= 0) throw Object.assign(new Error("Amount must be positive."), { statusCode: 400 });

    const wallet = await this.getByCustomerId(customerId);
    if (parseFloat(wallet.balance) < amountVal) {
      throw Object.assign(new Error("Insufficient wallet balance."), { statusCode: 400 });
    }

    const newBalance = parseFloat(wallet.balance) - amountVal;

    const txn = await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "debit",
        amount: amountVal,
        balanceAfter: newBalance,
        description,
        reference: this._generateRef(),
        createdBy: userId,
      },
    });

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: newBalance,
        totalDebit: { increment: amountVal },
      },
    });

    return { wallet: { ...wallet, balance: newBalance }, transaction: txn };
  },

  async getTransactions(customerId, query = {}) {
    const wallet = await this.getByCustomerId(customerId);
    const transactions = await prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      take: parseInt(query.limit) || 50,
    });
    return { wallet, transactions };
  },

  async getGlobalStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalWallets, totalBalance, dailyCredits, weeklyCredits, monthlyCredits] = await Promise.all([
      prisma.wallet.count({ where: { isActive: true } }),
      prisma.wallet.aggregate({ _sum: { balance: true } }),
      prisma.walletTransaction.aggregate({ where: { type: "credit", createdAt: { gte: today } }, _sum: { amount: true } }),
      prisma.walletTransaction.aggregate({ where: { type: "credit", createdAt: { gte: weekAgo } }, _sum: { amount: true } }),
      prisma.walletTransaction.aggregate({ where: { type: "credit", createdAt: { gte: monthStart } }, _sum: { amount: true } }),
    ]);

    return {
      totalWallets,
      totalBalance: parseFloat(totalBalance._sum.balance) || 0,
      dailyCredits: parseFloat(dailyCredits._sum.amount) || 0,
      weeklyCredits: parseFloat(weeklyCredits._sum.amount) || 0,
      monthlyCredits: parseFloat(monthlyCredits._sum.amount) || 0,
    };
  },
};
