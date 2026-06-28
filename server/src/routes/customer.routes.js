/**
 * Customer Routes
 */

import { Router } from "express";
import { customerController } from "../controllers/customer.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { body } from "express-validator";
import { validate } from "../middleware/validate.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

const customerValidation = [
  body("name").trim().notEmpty().withMessage("Customer name is required."),
  body("phone").trim().notEmpty().withMessage("Phone number is required."),
  body("email").optional().isEmail().withMessage("Valid email required."),
];

router.get("/", customerController.getAll);
router.get("/:id", customerController.getById);
router.post("/", customerValidation, validate, customerController.create);
router.put("/:id", customerValidation, validate, customerController.update);
router.delete("/:id", authorize("admin", "manager"), customerController.delete);
router.get("/:id/payment-history", customerController.getPaymentHistory);
router.get("/:id/stats", customerController.getStats);

export default router;
