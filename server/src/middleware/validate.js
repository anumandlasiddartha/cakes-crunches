/**
 * Express Validator Middleware Wrapper
 *
 * Runs validation chains and returns 422 with structured errors.
 */

import { validationResult } from "express-validator";

/**
 * Validate request using express-validator chains.
 * Place this after the validation chain array in route definitions.
 */
export function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed.",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
        value: err.value,
      })),
    });
  }

  next();
}
