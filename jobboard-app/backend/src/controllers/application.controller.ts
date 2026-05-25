import { Response, NextFunction } from "express";
import Application from "../models/Application";
import Job from "../models/Job";
import { AuthRequest } from "../types";
import { AppError } from "../middleware/error-handler";
import { notifyUser } from "../websocket/ws-server";

// ─── Apply to a job (candidate only)
export async function applyToJob(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const jobId      = paramId(req.params.id);
    const candidateId = req.user!.id;

    const job = await Job.findById(jobId);
    if (!job) throw new AppError("Job not found.", 404);
    if (job.status !== "open") {
      throw new AppError("This job is no longer accepting applications.", 400);
    }

    const existing = await Application.findOne({ job: jobId, candidate: candidateId });
    if (existing) throw new AppError("You have already applied to this job.", 409);

    // Create then populate in separate steps — Mongoose 9 types require this
    const application = await Application.create({
      job:         jobId,
      candidate:   candidateId,
      employer:    job.employer,
      coverLetter: req.body.coverLetter,
      resume:      req.body.resume ?? null,
    });

    await Job.findByIdAndUpdate(jobId, { $inc: { applicationCount: 1 } });

    // Populate after create — chain each path separately for correct types
    await application.populate("job",       "title company");
    await application.populate("candidate", "name email avatar");

    notifyUser(job.employer.toString(), {
      type:    "NEW_APPLICATION",
      message: `New application for ${job.title}`,
      data:    { applicationId: application._id.toString(), jobTitle: job.title },
    });

    res.status(201).json({
      success: true,
      message: "Application submitted successfully.",
      data: { application },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Get applications for a job (employer only)
export async function getJobApplications(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const jobId = paramId(req.params.id);
    const { status, page = "1", limit = "20" } = req.query as Record<string, string>;

    const job = await Job.findById(jobId);
    if (!job) throw new AppError("Job not found.", 404);

    if (job.employer.toString() !== req.user!.id) {
      throw new AppError("You can only view applications for your own jobs.", 403);
    }

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = { job: jobId };
    if (status) filter.status = status;

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate("candidate", "name email avatar bio resume")
        .sort("-appliedAt")
        .skip(skip)
        .limit(limitNum)
        .lean(),                   // ← .lean() returns plain objects, avoids the never type
      Application.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      message: "Applications retrieved.",
      data: applications,
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

// ─── Update application status (employer only)
export async function updateApplicationStatus(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const applicationId = paramId(req.params.id);
    const { status, notes } = req.body;

    // findById without populate first — avoids the never type issue
    const application = await Application.findById(applicationId);
    if (!application) throw new AppError("Application not found.", 404);

    if (application.employer.toString() !== req.user!.id) {
      throw new AppError("You can only update applications for your own jobs.", 403);
    }

    application.status = status;
    if (notes !== undefined) application.notes = notes;
    await application.save();

    // Populate job title separately after save
    await application.populate("job",       "title");
    await application.populate("candidate", "name email");

    // After populate, candidate and job are populated documents.
    // Cast to any to safely access nested fields — this is intentional
    // because Mongoose 9 doesn't narrow populated types automatically.
    const candidateDoc = application.candidate as any;
    const jobDoc       = application.job       as any;

    notifyUser(candidateDoc._id.toString(), {
      type:    "APPLICATION_STATUS_CHANGED",
      message: `Your application status changed to: ${status}`,
      data: {
        applicationId: application._id.toString(),
        status,
        jobTitle: jobDoc.title,
      },
    });

    res.status(200).json({
      success: true,
      message: "Application status updated.",
      data: { application },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Get candidate's own applications
export async function getMyApplications(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { status, page = "1", limit = "10" } = req.query as Record<string, string>;

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = { candidate: req.user!.id };
    if (status) filter.status = status;

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate("job", "title company location type status salary")
        .sort("-appliedAt")
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Application.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      message: "Your applications retrieved.",
      data: applications,
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

// ─── Withdraw an application (candidate only)
export async function withdrawApplication(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const applicationId = paramId(req.params.id);

    const application = await Application.findById(applicationId);
    if (!application) throw new AppError("Application not found.", 404);

    if (application.candidate.toString() !== req.user!.id) {
      throw new AppError("You can only withdraw your own applications.", 403);
    }

    if (["hired", "rejected"].includes(application.status)) {
      throw new AppError("Cannot withdraw a finalized application.", 400);
    }

    await Promise.all([
      Application.findByIdAndDelete(applicationId),
      Job.findByIdAndUpdate(application.job, { $inc: { applicationCount: -1 } }),
    ]);

    res.status(200).json({
      success: true,
      message: "Application withdrawn.",
    });
  } catch (err) {
    next(err);
  }
}

// ─── Helper: safely extract string id from Express 5 params
// Express 5 types req.params values as string | string[] — we always
// want a plain string, so we take the first element if it's an array.
function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}