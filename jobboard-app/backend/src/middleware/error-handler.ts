import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

// A typed error class you can throw anywhere in the app
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    // Capture a clean stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler — must have 4 parameters for Express to treat it as an error handler
export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default values
  let statusCode = 500;
  let message = "Internal server error. Please try again later.";
  let errors: Record<string, string> | undefined;

  // Our custom operational errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Mongoose validation errors (e.g. missing required field)
  else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 422;
    message = "Validation failed";
    errors = {};
    for (const field in err.errors) {
      errors[field] = err.errors[field].message;
    }
  }

  // Mongoose duplicate key error (e.g. email already exists)
  else if ((err as NodeJS.ErrnoException).code === "11000") {
    statusCode = 409;
    const keyValue = (err as any).keyValue;
    const field = Object.keys(keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
  }

  // Mongoose bad ObjectId
  else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Log unexpected errors
  if (statusCode === 500) {
    console.error("💥 Unhandled error:", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    // Only expose stack trace in development
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};