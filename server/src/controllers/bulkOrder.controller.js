/**
 * Bulk Order Controller
 */

import { bulkOrderService } from "../services/bulkOrder.service.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const bulkOrderController = {
  getAll: asyncHandler(async (req, res) => {
    const result = await bulkOrderService.getAll(req.query);
    res.json(result);
  }),

  getById: asyncHandler(async (req, res) => {
    const order = await bulkOrderService.getById(parseInt(req.params.id));
    res.json({ success: true, data: order });
  }),

  create: asyncHandler(async (req, res) => {
    const order = await bulkOrderService.create(req.body, req.user.id);
    res.status(201).json({ success: true, data: order });
  }),

  update: asyncHandler(async (req, res) => {
    const order = await bulkOrderService.update(parseInt(req.params.id), req.body, req.user.id);
    res.json({ success: true, data: order });
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const { status, notes } = req.body;
    const order = await bulkOrderService.updateStatus(parseInt(req.params.id), status, req.user.id, notes);
    res.json({ success: true, data: order });
  }),

  delete: asyncHandler(async (req, res) => {
    await bulkOrderService.delete(parseInt(req.params.id), req.user.id);
    res.json({ success: true, message: "Order cancelled and deleted." });
  }),

  getStats: asyncHandler(async (req, res) => {
    const stats = await bulkOrderService.getOrderStats();
    res.json({ success: true, data: stats });
  }),
};
