import React, { useState, useEffect, useRef } from 'react';
import { Bell, TrendingUp, TrendingDown, X } from 'lucide-react';
import { cn } from '@/lib/format';
import { useLiveMarket } from '@/hooks/use-live-market';

interface Notification {
  id: string;
  symbol: string;
  message: string;
  type: 'up' | 'down' | 'info';
  time: Date;
  read: boolean;
}

export function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { prices } = useLiveMarket();
  const prevPrices = useRef<Record<string, number>>({});
  const panelRef = useRef<HTMLDivElement>(null);

  // Generate notifications when prices move significantly
  useEffect(() => {
    Object.entries(prices).forEach(([symbol, data]) => {
      const prev = prevPrices.current[symbol];
      if (prev && data.price) {
        const changePct = ((data.price - prev) / prev) * 100;
        if (Math.abs(changePct) >= 0.5) {
          const isUp = changePct > 0;
          setNotifications(n => [{
            id: `${symbol}-${Date.now()}`,
            symbol,
            message: `${symbol} moved ${isUp ? '+' : ''}${changePct.toFixed(2)}% to ₹${data.price.toFixed(2)}`,
            type: isUp ? 'up' : 'down',
            time: new Date(),
            read: false,
          }, ...n].slice(0, 20));
        }
      }
      prevPrices.current[symbol] = data.price;
    });
  }, [prices]);

  // Seed with welcome notification
  useEffect(() => {
    setNotifications([{
      id: 'welcome',
      symbol: '',
      message: 'Welcome! Price alerts will appear here when stocks move significantly.',
      type: 'info',
      time: new Date(),
      read: false,
    }]);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const unread = notifications.filter(n => !n.read).length;
  const markAllRead = () => setNotifications(n => n.map(x => ({ ...x, read: true })));

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => { setOpen(!open); if (!open) markAllRead(); }}
        className="relative p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full text-[9px] font-bold text-primary-foreground flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-card border border-border rounded-2xl shadow-2xl shadow-black/40 z-50 overflow-hidden animate-slide-up">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-display font-bold text-sm">Notifications</h3>
            <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-secondary transition-colors">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet</div>
            ) : notifications.map(n => (
              <div key={n.id} className={cn("px-4 py-3 flex items-start gap-3", !n.read && "bg-primary/5")}>
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                  n.type === 'up' ? "bg-[hsl(var(--market-up-bg))] text-[hsl(var(--market-up))]" :
                  n.type === 'down' ? "bg-[hsl(var(--market-down-bg))] text-[hsl(var(--market-down))]" :
                  "bg-secondary text-muted-foreground"
                )}>
                  {n.type === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> :
                   n.type === 'down' ? <TrendingDown className="w-3.5 h-3.5" /> :
                   <Bell className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground leading-relaxed">{n.message}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {n.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
