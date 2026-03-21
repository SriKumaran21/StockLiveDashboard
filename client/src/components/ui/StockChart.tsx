import React, { useState, useMemo } from 'react';
import { useStockHistory } from '@/hooks/use-stocks';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';
import { cn } from '@/lib/format';
import { Loader2 } from 'lucide-react';

const RANGES = ['1D', '1W', '1M', '3M', '1Y', '5Y'] as const;
type Range = typeof RANGES[number];

interface Props {
  symbol: string;
  height?: number;
  defaultRange?: Range;
  rangePosition?: 'top' | 'bottom';
  showRanges?: boolean;
  showOHLC?: boolean;
}

function fmtTime(ts: string, range: Range) {
  const d = new Date(ts);
  if (range === '1D') return format(d, 'HH:mm');
  if (range === '1W') return format(d, 'EEE dd');
  if (range === '5Y') return format(d, 'MMM yy');
  return format(d, 'dd MMM');
}

function fmtPrice(v: number) {
  if (v >= 100000) return `${(v/1000).toFixed(0)}k`;
  if (v >= 1000)   return `${(v/1000).toFixed(1)}k`;
  return v.toFixed(0);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const price = payload[0]?.value;
  return (
    <div style={{
      background: '#1E2738',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8,
      padding: '8px 12px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3, fontFamily: 'Inter' }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#E5E7EB', fontFamily: 'JetBrains Mono' }}>
        ₹{Number(price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
};

export function StockChart({
  symbol, height = 300, defaultRange = '1M',
  rangePosition = 'top', showRanges = true, showOHLC = true,
}: Props) {
  const [range, setRange] = useState<Range>(defaultRange);
  const { data: history, isLoading } = useStockHistory(symbol, range);

  const chartData = useMemo(() =>
    (history || []).map(d => ({
      time:  fmtTime(d.timestamp, range),
      price: d.price,
    })),
    [history, range]
  );

  const prices    = chartData.map(d => d.price).filter(Boolean);
  const minPrice  = prices.length ? Math.min(...prices) : 0;
  const maxPrice  = prices.length ? Math.max(...prices) : 0;
  const firstPrice = prices[0]  || 0;
  const lastPrice  = prices[prices.length - 1] || 0;
  const isUp       = lastPrice >= firstPrice;
  const pctChange  = firstPrice > 0 ? (((lastPrice - firstPrice) / firstPrice) * 100).toFixed(2) : '0.00';

  // OHLC
  const open  = firstPrice;
  const high  = maxPrice;
  const low   = minPrice;

  const color   = isUp ? '#22C55E' : '#EF4444';
  const gradId  = `grad-${symbol.replace(/[^a-z0-9]/gi,'')}`;
  const padding = (maxPrice - minPrice) * 0.05;

  const RangeSelector = () => (
    <div style={{ display: 'flex', gap: 2 }}>
      {RANGES.map(r => (
        <button key={r} onClick={() => setRange(r)}
          style={{
            padding: '4px 10px',
            fontSize: 11,
            fontWeight: range === r ? 700 : 500,
            fontFamily: 'Inter',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 150ms',
            background: range === r ? 'rgba(255,255,255,0.08)' : 'transparent',
            color: range === r ? '#E5E7EB' : '#6B7280',
            borderBottom: range === r ? `2px solid ${color}` : '2px solid transparent',
          }}>
          {r}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ width: '100%' }}>
      {/* OHLC strip */}
      {showOHLC && prices.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 20,
          padding: '10px 20px 0',
          borderBottom: 'none',
        }}>
          {[
            { label: 'Open',  val: open },
            { label: 'High',  val: high },
            { label: 'Low',   val: low },
            { label: 'Close', val: lastPrice },
          ].map(({ label, val }) => (
            <div key={label}>
              <span style={{ fontSize: 10, color: '#6B7280', fontFamily: 'Inter', marginRight: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {label}
              </span>
              <span style={{ fontSize: 12, color: '#E5E7EB', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
                ₹{val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {showRanges && rangePosition === 'top' && <RangeSelector />}
            <span style={{
              fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono',
              color: isUp ? '#22C55E' : '#EF4444',
              padding: '2px 8px', borderRadius: 5,
              background: isUp ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            }}>
              {isUp ? '▲' : '▼'} {pctChange}%
            </span>
          </div>
        </div>
      )}

      {!showOHLC && showRanges && rangePosition === 'top' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px' }}>
          <RangeSelector />
          <span style={{ fontSize: 11, fontWeight: 700, color: isUp ? '#22C55E' : '#EF4444' }}>
            {isUp ? '▲' : '▼'} {pctChange}%
          </span>
        </div>
      )}

      {/* Chart */}
      <div style={{ position: 'relative', height, padding: '12px 4px 4px 4px' }}>
        {isLoading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <Loader2 style={{ width: 20, height: 20, color: '#22C55E', animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {!isLoading && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 6, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={color} stopOpacity={0.3} />
                  <stop offset="50%"  stopColor={color} stopOpacity={0.08} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>

              {/* Horizontal grid only — 4 lines max */}
              <CartesianGrid
                horizontal={true}
                vertical={false}
                stroke="rgba(255,255,255,0.05)"
                strokeDasharray="0"
              />

              <XAxis
                dataKey="time"
                axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'Inter' }}
                minTickGap={60}
                dy={6}
              />

              <YAxis
                domain={[minPrice - padding, maxPrice + padding]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                tickFormatter={fmtPrice}
                width={48}
                tickCount={5}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: 'rgba(255,255,255,0.15)',
                  strokeWidth: 1,
                  strokeDasharray: '4 4',
                }}
              />

              {/* Baseline reference */}
              <ReferenceLine
                y={firstPrice}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={1}
                strokeDasharray="6 3"
              />

              <Area
                type="linear"
                dataKey="price"
                stroke={color}
                strokeWidth={2}
                fill={`url(#${gradId})`}
                dot={false}
                activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {!isLoading && chartData.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <p style={{ fontSize: 12, color: '#6B7280' }}>No data available</p>
          </div>
        )}
      </div>

      {/* Bottom range selector */}
      {showRanges && rangePosition === 'bottom' && (
        <div style={{
          display: 'flex', justifyContent: 'center', padding: '8px 16px 12px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          <RangeSelector />
        </div>
      )}
    </div>
  );
}
