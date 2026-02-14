import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateSeriesRequest, type SeriesQueryParams } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useSeries(params?: SeriesQueryParams) {
  return useQuery({
    queryKey: [api.series.list.path, params],
    queryFn: async () => {
      const url = new URL(api.series.list.path, window.location.origin);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) url.searchParams.append(key, String(value));
        });
      }
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch series");
      return api.series.list.responses[200].parse(await res.json());
    },
  });
}

export function useSeriesDetail(id: number) {
  return useQuery({
    queryKey: [api.series.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.series.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch series details");
      return api.series.get.responses[200].parse(await res.json());
    },
    enabled: !isNaN(id),
  });
}

export function useCreateSeries() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateSeriesRequest) => {
      const res = await fetch(api.series.create.path, {
        method: api.series.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to create series");
      }
      
      return api.series.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.series.list.path] });
      toast({
        title: "Success",
        description: "Series created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
