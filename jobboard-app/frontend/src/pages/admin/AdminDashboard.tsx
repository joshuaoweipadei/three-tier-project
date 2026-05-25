import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import UserTable from "@/components/admin/UserTable";
import JobModerationQueue from "@/components/admin/JobModerationQueue";
// import StatsBar from "@/components/dashboard/StatsBar";
import {
  Users, Briefcase, Loader2, BarChart3,
} from "lucide-react";
import { clsx } from "clsx";

// Analytics types
interface Analytics {
  users: {
    total:        number;
    newThisWeek:  number;
    newThisMonth: number;
  };
  jobs: {
    total:  number;
    open:   number;
    draft:  number;
    closed: number;
  };
  applications: {
    total:       number;
    thisWeek:    number;
    hired:       number;
    rejected:    number;
    successRate: number;
  };
  topEmployers: Array<{
    employer:  { name: string; company?: string };
    totalApps: number;
    jobCount:  number;
  }>;
}

function useAnalytics() {
  return useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: Analytics }>(
        "/admin/analytics"
      );
      return data.data;
    },
    staleTime: 1000 * 60 * 5, // refresh every 5 minutes
  });
}

// Analytics tab
function AnalyticsTab() {
  const { data, isLoading } = useAnalytics();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Users section */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 uppercase
                       tracking-wide mb-3">
          Users
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Users",       value: data.users.total,        color: "text-brand-600"  },
            { label: "New This Week",     value: data.users.newThisWeek,  color: "text-blue-600"   },
            { label: "New This Month",    value: data.users.newThisMonth, color: "text-purple-600" },
          ].map((s) => (
            <div key={s.label} className="card p-4 text-center">
              <p className={clsx("text-3xl font-bold", s.color)}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Jobs section */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 uppercase
                       tracking-wide mb-3">
          Jobs
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total",  value: data.jobs.total,  color: "text-gray-900"   },
            { label: "Open",   value: data.jobs.open,   color: "text-green-600"  },
            { label: "Draft",  value: data.jobs.draft,  color: "text-yellow-600" },
            { label: "Closed", value: data.jobs.closed, color: "text-gray-500"   },
          ].map((s) => (
            <div key={s.label} className="card p-4 text-center">
              <p className={clsx("text-3xl font-bold", s.color)}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Applications + success rate */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 uppercase
                       tracking-wide mb-3">
          Applications
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Applications", value: data.applications.total,    color: "text-gray-900"  },
            { label: "This Week",          value: data.applications.thisWeek,  color: "text-blue-600"  },
            { label: "Hired",              value: data.applications.hired,     color: "text-green-600" },
            { label: "Rejected",           value: data.applications.rejected,  color: "text-red-500"   },
            {
              label: "Success Rate",
              value: `${data.applications.successRate}%`,
              color: data.applications.successRate >= 10
                ? "text-green-600"
                : "text-yellow-600",
            },
          ].map((s) => (
            <div key={s.label} className="card p-4 text-center">
              <p className={clsx("text-3xl font-bold", s.color)}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Top employers */}
      {data.topEmployers.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 uppercase
                         tracking-wide mb-3">
            Top Employers by Applications
          </h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">Employer</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-center">Jobs</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Applicants</th>
                </tr>
              </thead>
              <tbody>
                {data.topEmployers.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        {row.employer.company ?? row.employer.name}
                      </p>
                      {row.employer.company && (
                        <p className="text-xs text-gray-400">{row.employer.name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {row.jobCount}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-brand-600">
                      {row.totalApps}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

// Main component
type Tab = "analytics" | "users" | "moderation";

const TABS: { value: Tab; label: string; icon: React.ElementType }[] = [
  { value: "analytics",  label: "Analytics",       icon: BarChart3  },
  { value: "users",      label: "User Management", icon: Users      },
  { value: "moderation", label: "Job Moderation",  icon: Briefcase  },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("analytics");

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-500 mt-1">
          Platform analytics, user management, and job moderation.
        </p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {TABS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={clsx(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium",
              "border-b-2 whitespace-nowrap transition-colors",
              tab === value
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
            aria-current={tab === value ? "page" : undefined}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "analytics"  && <AnalyticsTab />}
      {tab === "users"      && <UserTable />}
      {tab === "moderation" && <JobModerationQueue />}
    </div>
  );
}