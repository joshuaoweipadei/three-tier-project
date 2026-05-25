import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useJob } from "@/hooks/use-jobs";
import { useJobApplications, useUpdateApplicationStatus } from "@/hooks/use-applications";
import type { Application, ApplicationStatus } from "@/types";
import { Skeleton, ApplicationCardSkeleton } from "@/components/ui/Skeleton";
import Alert from "@/components/ui/Alert";
import {
  ArrowLeft, Search, Users, Download,
  ChevronDown, CheckCircle, XCircle,
  Clock, Eye, Star, MoreVertical, Mail,
} from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";

// Status config
const STATUS_CONFIG: Record <ApplicationStatus,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  pending:     { label: "Applied",      color: "text-gray-700",   bg: "bg-gray-100",   icon: Clock        },
  reviewing:   { label: "Reviewing",    color: "text-blue-700",   bg: "bg-blue-100",   icon: Eye          },
  shortlisted: { label: "Shortlisted",  color: "text-purple-700", bg: "bg-purple-100", icon: Star         },
  hired:       { label: "Hired",        color: "text-green-700",  bg: "bg-green-100",  icon: CheckCircle  },
  rejected:    { label: "Rejected",     color: "text-red-700",    bg: "bg-red-100",    icon: XCircle      },
};

const STATUS_ORDER: ApplicationStatus[] = [
  "pending", "reviewing", "shortlisted", "hired", "rejected",
];

// Status dropdown for each applicant card
function StatusDropdown({
  application,
  onUpdate,
  isUpdating,
}: {
  application: Application;
  onUpdate:    (id: string, status: ApplicationStatus) => void;
  isUpdating:  boolean;
}) {
  const [open, setOpen] = useState(false);
  const current = STATUS_CONFIG[application.status];
  const Icon    = current.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isUpdating}
        className={clsx(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium",
          "border transition-colors disabled:opacity-50",
          current.bg, current.color, "border-transparent",
          "hover:opacity-80"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
        {current.label}
        <ChevronDown className="w-3 h-3 ml-1" aria-hidden="true" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <ul
            role="listbox"
            aria-label="Change status"
            className="absolute right-0 top-full mt-1 z-20 w-44 bg-white
                       rounded-xl border border-gray-200 shadow-lg py-1
                       overflow-hidden"
          >
            {STATUS_ORDER.map((status) => {
              const cfg     = STATUS_CONFIG[status];
              const StatusIcon = cfg.icon;
              return (
                <li key={status} role="option" aria-selected={application.status === status}>
                  <button
                    onClick={() => {
                      onUpdate(application._id, status);
                      setOpen(false);
                    }}
                    disabled={application.status === status}
                    className={clsx(
                      "w-full flex items-center gap-2 px-3 py-2 text-xs",
                      "transition-colors disabled:opacity-40",
                      application.status === status
                        ? `${cfg.bg} ${cfg.color} font-semibold`
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <StatusIcon className="w-3.5 h-3.5" aria-hidden="true" />
                    {cfg.label}
                    {application.status === status && (
                      <CheckCircle
                        className="w-3 h-3 ml-auto"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

// Single applicant card
function ApplicantCard({
  application,
  onUpdate,
  isUpdating,
}: {
  application: Application;
  onUpdate:    (id: string, status: ApplicationStatus) => void;
  isUpdating:  boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const candidate = application.candidate as any;

  return (
    <article className="card overflow-hidden">
      {/* Header row */}
      <div className="p-4 sm:p-5 flex items-start justify-between gap-4">
        {/* Candidate info */}
        <div className="flex items-start gap-3 min-w-0">
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-full bg-brand-100 flex items-center
                       justify-center text-brand-700 font-bold text-sm
                       flex-shrink-0"
            aria-hidden="true"
          >
            {candidate?.name?.charAt(0)?.toUpperCase() ?? "?"}
          </div>

          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">
              {candidate?.name ?? "Unknown"}
            </p>
            <a
              href={`mailto:${candidate?.email}`}
              className="text-sm text-gray-500 hover:text-brand-600 transition-colors flex items-center gap-1 mt-0.5"
            >
              <Mail className="w-3.5 h-3.5" aria-hidden="true" />
              {candidate?.email}
            </a>
            <p className="text-xs text-gray-400 mt-1">
              Applied{" "}
              {new Date(application.appliedAt).toLocaleDateString("en-CA", {
                month: "short", day: "numeric", year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Status dropdown */}
        <StatusDropdown
          application={application}
          onUpdate={onUpdate}
          isUpdating={isUpdating}
        />
      </div>

      {/* Bio preview if available */}
      {candidate?.bio && (
        <div className="px-5 pb-3 -mt-1">
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {candidate.bio}
          </p>
        </div>
      )}

      {/* Action bar */}
      <div
        className="flex items-center justify-between px-5 py-2.5
                   border-t border-gray-100 bg-gray-50"
      >
        {/* Resume download */}
        <div className="flex items-center gap-2">
          {(application.resume ?? candidate?.resume) ? (
            <a
              href={application.resume ?? candidate?.resume}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-brand-600
                         hover:text-brand-700 font-medium transition-colors"
              aria-label={`Download ${candidate?.name}'s resume`}
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              View Resume
            </a>
          ) : (
            <span className="text-xs text-gray-400">No resume uploaded</span>
          )}
        </div>

        {/* Expand cover letter */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-xs text-gray-500
                     hover:text-gray-700 transition-colors"
          aria-expanded={expanded}
        >
          <MoreVertical className="w-3.5 h-3.5" aria-hidden="true" />
          {expanded ? "Hide" : "Read"} cover letter
        </button>
      </div>

      {/* Cover letter expansion */}
      {expanded && (
        <div className="px-5 py-4 border-t border-gray-100">
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
            Cover Letter
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {application.coverLetter}
          </p>
        </div>
      )}
    </article>
  );
}

// ─── Main page
const STATUS_FILTERS = [
  { label: "All",         value: ""            },
  { label: "Applied",     value: "pending"      },
  { label: "Reviewing",   value: "reviewing"    },
  { label: "Shortlisted", value: "shortlisted"  },
  { label: "Hired",       value: "hired"        },
  { label: "Rejected",    value: "rejected"     },
];

export default function JobApplicationsPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate    = useNavigate();
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");

  // Job info
  const { data: jobData, isLoading: jobLoading } = useJob(id);

  // Applications
  const {
    data:      appData,
    isLoading: appsLoading,
    isError:   appsError,
  } = useJobApplications(id, { status: filter || undefined });

  const updateStatus = useUpdateApplicationStatus();

  const handleStatusUpdate = async (
    applicationId: string,
    status: ApplicationStatus
  ) => {
    try {
      await updateStatus.mutateAsync({ applicationId, status });
      toast.success(`Applicant moved to ${STATUS_CONFIG[status].label}.`);
    } catch {
      toast.error("Failed to update status.");
    }
  };

  // Client-side search filter (search by candidate name/email)
  const applications = (appData?.data ?? []).filter((app) => {
    if (!search) return true;
    const candidate = app.candidate as any;
    const term      = search.toLowerCase();
    return (
      candidate?.name?.toLowerCase().includes(term) ||
      candidate?.email?.toLowerCase().includes(term)
    );
  });

  // Count by status
  const countByStatus = (status: string) =>
    (appData?.data ?? []).filter((a) =>
      status ? a.status === status : true
    ).length;

  const job = jobData?.job;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <button
          onClick={() => navigate("/employer/dashboard")}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100
                     hover:text-gray-700 transition-colors mt-0.5"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="flex-1 min-w-0">
          {jobLoading ? (
            <>
              <Skeleton className="h-7 w-64 mb-2" />
              <Skeleton className="h-4 w-40" />
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 truncate">
                {job?.title ?? "Applications"}
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {job?.company} ·{" "}
                <Link
                  to={`/jobs/${id}`}
                  className="text-brand-600 hover:underline"
                  target="_blank"
                >
                  View job posting
                </Link>
                {" · "}
                <Link
                  to={`/employer/jobs/${id}/edit`}
                  className="text-brand-600 hover:underline"
                >
                  Edit job
                </Link>
              </p>
            </>
          )}
        </div>

        {/* Total count badge */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50
                          text-brand-700 rounded-lg text-sm font-medium">
            <Users className="w-4 h-4" aria-hidden="true" />
            {appData?.pagination?.total ?? 0} total
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2
                     w-4 h-4 text-gray-400 pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="Search by candidate name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-9"
          aria-label="Search applicants"
        />
      </div>

      {/* Status filter tabs */}
      <div
        className="flex gap-1 border-b border-gray-200 mb-5 overflow-x-auto"
        role="tablist"
        aria-label="Filter by status"
      >
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            role="tab"
            aria-selected={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium",
              "border-b-2 whitespace-nowrap transition-colors",
              filter === f.value
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {f.label}
            <span
              className={clsx(
                "text-xs px-1.5 py-0.5 rounded-full",
                filter === f.value
                  ? "bg-brand-100 text-brand-700"
                  : "bg-gray-100 text-gray-500"
              )}
            >
              {countByStatus(f.value)}
            </span>
          </button>
        ))}
      </div>

      {/* Error */}
      {appsError && (
        <Alert
          variant="error"
          message="Failed to load applications. Please refresh."
          className="mb-4"
        />
      )}

      {/* Loading */}
      {appsLoading && (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ApplicationCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!appsLoading && !appsError && applications.length === 0 && (
        <div className="card p-12 text-center">
          <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
            <Users
              className="w-10 h-10 text-gray-400"
              aria-hidden="true"
            />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {filter || search
              ? "No matching applicants"
              : "No applications yet"}
          </h2>
          <p className="text-gray-500 text-sm">
            {filter || search
              ? "Try adjusting your filters."
              : "Share your job posting to start receiving applications."}
          </p>
        </div>
      )}

      {/* Applicant cards */}
      {!appsLoading && applications.length > 0 && (
        <>
          <div className="flex flex-col gap-4">
            {applications.map((application) => (
              <ApplicantCard
                key={application._id}
                application={application}
                onUpdate={(id, status) => handleStatusUpdate(id, status)}
                isUpdating={updateStatus.isPending}
              />
            ))}
          </div>

          {/* Pagination */}
          {appData?.pagination && appData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <p className="text-sm text-gray-500">
                Page {appData.pagination.page} of{" "}
                {appData.pagination.totalPages}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}