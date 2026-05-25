import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { User } from "@/types";
import {
  Search, ShieldCheck, ShieldOff,
  ChevronLeft, ChevronRight, Loader2,
} from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";

function useAdminUsers(filters: {
  page?:     number;
  role?:     string;
  search?:   string;
  isActive?: string;
}) {
  return useQuery({
    queryKey: ["admin-users", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== "") params.set(k, String(v));
      });
      const { data } = await api.get(`/admin/users?${params}`);
      return data as {
        success: boolean;
        data: User[];
        pagination: {
          page: number; limit: number; total: number;
          totalPages: number; hasNextPage: boolean; hasPrevPage: boolean;
        };
      };
    },
  });
}

const ROLE_STYLES: Record<string, string> = {
  employer:  "bg-blue-100   text-blue-700",
  candidate: "bg-purple-100 text-purple-700",
  admin:     "bg-red-100    text-red-700",
};

export default function UserTable() {
  const queryClient = useQueryClient();
  const [search,   setSearch]   = useState("");
  const [role,     setRole]     = useState("");
  const [isActive, setIsActive] = useState("");
  const [page,     setPage]     = useState(1);

  const { data, isLoading } = useAdminUsers({
    page,
    role:     role     || undefined,
    search:   search   || undefined,
    isActive: isActive || undefined,
  });

  const toggleMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.patch(`/admin/users/${userId}/toggle`);
      return data;
    },
    onSuccess: (_, _userId) => {
      toast.success("User status updated.");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: () => toast.error("Failed to update user."),
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2
                       w-4 h-4 text-gray-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input pl-9"
            aria-label="Search users"
          />
        </div>
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="input w-auto"
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          <option value="employer">Employers</option>
          <option value="candidate">Candidates</option>
        </select>
        <select
          value={isActive}
          onChange={(e) => { setIsActive(e.target.value); setPage(1); }}
          className="input w-auto"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="grid">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-600">User</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Role</th>
                    <th className="px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">
                      Joined
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data?.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-gray-400 text-sm"
                      >
                        No users found.
                      </td>
                    </tr>
                  )}
                  {data?.data?.map((user) => (
                    <tr
                      key={user._id}
                      className="border-b border-gray-50 hover:bg-gray-50
                                 transition-colors last:border-0"
                    >
                      {/* User info */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full bg-brand-100 flex
                                       items-center justify-center text-brand-700
                                       font-semibold text-xs flex-shrink-0"
                            aria-hidden="true"
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <span
                          className={clsx(
                            "badge capitalize text-xs",
                            ROLE_STYLES[user.role] ?? "bg-gray-100 text-gray-600"
                          )}
                        >
                          {user.role}
                        </span>
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                        {new Date(user.createdAt).toLocaleDateString("en-CA", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={clsx(
                            "badge text-xs",
                            user.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100  text-gray-500"
                          )}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right">
                        {user.role !== "admin" && (
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  `${user.isActive ? "Deactivate" : "Activate"} ${user.name}?`
                                )
                              ) {
                                toggleMutation.mutate(user._id);
                              }
                            }}
                            disabled={toggleMutation.isPending}
                            className={clsx(
                              "inline-flex items-center gap-1.5 text-xs px-3",
                              "py-1.5 rounded-lg font-medium transition-colors",
                              "disabled:opacity-40 disabled:cursor-not-allowed",
                              user.isActive
                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                : "bg-green-50 text-green-600 hover:bg-green-100"
                            )}
                          >
                            {user.isActive ? (
                              <>
                                <ShieldOff className="w-3.5 h-3.5" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Activate
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data?.pagination && data.pagination.totalPages > 1 && (
              <div
                className="flex items-center justify-between px-4 py-3
                           border-t border-gray-100"
              >
                <p className="text-xs text-gray-500">
                  Showing {((page - 1) * 20) + 1}–
                  {Math.min(page * 20, data.pagination.total)} of{" "}
                  {data.pagination.total} users
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={!data.pagination.hasPrevPage}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500
                               hover:bg-gray-50 disabled:opacity-40
                               disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-gray-600 px-1">
                    {page} / {data.pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!data.pagination.hasNextPage}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500
                               hover:bg-gray-50 disabled:opacity-40
                               disabled:cursor-not-allowed transition-colors"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}