import { useState } from "react";
import { Link } from "react-router-dom";
import type { Application } from "@/types";
import ApplicationTimeline from "./ApplicationTimeline";
import { buildClientTimeline } from "@/lib/timeline";
import {
  MapPin, Briefcase, ChevronDown, ChevronUp,
  ExternalLink, Clock,
} from "lucide-react";
import { clsx } from "clsx";

const STATUS_STYLES: Record<string, string> = {
  pending:     "bg-gray-100   text-gray-700",
  reviewing:   "bg-blue-100   text-blue-700",
  shortlisted: "bg-purple-100 text-purple-700",
  hired:       "bg-green-100  text-green-700",
  rejected:    "bg-red-100    text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  pending:     "Applied",
  reviewing:   "Under Review",
  shortlisted: "Shortlisted",
  hired:       "Offer Extended",
  rejected:    "Not Selected",
};

interface ApplicationCardProps {
  application: Application;
  showTimeline?: boolean;
}

export default function ApplicationCard({
  application,
  showTimeline = true,
}: ApplicationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const job = application.job as any;

  const timeline = buildClientTimeline(application.status, application.appliedAt);
  const isRejected = application.status === "rejected";

  return (
    <article
      className={clsx(
        "card transition-all duration-200",
        application.status === "hired"    && "border-green-200 bg-green-50/30",
        application.status === "rejected" && "border-red-200   opacity-75",
      )}
    >
      {/* Header */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          {/* Job info */}
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center
                            justify-center flex-shrink-0 mt-0.5">
              <Briefcase
                className="w-5 h-5 text-brand-600"
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0">
              <Link
                to={`/jobs/${job?._id}`}
                className="font-semibold text-gray-900 hover:text-brand-600
                           transition-colors line-clamp-1 flex items-center gap-1"
              >
                {job?.title ?? "Job"}
                <ExternalLink
                  className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100"
                  aria-hidden="true"
                />
              </Link>
              <p className="text-sm text-gray-500 mt-0.5">
                {job?.company}
                {job?.location && (
                  <span className="inline-flex items-center gap-1 ml-2">
                    <MapPin className="w-3 h-3" aria-hidden="true" />
                    {job.location}
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" aria-hidden="true" />
                Applied{" "}
                {new Date(application.appliedAt).toLocaleDateString("en-CA", {
                  month: "short", day: "numeric", year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Status badge */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span
              className={clsx(
                "badge text-xs font-medium",
                STATUS_STYLES[application.status]
              )}
            >
              {STATUS_LABELS[application.status] ?? application.status}
            </span>
          </div>
        </div>

        {/* Compact timeline — always visible */}
        {showTimeline && (
          <div className="mt-4 px-1">
            <ApplicationTimeline
              events={timeline}
              isRejected={isRejected}
              compact
            />
          </div>
        )}
      </div>

      {/* Expand/collapse for full timeline */}
      {showTimeline && (
        <>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5
                       border-t border-gray-100 text-xs text-gray-400
                       hover:text-gray-600 hover:bg-gray-50 transition-colors
                       rounded-b-xl"
            aria-expanded={expanded}
            aria-label={expanded ? "Hide timeline" : "Show full timeline"}
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                Hide timeline
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                View full timeline
              </>
            )}
          </button>

          {expanded && (
            <div className="px-5 pt-2 pb-5 border-t border-gray-100">
              <ApplicationTimeline
                events={timeline}
                isRejected={isRejected}
                compact={false}
              />
            </div>
          )}
        </>
      )}
    </article>
  );
}