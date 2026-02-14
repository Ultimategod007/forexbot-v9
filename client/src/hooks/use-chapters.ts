import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateChapterRequest } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useChapters(seriesId: number) {
  return useQuery({
    queryKey: [api.chapters.list.path, seriesId],
    queryFn: async () => {
      const url = buildUrl(api.chapters.list.path, { seriesId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch chapters");
      return api.chapters.list.responses[200].parse(await res.json());
    },
    enabled: !isNaN(seriesId),
  });
}

export function useChapterDetail(id: number) {
  return useQuery({
    queryKey: [api.chapters.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.chapters.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch chapter");
      return api.chapters.get.responses[200].parse(await res.json());
    },
    enabled: !isNaN(id),
  });
}

export function useCreateChapter() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ seriesId, ...data }: CreateChapterRequest & { seriesId: number }) => {
      const url = buildUrl(api.chapters.create.path, { seriesId });
      const res = await fetch(url, {
        method: api.chapters.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to create chapter");
      }

      return api.chapters.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.chapters.list.path, variables.seriesId] });
      queryClient.invalidateQueries({ queryKey: [api.series.get.path, variables.seriesId] });
      toast({
        title: "Success",
        description: "Chapter uploaded successfully",
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
