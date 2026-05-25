import mongoose, { Schema } from "mongoose";
import { IApplication } from "../types";

const ApplicationSchema = new Schema<IApplication>(
  {
    job: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    candidate: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    employer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coverLetter: {
      type: String,
      required: [true, "Cover letter is required"],
      minlength: [100, "Cover letter must be at least 100 characters"],
      maxlength: [2000, "Cover letter cannot exceed 2000 characters"],
    },
    resume: {
      type: String,
      default: null, // Falls back to the candidate's profile resume
    },
    status: {
      type: String,
      enum: ["pending", "reviewing", "shortlisted", "rejected", "hired"],
      default: "pending",
    },
    notes: {
      type: String,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
      select: false, // Only returned when explicitly requested by employer
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Prevent duplicate applications (one per candidate per job)
ApplicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

// Indexes for employer dashboard queries
ApplicationSchema.index({ job: 1, status: 1 });
ApplicationSchema.index({ candidate: 1, status: 1 });
ApplicationSchema.index({ employer: 1, createdAt: -1 });

const Application = mongoose.model<IApplication>("Application", ApplicationSchema);
export default Application;