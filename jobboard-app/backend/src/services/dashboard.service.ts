import Application from "../models/Application";
import Job from "../models/Job";

// Candidate dashboard data
export async function getCandidateDashboardData(candidateId: string) {
  const applications = await Application.find({ candidate: candidateId })
    .populate({
      path:   "job",
      select: "title company location type salary status deadline employer",
      populate: { path: "employer", select: "name company avatar" },
    })
    .sort("-appliedAt")
    .lean();

  // Summary stats
  const total       = applications.length;
  const reviewing   = applications.filter((a) => a.status === "reviewing").length;
  const shortlisted = applications.filter((a) => a.status === "shortlisted").length;
  const hired       = applications.filter((a) => a.status === "hired").length;
  const rejected    = applications.filter((a) => a.status === "rejected").length;
  const pending     = applications.filter((a) => a.status === "pending").length;

  return {
    applications,
    stats: {
      total,
      pending,
      reviewing,
      shortlisted,
      hired,
      rejected,
      // Active = anything not finalized
      active: total - hired - rejected,
    },
  };
}

// Employer dashboard data
export async function getEmployerDashboardData(employerId: string) {
  // All jobs posted by this employer
  const jobs = await Job.find({ employer: employerId })
    .sort("-createdAt")
    .lean();

  const jobIds = jobs.map((j) => j._id);

  // All applications across all their jobs
  const applications = await Application.find({ job: { $in: jobIds } })
    .populate({
      path:   "candidate",
      select: "name email avatar bio resume",
    })
    .populate({
      path:   "job",
      select: "title company location type",
    })
    .sort("-appliedAt")
    .lean();

  // Group applications by status for Kanban
  const kanban = {
    pending:     applications.filter((a) => a.status === "pending"),
    reviewing:   applications.filter((a) => a.status === "reviewing"),
    shortlisted: applications.filter((a) => a.status === "shortlisted"),
    rejected:    applications.filter((a) => a.status === "rejected"),
    hired:       applications.filter((a) => a.status === "hired"),
  };

  // Summary stats
  const totalJobs        = jobs.length;
  const openJobs         = jobs.filter((j) => j.status === "open").length;
  const totalApplicants  = applications.length;
  const activeInterviews = applications.filter(
    (a) => a.status === "shortlisted"
  ).length;
  const hired = applications.filter((a) => a.status === "hired").length;

  return {
    jobs,
    kanban,
    stats: {
      totalJobs,
      openJobs,
      totalApplicants,
      activeInterviews,
      hired,
    },
  };
}

// Application status history (timeline events)
// We derive a timeline from the current status since we store final state.
// In a full event-sourced system this would query an events collection.
export function buildTimeline(status: string, appliedAt: Date | string) {
  const STATUS_ORDER = [
    "pending",
    "reviewing",
    "shortlisted",
    "hired",
  ];
  const REJECTED = "rejected";

  const applied = new Date(appliedAt);

  type TimelineEvent = {
    stage:     string;
    label:     string;
    completed: boolean;
    active:    boolean;
    skipped:   boolean;
    date:      Date | null;
  };

  if (status === REJECTED) {
    return [
      { stage: "pending",     label: "Applied",      completed: true,  active: false, skipped: false, date: applied },
      { stage: "reviewing",   label: "Under Review",  completed: false, active: false, skipped: false, date: null },
      { stage: "shortlisted", label: "Shortlisted",   completed: false, active: false, skipped: false, date: null },
      { stage: "rejected",    label: "Not Selected",  completed: true,  active: true,  skipped: false, date: new Date() },
    ] as TimelineEvent[];
  }

  const currentIndex = STATUS_ORDER.indexOf(status);

  return STATUS_ORDER.map((stage, i) => ({
    stage,
    label:     stageLabelMap[stage],
    completed: i < currentIndex,
    active:    i === currentIndex,
    skipped:   false,
    date:      i <= currentIndex ? new Date(applied.getTime() + i * 86400000 * 2) : null,
  })) as TimelineEvent[];
}

const stageLabelMap: Record<string, string> = {
  pending:     "Applied",
  reviewing:   "Under Review",
  shortlisted: "Shortlisted",
  hired:       "Offer Extended",
};