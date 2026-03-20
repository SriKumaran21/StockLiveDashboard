import React, { useState } from 'react';
import { useSearchStocks, useAllStocks } from '@/hooks/use-stocks';
import { useAddWatchlist, useWatchlist } from '@/hooks/use-watchlist';
import { LivePrice } from '@/components/ui/LivePrice';
import { Search, Star, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/format';
import { useLocation } from 'wouter';

export function ExplorePage() {
  const [query, setQuery] = useState('');
  const [sector, setSector] = useState<'all' | 'us' | 'in'>('all');
  const [, navigate] = useLocation();
  const { data: searchResults, isLoading: isSearching } = useSearchStocks(query);
  const { data: allStocks, isLoading: isAllLoading } = useAllStocks();
  const { data: watchlist } = useWatchlist();
  const addWatchlist = useAddWatchlist();
  const { toast } = useToast();

  const baseData = query.length >= 2 ? searchResults : allStocks;
  const displayData = baseData?.filter(s => {
    if (sector === 'us') return !s.symbol.includes('.');
    if (sector === 'in') return s.symbol.includes('.NS') || s.symbol.includes('.BO');
    return true;
  });
  const isLoading = query.length >= 2 ? isSearching : isAllLoading;
  const isInWatchlist = (symbol: string) => watchlist?.some(w => w.symbol === symbol);

  const handleAddWatchlist = async (e: React.MouseEvent, symbol: string, company: string) => {
    e.stopPropagation();
    try {
      await addWatchlist.mutateAsync({ symbol, companyName: company });
      toast({ title: `${symbol} added to watchlist` });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-5 pb-12 animate-slide-up">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by symbol or company…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full bg-card border border-border rounded-2xl pl-11 pr-12 py-3.5 text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
        />
        {isLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />}
      </div>

      {/* Sector Tabs */}
      <div className="flex gap-2">
        {([['all', 'All Markets'], ['us', '🇺🇸 US Stocks'], ['in', '🇮🇳 Indian Stocks']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setSector(key)}
            className={cn("px-4 py-2 rounded-xl text-xs font-semibold transition-all",
              sector === key ? "bg-primary text-black" : "bg-secondary text-muted-foreground hover:text-foreground")}
          >{label}</button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
              <th className="px-6 py-3.5 text-left font-semibold">Symbol</th>
              <th className="px-6 py-3.5 text-left font-semibold hidden sm:table-cell">Company</th>
              <th className="px-6 py-3.5 text-right font-semibold">Price</th>
              <th className="px-6 py-3.5 text-center font-semibold w-16">+</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {displayData?.map((stock, i) => {
              const inWL = isInWatchlist(stock.symbol);
              return (
                <tr key={stock.symbol}
                  className="hover:bg-secondary/40 transition-colors cursor-pointer group"
                  style={{ animationDelay: `${i * 30}ms` }}
                  onClick={() => navigate(`/stock/${stock.symbol}`)}
                >
                  <td className="px-6 py-4">
                    <span className="font-display font-bold text-foreground group-hover:text-primary transition-colors">
                      {stock.symbol}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell text-muted-foreground text-xs">{stock.company}</td>
                  <td className="px-6 py-4 text-right">
                    <LivePrice symbol={stock.symbol} initialPrice={stock.price} initialChangePercent={stock.changePercent} showChange className="justify-end" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={(e) => !inWL && handleAddWatchlist(e, stock.symbol, stock.company)}
                      disabled={inWL || addWatchlist.isPending}
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all",
                        inWL ? "text-yellow-500" : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                      )}
                    >
                      <Star className={cn("w-4 h-4", inWL && "fill-current")} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {displayData?.length === 0 && !isLoading && (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center text-muted-foreground text-sm">
                  No stocks found for "{query}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
