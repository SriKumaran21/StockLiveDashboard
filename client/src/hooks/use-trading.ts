import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useAuth } from "./use-auth";

export function useBuyStock() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: { symbol: string; quantity: number; price: number }) => {
      const res = await fetch(api.trading.buy.path, {
        method: api.trading.buy.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to buy stock');
      }
      
      return api.trading.buy.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [api.trading.holdings.path] });
      queryClient.invalidateQueries({ queryKey: [api.trading.portfolio.path] });
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
    },
  });
}

export function useSellStock() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { symbol: string; quantity: number; price: number }) => {
      const res = await fetch(api.trading.sell.path, {
        method: api.trading.sell.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to sell stock');
      }
      
      return api.trading.sell.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [api.trading.holdings.path] });
      queryClient.invalidateQueries({ queryKey: [api.trading.portfolio.path] });
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
    },
  });
}

export function useHoldings() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: [api.trading.holdings.path],
    queryFn: async () => {
      const res = await fetch(api.trading.holdings.path, {
        credentials: 'include',
      });
      
      if (!res.ok) {
        if (res.status === 401) return null;
        throw new Error("Failed to fetch holdings");
      }
      
      return api.trading.holdings.responses[200].parse(await res.json());
    },
    enabled: !!user,
  });
}

export function usePortfolio() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: [api.trading.portfolio.path],
    queryFn: async () => {
      const res = await fetch(api.trading.portfolio.path, {
        credentials: 'include',
      });
      
      if (!res.ok) {
        if (res.status === 401) return null;
        throw new Error("Failed to fetch portfolio");
      }
      
      return api.trading.portfolio.responses[200].parse(await res.json());
    },
    enabled: !!user,
  });
}
