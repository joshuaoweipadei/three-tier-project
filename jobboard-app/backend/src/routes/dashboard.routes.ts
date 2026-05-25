import { Router } from "express";
import {
  candidateDashboard,
  employerDashboard,
  advanceApplication,
  getApplicationTimeline,
} from "../controllers/dashboard.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

// Candidate
router.get(
  "/candidate",
  authenticate,
  authorize("candidate"),
  candidateDashboard
);

// Employer
router.get(
  "/employer",
  authenticate,
  authorize("employer"),
  employerDashboard
);

// Shared — advance status (employer only)
router.patch(
  "/applications/:id/advance",
  authenticate,
  authorize("employer"),
  advanceApplication
);

// Shared — timeline (candidate or employer)
router.get(
  "/applications/:id/timeline",
  authenticate,
  getApplicationTimeline
);

export default router;