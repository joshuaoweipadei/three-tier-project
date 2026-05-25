import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import type { UserRole } from "@/types";

interface GuestRouteProps {
  children: React.ReactNode;
}

function getDefaultRoute(role: UserRole): string {
  if (role === "employer") return "/employer/dashboard";
  if (role === "admin") return "/admin/dashboard";
  return "/jobs";
}

export default function GuestRoute({ children }: GuestRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    return <Navigate to={getDefaultRoute(user.role)} replace />;
  }

  return <>{children}</>;
}