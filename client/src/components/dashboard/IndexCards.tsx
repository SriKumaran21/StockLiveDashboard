import React from 'react';
import { useIndices } from '@/hooks/use-stocks';
import { useLiveMarket } from '@/hooks/use-live-market';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/format';
import { useLocation } from 'wouter';

const INDEX_TO_SYMBOL: Record<string, string> = {
  'Nifty 50': 'NIFTY50',
  'Sensex':   'SENSEX',
  'S&P 500':  'SPY',
  'Nasdaq':   'QQQ',
};

export function IndexCards() {
  const { data: indices, isLoading } = useIndices();
  const { indices: liveIndices } = useLiveMarket();
  const [, navigate] = useLocation();

  const display = (indices || []).map(idx => {
    const live = liveIndices[idx.name];
    return live ? { ...idx, ...live } : idx;
  });

  if (isLoading) {
    return (
      <>
        {[1,2,3,4].map(i => (
          <div key={i} className="skeleton rounded-2xl" style={{ height: 110 }} />
        ))}
      </>
    );
  }

  return (
    <>
      {display.map(index => {
        const isUp = index.change >= 0;
        return (
          <div key={index.name}
            onClick={() => navigate(`/stock/${INDEX_TO_SYMBOL[index.name] || index.name}`)}
            className="rounded-2xl cursor-pointer transition-all duration-200 hover:scale-[1.02]"
            style={{
              height: 110,
              background: isUp
                ? 'linear-gradient(135deg, #121821 60%, rgba(34,197,94,0.08) 100%)'
                : 'linear-gradient(135deg, #121821 60%, rgba(239,68,68,0.08) 100%)',
              boxShadow: isUp
                ? '0 4px 24px rgba(0,0,0,0.3), inset 0 0 40px rgba(34,197,94,0.04)'
                : '0 4px 24px rgba(0,0,0,0.3), inset 0 0 40px rgba(239,68,68,0.04)',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: `1px solid ${isUp ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}`,
            }}>
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                fontSize: 10, fontWeight: 700, fontFamily: 'Inter',
                color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                {index.name}
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono',
                padding: '2px 7px', borderRadius: 6,
                background: isUp ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                color: isUp ? '#22C55E' : '#EF4444',
              }}>
                {isUp
                  ? <TrendingUp style={{ width: 9, height: 9 }} />
                  : <TrendingDown style={{ width: 9, height: 9 }} />}
                {isUp ? '+' : ''}{index.changePercent.toFixed(2)}%
              </span>
            </div>

            {/* Value */}
            <div>
              <p style={{
                fontFamily: 'JetBrains Mono', fontSize: 22, fontWeight: 700,
                color: '#E5E7EB', lineHeight: 1,
              }}>
                {index.value > 0
                  ? index.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })
                  : '—'}
              </p>
              <p style={{
                fontFamily: 'JetBrains Mono', fontSize: 11, marginTop: 4,
                color: isUp ? '#22C55E' : '#EF4444',
              }}>
                {isUp ? '+' : ''}{index.change.toFixed(2)} today
              </p>
            </div>
          </div>
        );
      })}
    </>
  );
}
