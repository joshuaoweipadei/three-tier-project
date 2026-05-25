import { Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import type { AuthRequest } from "../types";
import { AppError } from "../middleware/error-handler";

// Upload resume
export async function uploadResume(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      throw new AppError("No file uploaded.", 400);
    }

    // Build the public URL path
    const fileUrl = `/uploads/resumes/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: "Resume uploaded successfully.",
      data: {
        url:          fileUrl,
        filename:     req.file.filename,
        originalName: req.file.originalname,
        size:         req.file.size,
        mimetype:     req.file.mimetype,
      },
    });
  } catch (err) {
    next(err);
  }
}

// Upload avatar
export async function uploadAvatar(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      throw new AppError("No file uploaded.", 400);
    }

    const fileUrl = `/uploads/avatars/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully.",
      data: { url: fileUrl },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Delete a file (cleanup helper)
export function deleteFile(filePath: string): void {
  const fullPath = path.join(__dirname, "../../", filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}