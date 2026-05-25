import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { Job } from "@/types";
import {
  CheckCircle, XCircle, Trash2, Search,
  ChevronLeft, ChevronRight, Loader2,
  MapPin, Briefcase, Users, ExternalLink,
} from "lucide-react";
import { clsx } from "clsx";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

function useAdminJobs(filters: {
  page?:   number;
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["admin-jobs", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== "") params.set(k, String(v));
      });
      const { data } = await api.get(`/admin/jobs?${params}`);
      return data as {
        success: boolean;
        data: Job[];
        pagination: {
          page: number; limit: number; total: number;
          totalPages: number; hasNextPage: boolean; hasPrevPage: boolean;
        };
      };
    },
  });
}

const STATUS_STYLES: Record<string, string> = {
  open:   "bg-green-100  text-green-700",
  draft:  "bg-yellow-100 text-yellow-700",
  closed: "bg-gray-100   text-gray-500",
};

const JOB_TYPE_STYLES: Record<string, string> = {
  "full-time":  "bg-green-50  text-green-700",
  "part-time":  "bg-blue-50   text-blue-700",
  "contract":   "bg-purple-50 text-purple-700",
  "internship": "bg-orange-50 text-orange-700",
  "remote":     "bg-teal-50   text-teal-700",
};

export default function JobModerationQueue() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("draft"); // default to pending moderation
  const [page,   setPage]   = useState(1);

  const { data, isLoading } = useAdminJobs({
    page,
    status: status || undefined,
    search: search || undefined,
  });

  const approveMutation = useMutation({
    mutationFn: (jobId: string) => api.patch(`/admin/jobs/${jobId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Job approved and published.");
    },
    onError: () => toast.error("Failed to approve job."),
  });

  const rejectMutation = useMutation({
    mutationFn: (jobId: string) => api.patch(`/admin/jobs/${jobId}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      toast.success("Job rejected.");
    },
    onError: () => toast.error("Failed to reject job."),
  });

  const deleteMutation = useMutation({
    mutationFn: (jobId: string) => api.delete(`/admin/jobs/${jobId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Job permanently deleted.");
    },
    onError: () => toast.error("Failed to delete job."),
  });

  const isActing =
    approveMutation.isPending ||
    rejectMutation.isPending  ||
    deleteMutation.isPending;

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2
                       w-4 h-4 text-gray-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search job title or company…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input pl-9"
            aria-label="Search jobs"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="input w-auto"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="draft">Pending review (draft)</option>
          <option value="open">Published</option>
          <option value="closed">Closed / Rejected</option>
        </select>
      </div>

      {/* Job list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="card p-10 text-center text-gray-400 text-sm">
          No jobs found for this filter.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {data?.data?.map((job) => {
            const employer = job.employer as any;
            return (
              <article
                key={job._id}
                className={clsx(
                  "card p-5 transition-opacity",
                  isActing && "opacity-60 pointer-events-none"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left — job details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Link
                        to={`/jobs/${job._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-gray-900 hover:text-brand-600
                                   transition-colors flex items-center gap-1"
                      >
                        {job.title}
                        <ExternalLink
                          className="w-3.5 h-3.5 opacity-50"
                          aria-hidden="true"
                        />
                      </Link>
                      <span
                        className={clsx(
                          "badge text-xs capitalize",
                          STATUS_STYLES[job.status]
                        )}
                      >
                        {job.status}
                      </span>
                      <span
                        className={clsx(
                          "badge text-xs",
                          JOB_TYPE_STYLES[job.type]
                        )}
                      >
                        {job.type}
                      </span>
                    </div>

                    <div
                      className="flex flex-wrap items-center gap-3
                                 text-sm text-gray-500 mt-1"
                    >
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5" aria-hidden="true" />
                        {job.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" aria-hidden="true" />
                        {job.applicationCount} applicants
                      </span>
                    </div>

                    {/* Employer info */}
                    {employer && (
                      <p className="text-xs text-gray-400 mt-2">
                        Posted by{" "}
                        <span className="font-medium text-gray-600">
                          {employer.name}
                        </span>
                        {employer.email && (
                          <span> · {employer.email}</span>
                        )}
                      </p>
                    )}

                    {/* Description preview */}
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                      {job.description}
                    </p>
                  </div>

                  {/* Right — action buttons */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {job.status === "draft" && (
                      <button
                        onClick={() => approveMutation.mutate(job._id)}
                        disabled={isActing}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5
                                   text-xs font-medium rounded-lg bg-green-600
                                   text-white hover:bg-green-700 transition-colors
                                   disabled:opacity-40"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Approve
                      </button>
                    )}

                    {job.status !== "closed" && (
                      <button
                        onClick={() => {
                          if (window.confirm("Reject this job posting?")) {
                            rejectMutation.mutate(job._id);
                          }
                        }}
                        disabled={isActing}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5
                                   text-xs font-medium rounded-lg bg-orange-50
                                   text-orange-700 hover:bg-orange-100
                                   transition-colors disabled:opacity-40"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            "Permanently delete this job and all applications?"
                          )
                        ) {
                          deleteMutation.mutate(job._id);
                        }
                      }}
                      disabled={isActing}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5
                                 text-xs font-medium rounded-lg bg-red-50
                                 text-red-600 hover:bg-red-100 transition-colors
                                 disabled:opacity-40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-500">
            {data.pagination.total} jobs total
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={!data.pagination.hasPrevPage}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500
                         hover:bg-gray-50 disabled:opacity-40
                         disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-600 px-1">
              {page} / {data.pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!data.pagination.hasNextPage}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500
                         hover:bg-gray-50 disabled:opacity-40
                         disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}