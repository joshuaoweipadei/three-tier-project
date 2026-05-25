import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useEmployerDashboard } from "@/hooks/use-dashboard";
import { useWebSocket } from "@/hooks/use-web-socket";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import StatsBar from "@/components/dashboard/StatsBar";
import KanbanBoard from "@/components/dashboard/KanbanBoard";
import JobCard from "@/components/jobs/JobCard";
import { StatsBarSkeleton, KanbanSkeleton } from "@/components/ui/Skeleton";
import { useDeleteJob } from "@/hooks/use-jobs";
import {
  Briefcase, Users, Star, CheckCircle,
  Plus, LayoutGrid, List,
} from "lucide-react";
import { clsx } from "clsx";
import type { Job } from "@/types";

type ViewMode = "kanban" | "list";

export default function EmployerDashboard() {
  const { user }      = useAuthStore();
  const queryClient   = useQueryClient();
  const { onMessage } = useWebSocket();
  const deleteJob     = useDeleteJob();

  const [view,      setView]      = useState<ViewMode>("kanban");
  const [jobFilter, setJobFilter] = useState<string>("");

  const { data, isLoading, isError } = useEmployerDashboard();

  // Real-time: refresh when a new application arrives
  useEffect(() => {
    const unsub = onMessage((msg) => {
      if (msg.type === "NEW_APPLICATION") {
        queryClient.invalidateQueries({ queryKey: ["dashboard", "employer"] });
      }
    });
    return () => { unsub(); };
  }, [onMessage, queryClient]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this job and all its applications?")) return;
    await deleteJob.mutateAsync(id);
    queryClient.invalidateQueries({ queryKey: ["dashboard", "employer"] });
  };

  const stats = data?.stats;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-gray-500 mt-1">
            Manage your job postings and move candidates through your pipeline.
          </p>
        </div>
        <Link to="/employer/jobs/new" className="btn-primary">
          <Plus className="w-4 h-4" aria-hidden="true" />
          Post a Job
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <StatsBar
          className="mb-6"
          stats={[
            {
              label: "Jobs Posted",
              value: stats.totalJobs,
              icon:  <Briefcase className="w-5 h-5" />,
              color: "text-brand-600",
            },
            {
              label: "Open Jobs",
              value: stats.openJobs,
              icon:  <Briefcase className="w-5 h-5" />,
              color: "text-green-600",
            },
            {
              label: "Total Applicants",
              value: stats.totalApplicants,
              icon:  <Users className="w-5 h-5" />,
              color: "text-blue-600",
            },
            {
              label: "Shortlisted",
              value: stats.activeInterviews,
              icon:  <Star className="w-5 h-5" />,
              color: "text-purple-600",
            },
            {
              label: "Hired",
              value: stats.hired,
              icon:  <CheckCircle className="w-5 h-5" />,
              color: "text-green-600",
            },
          ]}
        />
      )}

      {/* Loading */}
      {isLoading && (
        <>
          <StatsBarSkeleton count={5} />
          <KanbanSkeleton />
        </>
      )}

      {isError && (
        <div className="card p-8 text-center text-gray-500">
          Failed to load dashboard. Please refresh.
        </div>
      )}

      {!isLoading && !isError && data && (
        <>
          {/* View toggle + job filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center
                          justify-between gap-3 mb-4">
            {/* Job filter */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="job-filter"
                className="text-sm text-gray-600 whitespace-nowrap"
              >
                Filter by job:
              </label>
              <select
                id="job-filter"
                value={jobFilter}
                onChange={(e) => setJobFilter(e.target.value)}
                className="input w-auto text-sm py-1.5"
              >
                <option value="">All jobs</option>
                {data.jobs.map((job: Job) => (
                  <option key={job._id} value={job._id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView("kanban")}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm",
                  "font-medium transition-all",
                  view === "kanban"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
                aria-pressed={view === "kanban"}
              >
                <LayoutGrid className="w-4 h-4" aria-hidden="true" />
                Kanban
              </button>
              <button
                onClick={() => setView("list")}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm",
                  "font-medium transition-all",
                  view === "list"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
                aria-pressed={view === "list"}
              >
                <List className="w-4 h-4" aria-hidden="true" />
                List
              </button>
            </div>
          </div>

          {/* Kanban view */}
          {view === "kanban" && (
            <>
              {data.stats.totalApplicants === 0 ? (
                <div className="card p-12 text-center">
                  <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    No applicants yet
                  </h2>
                  <p className="text-gray-500 mb-4">
                    Once candidates apply to your jobs they'll appear here.
                  </p>
                  <Link to="/employer/jobs/new" className="btn-primary">
                    <Plus className="w-4 h-4" />
                    Post a Job
                  </Link>
                </div>
              ) : (
                <KanbanBoard
                  kanban={data.kanban}
                  jobFilter={jobFilter}
                />
              )}
            </>
          )}

          {/* List view — job postings */}
          {view === "list" && (
            <>
              {data.jobs.length === 0 ? (
                <div className="card p-12 text-center">
                  <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    No jobs posted yet
                  </h2>
                  <Link to="/employer/jobs/new" className="btn-primary">
                    <Plus className="w-4 h-4" />
                    Post your first job
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {data.jobs.map((job: Job) => (
                    <JobCard
                      key={job._id}
                      job={job}
                      showActions
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}