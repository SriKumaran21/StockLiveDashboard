import React, { useState, useMemo } from 'react';
import { useAllStocks, useStockHistory } from '@/hooks/use-stocks';
import { useWatchlist, useAddWatchlist, useRemoveWatchlist } from '@/hooks/use-watchlist';
import { useLiveMarket } from '@/hooks/use-live-market';
import { formatCurrency, cn } from '@/lib/format';
import { useLocation } from 'wouter';
import { Search, Star, TrendingUp, TrendingDown, ArrowRight, SlidersHorizontal, ChevronDown, X } from 'lucide-react';
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
  const [query,      setQuery]      = useState('');
  const [sector,     setSector]     = useState('All Sectors');
  const [market,     setMarket]     = useState('All');
  const [hovered,    setHovered]    = useState<string|null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [sortBy,     setSortBy]     = useState<'default'|'price_asc'|'price_desc'|'change_asc'|'change_desc'|'name'>('default');
  const [minPrice,   setMinPrice]   = useState('');
  const [maxPrice,   setMaxPrice]   = useState('');
  const [changeFilter, setChangeFilter] = useState<'all'|'gainers'|'losers'>('all');

  const { data: allStocks, isLoading } = useAllStocks();
  const { data: watchlist } = useWatchlist();
  const addMutation    = useAddWatchlist();
  const removeMutation = useRemoveWatchlist();
  const { prices }     = useLiveMarket();
  const [, navigate]   = useLocation();

  const watchlistSymbols = new Set(watchlist?.map(w => w.symbol) || []);

  const filtered = useMemo(() => {
    let result = (allStocks || []).filter(s => {
      const live = prices[s.symbol];
      const price = live?.price ?? s.price;
      const pct   = live?.changePercent ?? s.changePercent;
      const matchQuery  = !query || s.symbol.toLowerCase().includes(query.toLowerCase()) || s.company.toLowerCase().includes(query.toLowerCase());
      const matchSector = sector === 'All Sectors' || (s as any).sector === sector;
      const matchMarket = market === 'All'
        || (market === 'Indian' && (s.symbol.endsWith('.NS') || s.symbol.endsWith('.BO')))
        || (market === 'US'     && !s.symbol.endsWith('.NS') && !s.symbol.endsWith('.BO'));
      const matchMin    = !minPrice || price >= Number(minPrice);
      const matchMax    = !maxPrice || price <= Number(maxPrice);
      const matchChange = changeFilter === 'all' || (changeFilter === 'gainers' ? pct > 0 : pct < 0);
      return matchQuery && matchSector && matchMarket && matchMin && matchMax && matchChange;
    });
    if (sortBy === 'price_asc')   result = [...result].sort((a,b) => (prices[a.symbol]?.price ?? a.price) - (prices[b.symbol]?.price ?? b.price));
    if (sortBy === 'price_desc')  result = [...result].sort((a,b) => (prices[b.symbol]?.price ?? b.price) - (prices[a.symbol]?.price ?? a.price));
    if (sortBy === 'change_asc')  result = [...result].sort((a,b) => (prices[a.symbol]?.changePercent ?? a.changePercent) - (prices[b.symbol]?.changePercent ?? b.changePercent));
    if (sortBy === 'change_desc') result = [...result].sort((a,b) => (prices[b.symbol]?.changePercent ?? b.changePercent) - (prices[a.symbol]?.changePercent ?? a.changePercent));
    if (sortBy === 'name')        result = [...result].sort((a,b) => a.company.localeCompare(b.company));
    return result;
  }, [allStocks, query, sector, market, minPrice, maxPrice, changeFilter, sortBy, prices]);

  const activeFilterCount = [
    minPrice, maxPrice,
    changeFilter !== 'all' ? changeFilter : '',
    sortBy !== 'default' ? sortBy : '',
  ].filter(Boolean).length;

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

      {/* Market + Sector + Filter row */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
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
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
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

        {/* Filter button */}
        <button onClick={() => setShowFilter(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
            border: 'none', cursor: 'pointer', fontFamily: 'Inter', transition: 'all 150ms',
            background: showFilter || activeFilterCount > 0 ? 'rgba(59,130,246,0.15)' : '#161C27',
            color: showFilter || activeFilterCount > 0 ? '#3B82F6' : '#9CA3AF',
            flexShrink: 0,
          }}>
          <SlidersHorizontal style={{ width: 13, height: 13 }} />
          Filters
          {activeFilterCount > 0 && (
            <span style={{
              width: 18, height: 18, borderRadius: '50%', background: '#3B82F6',
              color: 'white', fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{activeFilterCount}</span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilter && (
        <div style={{
          background: '#161C27', borderRadius: 14, padding: 16,
          border: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start',
        }}>
          {/* Price range */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Price Range (₹)</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                style={{
                  width: 90, background: '#1E2738', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#E5E7EB',
                  fontFamily: 'JetBrains Mono', outline: 'none',
                }} />
              <span style={{ color: '#6B7280', fontSize: 12 }}>—</span>
              <input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                style={{
                  width: 90, background: '#1E2738', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#E5E7EB',
                  fontFamily: 'JetBrains Mono', outline: 'none',
                }} />
            </div>
          </div>

          {/* % Change filter */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>% Change</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { val: 'all', label: 'All' },
                { val: 'gainers', label: '▲ Gainers' },
                { val: 'losers',  label: '▼ Losers' },
              ].map(({ val, label }) => (
                <button key={val} onClick={() => setChangeFilter(val as any)}
                  style={{
                    padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                    border: 'none', cursor: 'pointer', transition: 'all 150ms',
                    background: changeFilter === val
                      ? val === 'gainers' ? 'rgba(34,197,94,0.15)' : val === 'losers' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)'
                      : 'rgba(255,255,255,0.04)',
                    color: changeFilter === val
                      ? val === 'gainers' ? '#22C55E' : val === 'losers' ? '#EF4444' : '#3B82F6'
                      : '#9CA3AF',
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort by */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Sort By</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { val: 'default',     label: 'Default' },
                { val: 'price_desc',  label: 'Price ↓' },
                { val: 'price_asc',   label: 'Price ↑' },
                { val: 'change_desc', label: 'Change ↓' },
                { val: 'change_asc',  label: 'Change ↑' },
                { val: 'name',        label: 'Name A-Z' },
              ].map(({ val, label }) => (
                <button key={val} onClick={() => setSortBy(val as any)}
                  style={{
                    padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                    border: 'none', cursor: 'pointer', transition: 'all 150ms',
                    background: sortBy === val ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                    color: sortBy === val ? '#3B82F6' : '#9CA3AF',
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Clear */}
          {activeFilterCount > 0 && (
            <button onClick={() => { setMinPrice(''); setMaxPrice(''); setChangeFilter('all'); setSortBy('default'); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto',
                padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                background: 'rgba(239,68,68,0.1)', color: '#EF4444',
                border: 'none', cursor: 'pointer',
              }}>
              <X style={{ width: 11, height: 11 }} /> Clear all
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      <p style={{ fontSize: 11, color: '#6B7280', fontWeight: 500 }}>
        Showing <strong style={{ color: '#E5E7EB' }}>{filtered.length}</strong> stocks
        {activeFilterCount > 0 && <span style={{ color: '#3B82F6' }}> (filtered)</span>}
      </p>

      {/* Stock list */}
      <div style={{ background: '#161C27', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
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
                padding: '12px 16px', cursor: 'pointer',
                borderBottom: i < filtered.length-1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                background: isHov ? '#1E2738' : 'transparent',
                transition: 'background 150ms',
              }}>
              {/* Row: icon+name | sparkline | change | star */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: `hsl(${stock.symbol.charCodeAt(0) * 15 % 360}, 40%, 25%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: '#E5E7EB', fontFamily: 'Manrope',
                }}>
                  {stock.symbol.replace('.NS','').replace('.BO','').slice(0,2)}
                </div>

                {/* Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Manrope', color: '#E5E7EB' }}>
                      {stock.symbol.replace('.NS','').replace('.BO','')}
                    </p>
                    {(stock as any).sector && (
                      <span style={{
                        fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 4,
                        background: 'rgba(59,130,246,0.1)', color: '#3B82F6',
                        textTransform: 'uppercase',
                      }}>
                        {(stock as any).sector}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stock.company}</p>
                </div>

                {/* Sparkline — hidden on very small screens via inline */}
                <div className="hidden sm:block">
                  <MiniSparkline symbol={stock.symbol} />
                </div>

                {/* Price + change */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono', color: '#E5E7EB' }}>
                    {formatCurrency(price)}
                  </p>
                  <p style={{ fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono',
                    color: isUp ? '#22C55E' : '#EF4444' }}>
                    {isUp ? '+' : ''}{pct.toFixed(2)}%
                  </p>
                </div>

                {/* Watchlist star */}
                <button
                  onClick={e => toggleWatchlist(e, stock.symbol, stock.company)}
                  style={{
                    width: 32, height: 32, borderRadius: 8, border: 'none', flexShrink: 0,
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
