import React, { useState, useMemo } from 'react';
import { useAllStocks, useStockHistory } from '@/hooks/use-stocks';
import { useWatchlist, useAddWatchlist, useRemoveWatchlist } from '@/hooks/use-watchlist';
import { useLiveMarket } from '@/hooks/use-live-market';
import { formatCurrency, cn } from '@/lib/format';
import { useLocation } from 'wouter';
import { Search, Star, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const SECTORS = ['All Sectors','Banking','Finance','IT','Tech','Energy','Auto','Consumer','Pharma','Telecom','Industrial'];
const MARKETS = ['All','Indian','US'];

function MiniSparkline({ symbol }: { symbol: string }) {
  const { data: history } = useStockHistory(symbol, '1M');
  if (!history?.length) return <div style={{ width: 80, height: 36 }} />;
  const data = history.map((d, i) => ({ i, v: d.price }));
  const isUp = data[data.length-1].v >= data[0].v;
  const color = isUp ? '#22C55E' : '#EF4444';
  return (
    <div style={{ width: 80, height: 36 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={`exp-${symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="100%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
            fill={`url(#exp-${symbol})`} dot={false} isAnimationActive={false}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ExplorePage() {
  const [query,   setQuery]   = useState('');
  const [sector,  setSector]  = useState('All Sectors');
  const [market,  setMarket]  = useState('All');
  const [hovered, setHovered] = useState<string|null>(null);

  const { data: allStocks, isLoading } = useAllStocks();
  const { data: watchlist } = useWatchlist();
  const addMutation    = useAddWatchlist();
  const removeMutation = useRemoveWatchlist();
  const { prices }     = useLiveMarket();
  const [, navigate]   = useLocation();

  const watchlistSymbols = new Set(watchlist?.map(w => w.symbol) || []);

  const filtered = useMemo(() => {
    return (allStocks || []).filter(s => {
      const matchQuery  = !query || s.symbol.toLowerCase().includes(query.toLowerCase()) || s.company.toLowerCase().includes(query.toLowerCase());
      const matchSector = sector === 'All Sectors' || (s as any).sector === sector;
      const matchMarket = market === 'All'
        || (market === 'Indian' && (s.symbol.endsWith('.NS') || s.symbol.endsWith('.BO')))
        || (market === 'US'     && !s.symbol.endsWith('.NS') && !s.symbol.endsWith('.BO'));
      return matchQuery && matchSector && matchMarket;
    });
  }, [allStocks, query, sector, market]);

  const toggleWatchlist = (e: React.MouseEvent, symbol: string, company: string) => {
    e.stopPropagation();
    if (watchlistSymbols.has(symbol)) removeMutation.mutate(symbol);
    else addMutation.mutate({ symbol, companyName: company });
  };

  return (
    <div className="space-y-4 pb-10 animate-slide-up">
      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search style={{
          position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
          width: 16, height: 16, color: '#6B7280',
        }} />
        <input
          type="text" placeholder="Search by symbol or company…"
          value={query} onChange={e => setQuery(e.target.value)}
          style={{
            width: '100%', background: '#161C27',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14,
            padding: '14px 16px 14px 46px', fontSize: 14, color: '#E5E7EB',
            fontFamily: 'Inter', outline: 'none', boxSizing: 'border-box',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
        />
      </div>

      {/* Market + Sector filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Market tabs */}
        <div style={{ display: 'flex', background: '#161C27', borderRadius: 10, padding: 3, gap: 2 }}>
          {MARKETS.map(m => (
            <button key={m} onClick={() => setMarket(m)}
              style={{
                padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                border: 'none', cursor: 'pointer', fontFamily: 'Inter', transition: 'all 150ms',
                background: market === m ? '#3B82F6' : 'transparent',
                color: market === m ? 'white' : '#6B7280',
              }}>
              {m === 'Indian' ? '🇮🇳 Indian' : m === 'US' ? '🇺🇸 US' : '🌐 All'}
            </button>
          ))}
        </div>

        {/* Sector pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {SECTORS.map(s => (
            <button key={s} onClick={() => setSector(s)}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                border: 'none', cursor: 'pointer', fontFamily: 'Inter', transition: 'all 150ms',
                background: sector === s ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                color: sector === s ? '#3B82F6' : '#9CA3AF',
              }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p style={{ fontSize: 11, color: '#6B7280', fontWeight: 500 }}>
        Showing <strong style={{ color: '#E5E7EB' }}>{filtered.length}</strong> stocks
      </p>

      {/* Stock list */}
      <div style={{ background: '#161C27', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
        {/* Column headers */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2.5fr 1fr 80px 100px 44px',
          padding: '10px 20px', gap: 8,
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          {['Stock','Price','Chart','Change',''].map(h => (
            <p key={h} style={{ fontSize: 10, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {h}
            </p>
          ))}
        </div>

        {isLoading ? (
          <div style={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
            <div className="animate-pulse" style={{ color: '#6B7280', fontSize: 12 }}>Loading stocks…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#6B7280' }}>No stocks found</p>
          </div>
        ) : filtered.map((stock, i) => {
          const live  = prices[stock.symbol];
          const price = live?.price ?? stock.price;
          const pct   = live?.changePercent ?? stock.changePercent;
          const chg   = live?.change ?? stock.change ?? 0;
          const isUp  = pct >= 0;
          const inWL  = watchlistSymbols.has(stock.symbol);
          const isHov = hovered === stock.symbol;

          return (
            <div key={stock.symbol}
              onClick={() => navigate(`/stock/${stock.symbol}`)}
              onMouseEnter={() => setHovered(stock.symbol)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: 'grid', gridTemplateColumns: '2.5fr 1fr 80px 100px 44px',
                padding: '12px 20px', gap: 8, cursor: 'pointer',
                borderBottom: i < filtered.length-1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                background: isHov ? '#1E2738' : 'transparent',
                transition: 'background 150ms',
                alignItems: 'center',
              }}>
              {/* Stock info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: `hsl(${stock.symbol.charCodeAt(0) * 15 % 360}, 40%, 25%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: '#E5E7EB', fontFamily: 'Manrope',
                }}>
                  {stock.symbol.replace('.NS','').replace('.BO','').slice(0,2)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Manrope', color: '#E5E7EB' }}>
                      {stock.symbol.replace('.NS','').replace('.BO','')}
                    </p>
                    {(stock as any).sector && (
                      <span style={{
                        fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                        background: 'rgba(59,130,246,0.1)', color: '#3B82F6',
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                      }}>
                        {(stock as any).sector}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: '#6B7280' }} className="truncate">{stock.company}</p>
                </div>
              </div>

              {/* Price */}
              <p style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono', color: '#E5E7EB' }}>
                {formatCurrency(price)}
              </p>

              {/* Sparkline */}
              <MiniSparkline symbol={stock.symbol} />

              {/* Change badge */}
              <div style={{
                padding: '5px 10px', borderRadius: 8, textAlign: 'center',
                background: isUp ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
              }}>
                <p style={{ fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono',
                  color: isUp ? '#22C55E' : '#EF4444' }}>
                  {isUp ? '+' : ''}{pct.toFixed(2)}%
                </p>
                <p style={{ fontSize: 10, color: isUp ? '#22C55E' : '#EF4444', fontFamily: 'JetBrains Mono' }}>
                  {isUp ? '+' : ''}{formatCurrency(Math.abs(chg))}
                </p>
              </div>

              {/* Watchlist star */}
              <button
                onClick={e => toggleWatchlist(e, stock.symbol, stock.company)}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: 'none',
                  background: inWL ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 150ms',
                }}>
                <Star style={{
                  width: 14, height: 14,
                  color: inWL ? '#F59E0B' : '#6B7280',
                  fill: inWL ? '#F59E0B' : 'none',
                }} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
