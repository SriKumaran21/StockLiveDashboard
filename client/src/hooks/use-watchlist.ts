import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

export function useWatchlist() {
  return useQuery({
    queryKey: [api.watchlist.list.path],
    queryFn: async () => {
      const res = await fetch(api.watchlist.list.path, { credentials: "include" });
      if (res.status === 401) return []; // Not logged in
      if (!res.ok) throw new Error("Failed to fetch watchlist");
      return api.watchlist.list.responses[200].parse(await res.json());
    },
  });
}

export function useAddWatchlist() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.watchlist.add.input>) => {
      const res = await fetch(api.watchlist.add.path, {
        method: api.watchlist.add.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add to watchlist");
      return api.watchlist.add.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.watchlist.list.path] });
    },
  });
}

export function useRemoveWatchlist() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (symbol: string) => {
      const url = buildUrl(api.watchlist.remove.path, { symbol });
      const res = await fetch(url, {
        method: api.watchlist.remove.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to remove from watchlist");
      return api.watchlist.remove.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.watchlist.list.path] });
    },
  });
}
