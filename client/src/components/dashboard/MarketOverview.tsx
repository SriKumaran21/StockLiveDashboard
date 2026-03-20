import React from 'react';
import { useIndices } from '@/hooks/use-stocks';
import { useLiveMarket } from '@/hooks/use-live-market';
import { cn, formatCurrency } from '@/lib/format';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

export function MarketOverview() {
  const { data: initialIndices, isLoading } = useIndices();
  const { indices: liveIndices } = useLiveMarket();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-card rounded-2xl border border-border/50" />
        ))}
      </div>
    );
  }

  const displayIndices = initialIndices?.map(idx => {
    const live = liveIndices[idx.name];
    return live ? { ...idx, ...live } : idx;
  }) || [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
      {displayIndices.map((index) => {
        const isPositive = index.change >= 0;
        return (
          <div 
            key={index.name}
            className="group bg-card rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden"
          >
            {/* Background gradient hint based on positive/negative */}
            <div className={cn(
              "absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity",
              isPositive ? "bg-[hsl(var(--market-up))]" : "bg-[hsl(var(--market-down))]"
            )} />

            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" />
                {index.name}
              </h3>
              <div className={cn(
                "p-2 rounded-lg",
                isPositive ? "bg-[hsl(var(--market-up-bg))] text-[hsl(var(--market-up))]" : "bg-[hsl(var(--market-down-bg))] text-[hsl(var(--market-down))]"
              )}>
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-2xl font-display font-bold font-mono tracking-tight text-foreground">
                {index.value.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
              </p>
              <p className={cn(
                "text-sm font-semibold font-mono",
                isPositive ? "text-[hsl(var(--market-up))]" : "text-[hsl(var(--market-down))]"
              )}>
                {isPositive ? '+' : ''}{index.change.toFixed(2)} ({isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%)
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
