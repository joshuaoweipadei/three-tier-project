import { clsx } from "clsx";

interface StatItem {
  label:   string;
  value:   number | string;
  color?:  string;
  icon?:   React.ReactNode;
}

interface StatsBarProps {
  stats:     StatItem[];
  className?: string;
}

export default function StatsBar({ stats, className }: StatsBarProps) {
  return (
    <div
      className={clsx(
        "grid gap-4",
        stats.length === 3 ? "grid-cols-3" :
        stats.length === 4 ? "grid-cols-2 sm:grid-cols-4" :
        stats.length === 5 ? "grid-cols-2 sm:grid-cols-5" :
        "grid-cols-2 sm:grid-cols-3",
        className
      )}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="card p-4 flex flex-col gap-1"
        >
          {stat.icon && (
            <div className={clsx("mb-1", stat.color ?? "text-brand-600")}>
              {stat.icon}
            </div>
          )}
          <p
            className={clsx(
              "text-2xl font-bold",
              stat.color ?? "text-gray-900"
            )}
          >
            {stat.value}
          </p>
          <p className="text-xs text-gray-500 leading-tight">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}