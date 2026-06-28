/**
 * Wallet Routes
 */
import { Router } from "express";
import { walletController } from "../controllers/wallet.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.get("/stats", walletController.getStats);
router.get("/:customerId", walletController.getByCustomer);
router.get("/:customerId/transactions", walletController.getTransactions);
router.post("/credit", walletController.credit);
router.post("/debit", walletController.debit);

export default router;
