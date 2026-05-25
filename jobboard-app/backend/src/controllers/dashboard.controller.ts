import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { AppError } from "../middleware/error-handler";
import {
  getCandidateDashboardData,
  getEmployerDashboardData,
  buildTimeline,
} from "../services/dashboard.service";
import Application from "../models/Application";
import { notifyUser } from "../websocket/ws-server";

// Candidate dashboard
export async function candidateDashboard(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await getCandidateDashboardData(req.user!.id);
    res.status(200).json({ success: true, message: "Dashboard data.", data });
  } catch (err) {
    next(err);
  }
}

// Employer dashboard
export async function employerDashboard(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await getEmployerDashboardData(req.user!.id);
    res.status(200).json({ success: true, message: "Dashboard data.", data });
  } catch (err) {
    next(err);
  }
}

// Move application to next stage (Kanban drag/click)
export async function advanceApplication(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const appId    = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status } = req.body as { status: string };

    const VALID = ["pending", "reviewing", "shortlisted", "rejected", "hired"];
    if (!VALID.includes(status)) {
      throw new AppError("Invalid status value.", 422);
    }

    const application = await Application.findById(appId);
    if (!application) throw new AppError("Application not found.", 404);

    // Only the employer who owns the job can advance the application
    if (application.employer.toString() !== req.user!.id) {
      throw new AppError("Forbidden.", 403);
    }

    const previousStatus = application.status;
    application.status   = status as any;
    await application.save();

    await application.populate([
      { path: "job",       select: "title company" },
      { path: "candidate", select: "name email"    },
    ]);

    const jobDoc       = application.job       as any;
    const candidateDoc = application.candidate as any;

    // Real-time push to the candidate
    notifyUser(candidateDoc._id.toString(), {
      type:    "APPLICATION_STATUS_CHANGED",
      message: `Your application for ${jobDoc.title} moved to: ${status}`,
      data: {
        applicationId:  application._id.toString(),
        previousStatus,
        status,
        jobTitle:       jobDoc.title,
      },
    });

    res.status(200).json({
      success: true,
      message: "Application advanced.",
      data:    { application },
    });
  } catch (err) {
    next(err);
  }
}

// Get timeline for a single application
export async function getApplicationTimeline(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const appId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const application = await Application.findById(appId)
      .populate("job",       "title company")
      .populate("candidate", "name email");

    if (!application) throw new AppError("Application not found.", 404);

    // Candidate can see their own; employer can see their job's applications
    const isCandidate = application.candidate._id.toString() === req.user!.id;
    const isEmployer  = application.employer.toString()       === req.user!.id;

    if (!isCandidate && !isEmployer) {
      throw new AppError("Forbidden.", 403);
    }

    const timeline = buildTimeline(application.status, application.appliedAt);

    res.status(200).json({
      success: true,
      message: "Timeline retrieved.",
      data:    { application, timeline },
    });
  } catch (err) {
    next(err);
  }
}