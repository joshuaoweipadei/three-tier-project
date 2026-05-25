import { Response, NextFunction } from "express";
import User from "../models/User";
import Job from "../models/Job";
import Application from "../models/Application";
import { AuthRequest } from "../types";
import { AppError } from "../middleware/error-handler";

// Platform stats
export async function getStats(
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const [
      totalUsers,
      totalEmployers,
      totalCandidates,
      totalJobs,
      openJobs,
      totalApplications,
      recentUsers,
      recentJobs,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: "employer", isActive: true }),
      User.countDocuments({ role: "candidate", isActive: true }),
      Job.countDocuments(),
      Job.countDocuments({ status: "open" }),
      Application.countDocuments(),
      User.find({ isActive: true })
        .sort("-createdAt")
        .limit(5)
        .select("name email role createdAt")
        .lean(),
      Job.find()
        .sort("-createdAt")
        .limit(5)
        .populate("employer", "name company")
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      message: "Platform stats retrieved.",
      data: {
        stats: {
          totalUsers,
          totalEmployers,
          totalCandidates,
          totalJobs,
          openJobs,
          totalApplications,
        },
        recentUsers,
        recentJobs,
      },
    });
  } catch (err) {
    next(err);
  }
}

// Get all users (paginated)
export async function getUsers(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      page = "1",
      limit = "20",
      role,
      search,
      isActive,
    } = req.query as Record<string, string>;

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = {};
    if (role)     filter.role     = role;
    if (isActive) filter.isActive = isActive === "true";
    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort("-createdAt")
        .skip(skip)
        .limit(limitNum)
        .select("-password")
        .lean(),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      message: "Users retrieved.",
      data: users,
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

// Toggle user active status
export async function toggleUserStatus(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    // Prevent admin from deactivating themselves
    if (userId === req.user!.id) {
      throw new AppError("You cannot deactivate your own account.", 400);
    }

    const user = await User.findById(userId);
    if (!user) throw new AppError("User not found.", 404);

    // Prevent modifying other admins
    if (user.role === "admin") {
      throw new AppError("Cannot modify admin accounts.", 403);
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? "activated" : "deactivated"} successfully.`,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

// Get all jobs (admin view)
export async function getAllJobs(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      page = "1",
      limit = "20",
      status,
      search,
    } = req.query as Record<string, string>;

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (search) filter.$text = { $search: search };

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate("employer", "name company email")
        .sort("-createdAt")
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

// Force-close a job
export async function closeJob(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const jobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const job = await Job.findByIdAndUpdate(
      jobId,
      { status: "closed" },
      { new: true }
    );

    if (!job) throw new AppError("Job not found.", 404);

    res.status(200).json({
      success: true,
      message: "Job closed.",
      data: { job },
    });
  } catch (err) {
    next(err);
  }
}

// Delete any job (admin override)
export async function deleteJob(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const jobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const job = await Job.findById(jobId);
    if (!job) throw new AppError("Job not found.", 404);

    await Promise.all([
      Job.findByIdAndDelete(jobId),
      Application.deleteMany({ job: jobId }),
    ]);

    res.status(200).json({
      success: true,
      message: "Job and all associated applications deleted.",
    });
  } catch (err) {
    next(err);
  }
}

// Approve a job (publish it)
export async function approveJob(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const jobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const job = await Job.findByIdAndUpdate(
      jobId,
      { status: "open" },
      { new: true }
    ).populate("employer", "name email company");

    if (!job) throw new AppError("Job not found.", 404);

    res.status(200).json({
      success: true,
      message: "Job approved and published.",
      data: { job },
    });
  } catch (err) {
    next(err);
  }
}

// Reject a job (close it with reason)
export async function rejectJob(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const jobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const job = await Job.findByIdAndUpdate(
      jobId,
      { status: "closed" },
      { new: true }
    );

    if (!job) throw new AppError("Job not found.", 404);

    res.status(200).json({
      success: true,
      message: "Job rejected.",
      data: { job },
    });
  } catch (err) {
    next(err);
  }
}

// Platform analytics
export async function getAnalytics(
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const now      = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const sevenDaysAgo  = new Date(now.getTime() -  7 * 86400000);

    const [
      totalUsers,
      newUsersThisWeek,
      newUsersThisMonth,
      totalJobs,
      openJobs,
      draftJobs,
      closedJobs,
      totalApplications,
      applicationsThisWeek,
      hiredCount,
      rejectedCount,
      topEmployers,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Job.countDocuments(),
      Job.countDocuments({ status: "open" }),
      Job.countDocuments({ status: "draft" }),
      Job.countDocuments({ status: "closed" }),
      Application.countDocuments(),
      Application.countDocuments({ appliedAt: { $gte: sevenDaysAgo } }),
      Application.countDocuments({ status: "hired" }),
      Application.countDocuments({ status: "rejected" }),
      // Top 5 employers by application count
      Job.aggregate([
        { $group: { _id: "$employer", totalApps: { $sum: "$applicationCount" }, jobCount: { $sum: 1 } } },
        { $sort:  { totalApps: -1 } },
        { $limit: 5 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "employer" } },
        { $unwind: "$employer" },
        { $project: { "employer.name": 1, "employer.company": 1, totalApps: 1, jobCount: 1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      message: "Analytics retrieved.",
      data: {
        users: {
          total:        totalUsers,
          newThisWeek:  newUsersThisWeek,
          newThisMonth: newUsersThisMonth,
        },
        jobs: {
          total:  totalJobs,
          open:   openJobs,
          draft:  draftJobs,
          closed: closedJobs,
        },
        applications: {
          total:       totalApplications,
          thisWeek:    applicationsThisWeek,
          hired:       hiredCount,
          rejected:    rejectedCount,
          successRate: totalApplications > 0
            ? Math.round((hiredCount / totalApplications) * 100)
            : 0,
        },
        topEmployers,
      },
    });
  } catch (err) {
    next(err);
  }
}