import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useIndices() {
  return useQuery({
    queryKey: [api.stocks.indices.path],
    queryFn: async () => {
      const res = await fetch(api.stocks.indices.path);
      if (!res.ok) throw new Error("Failed to fetch indices");
      return api.stocks.indices.responses[200].parse(await res.json());
    },
    refetchInterval: 30000,
  });
}

export function useAllStocks() {
  return useQuery({
    queryKey: [api.stocks.all.path],
    queryFn: async () => {
      const res = await fetch(api.stocks.all.path);
      if (!res.ok) throw new Error("Failed to fetch stocks");
      return api.stocks.all.responses[200].parse(await res.json());
    },
    refetchInterval: 30000,
  });
}

export function useGainersLosers(type: 'gainers' | 'losers') {
  const path = type === 'gainers' ? api.stocks.gainers.path : api.stocks.losers.path;
  const schema = type === 'gainers' ? api.stocks.gainers.responses[200] : api.stocks.losers.responses[200];
  return useQuery({
    queryKey: [path],
    queryFn: async () => {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`Failed to fetch ${type}`);
      return schema.parse(await res.json());
    },
    refetchInterval: 30000,
  });
}

export function useSearchStocks(query: string) {
  return useQuery({
    queryKey: [api.stocks.search.path, query],
    queryFn: async () => {
      const url = new URL(api.stocks.search.path, window.location.origin);
      if (query) url.searchParams.set('q', query);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Search failed");
      return api.stocks.search.responses[200].parse(await res.json());
    },
    enabled: query.length >= 2,
  });
}

export function useStockBySymbol(symbol: string) {
  return useQuery({
    queryKey: ['stock-by-symbol', symbol],
    queryFn: async () => {
      const url = new URL(api.stocks.search.path, window.location.origin);
      url.searchParams.set('q', symbol);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch stock");
      const results = api.stocks.search.responses[200].parse(await res.json());
      return results.find((s: any) => s.symbol === symbol.toUpperCase()) ?? null;
    },
    enabled: !!symbol,
    staleTime: 30000,
  });
}

export function useStockHistory(symbol: string, range: string) {
  return useQuery({
    queryKey: [api.stocks.history.path, symbol, range],
    queryFn: async () => {
      const url = new URL(api.stocks.history.path, window.location.origin);
      url.searchParams.set('symbol', symbol);
      url.searchParams.set('range', range);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch history");
      return api.stocks.history.responses[200].parse(await res.json());
    },
    enabled: !!symbol && symbol.length > 0,
    staleTime: 60000,
  });
}
