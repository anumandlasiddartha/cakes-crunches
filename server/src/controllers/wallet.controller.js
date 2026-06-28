/**
 * Wallet Controller
 */
import { walletService } from "../services/wallet.service.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const walletController = {
  getByCustomer: asyncHandler(async (req, res) => {
    const wallet = await walletService.getByCustomerId(parseInt(req.params.customerId));
    res.json({ success: true, data: wallet });
  }),

  credit: asyncHandler(async (req, res) => {
    const { customerId, amount, description } = req.body;
    const result = await walletService.credit(parseInt(customerId), amount, description, req.user.id);
    res.json({ success: true, data: result });
  }),

  debit: asyncHandler(async (req, res) => {
    const { customerId, amount, description } = req.body;
    const result = await walletService.debit(parseInt(customerId), amount, description, req.user.id);
    res.json({ success: true, data: result });
  }),

  getTransactions: asyncHandler(async (req, res) => {
    const result = await walletService.getTransactions(parseInt(req.params.customerId), req.query);
    res.json({ success: true, data: result });
  }),

  getStats: asyncHandler(async (req, res) => {
    const stats = await walletService.getGlobalStats();
    res.json({ success: true, data: stats });
  }),
};
