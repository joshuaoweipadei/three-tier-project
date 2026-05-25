import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { Application, ApiResponse, PaginatedResponse } from "@/types";
import toast from "react-hot-toast";

// Candidate: my applications
export function useMyApplications(filters: { status?: string; page?: number } = {}) {
  return useQuery({
    queryKey: ["my-applications", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== "") params.set(key, String(val));
      });
      const { data } = await api.get<PaginatedResponse<Application>>(
        `/applications/mine?${params.toString()}`
      );
      return data;
    },
  });
}

// Employer: applications for a job
export function useJobApplications(jobId: string, filters: { status?: string } = {}) {
  return useQuery({
    queryKey: ["job-applications", jobId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== "") params.set(key, String(val));
      });
      const { data } = await api.get<PaginatedResponse<Application>>(
        `/applications/jobs/${jobId}/applications?${params.toString()}`
      );
      return data;
    },
    enabled: !!jobId,
  });
}

// Candidate: apply to job
export function useApplyToJob(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { coverLetter: string; resume?: string }) => {
      const { data } = await api.post<ApiResponse<{ application: Application }>>(
        `/applications/jobs/${jobId}/apply`,
        payload
      );
      return data.data!.application;
    },
    onSuccess: () => {
      toast.success("Application submitted! Good luck.");
      queryClient.invalidateQueries({ queryKey: ["job", jobId] });
      queryClient.invalidateQueries({ queryKey: ["my-applications"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to submit application.");
    },
  });
}

// Candidate: withdraw application
export function useWithdrawApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (applicationId: string) => {
      await api.delete(`/applications/${applicationId}/withdraw`);
      return applicationId;
    },
    onSuccess: () => {
      toast.success("Application withdrawn.");
      queryClient.invalidateQueries({ queryKey: ["my-applications"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to withdraw application.");
    },
  });
}

// Employer: update application status
export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      applicationId,
      status,
      notes,
    }: {
      applicationId: string;
      status: string;
      notes?: string;
    }) => {
      const { data } = await api.patch<ApiResponse<{ application: Application }>>(
        `/applications/${applicationId}/status`,
        { status, notes }
      );
      return data.data!.application;
    },
    onSuccess: (_data, _variables) => {
      queryClient.invalidateQueries({ queryKey: ["job-applications"] });
    },
  });
}