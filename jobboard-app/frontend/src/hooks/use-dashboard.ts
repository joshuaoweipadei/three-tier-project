import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type {
  CandidateStats, EmployerStats, KanbanData,
  Application, Job, TimelineEvent,
} from "@/types";
import toast from "react-hot-toast";

// Candidate dashboard
export function useCandidateDashboard() {
  return useQuery({
    queryKey: ["dashboard", "candidate"],
    queryFn: async () => {
      const { data } = await api.get<{
        success: boolean;
        data: { applications: Application[]; stats: CandidateStats };
      }>("/dashboard/candidate");
      return data.data;
    },
    staleTime: 1000 * 30,
  });
}

// Employer dashboard
export function useEmployerDashboard() {
  return useQuery({
    queryKey: ["dashboard", "employer"],
    queryFn: async () => {
      const { data } = await api.get<{
        success: boolean;
        data: { jobs: Job[]; kanban: KanbanData; stats: EmployerStats };
      }>("/dashboard/employer");
      return data.data;
    },
    staleTime: 1000 * 30,
  });
}

// Advance application status
export function useAdvanceApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      applicationId,
      status,
    }: {
      applicationId: string;
      status:        string;
    }) => {
      const { data } = await api.patch(
        `/dashboard/applications/${applicationId}/advance`,
        { status }
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      toast.success(`Candidate moved to ${variables.status}.`);
      queryClient.invalidateQueries({ queryKey: ["dashboard", "employer"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "candidate"] });
    },
    onError: () => {
      toast.error("Failed to update application status.");
    },
  });
}

// Application timeline
export function useApplicationTimeline(applicationId: string) {
  return useQuery({
    queryKey: ["timeline", applicationId],
    queryFn: async () => {
      const { data } = await api.get<{
        success: boolean;
        data: { application: Application; timeline: TimelineEvent[] };
      }>(`/dashboard/applications/${applicationId}/timeline`);
      return data.data;
    },
    enabled: !!applicationId,
  });
}