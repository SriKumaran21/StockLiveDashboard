import React from 'react';
import { MarketOverview } from '@/components/dashboard/MarketOverview';
import { InteractiveChart } from '@/components/dashboard/InteractiveChart';
import { WatchlistWidget } from '@/components/dashboard/WatchlistWidget';
import { StockListWidget } from '@/components/dashboard/StockListWidget';
import { IPOCarousel } from '@/components/dashboard/IPOCarousel';
import { MarketHeatmap } from '@/components/dashboard/MarketHeatmap';

export function DashboardPage() {
  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <MarketOverview />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <InteractiveChart />
        </div>
        <div className="lg:col-span-1">
          <WatchlistWidget />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <StockListWidget />
        <div>
          <IPOCarousel />
        </div>
      </div>

      <MarketHeatmap />
    </div>
  );
}
