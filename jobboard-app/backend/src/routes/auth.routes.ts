import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
  getMe,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";
import { authRateLimiter } from "../middleware/rate-limiter";
import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

const router = Router();

// Register validators

const registerValidators = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required.")
    .isLength({ min: 2, max: 50 }).withMessage("Name must be 2–50 characters."),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Please enter a valid email address.")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required.")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters.")
    .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter.")
    .matches(/[0-9]/).withMessage("Password must contain at least one number.")
    .matches(/[^A-Za-z0-9]/).withMessage("Password must contain at least one special character."),

  body("role")
    .optional()
    .isIn(["employer", "candidate"]).withMessage("Role must be employer or candidate."),

  body("company")
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage("Company name cannot exceed 100 characters."),
];

const loginValidators = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Please enter a valid email address."),

  body("password")
    .notEmpty().withMessage("Password is required."),
];

// Routes

// Public routes — rate limited
router.post("/register", authRateLimiter, registerValidators, validate, register);
router.post("/login",    authRateLimiter, loginValidators,    validate, login);
router.post("/refresh",  refresh);
router.post("/logout",   logout);

// Protected route — requires valid access token
router.get("/me", authenticate, getMe);

export default router;

// Validation middleware factory

function validate(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted: Record<string, string> = {};
    errors.array().forEach((err) => {
      if (err.type === "field") {
        formatted[err.path] = err.msg;
      }
    });
    res.status(422).json({
      success: false,
      message: "Validation failed.",
      errors: formatted,
    });
    return;
  }
  next();
}