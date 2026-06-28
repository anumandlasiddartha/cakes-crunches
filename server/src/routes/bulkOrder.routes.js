/**
 * Bulk Order Routes
 */

import { Router } from "express";
import { bulkOrderController } from "../controllers/bulkOrder.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { body } from "express-validator";
import { validate } from "../middleware/validate.js";

const router = Router();
router.use(authenticate);

const orderValidation = [
  body("customerId").isInt({ min: 1 }).withMessage("Valid customer ID is required."),
  body("items").isArray({ min: 1 }).withMessage("At least one order item is required."),
  body("items.*.itemName").trim().notEmpty().withMessage("Item name is required."),
  body("items.*.quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1."),
  body("items.*.unitPrice").isFloat({ min: 0 }).withMessage("Valid unit price is required."),
];

router.get("/", bulkOrderController.getAll);
router.get("/stats", bulkOrderController.getStats);
router.get("/:id", bulkOrderController.getById);
router.post("/", orderValidation, validate, bulkOrderController.create);
router.put("/:id", bulkOrderController.update);
router.patch("/:id/status", body("status").notEmpty(), validate, bulkOrderController.updateStatus);
router.delete("/:id", authorize("admin", "manager"), bulkOrderController.delete);

export default router;
