import { Router } from "express";
import {
  getStats,
  getUsers,
  toggleUserStatus,
  getAllJobs,
  closeJob,
  deleteJob,
  approveJob,
  rejectJob,
  getAnalytics,
} from "../controllers/admin.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.use(authenticate, authorize("admin"));

// Stats + analytics
router.get("/stats",     getStats);
router.get("/analytics", getAnalytics);

// User management
router.get(   "/users",           getUsers);
router.patch( "/users/:id/toggle", toggleUserStatus);

// Job moderation
router.get(   "/jobs",             getAllJobs);
router.patch( "/jobs/:id/approve", approveJob);
router.patch( "/jobs/:id/reject",  rejectJob);
router.patch( "/jobs/:id/close",   closeJob);
router.delete("/jobs/:id",         deleteJob);

export default router;