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
    <div className="pb-8 animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Index cards + Sentiment ── */}
      <div className="dashboard-top-grid">
        <div className="index-cards-grid">
          <IndexCards />
        </div>
        <div><SentimentCard /></div>
      </div>

      {/* ── Chart + Watchlist ── */}
      <div className="dashboard-chart-grid">
        <div className="bg-card rounded-2xl overflow-hidden"
          style={{ background: '#161C27', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          <InteractiveChart />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <WatchlistWidget fillHeight />
        </div>
      </div>

      {/* ── Market Movers + IPOs ── */}
      <div className="dashboard-bottom-grid">
        <StockListWidget />
        <IPOCarousel />
      </div>

      {/* ── Heatmap ── */}
      <MarketHeatmap />
    </div>
  );
}
