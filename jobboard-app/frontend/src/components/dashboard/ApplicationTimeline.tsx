import { clsx } from "clsx";
import type { TimelineEvent } from "@/types";
import {
  CheckCircle, Circle, XCircle, Clock,
  Eye, Star, Award,
} from "lucide-react";

const STAGE_ICONS: Record<string, React.ElementType> = {
  pending:     Clock,
  reviewing:   Eye,
  shortlisted: Star,
  hired:       Award,
  rejected:    XCircle,
};

interface ApplicationTimelineProps {
  events:    TimelineEvent[];
  isRejected?: boolean;
  compact?:  boolean;
}

export default function ApplicationTimeline({
  events,
  isRejected = false,
  compact    = false,
}: ApplicationTimelineProps) {
  return (
    <ol
      className={clsx(
        "relative",
        compact ? "flex items-center gap-0" : "flex flex-col gap-0"
      )}
      aria-label="Application status timeline"
    >
      {events.map((event, index) => {
        const Icon       = STAGE_ICONS[event.stage] ?? Circle;
        const isLast     = index === events.length - 1;
        const isRejStage = event.stage === "rejected";

        if (compact) {
          // Horizontal compact version for cards
          return (
            <li key={event.stage} className="flex items-center">
              <div
                className={clsx(
                  "flex flex-col items-center",
                )}
                title={event.label}
              >
                <div
                  className={clsx(
                    "w-7 h-7 rounded-full flex items-center justify-center",
                    "border-2 transition-colors",
                    event.active && isRejStage
                      ? "border-red-500   bg-red-50   text-red-600"
                      : event.active
                      ? "border-brand-500 bg-brand-50 text-brand-600"
                      : event.completed
                      ? "border-green-500 bg-green-50 text-green-600"
                      : "border-gray-200  bg-white    text-gray-300"
                  )}
                  aria-current={event.active ? "step" : undefined}
                >
                  {event.completed && !event.active ? (
                    <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                </div>
                <span
                  className={clsx(
                    "text-[10px] mt-1 text-center whitespace-nowrap",
                    event.active
                      ? isRejStage ? "text-red-600 font-semibold"
                                   : "text-brand-600 font-semibold"
                      : event.completed
                      ? "text-green-600"
                      : "text-gray-400"
                  )}
                >
                  {event.label}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={clsx(
                    "h-0.5 flex-1 mx-1 mb-4 transition-colors",
                    event.completed
                      ? "bg-green-400"
                      : "bg-gray-200"
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        }

        // Vertical full version
        return (
          <li key={event.stage} className="flex gap-4 pb-6 last:pb-0">
            {/* Left column — icon + connector */}
            <div className="flex flex-col items-center">
              <div
                className={clsx(
                  "w-9 h-9 rounded-full flex items-center justify-center",
                  "border-2 flex-shrink-0 transition-all duration-300",
                  event.active && isRejStage
                    ? "border-red-500   bg-red-50   text-red-600"
                    : event.active
                    ? "border-brand-500 bg-brand-50 text-brand-600 shadow-md shadow-brand-100"
                    : event.completed
                    ? "border-green-500 bg-green-50 text-green-600"
                    : "border-gray-200  bg-white    text-gray-300"
                )}
                aria-current={event.active ? "step" : undefined}
              >
                {event.completed && !event.active ? (
                  <CheckCircle className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Icon className="w-4 h-4" aria-hidden="true" />
                )}
              </div>

              {/* Vertical connector */}
              {!isLast && (
                <div
                  className={clsx(
                    "w-0.5 flex-1 mt-1 transition-colors duration-300",
                    event.completed ? "bg-green-400" : "bg-gray-200"
                  )}
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Right column — label + date */}
            <div className="pt-1.5 pb-2">
              <p
                className={clsx(
                  "text-sm font-medium leading-none",
                  event.active && isRejStage ? "text-red-700"
                  : event.active             ? "text-brand-700"
                  : event.completed          ? "text-green-700"
                  :                            "text-gray-400"
                )}
              >
                {event.label}
              </p>
              {event.date && (
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(event.date).toLocaleDateString("en-CA", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </p>
              )}
              {!event.date && !event.completed && !event.active && (
                <p className="text-xs text-gray-300 mt-1">Pending</p>
              )}
              {isRejected && (
                <p className="text-xs text-red-600 mt-1">Rejected</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}