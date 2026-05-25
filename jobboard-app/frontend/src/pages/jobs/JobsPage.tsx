import { useState, useCallback } from "react";
import { useJobs, type JobFilters } from "@/hooks/use-jobs";
import JobCard from "@/components/jobs/JobCard";
import { Search, SlidersHorizontal, X, AlertCircle } from "lucide-react";
import { clsx } from "clsx";
import { useAuthStore } from "@/stores/auth-store";
import { Link } from "react-router-dom";
import { JobCardSkeleton } from "@/components/ui/Skeleton";

const JOB_TYPES = ["full-time", "part-time", "contract", "internship", "remote"];

export default function JobsPage() {
  const { user } = useAuthStore();

  const [filters, setFilters] = useState<JobFilters>({
    page: 1, limit: 10, sort: "-createdAt",
  });
  const [searchInput,   setSearchInput]   = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [showFilters,   setShowFilters]   = useState(false);

  const { data, isLoading, isError, error } = useJobs(filters);

  const applySearch = useCallback(() => {
    setFilters((f) => ({
      ...f,
      page:     1,
      search:   searchInput.trim()   || undefined,
      location: locationInput.trim() || undefined,
    }));
  }, [searchInput, locationInput]);

  const clearFilters = () => {
    setSearchInput("");
    setLocationInput("");
    setFilters({ page: 1, limit: 10, sort: "-createdAt" });
  };

  const hasActiveFilters =
    filters.search || filters.location || filters.type;

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Browse Jobs</h1>
        <p className="text-gray-500 mt-1">
          {data?.pagination?.total ?? 0} positions available
        </p>
      </div>

      {/* Search bar */}
      <div className="card p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Keyword search */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2
                         w-4 h-4 text-gray-400 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Job title, skill, or keyword…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applySearch()}
              className="input pl-9"
              aria-label="Search jobs"
            />
          </div>

          {/* Location */}
          <div className="relative sm:w-52">
            <input
              type="text"
              placeholder="Location…"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applySearch()}
              className="input"
              aria-label="Filter by location"
            />
          </div>

          <button onClick={applySearch} className="btn-primary whitespace-nowrap">
            <Search className="w-4 h-4" aria-hidden="true" />
            Search
          </button>

          <button
            onClick={() => setShowFilters((v) => !v)}
            className={clsx(
              "btn-secondary whitespace-nowrap",
              showFilters && "bg-brand-50 border-brand-300 text-brand-700"
            )}
            aria-expanded={showFilters}
          >
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 w-2 h-2 rounded-full bg-brand-500" />
            )}
          </button>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {JOB_TYPES.map((type) => (
              <button
                key={type}
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    page: 1,
                    type: f.type === type ? undefined : type,
                  }))
                }
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                  filters.type === type
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        )}

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500">Active filters:</span>
            {filters.search && (
              <span className="badge bg-brand-100 text-brand-700 gap-1">
                "{filters.search}"
                <button
                  onClick={() => setFilters((f) => ({ ...f, search: undefined, page: 1 }))}
                  aria-label="Remove search filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.location && (
              <span className="badge bg-brand-100 text-brand-700 gap-1">
                📍 {filters.location}
                <button
                  onClick={() => setFilters((f) => ({ ...f, location: undefined, page: 1 }))}
                  aria-label="Remove location filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.type && (
              <span className="badge bg-brand-100 text-brand-700 gap-1">
                {filters.type}
                <button
                  onClick={() => setFilters((f) => ({ ...f, type: undefined, page: 1 }))}
                  aria-label="Remove type filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-xs text-gray-400 hover:text-gray-600 underline ml-1"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Sort + count bar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {isLoading ? "Loading…" : `${data?.pagination?.total ?? 0} jobs found`}
        </p>
        <select
          value={filters.sort ?? "-createdAt"}
          onChange={(e) =>
            setFilters((f) => ({ ...f, sort: e.target.value, page: 1 }))
          }
          className="input w-auto text-sm py-1.5"
          aria-label="Sort jobs"
        >
          <option value="-createdAt">Newest first</option>
          <option value="createdAt">Oldest first</option>
          <option value="-applicationCount">Most applied</option>
          <option value="salary.min">Lowest salary</option>
          <option value="-salary.min">Highest salary</option>
        </select>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="card p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">Failed to load jobs</p>
          <p className="text-sm text-gray-500 mt-1">
            {(error as Error)?.message ?? "Please try again."}
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && data?.data?.length === 0 && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center
                          justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No jobs found
          </h2>
          <p className="text-gray-500 mb-4">
            Try adjusting your search or filters.
          </p>
          <button onClick={clearFilters} className="btn-secondary">
            Clear filters
          </button>
        </div>
      )}

      {/* Job list */}
      {!isLoading && !isError && data?.data && data.data.length > 0 && (
        <>
          <div className="flex flex-col gap-3">
            {data.data.map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>

          {/* Pagination */}
          {data.pagination && data.pagination.totalPages > 1 && (
            <nav
              className="flex items-center justify-center gap-2 mt-8"
              aria-label="Pagination"
            >
              <button
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
                disabled={!data.pagination.hasPrevPage}
                className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
              >
                Previous
              </button>

              <span className="text-sm text-gray-600 px-2">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </span>

              <button
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
                disabled={!data.pagination.hasNextPage}
                className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}

      {/* CTA for employers */}
      {user?.role === "employer" && (
        <div className="card p-6 mt-6 bg-brand-50 border-brand-200 text-center">
          <h3 className="font-semibold text-brand-900 mb-1">
            Looking to hire?
          </h3>
          <p className="text-sm text-brand-700 mb-3">
            Post a job and reach thousands of candidates.
          </p>
          <Link to="/employer/jobs/new" className="btn-primary">
            Post a Job
          </Link>
        </div>
      )}
    </div>
  );
}