import React from 'react';
import { useAllStocks } from '@/hooks/use-stocks';
import { useLiveMarket } from '@/hooks/use-live-market';
import { cn } from '@/lib/format';
import { useLocation } from 'wouter';

export function MarketHeatmap() {
  const { data: allStocks } = useAllStocks();
  const { prices } = useLiveMarket();
  const [, navigate] = useLocation();

  const stocks = allStocks?.map(s => {
    const live = prices[s.symbol];
    return { ...s, changePercent: live?.changePercent ?? s.changePercent };
  }) || [];

  function getColor(pct: number): string {
    if (pct >= 3)  return 'bg-green-500 text-black';
    if (pct >= 1)  return 'bg-green-600/80 text-white';
    if (pct >= 0)  return 'bg-green-900/60 text-green-300';
    if (pct >= -1) return 'bg-red-900/60 text-red-300';
    if (pct >= -3) return 'bg-red-600/80 text-white';
    return 'bg-red-500 text-black';
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h3 className="font-display font-bold text-sm">Market Heatmap</h3>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="w-3 h-3 rounded bg-red-500 inline-block" /> Falling
          <span className="w-3 h-3 rounded bg-green-500 inline-block ml-2" /> Rising
        </div>
      </div>
      <div className="p-4 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5">
        {stocks.map(stock => (
          <button
            key={stock.symbol}
            onClick={() => navigate(`/stock/${stock.symbol}`)}
            className={cn(
              "rounded-xl p-2.5 text-center transition-all hover:scale-105 hover:z-10 hover:shadow-lg relative",
              getColor(stock.changePercent)
            )}
          >
            <div className="font-display font-bold text-xs truncate">
              {stock.symbol.replace('.NS','').replace('.BO','')}
            </div>
            <div className="text-[10px] font-mono mt-0.5 opacity-90">
              {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
