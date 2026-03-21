import React from 'react';
import { useWatchlist, useRemoveWatchlist } from '@/hooks/use-watchlist';
import { useAllStocks } from '@/hooks/use-stocks';
import { useStockHistory } from '@/hooks/use-stocks';
import { useLiveMarket } from '@/hooks/use-live-market';
import { Star, Trash2, Plus } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/format';

function MiniSparkline({ symbol }: { symbol: string }) {
  const { data: history } = useStockHistory(symbol, '1M');
  if (!history?.length) return <div style={{ width: 64, height: 32 }} />;
  const prices = history.map((d, i) => ({ i, v: d.price }));
  const isUp = prices[prices.length - 1].v >= prices[0].v;
  const color = isUp ? '#22C55E' : '#EF4444';
  return (
    <div style={{ width: 64, height: 32 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={prices} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={`spark-${symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
            fill={`url(#spark-${symbol})`} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WatchlistWidget({ fillHeight }: { fillHeight?: boolean }) {
  const { data: watchlist, isLoading } = useWatchlist();
  const { data: allStocks } = useAllStocks();
  const { prices } = useLiveMarket();
  const removeMutation = useRemoveWatchlist();
  const [, navigate] = useLocation();

  const populated = watchlist?.map(item => {
    const s = allStocks?.find(x => x.symbol === item.symbol);
    const live = prices[item.symbol];
    return {
      ...item,
      price: live?.price ?? s?.price ?? 0,
      changePercent: live?.changePercent ?? s?.changePercent ?? 0,
    };
  });

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: '#161C27', height: fillHeight ? '100%' : undefined, minHeight: fillHeight ? 0 : 400, flex: fillHeight ? 1 : undefined, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h3 className="flex items-center gap-2"
          style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 14, color: '#E5E7EB' }}>
          <Star style={{ width: 14, height: 14, color: '#F59E0B', fill: '#F59E0B' }} />
          Watchlist
        </h3>
        <Link href="/explore"
          className="flex items-center justify-center w-6 h-6 rounded-lg transition-colors hover:bg-white/10"
          style={{ color: '#22C55E' }}>
          <Plus style={{ width: 14, height: 14 }} />
        </Link>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-5 space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-3 w-20 rounded" />
                  <div className="skeleton h-2 w-14 rounded" />
                </div>
                <div className="skeleton w-16 h-8 rounded" />
              </div>
            ))}
          </div>
        ) : populated?.length ? (
          <div>
            {populated.map((item, i) => {
              const isUp = item.changePercent >= 0;
              return (
                <div key={item.id}
                  className="flex items-center gap-3 px-5 cursor-pointer group"
                  style={{
                    height: 56,
                    borderBottom: i < populated.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                    transition: 'background 150ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => navigate(`/stock/${item.symbol}`)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#E5E7EB', fontFamily: 'Manrope' }}
                      className="group-hover:text-blue-400 transition-colors truncate">
                      {item.symbol.replace('.NS','').replace('.BO','')}
                    </p>
                    <p style={{ fontSize: 11, color: '#6B7280' }} className="truncate">{item.companyName}</p>
                  </div>

                  {/* Mini sparkline */}
                  <MiniSparkline symbol={item.symbol} />

                  <div className="text-right min-w-[80px]">
                    <p style={{ fontSize: 13, fontWeight: 600, fontFamily: 'JetBrains Mono', color: '#E5E7EB' }}>
                      ₹{item.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </p>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: isUp ? '#22C55E' : '#EF4444',
                    }}>
                      {isUp ? '+' : ''}{item.changePercent.toFixed(2)}%
                    </span>
                  </div>

                  <button
                    onClick={e => { e.stopPropagation(); removeMutation.mutate(item.symbol); }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all hover:bg-red-500/10"
                    style={{ color: '#EF4444' }}>
                    <Trash2 style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Star style={{ width: 32, height: 32, color: 'rgba(255,255,255,0.1)', marginBottom: 12 }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: '#E5E7EB', marginBottom: 4 }}>Watchlist is empty</p>
            <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>Add stocks from Explore</p>
            <Link href="/explore"
              className="px-4 py-2 rounded-xl transition-colors hover:bg-white/10"
              style={{ fontSize: 12, fontWeight: 600, color: '#3B82F6', background: 'rgba(59,130,246,0.1)' }}>
              Explore Stocks
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
