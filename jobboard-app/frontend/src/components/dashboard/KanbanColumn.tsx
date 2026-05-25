import type { Application } from "@/types";
import { clsx } from "clsx";

const COLUMN_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  pending: {
    label: "Applied",
    color: "bg-gray-50  border-gray-200",
    dot:   "bg-gray-400",
  },
  reviewing: {
    label: "Reviewing",
    color: "bg-blue-50  border-blue-200",
    dot:   "bg-blue-500",
  },
  shortlisted: {
    label: "Shortlisted",
    color: "bg-purple-50 border-purple-200",
    dot:   "bg-purple-500",
  },
  hired: {
    label: "Hired",
    color: "bg-green-50  border-green-200",
    dot:   "bg-green-500",
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-50    border-red-200",
    dot:   "bg-red-400",
  },
};

interface KanbanColumnProps {
  status:       string;
  applications: Application[];
  onAdvance:    (applicationId: string, newStatus: string) => void;
  isAdvancing:  boolean;
  renderCard:   (app: Application) => React.ReactNode;
}

export default function KanbanColumn({
  status,
  applications,
  renderCard,
}: KanbanColumnProps) {
  const config = COLUMN_CONFIG[status] ?? {
    label: status,
    color: "bg-gray-50 border-gray-200",
    dot:   "bg-gray-400",
  };

  return (
    <section
      className={clsx(
        "flex flex-col rounded-xl border min-w-[260px] flex-1 max-w-xs",
        config.color
      )}
      aria-label={`${config.label} column`}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-inherit">
        <span
          className={clsx("w-2.5 h-2.5 rounded-full flex-shrink-0", config.dot)}
          aria-hidden="true"
        />
        <h3 className="text-sm font-semibold text-gray-700 flex-1">
          {config.label}
        </h3>
        <span className="text-xs font-medium text-gray-500 bg-white
                         px-2 py-0.5 rounded-full border border-gray-200">
          {applications.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 p-2 flex-1 min-h-[120px]">
        {applications.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">
            No applicants here
          </p>
        ) : (
          applications.map((app) => (
            <div key={app._id}>{renderCard(app)}</div>
          ))
        )}
      </div>
    </section>
  );
}