import React, { useMemo } from 'react';
import { useAllStocks } from '@/hooks/use-stocks';
import { useLiveMarket } from '@/hooks/use-live-market';

function getLabel(score: number): { label: string; color: string; emoji: string } {
  if (score <= 20) return { label: 'Extreme Fear',  color: '#EF4444', emoji: '😨' };
  if (score <= 40) return { label: 'Fear',          color: '#F97316', emoji: '😟' };
  if (score <= 60) return { label: 'Neutral',       color: '#EAB308', emoji: '😐' };
  if (score <= 80) return { label: 'Greed',         color: '#22C55E', emoji: '😊' };
  return                   { label: 'Extreme Greed',color: '#16A34A', emoji: '🤑' };
}

export function FearGreed() {
  const { data: allStocks } = useAllStocks();
  const { prices } = useLiveMarket();

  const score = useMemo(() => {
    const stocks = allStocks || [];
    if (!stocks.length) return 50;

    const changes = stocks.map(s => prices[s.symbol]?.changePercent ?? s.changePercent);
    const gainers = changes.filter(c => c > 0).length;
    const losers  = changes.filter(c => c < 0).length;
    const total   = gainers + losers || 1;

    // Breadth: ratio of gainers
    const breadth = (gainers / total) * 100;

    // Momentum: avg positive change magnitude
    const avgChange = changes.reduce((s, c) => s + c, 0) / (changes.length || 1);
    const momentum = Math.min(Math.max((avgChange + 3) / 6 * 100, 0), 100);

    // Volatility: std deviation (lower = more greed)
    const mean = avgChange;
    const variance = changes.reduce((s, c) => s + Math.pow(c - mean, 2), 0) / changes.length;
    const stdDev = Math.sqrt(variance);
    const volatility = Math.max(0, 100 - stdDev * 10);

    const composite = breadth * 0.5 + momentum * 0.3 + volatility * 0.2;
    return Math.round(Math.min(Math.max(composite, 0), 100));
  }, [allStocks, prices]);

  const { label, color, emoji } = getLabel(score);

  // Gauge arc calculation
  const radius = 52;
  const cx = 70;
  const cy = 70;
  const startAngle = 180;
  const endAngle = 0;
  const scoreAngle = 180 - (score / 100) * 180;

  function polarToXY(angle: number, r: number) {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy - r * Math.sin(rad),
    };
  }

  const bgStart = polarToXY(startAngle, radius);
  const bgEnd   = polarToXY(endAngle,   radius);
  const fgEnd   = polarToXY(scoreAngle, radius);
  const needle  = polarToXY(scoreAngle, radius - 10);

  const bgArc = `M ${bgStart.x} ${bgStart.y} A ${radius} ${radius} 0 0 1 ${bgEnd.x} ${bgEnd.y}`;
  const fgArc = `M ${bgStart.x} ${bgStart.y} A ${radius} ${radius} 0 ${score > 50 ? 0 : 0} 1 ${fgEnd.x} ${fgEnd.y}`;

  return (
    <div className="bg-card rounded-2xl px-4 py-3 flex items-center gap-3 w-full">
      {/* Gauge SVG */}
      <div className="flex-shrink-0">
        <svg width={110} height={65} viewBox="0 0 140 80">
          {/* Background arc */}
          <path d={bgArc} fill="none" stroke="hsl(var(--secondary))" strokeWidth={10} strokeLinecap="round" />

          {/* Colored fill arc */}
          <path d={fgArc} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${color}60)` }} />

          {/* Needle dot */}
          <circle cx={needle.x} cy={needle.y} r={4} fill={color} />

          {/* Score text */}
          <text x={cx} y={cy - 4} textAnchor="middle"
            style={{ fontFamily: 'JetBrains Mono', fontSize: 20, fontWeight: 700, fill: color }}>
            {score}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle"
            style={{ fontFamily: 'Inter', fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}>
            out of 100
          </text>

          {/* Labels */}
          <text x={14} y={78} style={{ fontFamily: 'Inter', fontSize: 7, fill: '#EF4444' }}>Fear</text>
          <text x={105} y={78} style={{ fontFamily: 'Inter', fontSize: 7, fill: '#22C55E' }}>Greed</text>
        </svg>
      </div>

      {/* Label */}
      <div>
        <p className="text-muted-foreground" style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
          Market Sentiment
        </p>
        <p style={{ fontSize: 16, fontWeight: 800, fontFamily: 'Manrope', color }} className="flex items-center gap-1.5">
          {emoji} {label}
        </p>
        <p className="text-muted-foreground mt-1" style={{ fontSize: 11, lineHeight: 1.4 }}>
          Based on {allStocks?.length || 0} stocks<br />breadth & momentum
        </p>
      </div>
    </div>
  );
}
