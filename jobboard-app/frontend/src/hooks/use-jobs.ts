import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { Job, PaginatedResponse, ApiResponse } from "@/types";
import toast from "react-hot-toast";

export interface JobFilters {
  page?:      number;
  limit?:     number;
  search?:    string;
  type?:      string;
  location?:  string;
  minSalary?: number;
  maxSalary?: number;
  skills?:    string;
  sort?:      string;
}

// Fetch jobs list
export function useJobs(filters: JobFilters = {}) {
  return useQuery({
    queryKey: ["jobs", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== "") {
          params.set(key, String(val));
        }
      });
      const { data } = await api.get<PaginatedResponse<Job>>(
        `/jobs?${params.toString()}`
      );
      return data;
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

// Fetch single job
export function useJob(id: string) {
  return useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ job: Job; hasApplied: boolean }>>(`/jobs/${id}`);
      return data.data!;
    },
    enabled: !!id,
  });
}

// Fetch employer's own jobs
export function useMyJobs(filters: { status?: string; page?: number } = {}) {
  return useQuery({
    queryKey: ["my-jobs", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== "") params.set(key, String(val));
      });
      const { data } = await api.get<PaginatedResponse<Job>>(
        `/jobs/employer/mine?${params.toString()}`
      );
      return data;
    },
  });
}

// Create job
export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (jobData: Partial<Job>) => {
      const { data } = await api.post<ApiResponse<{ job: Job }>>("/jobs", jobData);
      return data.data!.job;
    },
    onSuccess: () => {
      toast.success("Job posted successfully!");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["my-jobs"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to post job.");
    },
  });
}

// Update job
export function useUpdateJob(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (jobData: Partial<Job>) => {
      const { data } = await api.put<ApiResponse<{ job: Job }>>(
        `/jobs/${id}`,
        jobData
      );
      return data.data!.job;
    },
    onSuccess: () => {
      toast.success("Job updated.");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job", id] });
      queryClient.invalidateQueries({ queryKey: ["my-jobs"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to update job.");
    },
  });
}

// Delete job
export function useDeleteJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/jobs/${id}`);
      return id;
    },
    onSuccess: () => {
      toast.success("Job deleted.");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["my-jobs"] });
    },
  });
}