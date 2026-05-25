import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";
import crypto from "crypto";

// Ensure upload directories exist
const UPLOAD_BASE = path.join(__dirname, "../../uploads");
const RESUME_DIR  = path.join(UPLOAD_BASE, "resumes");
const AVATAR_DIR  = path.join(UPLOAD_BASE, "avatars");

[UPLOAD_BASE, RESUME_DIR, AVATAR_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Storage engine factory
function makeStorage(destination: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, destination),
    filename: (_req, file, cb) => {
      // Cryptographically random filename — prevents enumeration attacks
      const randomName = crypto.randomBytes(16).toString("hex");
      const ext        = path.extname(file.originalname).toLowerCase();
      cb(null, `${randomName}${ext}`);
    },
  });
}

// File type validators
function resumeFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void {
  const allowed = [".pdf", ".doc", ".docx"];
  const ext     = path.extname(file.originalname).toLowerCase();

  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, DOC, and DOCX files are allowed for resumes."));
  }
}

function avatarFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void {
  const allowed = [".jpg", ".jpeg", ".png", ".webp"];
  const ext     = path.extname(file.originalname).toLowerCase();

  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, and WebP files are allowed for avatars."));
  }
}

// Multer instances
export const resumeUpload = multer({
  storage:    makeStorage(RESUME_DIR),
  fileFilter: resumeFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files:    1,
  },
});

export const avatarUpload = multer({
  storage:    makeStorage(AVATAR_DIR),
  fileFilter: avatarFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB
    files:    1,
  },
});