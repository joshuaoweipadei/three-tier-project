import { Router } from "express";
import {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getMyJobs,
} from "../controllers/job.controller";
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

const jobValidators = [
  body("title")
    .trim().notEmpty().withMessage("Title is required.")
    .isLength({ min: 3, max: 100 }).withMessage("Title must be 3–100 characters."),
  body("description")
    .trim().notEmpty().withMessage("Description is required.")
    .isLength({ min: 50, max: 5000 }).withMessage("Description must be 50–5000 characters."),
  body("company")
    .trim().notEmpty().withMessage("Company is required."),
  body("location")
    .trim().notEmpty().withMessage("Location is required."),
  body("type")
    .isIn(["full-time", "part-time", "contract", "internship", "remote"])
    .withMessage("Invalid job type."),
  body("skills")
    .optional().isArray({ max: 20 }).withMessage("Skills must be an array of up to 20 items."),
  body("salary.min")
    .optional().isNumeric().withMessage("Minimum salary must be a number."),
  body("salary.max")
    .optional().isNumeric().withMessage("Maximum salary must be a number."),
];

// Public
router.get("/",     getJobs);
router.get("/:id",  authenticate, getJob);   // authenticate optional — checks hasApplied

// Employer only
router.get(   "/employer/mine",  authenticate, authorize("employer"), getMyJobs);
router.post(  "/",               authenticate, authorize("employer"), jobValidators, validate, createJob);
router.put(   "/:id",            authenticate, authorize("employer"), jobValidators, validate, updateJob);
router.delete("/:id",            authenticate, authorize("employer"), deleteJob);

export default router;