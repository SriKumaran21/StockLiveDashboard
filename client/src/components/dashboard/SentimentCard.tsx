import React, { useMemo } from 'react';
import { useAllStocks } from '@/hooks/use-stocks';
import { useLiveMarket } from '@/hooks/use-live-market';

export function SentimentCard() {
  const { data: allStocks } = useAllStocks();
  const { prices } = useLiveMarket();

  const score = useMemo(() => {
    const stocks = allStocks || [];
    if (!stocks.length) return 50;
    const changes = stocks.map(s => prices[s.symbol]?.changePercent ?? s.changePercent);
    const gainers = changes.filter(c => c > 0).length;
    const total   = changes.length || 1;
    const avg     = changes.reduce((s, c) => s + c, 0) / total;
    const breadth  = (gainers / total) * 100;
    const momentum = Math.min(Math.max((avg + 3) / 6 * 100, 0), 100);
    return Math.round(breadth * 0.6 + momentum * 0.4);
  }, [allStocks, prices]);

  const cfg = score <= 20 ? { label: 'Extreme Fear',  color: '#EF4444', emoji: '😨' }
    : score <= 40          ? { label: 'Fear',          color: '#F97316', emoji: '😟' }
    : score <= 60          ? { label: 'Neutral',       color: '#F59E0B', emoji: '😐' }
    : score <= 80          ? { label: 'Greed',         color: '#22C55E', emoji: '😊' }
    :                        { label: 'Extreme Greed', color: '#16A34A', emoji: '🤑' };

  // Semicircle gauge
  const r = 30, cx = 44, cy = 40;
  const angle = 180 - (score / 100) * 180;
  const rad   = (angle * Math.PI) / 180;
  const nx    = cx + r * Math.cos(rad);
  const ny    = cy - r * Math.sin(rad);

  return (
    <div className="rounded-2xl"
      style={{
        height: 110,
        background: '#161C27',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
      {/* Gauge */}
      <svg width={88} height={52} viewBox="0 0 88 52" style={{ flexShrink: 0 }}>
        {/* Track */}
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
          fill="none" stroke="#1E2738" strokeWidth={7} strokeLinecap="round" />
        {/* Fill */}
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${nx} ${ny}`}
          fill="none" stroke={cfg.color} strokeWidth={7} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${cfg.color}50)` }} />
        {/* Needle */}
        <circle cx={nx} cy={ny} r={3.5} fill={cfg.color} />
        {/* Score */}
        <text x={cx} y={cy + 2} textAnchor="middle"
          style={{ fontFamily: 'JetBrains Mono', fontSize: 15, fontWeight: 700, fill: cfg.color }}>
          {score}
        </text>
        {/* Labels */}
        <text x={cx - r + 2} y={cy + 12}
          style={{ fontFamily: 'Inter', fontSize: 7, fill: '#EF4444' }}>Fear</text>
        <text x={cx + r - 14} y={cy + 12}
          style={{ fontFamily: 'Inter', fontSize: 7, fill: '#22C55E' }}>Greed</text>
      </svg>

      {/* Text */}
      <div>
        <p style={{ fontSize: 9, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
          Market Sentiment
        </p>
        <p style={{ fontSize: 15, fontWeight: 800, fontFamily: 'Manrope', color: cfg.color, lineHeight: 1 }}>
          {cfg.emoji} {cfg.label}
        </p>
        <p style={{ fontSize: 10, color: '#6B7280', marginTop: 4 }}>
          Based on {allStocks?.length || 0} stocks
        </p>
      </div>
    </div>
  );
}
