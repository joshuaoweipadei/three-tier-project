import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { useAuth } from "@/hooks/use-auth";
import {
  Briefcase, LayoutDashboard, LogOut, Menu, X,
  User, ChevronDown,
} from "lucide-react";
import { clsx } from "clsx";
import NotificationBell from "@/components/notifications/NotificationBell";

export default function Navbar() {
  const { user, isAuthenticated } = useAuthStore();
  const { logout } = useAuth();
//   const navigate   = useNavigate();
  const location   = useLocation();
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isActive = (path: string) => location.pathname.startsWith(path);

  const dashboardPath =
    user?.role === "employer" ? "/employer/dashboard" :
    user?.role === "admin"    ? "/admin/dashboard"    :
    "/candidate/dashboard";

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-xl text-gray-900
                       hover:text-brand-600 transition-colors"
          >
            <Briefcase className="w-6 h-6 text-brand-600" aria-hidden="true" />
            JobBoard
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            <Link
              to="/jobs"
              className={clsx(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive("/jobs")
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              Browse Jobs
            </Link>

            {isAuthenticated && (
              <Link
                to={dashboardPath}
                className={clsx(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive("/employer/dashboard") ||
                  isActive("/candidate/dashboard") ||
                  isActive("/admin/dashboard")
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                Dashboard
              </Link>
            )}

            {user?.role === "employer" && (
              <Link
                to="/employer/jobs/new"
                className={clsx(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive("/employer/jobs/new")
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                Post a Job
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                {/* Notifications bell — Phase 4 */}
                <NotificationBell />

                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen((v) => !v)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg
                               text-sm font-medium text-gray-700
                               hover:bg-gray-100 transition-colors"
                    aria-expanded={profileOpen}
                    aria-haspopup="true"
                  >
                    {/* Avatar */}
                    <span className="w-7 h-7 rounded-full bg-brand-100
                                     flex items-center justify-center
                                     text-brand-700 font-semibold text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="max-w-[120px] truncate">{user.name}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" aria-hidden="true" />
                  </button>

                  {/* Dropdown menu */}
                  {profileOpen && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setProfileOpen(false)}
                        aria-hidden="true"
                      />
                      <div
                        className="absolute right-0 mt-1 w-56 bg-white rounded-xl
                                   border border-gray-200 shadow-lg z-20 py-1
                                   overflow-hidden"
                        role="menu"
                      >
                        {/* User info */}
                        <div className="px-4 py-2 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user.name}
                            </p>
                            <span className="badge bg-brand-100 text-brand-700">
                              {user.role}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {user.email}
                          </p>
                        </div>

                        <Link
                          to="/profile"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 w-full px-4 py-2
                                     text-sm text-gray-700 hover:bg-gray-50
                                     transition-colors"
                          role="menuitem"
                        >
                          <User className="w-4 h-4 text-gray-400" aria-hidden="true" />
                          My Profile
                        </Link>

                        <Link
                          to={dashboardPath}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 w-full px-4 py-2
                                     text-sm text-gray-700 hover:bg-gray-50
                                     transition-colors"
                          role="menuitem"
                        >
                          <LayoutDashboard className="w-4 h-4 text-gray-400" aria-hidden="true" />
                          Dashboard
                        </Link>

                        <div className="border-t border-gray-100 mt-1">
                          <button
                            onClick={() => { setProfileOpen(false); logout(); }}
                            className="flex items-center gap-2 w-full px-4 py-2
                                       text-sm text-red-600 hover:bg-red-50
                                       transition-colors"
                            role="menuitem"
                          >
                            <LogOut className="w-4 h-4" aria-hidden="true" />
                            Sign out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">Sign in</Link>
                <Link to="/register" className="btn-primary">Get started</Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen
              ? <X className="w-5 h-5" />
              : <Menu className="w-5 h-5" />
            }
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3 flex flex-col gap-1">
          <Link
            to="/jobs"
            onClick={() => setMenuOpen(false)}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700
                       hover:bg-gray-100 transition-colors"
          >
            Browse Jobs
          </Link>

          {isAuthenticated && (
            <Link
              to={dashboardPath}
              onClick={() => setMenuOpen(false)}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700
                         hover:bg-gray-100 transition-colors"
            >
              Dashboard
            </Link>
          )}

          {user?.role === "employer" && (
            <Link
              to="/employer/jobs/new"
              onClick={() => setMenuOpen(false)}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700
                         hover:bg-gray-100 transition-colors"
            >
              Post a Job
            </Link>
          )}

          {isAuthenticated ? (
            <button
              onClick={() => { setMenuOpen(false); logout(); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm
                         font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          ) : (
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 mt-1">
              <Link to="/login"    onClick={() => setMenuOpen(false)} className="btn-secondary">Sign in</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary">Get started</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}