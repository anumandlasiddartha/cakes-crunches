/**
 * ═══════════════════════════════════════════════════════════════
 * Auth Controller — HTTP request handlers for authentication
 * ═══════════════════════════════════════════════════════════════
 */

import { authService } from "../services/auth.service.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const authController = {
  /**
   * POST /api/auth/register
   */
  register: asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, phone, roleId } = req.body;
    const result = await authService.register({ email, password, firstName, lastName, phone, roleId });
    res.status(201).json({ success: true, ...result });
  }),

  /**
   * POST /api/auth/login
   */
  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.json({ success: true, ...result });
  }),

  /**
   * POST /api/auth/refresh-token
   */
  refreshToken: asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    res.json({ success: true, ...result });
  }),

  /**
   * POST /api/auth/forgot-password
   */
  forgotPassword: asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.json({ success: true, ...result });
  }),

  /**
   * POST /api/auth/reset-password
   */
  resetPassword: asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    const result = await authService.resetPassword(token, password);
    res.json({ success: true, ...result });
  }),

  /**
   * POST /api/auth/change-password (authenticated)
   */
  changePassword: asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
    res.json({ success: true, ...result });
  }),

  /**
   * POST /api/auth/logout (authenticated)
   */
  logout: asyncHandler(async (req, res) => {
    const result = await authService.logout(req.user.id);
    res.json({ success: true, ...result });
  }),

  /**
   * GET /api/auth/me (authenticated)
   */
  getProfile: asyncHandler(async (req, res) => {
    const user = await authService.getProfile(req.user.id);
    res.json({ success: true, user });
  }),
};
