import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/format';
import { Clock } from 'lucide-react';

interface Market {
  name: string;
  timezone: string;
  open: number;  // hour in local time (24h)
  close: number;
  days: number[]; // 0=Sun, 1=Mon...5=Fri
}

const MARKETS: Market[] = [
  { name: 'NSE', timezone: 'Asia/Kolkata',    open: 9,  close: 15, days: [1,2,3,4,5] },
  { name: 'NYSE', timezone: 'America/New_York', open: 9,  close: 16, days: [1,2,3,4,5] },
];

function isMarketOpen(market: Market): boolean {
  const now = new Date();
  const localTime = new Date(now.toLocaleString('en-US', { timeZone: market.timezone }));
  const hour = localTime.getHours();
  const minute = localTime.getMinutes();
  const day = localTime.getDay();
  const timeInHours = hour + minute / 60;
  return market.days.includes(day) && timeInHours >= market.open && timeInHours < market.close;
}

function getLocalTime(timezone: string): string {
  return new Date().toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function MarketHours() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3">
      {MARKETS.map(market => {
        const open = isMarketOpen(market);
        const time = getLocalTime(market.timezone);
        return (
          <div key={market.name} className={cn(
            "flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg ",
            open
              ? "bg-[hsl(var(--market-up-bg))] border-[hsl(var(--market-up)/0.2)] text-[hsl(var(--market-up))]"
              : "bg-secondary  text-muted-foreground"
          )}>
            <span className={cn(
              "w-1.5 h-1.5 rounded-full flex-shrink-0",
              open ? "bg-[hsl(var(--market-up))] animate-pulse" : "bg-muted-foreground"
            )} />
            <span>{market.name}</span>
            <span className="font-mono opacity-70">{time}</span>
            <span className="opacity-60">{open ? 'Open' : 'Closed'}</span>
          </div>
        );
      })}
    </div>
  );
}
