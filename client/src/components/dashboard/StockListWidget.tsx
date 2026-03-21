import React, { useState } from 'react';
import { useGainersLosers, useAllStocks } from '@/hooks/use-stocks';
import { useLiveMarket } from '@/hooks/use-live-market';
import { StockIcon } from '@/components/ui/StockIcon';
import { cn } from '@/lib/format';
import { useLocation } from 'wouter';

export function StockListWidget() {
  const [tab, setTab] = useState<'gainers' | 'losers'>('gainers');
  const [, navigate] = useLocation();
  const { data: gainers } = useGainersLosers('gainers');
  const { data: losers } = useGainersLosers('losers');
  const { data: allStocks } = useAllStocks();
  const { prices } = useLiveMarket();

  const getActiveData = () => {
    const base = tab === 'gainers' ? gainers : losers;
    if (base && base.length > 0) return base.slice(0, 8);
    return allStocks
      ?.slice()
      .sort((a, b) => tab === 'gainers'
        ? b.changePercent - a.changePercent
        : a.changePercent - b.changePercent)
      .slice(0, 8);
  };

  const data = getActiveData();

  return (
    <div className="bg-card rounded-2xl overflow-hidden" style={{ background: '#111827' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h3 style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 14, color: '#E5E7EB' }}>
          Market Movers
        </h3>
        <div className="flex p-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {(['gainers', 'losers'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-3 py-1.5 rounded-md transition-all"
              style={{
                fontSize: 11, fontWeight: 600, fontFamily: 'Inter',
                background: tab === t ? (t === 'gainers' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)') : 'transparent',
                color: tab === t ? (t === 'gainers' ? '#22C55E' : '#EF4444') : '#6B7280',
              }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div style={{ maxHeight: 380, overflowY: 'auto' }}>
        {/* Column headers */}
        <div className="flex items-center px-5 py-2"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</span>
        </div>

        {!data ? (
          <div className="px-5 py-8 space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-3 w-24 rounded" />
                  <div className="skeleton h-2 w-16 rounded" />
                </div>
                <div className="skeleton h-4 w-20 rounded" />
              </div>
            ))}
          </div>
        ) : data.map((stock, i) => {
          const live = prices[stock.symbol];
          const price = live?.price ?? stock.price;
          const pct = live?.changePercent ?? stock.changePercent;
          const isUp = pct >= 0;

          return (
            <div key={stock.symbol}
              onClick={() => navigate(`/stock/${stock.symbol}`)}
              className="flex items-center gap-3 px-5 cursor-pointer group"
              style={{
                height: 52,
                borderBottom: i < data.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                transition: 'background 150ms ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <StockIcon symbol={stock.symbol} size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#E5E7EB', fontFamily: 'Manrope' }}
                  className="truncate group-hover:text-blue-400 transition-colors">
                  {stock.symbol.replace('.NS','').replace('.BO','')}
                </p>
                <p style={{ fontSize: 11, color: '#6B7280' }} className="truncate">{stock.company}</p>
              </div>
              <div className="text-right">
                <p style={{ fontSize: 13, fontWeight: 600, fontFamily: 'JetBrains Mono', color: '#E5E7EB' }}>
                  ₹{price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
                <span style={{
                  fontSize: 11, fontWeight: 600, fontFamily: 'JetBrains Mono',
                  color: isUp ? '#22C55E' : '#EF4444',
                }}>
                  {isUp ? '+' : ''}{pct.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
