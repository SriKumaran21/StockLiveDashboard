import React from 'react';
import { InteractiveChart } from '@/components/dashboard/InteractiveChart';
import { WatchlistWidget } from '@/components/dashboard/WatchlistWidget';
import { StockListWidget } from '@/components/dashboard/StockListWidget';
import { IPOCarousel } from '@/components/dashboard/IPOCarousel';
import { MarketHeatmap } from '@/components/dashboard/MarketHeatmap';
import { IndexCards } from '@/components/dashboard/IndexCards';
import { SentimentCard } from '@/components/dashboard/SentimentCard';

export function DashboardPage() {
  return (
    <div className="space-y-0 pb-8 animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── 12-col master grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '8fr 4fr', gap: 16 }}>

        {/* LEFT: 4 index cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
          <IndexCards />
        </div>

        {/* RIGHT: Sentiment — same height as index cards */}
        <div>
          <SentimentCard />
        </div>
      </div>

      {/* ── Chart + Watchlist ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '8fr 4fr', gap: 16, alignItems: 'stretch' }}>

        {/* Chart */}
        <div className="bg-card rounded-2xl overflow-hidden"
          style={{ background: '#161C27', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          <InteractiveChart />
        </div>

        {/* Watchlist — same height as chart */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <WatchlistWidget fillHeight />
        </div>
      </div>

      {/* ── Market Movers + IPOs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <StockListWidget />
        <IPOCarousel />
      </div>

      {/* ── Heatmap ── */}
      <MarketHeatmap />
    </div>
  );
}
