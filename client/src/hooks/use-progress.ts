import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type UpdateProgressRequest } from "@shared/routes";

export function useSeriesProgress(seriesId: number) {
  return useQuery({
    queryKey: [api.progress.get.path, seriesId],
    queryFn: async () => {
      const url = buildUrl(api.progress.get.path, { seriesId });
      const res = await fetch(url, { credentials: "include" });
      
      // If unauthorized (not logged in), just return null, don't throw
      if (res.status === 401) return null;
      
      if (!res.ok) throw new Error("Failed to fetch progress");
      return api.progress.get.responses[200].parse(await res.json());
    },
    enabled: !isNaN(seriesId),
    retry: false,
  });
}

export function useUpdateProgress(seriesId: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UpdateProgressRequest) => {
      const url = buildUrl(api.progress.update.path, { seriesId });
      const res = await fetch(url, {
        method: api.progress.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (res.status === 401) return null; // Ignore update if not logged in
      if (!res.ok) throw new Error("Failed to update progress");
      
      return api.progress.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.progress.get.path, seriesId] });
    },
  });
}
