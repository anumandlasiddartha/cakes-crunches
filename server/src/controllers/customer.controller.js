/**
 * Customer Controller — HTTP handlers for customer management
 */

import { customerService } from "../services/customer.service.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const customerController = {
  getAll: asyncHandler(async (req, res) => {
    const result = await customerService.getAll(req.query);
    res.json(result);
  }),

  getById: asyncHandler(async (req, res) => {
    const customer = await customerService.getById(parseInt(req.params.id));
    res.json({ success: true, data: customer });
  }),

  create: asyncHandler(async (req, res) => {
    const customer = await customerService.create(req.body);
    res.status(201).json({ success: true, data: customer });
  }),

  update: asyncHandler(async (req, res) => {
    const customer = await customerService.update(parseInt(req.params.id), req.body);
    res.json({ success: true, data: customer });
  }),

  delete: asyncHandler(async (req, res) => {
    await customerService.delete(parseInt(req.params.id));
    res.json({ success: true, message: "Customer deleted successfully." });
  }),

  getPaymentHistory: asyncHandler(async (req, res) => {
    const history = await customerService.getPaymentHistory(parseInt(req.params.id));
    res.json({ success: true, data: history });
  }),

  getStats: asyncHandler(async (req, res) => {
    const stats = await customerService.getStats(parseInt(req.params.id));
    res.json({ success: true, data: stats });
  }),
};
