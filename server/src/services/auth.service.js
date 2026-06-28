/**
 * ═══════════════════════════════════════════════════════════════
 * Auth Service — Business logic for authentication
 * ═══════════════════════════════════════════════════════════════
 */

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../utils/prisma.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateResetToken,
} from "../utils/jwt.js";
import { logger } from "../utils/logger.js";

const SALT_ROUNDS = 12;

export const authService = {
  /**
   * Register a new user account.
   */
  async register({ email, password, firstName, lastName, phone, roleId }) {
    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw Object.assign(new Error("Email already registered."), { statusCode: 409 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Default to staff role if not specified
    const role = roleId || (await prisma.role.findUnique({ where: { name: "staff" } }))?.id || 3;

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        roleId: role,
      },
      include: { role: true },
    });

    // Generate tokens
    const tokenPayload = { id: user.id, email: user.email, roleId: user.roleId };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "user_registered",
        details: `New user registered: ${email}`,
      },
    });

    return {
      user: this._sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  },

  /**
   * Authenticate user with email and password.
   */
  async login({ email, password }) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user || user.deletedAt) {
      throw Object.assign(new Error("Invalid email or password."), { statusCode: 401 });
    }

    if (!user.isActive) {
      throw Object.assign(new Error("Account is deactivated. Contact admin."), { statusCode: 403 });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw Object.assign(new Error("Invalid email or password."), { statusCode: 401 });
    }

    // Generate tokens
    const tokenPayload = { id: user.id, email: user.email, roleId: user.roleId };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Update last login and refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        refreshToken,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "user_login",
        details: `User logged in: ${email}`,
      },
    });

    return {
      user: this._sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  },

  /**
   * Refresh access token using refresh token.
   */
  async refreshToken(token) {
    try {
      const decoded = verifyRefreshToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { role: true },
      });

      if (!user || user.refreshToken !== token) {
        throw Object.assign(new Error("Invalid refresh token."), { statusCode: 401 });
      }

      const tokenPayload = { id: user.id, email: user.email, roleId: user.roleId };
      const accessToken = generateAccessToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(tokenPayload);

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newRefreshToken },
      });

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw Object.assign(new Error("Invalid or expired refresh token."), { statusCode: 401 });
    }
  },

  /**
   * Initiate password reset — generate token and save.
   */
  async forgotPassword(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if email exists
      return { message: "If the email exists, a reset link has been sent." };
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExp },
    });

    // TODO: Send email with resetToken via Nodemailer
    logger.info(`Password reset token generated for ${email}: ${resetToken}`);

    return { message: "If the email exists, a reset link has been sent." };
  },

  /**
   * Reset password using token.
   */
  async resetPassword(token, newPassword) {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExp: { gt: new Date() },
      },
    });

    if (!user) {
      throw Object.assign(new Error("Invalid or expired reset token."), { statusCode: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExp: null,
        refreshToken: null, // Invalidate existing sessions
      },
    });

    return { message: "Password reset successful. Please log in." };
  },

  /**
   * Change password for logged-in user.
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw Object.assign(new Error("User not found."), { statusCode: 404 });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw Object.assign(new Error("Current password is incorrect."), { statusCode: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: "Password changed successfully." };
  },

  /**
   * Logout — clear refresh token.
   */
  async logout(userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: "Logged out successfully." };
  },

  /**
   * Get current user profile.
   */
  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw Object.assign(new Error("User not found."), { statusCode: 404 });
    }

    return this._sanitizeUser(user);
  },

  /**
   * Strip sensitive fields from user object.
   */
  _sanitizeUser(user) {
    const { passwordHash, refreshToken, resetToken, resetTokenExp, ...safe } = user;
    return safe;
  },
};
