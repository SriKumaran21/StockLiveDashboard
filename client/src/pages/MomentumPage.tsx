import React, { useState } from 'react';
import { useAllStocks } from '@/hooks/use-stocks';
import { useLiveMarket } from '@/hooks/use-live-market';
import { StockIcon } from '@/components/ui/StockIcon';
import { LivePrice } from '@/components/ui/LivePrice';
import { cn } from '@/lib/format';
import { useLocation } from 'wouter';
import { Zap, TrendingUp, TrendingDown, Activity } from 'lucide-react';

type Filter = 'all' | 'gainers' | 'losers' | 'volatile';

export function MomentumPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [, navigate] = useLocation();
  const { data: allStocks } = useAllStocks();
  const { prices } = useLiveMarket();

  const enriched = allStocks?.map(s => {
    const live = prices[s.symbol];
    return {
      ...s,
      changePercent: live?.changePercent ?? s.changePercent,
      price: live?.price ?? s.price,
      change: live?.change ?? s.change,
      absChange: Math.abs(live?.changePercent ?? s.changePercent),
    };
  }) || [];

  const filtered = enriched
    .filter(s => {
      if (filter === 'gainers') return s.changePercent > 0;
      if (filter === 'losers') return s.changePercent < 0;
      if (filter === 'volatile') return s.absChange > 1;
      return true;
    })
    .sort((a, b) => {
      if (filter === 'losers') return a.changePercent - b.changePercent;
      return b.absChange - a.absChange;
    });

  const tabs: { key: Filter; label: string; icon: any }[] = [
    { key: 'all',      label: 'All',      icon: Activity },
    { key: 'gainers',  label: 'Gainers',  icon: TrendingUp },
    { key: 'losers',   label: 'Losers',   icon: TrendingDown },
    { key: 'volatile', label: 'Volatile', icon: Zap },
  ];

  return (
    <div className="space-y-5 pb-12 animate-slide-up">
      <div>
        <h1 className="font-display font-bold text-xl flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" /> Momentum Scanner
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Real-time movers ranked by momentum</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all",
              filter === key ? "bg-primary text-black" : "bg-secondary text-muted-foreground hover:text-foreground"
            )}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Stock list */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-3 border-b border-border grid grid-cols-12 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          <span className="col-span-1">#</span>
          <span className="col-span-4">Stock</span>
          <span className="col-span-3 text-right">Price</span>
          <span className="col-span-2 text-right">Change</span>
          <span className="col-span-2 text-right">Momentum</span>
        </div>
        <div className="divide-y divide-border">
          {filtered.map((stock, i) => {
            const isPos = stock.changePercent >= 0;
            const momentum = Math.min(Math.abs(stock.changePercent) * 10, 100);
            return (
              <div key={stock.symbol}
                onClick={() => navigate(`/stock/${stock.symbol}`)}
                className="px-6 py-3.5 grid grid-cols-12 items-center hover:bg-secondary/30 transition-colors cursor-pointer group">
                <span className="col-span-1 text-xs text-muted-foreground font-mono">{i + 1}</span>
                <div className="col-span-4 flex items-center gap-2.5">
                  <StockIcon symbol={stock.symbol} size={28} />
                  <div>
                    <div className="font-display font-bold text-sm group-hover:text-primary transition-colors">{stock.symbol}</div>
                    <div className="text-[11px] text-muted-foreground truncate max-w-[100px]">{stock.company}</div>
                  </div>
                </div>
                <div className="col-span-3 text-right">
                  <LivePrice symbol={stock.symbol} initialPrice={stock.price} initialChangePercent={stock.changePercent} showChange={false} className="justify-end font-mono text-sm" />
                </div>
                <div className="col-span-2 text-right">
                  <span className={cn("text-sm font-mono font-bold", isPos ? "text-[hsl(var(--market-up))]" : "text-[hsl(var(--market-down))]")}>
                    {isPos ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </span>
                </div>
                <div className="col-span-2 flex justify-end">
                  <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", isPos ? "bg-[hsl(var(--market-up))]" : "bg-[hsl(var(--market-down))]")}
                      style={{ width: `${momentum}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
