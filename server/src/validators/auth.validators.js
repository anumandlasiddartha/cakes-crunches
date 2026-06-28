/**
 * Auth Validation Rules
 */

import { body } from "express-validator";

export const authValidators = {
  register: [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required."),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters."),
    body("firstName").trim().notEmpty().withMessage("First name is required."),
    body("lastName").trim().notEmpty().withMessage("Last name is required."),
    body("phone").optional().trim(),
  ],

  login: [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required."),
    body("password").notEmpty().withMessage("Password is required."),
  ],

  forgotPassword: [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required."),
  ],

  resetPassword: [
    body("token").notEmpty().withMessage("Reset token is required."),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters."),
  ],

  changePassword: [
    body("currentPassword").notEmpty().withMessage("Current password is required."),
    body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters."),
  ],

  refreshToken: [
    body("refreshToken").notEmpty().withMessage("Refresh token is required."),
  ],
};
