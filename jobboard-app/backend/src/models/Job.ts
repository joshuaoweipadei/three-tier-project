import mongoose, { Schema } from "mongoose";
import { IJob } from "../types";

const JobSchema = new Schema<IJob>(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      minlength: [50, "Description must be at least 50 characters"],
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship", "remote"],
      required: [true, "Job type is required"],
    },
    salary: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 },
      currency: { type: String, default: "USD" },
    },
    skills: {
      type: [String],
      default: [],
      validate: {
        validator: (arr: string[]) => arr.length <= 20,
        message: "A job can have at most 20 required skills",
      },
    },
    employer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "closed", "draft"],
      default: "open",
    },
    applicationCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    deadline: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Text search index (lets candidates search jobs by keyword)
JobSchema.index({ title: "text", description: "text", skills: "text" });

// Compound indexes for common filter combos
JobSchema.index({ status: 1, createdAt: -1 });
JobSchema.index({ employer: 1, status: 1 });
JobSchema.index({ type: 1, status: 1 });

const Job = mongoose.model<IJob>("Job", JobSchema);
export default Job;