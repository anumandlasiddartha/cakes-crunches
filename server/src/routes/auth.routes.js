/**
 * Auth Routes
 */

import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { authValidators } from "../validators/auth.validators.js";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/register", authValidators.register, validate, authController.register);
router.post("/login", authValidators.login, validate, authController.login);
router.post("/refresh-token", authValidators.refreshToken, validate, authController.refreshToken);
router.post("/forgot-password", authValidators.forgotPassword, validate, authController.forgotPassword);
router.post("/reset-password", authValidators.resetPassword, validate, authController.resetPassword);
router.post("/change-password", authenticate, authValidators.changePassword, validate, authController.changePassword);
router.post("/logout", authenticate, authController.logout);
router.get("/me", authenticate, authController.getProfile);

export default router;
