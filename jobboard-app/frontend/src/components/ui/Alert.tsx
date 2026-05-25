import { clsx } from "clsx";
import { AlertCircle, CheckCircle, XCircle, Info } from "lucide-react";

type AlertVariant = "error" | "success" | "warning" | "info";

interface AlertProps {
  variant?: AlertVariant;
  message: string;
  className?: string;
}

const icons = {
  error:   XCircle,
  success: CheckCircle,
  warning: AlertCircle,
  info:    Info,
};

const styles: Record<AlertVariant, string> = {
  error:   "bg-red-50 text-red-800 border-red-200",
  success: "bg-green-50 text-green-800 border-green-200",
  warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
  info:    "bg-blue-50 text-blue-800 border-blue-200",
};

export default function Alert({
  variant = "error",
  message,
  className,
}: AlertProps) {
  const Icon = icons[variant];

  return (
    <div
      role="alert"
      className={clsx(
        "flex items-start gap-3 px-4 py-3 rounded-lg border text-sm",
        styles[variant],
        className
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}