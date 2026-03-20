import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useIPOs() {
  return useQuery({
    queryKey: [api.ipos.list.path],
    queryFn: async () => {
      const res = await fetch(api.ipos.list.path);
      if (!res.ok) throw new Error("Failed to fetch IPOs");
      return api.ipos.list.responses[200].parse(await res.json());
    },
  });
}
