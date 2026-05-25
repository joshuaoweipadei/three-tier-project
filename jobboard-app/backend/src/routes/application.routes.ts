import { Router } from "express";
import {
  applyToJob,
  getJobApplications,
  updateApplicationStatus,
  getMyApplications,
  withdrawApplication,
} from "../controllers/application.controller";
import { authenticate, authorize } from "../middleware/auth";
import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

const router = Router();

function validate(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted: Record<string, string> = {};
    errors.array().forEach((err) => {
      if (err.type === "field") formatted[err.path] = err.msg;
    });
    res.status(422).json({ success: false, message: "Validation failed.", errors: formatted });
    return;
  }
  next();
}

// Candidate routes
router.get(
  "/mine",
  authenticate,
  authorize("candidate"),
  getMyApplications
);

router.post(
  "/jobs/:id/apply",
  authenticate,
  authorize("candidate"),
  [
    body("coverLetter")
      .trim().notEmpty().withMessage("Cover letter is required.")
      .isLength({ min: 100, max: 2000 }).withMessage("Cover letter must be 100–2000 characters."),
  ],
  validate,
  applyToJob
);

router.delete(
  "/:id/withdraw",
  authenticate,
  authorize("candidate"),
  withdrawApplication
);

// Employer routes
router.get(
  "/jobs/:id/applications",
  authenticate,
  authorize("employer"),
  getJobApplications
);

router.patch(
  "/:id/status",
  authenticate,
  authorize("employer"),
  [
    body("status")
      .isIn(["pending", "reviewing", "shortlisted", "rejected", "hired"])
      .withMessage("Invalid status."),
    body("notes")
      .optional()
      .isLength({ max: 1000 }).withMessage("Notes cannot exceed 1000 characters."),
  ],
  validate,
  updateApplicationStatus
);

export default router;