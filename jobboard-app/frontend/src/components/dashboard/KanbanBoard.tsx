import type { Application, KanbanData } from "@/types";
import KanbanColumn from "./KanbanColumn";
import { useAdvanceApplication } from "@/hooks/use-dashboard";
import { Clock, ChevronRight, MoreHorizontal } from "lucide-react";
import { useState } from "react";

const STATUS_ORDER = [
  "pending",
  "reviewing",
  "shortlisted",
  "hired",
  "rejected",
] as const;

const NEXT_STATUS: Record<string, string> = {
  pending:     "reviewing",
  reviewing:   "shortlisted",
  shortlisted: "hired",
};

const PREV_STATUS: Record<string, string> = {
  reviewing:   "pending",
  shortlisted: "reviewing",
  hired:       "shortlisted",
};

// Mini card shown inside each Kanban column
function KanbanCard({
  application,
  onAdvance,
  isAdvancing,
}: {
  application: Application;
  onAdvance:   (id: string, status: string) => void;
  isAdvancing: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const candidate = application.candidate as any;
  const job       = application.job       as any;
  const status    = application.status;
  const nextSt    = NEXT_STATUS[status];
  const prevSt    = PREV_STATUS[status];

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm
                 hover:shadow-md transition-shadow cursor-default group"
    >
      {/* Candidate row */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center
                        justify-center text-brand-700 font-semibold text-xs
                        flex-shrink-0">
          {candidate?.name?.charAt(0)?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-900 truncate">
            {candidate?.name ?? "Unknown"}
          </p>
          <p className="text-[10px] text-gray-400 truncate">
            {candidate?.email}
          </p>
        </div>

        {/* Actions menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1 rounded text-gray-400 hover:text-gray-600
                       hover:bg-gray-100 opacity-0 group-hover:opacity-100
                       transition-all"
            aria-label="Actions"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 top-6 z-20 bg-white rounded-lg
                              border border-gray-200 shadow-lg py-1 w-40">
                {nextSt && (
                  <button
                    onClick={() => {
                      onAdvance(application._id, nextSt);
                      setMenuOpen(false);
                    }}
                    disabled={isAdvancing}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700
                               hover:bg-brand-50 hover:text-brand-700 transition-colors"
                  >
                    Move to {nextSt}
                  </button>
                )}
                {prevSt && (
                  <button
                    onClick={() => {
                      onAdvance(application._id, prevSt);
                      setMenuOpen(false);
                    }}
                    disabled={isAdvancing}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700
                               hover:bg-gray-50 transition-colors"
                  >
                    Move back to {prevSt}
                  </button>
                )}
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => {
                    onAdvance(application._id, "rejected");
                    setMenuOpen(false);
                  }}
                  disabled={isAdvancing || status === "rejected"}
                  className="w-full text-left px-3 py-1.5 text-xs text-red-600
                             hover:bg-red-50 transition-colors disabled:opacity-40"
                >
                  Reject
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Job name */}
      <p className="text-[10px] text-gray-500 truncate mb-2 pl-0.5">
        {job?.title ?? "Unknown job"}
      </p>

      {/* Applied date */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-400 flex items-center gap-1">
          <Clock className="w-3 h-3" aria-hidden="true" />
          {new Date(application.appliedAt).toLocaleDateString("en-CA", {
            month: "short", day: "numeric",
          })}
        </span>

        {/* Quick advance button */}
        {nextSt && (
          <button
            onClick={() => onAdvance(application._id, nextSt)}
            disabled={isAdvancing}
            className="flex items-center gap-0.5 text-[10px] text-brand-600
                       hover:text-brand-700 font-medium disabled:opacity-40
                       transition-colors"
            title={`Move to ${nextSt}`}
          >
            {nextSt}
            <ChevronRight className="w-3 h-3" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

// Main board
interface KanbanBoardProps {
  kanban:     KanbanData;
  jobFilter?: string;
}

export default function KanbanBoard({ kanban, jobFilter }: KanbanBoardProps) {
  const advance = useAdvanceApplication();

  const handleAdvance = (applicationId: string, newStatus: string) => {
    advance.mutate({ applicationId, status: newStatus });
  };

  // Optionally filter by job
  const filterByJob = (apps: Application[]) =>
    jobFilter
      ? apps.filter((a) => (a.job as any)?._id === jobFilter)
      : apps;

  return (
    <div
      className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6"
      role="region"
      aria-label="Application Kanban board"
    >
      {STATUS_ORDER.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          applications={filterByJob(kanban[status] ?? [])}
          onAdvance={handleAdvance}
          isAdvancing={advance.isPending}
          renderCard={(app) => (
            <KanbanCard
              application={app}
              onAdvance={handleAdvance}
              isAdvancing={advance.isPending}
            />
          )}
        />
      ))}
    </div>
  );
}