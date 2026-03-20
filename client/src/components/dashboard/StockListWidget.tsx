import React, { useState } from 'react';
import { useGainersLosers, useAllStocks } from '@/hooks/use-stocks';
import { LivePrice } from '@/components/ui/LivePrice';
import { cn } from '@/lib/format';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useLocation } from 'wouter';
import { StockIcon } from '@/components/ui/StockIcon';

export function StockListWidget() {
  const [tab, setTab] = useState<'gainers' | 'losers'>('gainers');
  const [, navigate] = useLocation();

  const { data: gainers } = useGainersLosers('gainers');
  const { data: losers } = useGainersLosers('losers');
  const { data: allStocks } = useAllStocks();

  // Fallback: if API returns empty array (Finnhub free tier often returns 0 change),
  // sort all stocks by changePercent instead
  const getActiveData = () => {
    if (tab === 'gainers') {
      if (gainers && gainers.length > 0) return gainers.slice(0, 8);
      // fallback: top 8 by changePercent descending from allStocks
      return allStocks
        ?.slice()
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, 8);
    } else {
      if (losers && losers.length > 0) return losers.slice(0, 8);
      // fallback: bottom 8 by changePercent ascending from allStocks
      return allStocks
        ?.slice()
        .sort((a, b) => a.changePercent - b.changePercent)
        .slice(0, 8);
    }
  };

  const activeData = getActiveData();

  return (
    <div className="bg-card border border-border/50 rounded-2xl shadow-lg shadow-black/5 overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-border/50 flex justify-between items-center bg-muted/20">
        <h3 className="text-lg font-display font-bold">Market Movers</h3>
        <div className="flex bg-secondary p-1 rounded-xl">
          <button
            onClick={() => setTab('gainers')}
            className={cn(
              "px-4 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all duration-200",
              tab === 'gainers'
                ? "bg-background text-[hsl(var(--market-up))] shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <TrendingUp className="w-3.5 h-3.5" /> Gainers
          </button>
          <button
            onClick={() => setTab('losers')}
            className={cn(
              "px-4 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all duration-200",
              tab === 'losers'
                ? "bg-background text-[hsl(var(--market-down))] shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <TrendingDown className="w-3.5 h-3.5" /> Losers
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto max-h-[400px]">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground bg-muted/10 sticky top-0 backdrop-blur-md">
            <tr>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider">Company</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-right">Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {activeData?.map((stock) => (
              <tr
                key={stock.symbol}
                className="hover:bg-muted/30 transition-colors group cursor-pointer"
                onClick={() => navigate(`/stock/${stock.symbol}`)}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <StockIcon symbol={stock.symbol} size={28} />
                    <div>
                      <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {stock.symbol}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {stock.company}
                      </div>
                    </div>
                  </div>
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
              </tr>
            ))}

            {!activeData && (
              <tr>
                <td colSpan={2} className="px-6 py-12 text-center text-muted-foreground">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
                    <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
