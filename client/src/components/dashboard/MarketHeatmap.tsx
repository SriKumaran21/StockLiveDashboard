import React, { useState } from 'react';
import { useAllStocks } from '@/hooks/use-stocks';
import { useLiveMarket } from '@/hooks/use-live-market';
import { cn } from '@/lib/format';
import { useLocation } from 'wouter';

const SECTOR_ORDER = ['Banking','Finance','IT','Tech','Energy','Industrial','Auto','Consumer','Pharma','Telecom'];

function getColor(pct: number): { bg: string; text: string } {
  if (pct >=  3) return { bg: 'rgba(34,197,94,0.85)',  text: 'white' };
  if (pct >=  1) return { bg: 'rgba(34,197,94,0.55)',  text: 'white' };
  if (pct >=  0) return { bg: 'rgba(34,197,94,0.25)',  text: 'hsl(var(--foreground))' };
  if (pct >= -1) return { bg: 'rgba(239,68,68,0.25)',  text: 'hsl(var(--foreground))' };
  if (pct >= -3) return { bg: 'rgba(239,68,68,0.55)',  text: 'white' };
  return             { bg: 'rgba(239,68,68,0.85)',  text: 'white' };
}

export function MarketHeatmap() {
  const { data: allStocks } = useAllStocks();
  const { prices } = useLiveMarket();
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<string>('all');

  const enriched = (allStocks || []).map(s => ({
    ...s,
    changePercent: prices[s.symbol]?.changePercent ?? s.changePercent,
    sector: (s as any).sector || 'Other',
  }));

  // Group by sector
  const grouped: Record<string, typeof enriched> = {};
  enriched.forEach(s => {
    const sec = s.sector;
    if (!grouped[sec]) grouped[sec] = [];
    grouped[sec].push(s);
  });

  const sectors = filter === 'all'
    ? SECTOR_ORDER.filter(s => grouped[s])
    : [filter].filter(s => grouped[s]);

  const allSectors = SECTOR_ORDER.filter(s => grouped[s]);

  return (
    <div className="bg-card rounded-2xl overflow-hidden"
      >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 flex-wrap gap-3"
        style={{ borderBottom: '1px solid hsl(var(--))' }}>
        <div className="flex items-center gap-3">
          <h3 style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 14 }} className="text-foreground">
            Market Heatmap
          </h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: 'rgba(34,197,94,0.6)' }} />
              Rising
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: 'rgba(239,68,68,0.6)' }} />
              Falling
            </span>
          </div>
        </div>

        {/* Sector filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
          <button onClick={() => setFilter('all')}
            className={cn("px-2.5 py-1 rounded-lg text-xs font-semibold transition-all",
              filter === 'all' ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground")}>
            All
          </button>
          {allSectors.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={cn("px-2.5 py-1 rounded-lg text-xs font-semibold transition-all",
                filter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground")}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped grid */}
      <div className="p-4 space-y-4">
        {sectors.map(sector => (
          <div key={sector}>
            <p className="text-muted-foreground uppercase tracking-wider mb-2"
              style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em' }}>
              {sector}
            </p>
            <div className="grid gap-1.5"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))' }}>
              {grouped[sector].map(stock => {
                const { bg, text } = getColor(stock.changePercent);
                return (
                  <button key={stock.symbol} onClick={() => navigate(`/stock/${stock.symbol}`)}
                    className="rounded-xl p-2.5 text-center transition-all hover:scale-105 hover:shadow-lg"
                    style={{ background: bg, color: text }}>
                    <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'Manrope' }}>
                      {stock.symbol.replace('.NS','').replace('.BO','')}
                    </div>
                    <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono', marginTop: 2, opacity: 0.9 }}>
                      {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
