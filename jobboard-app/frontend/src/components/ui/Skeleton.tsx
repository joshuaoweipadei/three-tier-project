import { clsx } from "clsx";

interface SkeletonProps {
  className?: string;
  lines?:     number;
}

// Single skeleton bar
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-md bg-gray-200",
        className
      )}
      aria-hidden="true"
    />
  );
}

// Paragraph skeleton — multiple lines
export function SkeletonText({ lines = 3, className }: SkeletonProps) {
  return (
    <div className={clsx("flex flex-col gap-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={clsx(
            "h-3 rounded",
            i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

// Job card skeleton
export function JobCardSkeleton() {
  return (
    <div className="card p-5" aria-hidden="true">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <Skeleton className="h-4 w-48 mb-2" />
          <Skeleton className="h-3 w-32 mb-3" />
          <div className="flex gap-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex gap-1.5 mt-3">
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-5 w-14 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-5 w-20 rounded-full flex-shrink-0" />
      </div>
    </div>
  );
}

// Application card skeleton
export function ApplicationCardSkeleton() {
  return (
    <div className="card p-5" aria-hidden="true">
      <div className="flex items-start gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
        <div className="flex-1">
          <Skeleton className="h-4 w-40 mb-2" />
          <Skeleton className="h-3 w-28 mb-1" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      {/* Timeline skeleton */}
      <div className="flex items-center gap-2 mt-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center flex-1">
            <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
            {i < 4 && <Skeleton className="h-0.5 flex-1 mx-1" />}
          </div>
        ))}
      </div>
    </div>
  );
}

// Stats bar skeleton
export function StatsBarSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div
      className={`grid gap-4 grid-cols-2 sm:grid-cols-${count} mb-6`}
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-4">
          <Skeleton className="h-8 w-12 mb-2" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

// Kanban column skeleton
export function KanbanSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((col) => (
        <div
          key={col}
          className="min-w-[260px] flex-1 max-w-xs border border-gray-200
                     rounded-xl p-3 bg-gray-50"
        >
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="w-2.5 h-2.5 rounded-full" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((card) => (
              <div
                key={card}
                className="bg-white rounded-lg border border-gray-200 p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-3 w-24 mb-1" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                </div>
                <Skeleton className="h-2.5 w-32 mb-2" />
                <Skeleton className="h-2.5 w-20" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}