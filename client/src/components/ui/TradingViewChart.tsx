import React, { useEffect, useRef, memo } from 'react';

function toTVSymbol(symbol: string): string {
  if (symbol.endsWith('.NS')) return `NSE:${symbol.replace('.NS', '')}`;
  if (symbol.endsWith('.BO')) return `BSE:${symbol.replace('.BO', '')}`;
  if (symbol === 'SPY') return 'AMEX:SPY';
  if (symbol === 'QQQ') return 'NASDAQ:QQQ';
  if (symbol === 'DIA') return 'AMEX:DIA';
  const NYSE = ['V', 'BAC', 'JPM', 'WMT', 'DIS', 'BRK.B'];
  if (NYSE.includes(symbol)) return `NYSE:${symbol}`;
  return `NASDAQ:${symbol}`;
}

interface Props { symbol: string; height?: number; }

export const TradingViewChart = memo(function TradingViewChart({ symbol, height = 520 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'tradingview-widget-container';
    wrapper.style.height = `${height}px`;
    wrapper.style.width = '100%';

    const inner = document.createElement('div');
    inner.className = 'tradingview-widget-container__widget';
    inner.style.height = '100%';
    inner.style.width = '100%';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: toTVSymbol(symbol),
      interval: 'D',
      timezone: 'Asia/Kolkata',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: 'rgba(15, 15, 15, 1)',
      gridColor: 'rgba(255, 255, 255, 0.04)',
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      calendar: false,
      hide_volume: false,
      support_host: 'https://www.tradingview.com',
    });

    wrapper.appendChild(inner);
    wrapper.appendChild(script);
    ref.current.appendChild(wrapper);

    return () => {
      if (ref.current) ref.current.innerHTML = '';
    };
  }, [symbol]);

  return (
    <div ref={ref} style={{ height, width: '100%' }} />
  );
});
