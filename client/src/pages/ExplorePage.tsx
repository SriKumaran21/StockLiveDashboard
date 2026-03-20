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
  const [, navigate] = useLocation();
  const { data: searchResults, isLoading: isSearching } = useSearchStocks(query);
  const { data: allStocks, isLoading: isAllLoading } = useAllStocks();
  const { data: watchlist } = useWatchlist();
  const addWatchlist = useAddWatchlist();
  const { toast } = useToast();

  const displayData = query.length >= 2 ? searchResults : allStocks;
  const isLoading = query.length >= 2 ? isSearching : isAllLoading;

  const handleAddWatchlist = async (e: React.MouseEvent, symbol: string, company: string) => {
    e.stopPropagation(); // prevent row click from firing
    try {
      await addWatchlist.mutateAsync({ symbol, companyName: company });
      toast({ title: "Added to Watchlist", description: `${symbol} has been added.` });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: 'destructive' });
    }
  };

  const isSymbolInWatchlist = (symbol: string) => {
    return watchlist?.some(w => w.symbol === symbol);
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="relative max-w-2xl mx-auto">
        <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-xl rounded-full opacity-50 pointer-events-none" />
        
        <div className="relative bg-card border-2 border-border shadow-2xl shadow-primary/5 rounded-2xl flex items-center p-2 transition-all focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
          <Search className="w-6 h-6 text-muted-foreground ml-3" />
          <input
            type="text"
            placeholder="Search stocks by symbol or company name..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent border-none text-lg px-4 py-3 focus:outline-none placeholder:text-muted-foreground/70"
          />
          {isLoading && <Loader2 className="w-5 h-5 text-primary animate-spin mr-3" />}
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-3xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-muted/30 border-b border-border text-xs uppercase tracking-wider font-semibold text-muted-foreground">
            <tr>
              <th className="px-6 py-4">Symbol</th>
              <th className="px-6 py-4 hidden sm:table-cell">Company</th>
              <th className="px-6 py-4 text-right">Price</th>
              <th className="px-6 py-4 text-center w-24">Watchlist</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {displayData?.map((stock) => {
              const inWatchlist = isSymbolInWatchlist(stock.symbol);
              return (
                <tr
                  key={stock.symbol}
                  className="hover:bg-muted/20 transition-colors group cursor-pointer"
                  onClick={() => navigate(`/stock/${stock.symbol}`)}
                >
                  <td className="px-6 py-4">
                    <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                      {stock.symbol}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell text-muted-foreground text-sm">
                    {stock.company}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <LivePrice
                      symbol={stock.symbol}
                      initialPrice={stock.price}
                      initialChangePercent={stock.changePercent}
                      showChange={true}
                      className="justify-end"
                    />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={(e) => !inWatchlist && handleAddWatchlist(e, stock.symbol, stock.company)}
                      disabled={inWatchlist || addWatchlist.isPending}
                      className={cn(
                        "p-2 rounded-xl transition-all",
                        inWatchlist
                          ? "text-yellow-500 bg-yellow-500/10 cursor-not-allowed"
                          : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      )}
                    >
                      <Star className={cn("w-5 h-5", inWatchlist && "fill-current")} />
                    </button>
                  </td>
                </tr>
              );
            })}

            {displayData?.length === 0 && !isLoading && (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center text-muted-foreground">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-semibold text-foreground mb-1">No stocks found</p>
                  <p>Try adjusting your search terms</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
