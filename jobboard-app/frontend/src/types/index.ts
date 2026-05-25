// User

export type UserRole = "employer" | "candidate" | "admin";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  company?: string;
  bio?: string;
  resume: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Auth

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  role: "employer" | "candidate";
  company?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

// API

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Jobs

export type JobType =
  | "full-time"
  | "part-time"
  | "contract"
  | "internship"
  | "remote";

export type JobStatus = "open" | "closed" | "draft";

export interface Job {
  _id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  type: JobType;
  salary?: {
    min: number;
    max?: number;
    currency: string;
  };
  skills: string[];
  employer: string;
  status: JobStatus;
  applicationCount: number;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

// Applications

export type ApplicationStatus =
  | "pending"
  | "reviewing"
  | "shortlisted"
  | "rejected"
  | "hired";

export interface Application {
  _id: string;
  job: Job;
  candidate: User;
  employer: string;
  coverLetter: string;
  resume: string | null;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
}

// Dashboard

export interface TimelineEvent {
  stage:     string;
  label:     string;
  completed: boolean;
  active:    boolean;
  skipped:   boolean;
  date:      string | null;
}

export interface CandidateStats {
  total:      number;
  pending:    number;
  reviewing:  number;
  shortlisted: number;
  hired:      number;
  rejected:   number;
  active:     number;
}

export interface EmployerStats {
  totalJobs:       number;
  openJobs:        number;
  totalApplicants: number;
  activeInterviews: number;
  hired:           number;
}

export interface KanbanData {
  pending:     Application[];
  reviewing:   Application[];
  shortlisted: Application[];
  rejected:    Application[];
  hired:       Application[];
}