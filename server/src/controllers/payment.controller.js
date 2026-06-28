/**
 * Payment Controller
 */

import { paymentService } from "../services/payment.service.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const paymentController = {
  recordAdvance: asyncHandler(async (req, res) => {
    const result = await paymentService.recordAdvancePayment({
      ...req.body,
      receivedBy: req.user.id,
    });
    res.status(201).json({ success: true, data: result });
  }),

  recordBalance: asyncHandler(async (req, res) => {
    const result = await paymentService.recordBalancePayment({
      ...req.body,
      receivedBy: req.user.id,
    });
    res.status(201).json({ success: true, data: result });
  }),

  getAll: asyncHandler(async (req, res) => {
    const result = await paymentService.getAllPayments(req.query);
    res.json(result);
  }),

  getOrderPayments: asyncHandler(async (req, res) => {
    const result = await paymentService.getOrderPayments(parseInt(req.params.orderId));
    res.json({ success: true, data: result });
  }),

  getStats: asyncHandler(async (req, res) => {
    const stats = await paymentService.getPaymentStats();
    res.json({ success: true, data: stats });
  }),

  getOutstanding: asyncHandler(async (req, res) => {
    const result = await paymentService.getOutstandingBalances(req.query);
    res.json(result);
  }),
};
