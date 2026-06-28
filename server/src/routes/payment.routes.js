/**
 * Payment Routes
 */

import { Router } from "express";
import { paymentController } from "../controllers/payment.controller.js";
import { authenticate } from "../middleware/auth.js";
import { body } from "express-validator";
import { validate } from "../middleware/validate.js";

const router = Router();
router.use(authenticate);

const paymentValidation = [
  body("bulkOrderId").isInt({ min: 1 }).withMessage("Valid bulk order ID is required."),
  body("amount").isFloat({ min: 0.01 }).withMessage("Amount must be greater than 0."),
  body("paymentMethod").trim().notEmpty().withMessage("Payment method is required."),
];

router.get("/", paymentController.getAll);
router.get("/stats", paymentController.getStats);
router.get("/outstanding", paymentController.getOutstanding);
router.get("/order/:orderId", paymentController.getOrderPayments);
router.post("/advance", paymentValidation, validate, paymentController.recordAdvance);
router.post("/balance", paymentValidation, validate, paymentController.recordBalance);

export default router;
