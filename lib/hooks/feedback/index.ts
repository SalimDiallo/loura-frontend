"use client";

import {
  feedbackService,
  type FeedbackListFilters,
  type FeedbackStatus,
} from "@/lib/services/feedback/feedback.service";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

const REFRESH_MS = 30_000;

export function useFeedbackList(filters: FeedbackListFilters) {
  return useQuery({
    queryKey: ["feedback", "list", filters],
    queryFn: () => feedbackService.list(filters),
    refetchInterval: REFRESH_MS,
    staleTime: REFRESH_MS,
  });
}

export function useUpdateFeedbackStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: FeedbackStatus }) =>
      feedbackService.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feedback", "list"] });
    },
  });
}

export function useDeleteFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => feedbackService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feedback", "list"] });
    },
  });
}
