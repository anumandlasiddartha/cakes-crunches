/**
 * Authentication & Authorization Middleware
 *
 * Verifies JWT tokens and enforces role-based access control.
 */

import { verifyAccessToken } from "../utils/jwt.js";
import { prisma } from "../utils/prisma.js";

/**
 * Authenticate — Verify Bearer token and attach user to request.
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    // Fetch user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { role: true },
    });

    if (!user || !user.isActive || user.deletedAt) {
      return res.status(401).json({
        success: false,
        message: "Access denied. User account is inactive or deleted.",
      });
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId,
      roleName: user.role.name,
      permissions: typeof user.role.permissions === "string" 
        ? JSON.parse(user.role.permissions) 
        : (user.role.permissions || []),
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please log in again.",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Authentication error.",
    });
  }
}

/**
 * Authorize — Check if user has one of the required roles.
 * @param {...string} roles - Allowed role names (e.g., "admin", "manager", "staff")
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!roles.includes(req.user.roleName)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions. Required roles: " + roles.join(", "),
      });
    }

    next();
  };
}
