import { Response, NextFunction } from "express";
import Job from "../models/Job";
import Application from "../models/Application";
import { AuthRequest, ApiResponse, IJob } from "../types";
import { AppError } from "../middleware/error-handler";

// Get all jobs (public, paginated, filterable)
export async function getJobs(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      page = "1",
      limit = "10",
      search,
      type,
      location,
      status = "open",
      minSalary,
      maxSalary,
      skills,
      sort = "-createdAt",
    } = req.query as Record<string, string>;

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    // Build filter
    const filter: Record<string, unknown> = { status };

    if (search) {
      filter.$text = { $search: search };
    }

    if (type) {
      filter.type = type;
    }

    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }

    if (minSalary || maxSalary) {
      filter["salary.min"] = {};
      if (minSalary) (filter["salary.min"] as Record<string, number>).$gte = parseInt(minSalary);
      if (maxSalary) (filter["salary.min"] as Record<string, number>).$lte = parseInt(maxSalary);
    }

    if (skills) {
      const skillList = skills.split(",").map((s) => s.trim());
      filter.skills = { $in: skillList };
    }

    // Query
    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate("employer", "name company avatar")
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Job.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      message: "Jobs retrieved.",
      data: jobs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

// Get single job
export async function getJob(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const job = await Job.findById(req.params.id)
      .populate("employer", "name company avatar bio");

    if (!job) {
      throw new AppError("Job not found.", 404);
    }

    // If candidate is logged in, check if they already applied
    let hasApplied = false;
    if (req.user?.role === "candidate") {
      const existing = await Application.findOne({
        job: job._id,
        candidate: req.user.id,
      });
      hasApplied = !!existing;
    }

    res.status(200).json({
      success: true,
      message: "Job retrieved.",
      data: { job, hasApplied },
    });
  } catch (err) {
    next(err);
  }
}

// Create job (employer only)
export async function createJob(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const employer = req.user!;

    const job = await Job.create({
      ...req.body,
      employer: employer.id,
    });

    await job.populate("employer", "name company avatar");

    res.status(201).json({
      success: true,
      message: "Job posted successfully.",
      data: { job },
    });
  } catch (err) {
    next(err);
  }
}

// Update job (employer only, must own the job)
export async function updateJob(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      throw new AppError("Job not found.", 404);
    }

    if (job.employer.toString() !== req.user!.id) {
      throw new AppError("You can only edit your own job postings.", 403);
    }

    // Prevent changing employer field
    delete req.body.employer;
    delete req.body.applicationCount;

    const updated = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate("employer", "name company avatar");

    res.status(200).json({
      success: true,
      message: "Job updated.",
      data: { job: updated },
    });
  } catch (err) {
    next(err);
  }
}

// Delete job (employer only, must own)
export async function deleteJob(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      throw new AppError("Job not found.", 404);
    }

    if (job.employer.toString() !== req.user!.id) {
      throw new AppError("You can only delete your own job postings.", 403);
    }

    // Delete the job and all its applications atomically
    await Promise.all([
      Job.findByIdAndDelete(req.params.id),
      Application.deleteMany({ job: req.params.id }),
    ]);

    res.status(200).json({
      success: true,
      message: "Job deleted.",
    });
  } catch (err) {
    next(err);
  }
}

// Get employer's own jobs
export async function getMyJobs(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { page = "1", limit = "10", status } = req.query as Record<string, string>;

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = { employer: req.user!.id };
    if (status) filter.status = status;

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .sort("-createdAt")
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Job.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      message: "Your jobs retrieved.",
      data: jobs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (err) {
    next(err);
  }
}