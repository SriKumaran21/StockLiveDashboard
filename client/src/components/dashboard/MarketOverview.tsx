import React from 'react';
import { useIndices } from '@/hooks/use-stocks';
import { useLiveMarket } from '@/hooks/use-live-market';
import { cn } from '@/lib/format';
import { useLocation } from 'wouter';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function MarketOverview() {
  const [, navigate] = useLocation();
  const indexToSymbol: Record<string, string> = {
    'S&P 500': 'SPY',
    'Nasdaq 100': 'QQQ',
    'Dow Jones': 'DIA',
  };
  const { data: initialIndices, isLoading } = useIndices();
  const { indices: liveIndices } = useLiveMarket();

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3].map(i => (
          <div key={i} className="h-24 bg-secondary rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const displayIndices = initialIndices?.map(idx => {
    const live = liveIndices[idx.name];
    return live ? { ...idx, ...live } : idx;
  }) || [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {displayIndices.map((index, i) => {
        const isPositive = index.change >= 0;
        return (
          <div key={index.name}
            onClick={() => navigate(`/stock/${indexToSymbol[index.name] || index.name}`)}
            className={cn(
              "relative rounded-2xl p-5 border overflow-hidden transition-all duration-300 animate-slide-up cursor-pointer",
              "bg-card border-border hover:border-primary/30 hover:bg-secondary/30"
            )}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className={cn(
              "absolute inset-0 opacity-5",
              isPositive ? "bg-[hsl(var(--market-up))]" : "bg-[hsl(var(--market-down))]"
            )} />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{index.name}</span>
                <span className={cn(
                  "flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md",
                  isPositive ? "bg-[hsl(var(--market-up-bg))] text-[hsl(var(--market-up))]" : "bg-[hsl(var(--market-down-bg))] text-[hsl(var(--market-down))]"
                )}>
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%
                </span>
              </div>
              <p className="text-2xl font-display font-bold font-mono tracking-tight">
                {index.value > 0 ? index.value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—'}
              </p>
              <p className={cn("text-xs font-mono mt-1", isPositive ? "text-[hsl(var(--market-up))]" : "text-[hsl(var(--market-down))]")}>
                {isPositive ? '+' : ''}{index.change.toFixed(2)} today
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
