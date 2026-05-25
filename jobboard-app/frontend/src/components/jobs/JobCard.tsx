import { Link } from "react-router-dom";
import type { Job } from "@/types";
import {
  MapPin, Clock, DollarSign, Users, Briefcase,
} from "lucide-react";
import { clsx } from "clsx";

const JOB_TYPE_STYLES: Record<string, string> = {
  "full-time":  "bg-green-100  text-green-800",
  "part-time":  "bg-blue-100   text-blue-800",
  "contract":   "bg-purple-100 text-purple-800",
  "internship": "bg-orange-100 text-orange-800",
  "remote":     "bg-teal-100   text-teal-800",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  if (days === 0 && hours === 0) return "Just now";
  if (days === 0) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 30)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

interface JobCardProps {
  job: Job;
  showActions?: boolean;
  onDelete?: (id: string) => void;
}

export default function JobCard({ job, showActions, onDelete }: JobCardProps) {
  return (
    <article
      className="card p-5 hover:shadow-md hover:border-brand-200
                 transition-all duration-150 group"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left */}
        <div className="flex-1 min-w-0">
          {/* Title + company */}
          <div className="flex items-start gap-3 mb-1">
            <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center
                            justify-center flex-shrink-0">
              <Briefcase className="w-5 h-5 text-brand-600" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <Link
                to={`/jobs/${job._id}`}
                className="text-base font-semibold text-gray-900
                           group-hover:text-brand-600 transition-colors
                           hover:underline line-clamp-1"
              >
                {job.title}
              </Link>
              <p className="text-sm text-gray-500 truncate">{job.company}</p>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
              {job.location}
            </span>

            {job.salary && (
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" aria-hidden="true" />
                {job.salary.currency} {job.salary.min.toLocaleString()}
                {job.salary.max ? ` – ${job.salary.max.toLocaleString()}` : "+"}
              </span>
            )}

            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" aria-hidden="true" />
              {job.applicationCount}{" "}
              {job.applicationCount === 1 ? "applicant" : "applicants"}
            </span>

            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              {timeAgo(job.createdAt)}
            </span>
          </div>

          {/* Skills */}
          {job.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {job.skills.slice(0, 5).map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-0.5 rounded-md bg-gray-100
                             text-gray-600 text-xs font-medium"
                >
                  {skill}
                </span>
              ))}
              {job.skills.length > 5 && (
                <span className="px-2 py-0.5 rounded-md bg-gray-100
                                 text-gray-400 text-xs">
                  +{job.skills.length - 5} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right — type badge + status */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className={clsx("badge", JOB_TYPE_STYLES[job.type])}>
            {job.type}
          </span>
          {job.status !== "open" && (
            <span className="badge bg-gray-100 text-gray-500">
              {job.status}
            </span>
          )}
        </div>
      </div>

      {/* Employer actions */}
      {showActions && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
          <Link
            to={`/employer/jobs/${job._id}/edit`}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            Edit
          </Link>
          <Link
            to={`/employer/jobs/${job._id}/applications`}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            View Applications
          </Link>
          <button
            onClick={() => onDelete?.(job._id)}
            className="btn-danger text-xs px-3 py-1.5 ml-auto"
          >
            Delete
          </button>
        </div>
      )}
    </article>
  );
}