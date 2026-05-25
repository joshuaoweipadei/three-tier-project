import { clsx } from "clsx";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon:        LucideIcon;
  title:       string;
  description: string;
  action?:     ReactNode;
  className?:  string;
}


export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "card p-12 flex flex-col items-center text-center",
        className
      )}
      role="status"
      aria-label={title}
    >
      <div className="p-4 bg-gray-100 rounded-full mb-4">
        <Icon className="w-10 h-10 text-gray-400" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-500 text-sm max-w-xs leading-relaxed mb-6">
        {description}
      </p>
      {action && action}
    </div>
  );
}