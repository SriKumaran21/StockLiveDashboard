import React, { useState } from 'react';
import { useStockHistory } from '@/hooks/use-stocks';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { cn } from '@/lib/format';
import { Loader2 } from 'lucide-react';

const RANGES = ['1D', '1W', '1M', '3M', '1Y', '5Y'] as const;
type Range = typeof RANGES[number];

interface Props {
  symbol: string;
  showRanges?: boolean;
  height?: number;
  defaultRange?: Range;
}

function formatTime(ts: string, range: Range): string {
  const d = new Date(ts);
  if (range === '1D') return format(d, 'HH:mm');
  if (range === '1W') return format(d, 'EEE dd');
  if (range === '5Y') return format(d, 'MMM yy');
  return format(d, 'dd MMM');
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[hsl(0,0%,9%)] border border-[hsl(0,0%,16%)] rounded-xl px-3 py-2 shadow-xl">
      <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-bold font-mono text-foreground">
        ₹{Number(payload[0].value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
};

export function StockChart({ symbol, showRanges = true, height = 300, defaultRange = '1M' }: Props) {
  const [range, setRange] = useState<Range>(defaultRange);
  const { data: history, isLoading } = useStockHistory(symbol, range);

  const chartData = (history || []).map(d => ({
    time: formatTime(d.timestamp, range),
    price: d.price,
  }));

  const prices = chartData.map(d => d.price).filter(Boolean);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const firstPrice = prices[0] || 0;
  const lastPrice = prices[prices.length - 1] || 0;
  const isPositive = lastPrice >= firstPrice;
  const color = isPositive ? '#22c55e' : '#ef4444';
  const gradId = `grad-${symbol}-${isPositive}`;

  return (
    <div className="w-full">
      {showRanges && (
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex gap-0.5 bg-secondary p-1 rounded-xl">
            {RANGES.map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={cn("px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                  range === r ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground")}>
                {r}
              </button>
            ))}
          </div>
          <div className="flex gap-3 text-[10px] text-muted-foreground pr-1">
            <span className={cn("font-mono font-semibold text-xs", isPositive ? "text-green-500" : "text-red-500")}>
              {isPositive ? '▲' : '▼'} {firstPrice > 0 ? (((lastPrice - firstPrice) / firstPrice) * 100).toFixed(2) : '0.00'}%
            </span>
          </div>
        </div>
      )}

      <div className="relative" style={{ height }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}
        {!isLoading && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'DM Mono' }}
                minTickGap={50}
                dy={6}
              />
              <YAxis
                domain={[minPrice * 0.998, maxPrice * 1.002]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'DM Mono' }}
                tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v.toFixed(0)}
                width={52}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <ReferenceLine y={firstPrice} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" strokeWidth={1} />
              <Area
                type="linear"
                dataKey="price"
                stroke={color}
                strokeWidth={1.5}
                fill={`url(#${gradId})`}
                dot={false}
                activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
