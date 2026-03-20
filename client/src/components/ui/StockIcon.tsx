import React, { useState } from 'react';
import { cn } from '@/lib/format';

const SYMBOL_TO_DOMAIN: Record<string, string> = {
  AAPL: 'apple.com', MSFT: 'microsoft.com', GOOGL: 'google.com',
  TSLA: 'tesla.com', AMZN: 'amazon.com', NVDA: 'nvidia.com',
  META: 'meta.com', NFLX: 'netflix.com', AMD: 'amd.com',
  INTC: 'intel.com', V: 'visa.com', BABA: 'alibaba.com',
  'RELIANCE.NS': 'ril.com', 'TCS.NS': 'tcs.com',
  'INFY.NS': 'infosys.com', 'HDFCBANK.NS': 'hdfcbank.com',
  'ICICIBANK.NS': 'icicibank.com', 'WIPRO.NS': 'wipro.com',
  'SBIN.NS': 'sbi.co.in', 'TATAMOTORS.NS': 'tatamotors.com',
  'BAJFINANCE.NS': 'bajajfinserv.in', 'ADANIENT.NS': 'adani.com',
  SPY: 'ssga.com', QQQ: 'invesco.com', DIA: 'ssga.com',
};

interface StockIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

export function StockIcon({ symbol, size = 32, className }: StockIconProps) {
  const [error, setError] = useState(false);
  const domain = SYMBOL_TO_DOMAIN[symbol];
  const initials = symbol.replace('.NS','').replace('.BO','').slice(0,2);

  if (!domain || error) {
    return (
      <div className={cn(
        "rounded-xl bg-secondary flex items-center justify-center font-display font-bold text-xs text-muted-foreground flex-shrink-0",
        className
      )} style={{ width: size, height: size }}>
        {initials}
      </div>
    );
  }

  return (
    <img
      src={`https://logo.clearbit.com/${domain}`}
      alt={symbol}
      width={size}
      height={size}
      onError={() => setError(true)}
      className={cn("rounded-xl object-contain bg-white flex-shrink-0", className)}
      style={{ width: size, height: size }}
    />
  );
}
