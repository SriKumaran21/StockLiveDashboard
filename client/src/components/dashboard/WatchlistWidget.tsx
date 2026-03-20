import React from 'react';
import { useWatchlist, useRemoveWatchlist } from '@/hooks/use-watchlist';
import { useAllStocks } from '@/hooks/use-stocks';
import { LivePrice } from '@/components/ui/LivePrice';
import { Star, Trash2, Plus } from 'lucide-react';
import { Link } from 'wouter';

export function WatchlistWidget() {
  const { data: watchlist, isLoading } = useWatchlist();
  const { data: allStocks } = useAllStocks();
  const removeMutation = useRemoveWatchlist();

  // Cross-reference with all stocks to get initial price data
  const populatedWatchlist = watchlist?.map(item => {
    const stockData = allStocks?.find(s => s.symbol === item.symbol);
    return { ...item, ...stockData };
  });

  return (
    <div className="bg-card border border-border/50 rounded-2xl shadow-lg shadow-black/5 flex flex-col h-full min-h-[400px]">
      <div className="px-6 py-4 border-b border-border/50 flex justify-between items-center bg-muted/20">
        <h3 className="text-lg font-display font-bold flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" /> Watchlist
        </h3>
        <Link 
          href="/explore" 
          className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <Plus className="w-4 h-4" />
        </Link>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse flex justify-between items-center">
                <div className="h-10 w-32 bg-muted rounded" />
                <div className="h-10 w-24 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : populatedWatchlist && populatedWatchlist.length > 0 ? (
          <div className="divide-y divide-border/50">
            {populatedWatchlist.map((item) => (
              <div key={item.id} className="p-4 sm:px-6 hover:bg-muted/30 transition-colors flex justify-between items-center group">
                <div>
                  <h4 className="font-semibold text-foreground">{item.symbol}</h4>
                  <p className="text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-[200px]">{item.companyName}</p>
                </div>
                
                <div className="flex items-center gap-4">
                  {item.price !== undefined && (
                    <LivePrice 
                      symbol={item.symbol} 
                      initialPrice={item.price} 
                      initialChangePercent={item.changePercent}
                      showChange={true}
                    />
                  )}
                  
                  <button 
                    onClick={() => removeMutation.mutate(item.symbol)}
                    disabled={removeMutation.isPending}
                    className="p-2 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all focus:opacity-100 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
            <Star className="w-12 h-12 mb-4 text-border" />
            <p className="font-semibold mb-1">Your watchlist is empty</p>
            <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">Track your favorite stocks by adding them from the explore page.</p>
            <Link 
              href="/explore" 
              className="mt-6 px-6 py-2 rounded-xl font-medium bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              Explore Stocks
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
