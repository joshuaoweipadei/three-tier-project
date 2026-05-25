import { Router } from "express";
import { uploadResume, uploadAvatar } from "../controllers/upload.controller";
import { authenticate } from "../middleware/auth";
import { resumeUpload, avatarUpload } from "../middleware/upload";
import { uploadRateLimiter } from "../middleware/rate-limiter";
import { Request, Response, NextFunction } from "express";

const router = Router();

// All upload routes require authentication
router.use(authenticate);

// Resume upload
router.post(
  "/resume",
  uploadRateLimiter,
  (req: Request, res: Response, next: NextFunction) => {
    resumeUpload.single("resume")(req, res, (err) => {
      if (err) {
        res.status(400).json({ success: false, message: err.message });
        return;
      }
      next();
    });
  },
  uploadResume
);

// Avatar upload
router.post(
  "/avatar",
  uploadRateLimiter,
  (req: Request, res: Response, next: NextFunction) => {
    avatarUpload.single("avatar")(req, res, (err) => {
      if (err) {
        res.status(400).json({ success: false, message: err.message });
        return;
      }
      next();
    });
  },
  uploadAvatar
);

export default router;