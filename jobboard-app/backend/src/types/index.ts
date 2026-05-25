import { Request } from "express";
import { Document, Types } from "mongoose";

// ─── UsT
export type UserRole = "employer" | "candidate" | "admin";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string | null;    // ✅ null is valid when no avatar set
  company?: string;
  bio?: string;
  resume?: string | null;    // ✅ null is valid when no resume set
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

// ─── JT

export type JobType =
  | "full-time"
  | "part-time"
  | "contract"
  | "internship"
  | "remote";

export type JobStatus = "open" | "closed" | "draft";

// ✅ Extracted as standalone interface — reusable in frontend too
export interface ISalary {
  min: number;
  max: number;
  currency: string;         // e.g. "CAD", "USD"
}

export interface IJob extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  company: string;
  location: string;
  type: JobType;
  salary?: ISalary;
  skills: string[];
  employer: Types.ObjectId;
  status: JobStatus;
  applicationCount: number;
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Application ─────────────────────────────────────────────────────────────

export type ApplicationStatus =
  | "pending"
  | "reviewing"
  | "shortlisted"
  | "rejected"
  | "hired";

export interface IApplication extends Document {
  _id: Types.ObjectId;
  job: Types.ObjectId;
  candidate: Types.ObjectId;
  employer: Types.ObjectId;
  coverLetter: string;
  resume?: string | null;   // ✅ null when using profile resume
  status: ApplicationStatus;
  notes?: string;
  appliedAt: Date;
  updatedAt: Date;
}

// ─── Express Extensions

export interface AuthRequest extends Request {
  user?: IAuthUser;         // ✅ extracted so it's reusable
}

// ✅ Standalone — reuse in middleware, controllers, JWT
export interface IAuthUser {
  id: string;
  role: UserRole;
  email: string;
}

// API Responses

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: IPagination;  // ✅ extracted for reuse
}

// ✅ Reusable pagination shape
export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;     // ✅ added — useful in frontend
  hasPrevPage: boolean;     // ✅ added — useful in frontend
}

// JWT

// ✅ Extends IAuthUser — stays in sync automatically
export interface JwtPayload extends IAuthUser {
  iat?: number;
  exp?: number;
}