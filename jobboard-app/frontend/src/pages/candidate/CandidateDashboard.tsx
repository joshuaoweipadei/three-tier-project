import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCandidateDashboard } from "@/hooks/use-dashboard";
import { useWebSocket } from "@/hooks/use-web-socket";
import { useQueryClient } from "@tanstack/react-query";
import StatsBar from "@/components/dashboard/StatsBar";
import ApplicationCard from "@/components/dashboard/ApplicationCard";
import { ApplicationCardSkeleton, StatsBarSkeleton } from "@/components/ui/Skeleton";
import {
  Search, Briefcase,
  CheckCircle, Clock, Star, XCircle,
} from "lucide-react";
import { clsx } from "clsx";

const FILTERS = [
  { label: "All",         value: ""            },
  { label: "Pending",     value: "pending"      },
  { label: "Reviewing",   value: "reviewing"    },
  { label: "Shortlisted", value: "shortlisted"  },
  { label: "Hired",       value: "hired"        },
  { label: "Rejected",    value: "rejected"     },
];

export default function CandidateDashboard() {
  const queryClient     = useQueryClient();
  const { onMessage }   = useWebSocket();
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useCandidateDashboard();

  // Real-time: refresh dashboard when application status changes
  useEffect(() => {
    const unsub = onMessage((msg) => {
      if (msg.type === "APPLICATION_STATUS_CHANGED") {
        queryClient.invalidateQueries({ queryKey: ["dashboard", "candidate"] });
      }
    });
    return () => { unsub(); };
  }, [onMessage, queryClient]);

  // Filter + search
  const filtered = (data?.applications ?? []).filter((app) => {
    const job      = app.job as any;
    const matchSt  = filter ? app.status === filter : true;
    const matchSrch = search
      ? job?.title?.toLowerCase().includes(search.toLowerCase()) ||
        job?.company?.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchSt && matchSrch;
  });

  const stats = data?.stats;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          My Applications
        </h1>
        <p className="text-gray-500 mt-1">
          Track every application and your progress through each stage.
        </p>
      </div>

      {/* Stats bar */}
      {stats && (
        <StatsBar
          className="mb-6"
          stats={[
            {
              label: "Total Applied",
              value: stats.total,
              icon:  <Briefcase className="w-5 h-5" />,
              color: "text-brand-600",
            },
            {
              label: "Active",
              value: stats.active,
              icon:  <Clock className="w-5 h-5" />,
              color: "text-blue-600",
            },
            {
              label: "Shortlisted",
              value: stats.shortlisted,
              icon:  <Star className="w-5 h-5" />,
              color: "text-purple-600",
            },
            {
              label: "Hired",
              value: stats.hired,
              icon:  <CheckCircle className="w-5 h-5" />,
              color: "text-green-600",
            },
            {
              label: "Rejected",
              value: stats.rejected,
              icon:  <XCircle className="w-5 h-5" />,
              color: "text-red-500",
            },
          ]}
        />
      )}

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2
                       w-4 h-4 text-gray-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search by job title or company…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
            aria-label="Search applications"
          />
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-5 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={clsx(
              "px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap",
              "transition-colors",
              filter === f.value
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {f.label}
            {f.value && stats && (
              <span className="ml-1.5 text-xs text-gray-400">
                {stats[f.value as keyof typeof stats] ?? 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <>
          <StatsBarSkeleton count={5} />
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ApplicationCardSkeleton key={i} />
            ))}
          </div>
        </>
      )}

      {/* Error */}
      {isError && (
        <div className="card p-8 text-center text-gray-500">
          Failed to load applications. Please refresh.
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && filtered.length === 0 && (
        <div className="card p-12 text-center">
          <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {filter || search ? "No matching applications" : "No applications yet"}
          </h2>
          <p className="text-gray-500 mb-4">
            {filter || search
              ? "Try changing your filter or search."
              : "Start applying to track your progress here."}
          </p>
          <Link to="/jobs" className="btn-primary">Browse Jobs</Link>
        </div>
      )}

      {/* Application list */}
      {!isLoading && !isError && filtered.length > 0 && (
        <div className="flex flex-col gap-4">
          {filtered.map((application) => (
            <ApplicationCard
              key={application._id}
              application={application}
              showTimeline
            />
          ))}
        </div>
      )}
    </div>
  );
}