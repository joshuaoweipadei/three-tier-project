import type { TimelineEvent } from "@/types";

const STATUS_ORDER = ["pending", "reviewing", "shortlisted", "hired"] as const;

const STAGE_LABELS: Record<string, string> = {
  pending:     "Applied",
  reviewing:   "Under Review",
  shortlisted: "Shortlisted",
  hired:       "Offer Extended",
  rejected:    "Not Selected",
};

export function buildClientTimeline(
  status:    string,
  appliedAt: string | Date
): TimelineEvent[] {
  const applied = new Date(appliedAt);

  if (status === "rejected") {
    return [
      {
        stage:     "pending",
        label:     "Applied",
        completed: true,
        active:    false,
        skipped:   false,
        date:      applied.toISOString(),
      },
      {
        stage:     "reviewing",
        label:     "Under Review",
        completed: false,
        active:    false,
        skipped:   false,
        date:      null,
      },
      {
        stage:     "shortlisted",
        label:     "Shortlisted",
        completed: false,
        active:    false,
        skipped:   false,
        date:      null,
      },
      {
        stage:     "rejected",
        label:     "Not Selected",
        completed: true,
        active:    true,
        skipped:   false,
        date:      new Date().toISOString(),
      },
    ];
  }

  const currentIndex = STATUS_ORDER.indexOf(status as any);

  return STATUS_ORDER.map((stage, i) => ({
    stage,
    label:     STAGE_LABELS[stage],
    completed: i < currentIndex,
    active:    i === currentIndex,
    skipped:   false,
    date:
      i <= currentIndex
        ? new Date(applied.getTime() + i * 86400000 * 2).toISOString()
        : null,
  }));
}