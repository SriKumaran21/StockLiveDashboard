import React, { useState } from 'react';
import { usePortfolio } from '@/hooks/use-trading';
import { useLiveMarket } from '@/hooks/use-live-market';
import { useStockHistory } from '@/hooks/use-stocks';
import { formatCurrency, cn } from '@/lib/format';
import { useLocation } from 'wouter';
import { ArrowUpRight, ArrowDownRight, BarChart2, Loader2 } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const PIE_COLORS = ['#22C55E','#3B82F6','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6','#F97316'];

function MiniSparkline({ symbol }: { symbol: string }) {
  const { data: history } = useStockHistory(symbol, '1M');
  if (!history?.length) return <div style={{ width: 72, height: 28 }} />;
  const data = history.map((d, i) => ({ i, v: d.price }));
  const isUp = data[data.length-1].v >= data[0].v;
  const color = isUp ? '#22C55E' : '#EF4444';
  return (
    <div style={{ width: 72, height: 28 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={`sp-${symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="100%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
            fill={`url(#sp-${symbol})`} dot={false} isAnimationActive={false}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Custom center label for donut
function DonutCenter({ cx, cy, totalValue }: { cx: number; cy: number; totalValue: number }) {
  const fmt = totalValue >= 100000
    ? `₹${(totalValue/100000).toFixed(1)}L`
    : totalValue >= 1000
    ? `₹${(totalValue/1000).toFixed(1)}K`
    : `₹${totalValue.toFixed(0)}`;
  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle"
        style={{ fontSize: 10, fill: '#6B7280', fontFamily: 'Inter', fontWeight: 600 }}>
        TOTAL
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle"
        style={{ fontSize: 18, fill: '#E5E7EB', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
        {fmt}
      </text>
    </g>
  );
}

export function PortfolioPage() {
  const { data: portfolio, isLoading } = usePortfolio();
  const { prices } = useLiveMarket();
  const [, navigate] = useLocation();
  const [sortBy, setSortBy] = useState<'value'|'returns'|'name'>('value');

  if (isLoading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  const holdings    = portfolio?.holdings || [];
  const totalValue  = portfolio?.totalValue   || 0;
  const totalCost   = portfolio?.totalCost    || 0;
  const totalReturn = portfolio?.totalReturns || 0;
  const returnPct   = portfolio?.returnsPercent || 0;
  const isUp        = totalReturn >= 0;

  // Live-enriched holdings
  const enriched = holdings.map(h => {
    const live     = prices[h.symbol];
    const livePrice = live?.price ?? Number(h.averagePrice);
    const liveValue = livePrice * Number(h.quantity);
    const cost      = Number(h.totalCost);
    const ret       = liveValue - cost;
    const retPct    = cost > 0 ? (ret / cost) * 100 : 0;
    return { ...h, livePrice, liveValue, ret, retPct };
  });

  const sorted = [...enriched].sort((a, b) =>
    sortBy === 'value'   ? b.liveValue - a.liveValue :
    sortBy === 'returns' ? b.ret - a.ret :
    a.symbol.localeCompare(b.symbol)
  );

  const pieData = enriched
    .filter(h => h.liveValue > 0)
    .map(h => ({
      name:  h.symbol.replace('.NS','').replace('.BO',''),
      value: h.liveValue,
      full:  h.symbol,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 40 }}>

      {/* ── ROW 1: Hero (60%) + Allocation Pie (40%) ── */}
      <div className="portfolio-hero-grid">

        {/* LEFT — Portfolio value hero */}
        <div style={{
          background: 'linear-gradient(135deg, #161C27 0%, #1A2232 100%)',
          borderRadius: 20, padding: '28px 32px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
            Portfolio Value
          </p>
          <p style={{ fontSize: 40, fontWeight: 800, fontFamily: 'JetBrains Mono', color: '#E5E7EB', lineHeight: 1, marginBottom: 12 }}>
            {formatCurrency(totalValue)}
          </p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 14,
            padding: '6px 14px', borderRadius: 10, width: 'fit-content',
            background: isUp ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
          }}>
            {isUp
              ? <ArrowUpRight style={{ width: 15, height: 15, color: '#22C55E' }} />
              : <ArrowDownRight style={{ width: 15, height: 15, color: '#EF4444' }} />
            }
            <span style={{
              fontSize: 15, fontWeight: 700, fontFamily: 'JetBrains Mono',
              color: isUp ? '#22C55E' : '#EF4444',
            }}>
              {isUp ? '+' : ''}{formatCurrency(Math.abs(totalReturn))} ({isUp ? '+' : ''}{returnPct.toFixed(2)}%)
            </span>
          </div>
          <p style={{ fontSize: 12, color: '#6B7280' }}>
            {holdings.length} position{holdings.length !== 1 ? 's' : ''} · Invested {formatCurrency(totalCost)}
          </p>
        </div>

        {/* RIGHT — Big allocation donut */}
        <div style={{
          background: '#161C27', borderRadius: 20, padding: '20px 24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
            Allocation
          </p>
          {pieData.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180 }}>
              <p style={{ fontSize: 12, color: '#6B7280' }}>No holdings yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              {/* Donut */}
              <div style={{ flexShrink: 0 }}>
                <PieChart width={180} height={180}>
                  <Pie
                    data={pieData} cx={90} cy={90}
                    innerRadius={58} outerRadius={82}
                    dataKey="value" strokeWidth={0} startAngle={90} endAngle={-270}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <DonutCenter cx={90} cy={90} totalValue={totalValue} />
                  <Tooltip
                    formatter={(v: any) => formatCurrency(v)}
                    contentStyle={{ background: '#1E2738', border: 'none', borderRadius: 8, fontSize: 11 }}
                  />
                </PieChart>
              </div>
              {/* Legend */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pieData.slice(0, 6).map((d, i) => {
                  const pct = totalValue > 0 ? ((d.value / totalValue) * 100).toFixed(1) : '0';
                  return (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        background: PIE_COLORS[i % PIE_COLORS.length],
                      }} />
                      <span style={{ flex: 1, fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter' }}>
                        {d.name}
                      </span>
                      <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', fontWeight: 700, color: '#E5E7EB' }}>
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 2: 3 stat cards ── */}
      <div className="portfolio-stats-grid">
        {[
          { label: 'Invested',      value: formatCurrency(totalCost),                                       accent: '#3B82F6' },
          { label: 'Current Value', value: formatCurrency(totalValue),                                      accent: '#3B82F6' },
          { label: 'Total Returns', value: `${isUp?'+':''}${formatCurrency(Math.abs(totalReturn))}`,
            sub: `${isUp?'▲':'▼'} ${Math.abs(returnPct).toFixed(2)}% all time`,
            accent: isUp ? '#22C55E' : '#EF4444' },
        ].map(({ label, value, sub, accent }) => (
          <div key={label} style={{
            background: '#161C27', borderRadius: 16, padding: '18px 22px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            borderLeft: `3px solid ${accent}`,
          }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              {label}
            </p>
            <p style={{ fontSize: 20, fontWeight: 800, fontFamily: 'JetBrains Mono', color: '#E5E7EB', lineHeight: 1 }}>
              {value}
            </p>
            {sub && (
              <p style={{ fontSize: 11, fontFamily: 'JetBrains Mono', fontWeight: 600, marginTop: 5, color: accent }}>
                {sub}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── ROW 3: Holdings full width ── */}
      <div style={{ background: '#161C27', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          <h3 style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 14, color: '#E5E7EB' }}>
            Your Holdings
          </h3>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['value','returns','name'] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)}
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', border: 'none', fontFamily: 'Inter', transition: 'all 150ms',
                  background: sortBy === s ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                  color: sortBy === s ? '#3B82F6' : '#6B7280',
                }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Rows — card layout works on all screen sizes */}
        {sorted.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <BarChart2 style={{ width: 32, height: 32, color: '#374151', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 13, color: '#6B7280' }}>No holdings yet</p>
            <button onClick={() => navigate('/explore')}
              style={{ marginTop: 10, fontSize: 12, color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Explore stocks →
            </button>
          </div>
        ) : sorted.map((h, i) => {
          const isHUp = h.ret >= 0;
          return (
            <div key={h.id}
              onClick={() => navigate(`/stock/${h.symbol}`)}
              style={{
                padding: '14px 16px', cursor: 'pointer',
                borderBottom: i < sorted.length-1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                transition: 'background 150ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1E2738')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

              {/* Row 1: icon + name + returns badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: `hsl(${h.symbol.charCodeAt(0) * 15 % 360},35%,22%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: '#E5E7EB', fontFamily: 'Manrope',
                }}>
                  {h.symbol.replace('.NS','').replace('.BO','').slice(0,2)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Manrope', color: '#E5E7EB' }}>
                    {h.symbol.replace('.NS','').replace('.BO','')}
                  </p>
                  <p style={{ fontSize: 11, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.companyName}</p>
                </div>
                <div style={{
                  padding: '5px 10px', borderRadius: 8, textAlign: 'right', flexShrink: 0,
                  background: isHUp ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                }}>
                  <p style={{ fontSize: 12, fontFamily: 'JetBrains Mono', fontWeight: 700, color: isHUp ? '#22C55E' : '#EF4444' }}>
                    {isHUp?'+':''}{h.retPct.toFixed(2)}%
                  </p>
                  <p style={{ fontSize: 10, color: isHUp ? '#22C55E' : '#EF4444', fontFamily: 'JetBrains Mono' }}>
                    {isHUp?'+':''}{formatCurrency(Math.abs(h.ret))}
                  </p>
                </div>
              </div>

              {/* Row 2: stats + sparkline */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4 }}>
                  {[
                    { label: 'Shares', value: String(h.quantity) },
                    { label: 'Avg Cost', value: formatCurrency(Number(h.averagePrice)) },
                    { label: 'Live', value: formatCurrency(h.livePrice) },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '5px 8px' }}>
                      <p style={{ fontSize: 9, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</p>
                      <p style={{ fontSize: 11, fontFamily: 'JetBrains Mono', fontWeight: 600, color: '#E5E7EB' }}>{value}</p>
                    </div>
                  ))}
                </div>
                <MiniSparkline symbol={h.symbol} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
