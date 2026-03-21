import React from 'react';
import { useIndices } from '@/hooks/use-stocks';
import { useLiveMarket } from '@/hooks/use-live-market';
import { cn } from '@/lib/format';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useLocation } from 'wouter';

export function MarketOverview() {
  const { data: initialIndices, isLoading } = useIndices();
  const { indices: liveIndices } = useLiveMarket();
  const [, navigate] = useLocation();

  const indexToSymbol: Record<string, string> = {
    'Nifty 50': 'NIFTY50',
    'Sensex':   'SENSEX',
    'S&P 500':  'SPY',
    'Nasdaq':   'QQQ',
  };

  const displayIndices = initialIndices?.map(idx => {
    const live = liveIndices[idx.name];
    return live ? { ...idx, ...live } : idx;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-20 w-52 flex-shrink-0 bg-secondary rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-3">
      {displayIndices.map((index, i) => {
        const isPositive = index.change >= 0;
        return (
          <div
            key={index.name}
            onClick={() => navigate(`/stock/${indexToSymbol[index.name] || index.name}`)}
            className={cn(
              "flex-shrink-0 relative rounded-2xl p-4  overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:border-primary/40",
              "bg-card  w-52"
            )}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className={cn("absolute inset-0 opacity-[0.04]",
              isPositive ? "bg-green-500" : "bg-red-500")} />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{index.name}</span>
                <span className={cn(
                  "flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                  isPositive ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                )}>
                  {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%
                </span>
              </div>
              <p className="text-xl font-display font-bold font-mono tracking-tight">
                {index.value > 0 ? index.value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—'}
              </p>
              <p className={cn("text-[11px] font-mono mt-0.5", isPositive ? "text-green-500" : "text-red-500")}>
                {isPositive ? '+' : ''}{index.change.toFixed(2)} today
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
