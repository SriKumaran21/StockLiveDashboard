import React, { useState } from 'react';
import { useAllStocks, useStockBySymbol } from '@/hooks/use-stocks';
import { useLiveMarket } from '@/hooks/use-live-market';
import { useBuyStock, useSellStock, useHoldings } from '@/hooks/use-trading';
import { useAuth } from '@/hooks/use-auth';
import { AddFundsDialog } from '@/components/user/AddFundsDialog';
import { StockIcon } from '@/components/ui/StockIcon';
import { formatCurrency, cn } from '@/lib/format';
import { Search, TrendingUp, TrendingDown, Plus, Minus, Loader2, Zap } from 'lucide-react';

export function QuickTrade() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [showDeposit, setShowDeposit] = useState(false);
  const [success, setSuccess] = useState('');

  const { data: allStocks } = useAllStocks();
  const { prices } = useLiveMarket();
  const { data: stock } = useStockBySymbol(selected || '');
  const { data: holdings } = useHoldings();
  const { user } = useAuth();
  const buyMutation = useBuyStock();
  const sellMutation = useSellStock();

  const filtered = query.length >= 1
    ? allStocks?.filter(s =>
        s.symbol.toLowerCase().includes(query.toLowerCase()) ||
        s.company.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  const livePrice = selected ? prices[selected]?.price ?? stock?.price ?? 0 : 0;
  const isPositive = (stock?.change ?? 0) >= 0;
  const holding = holdings?.find(h => h.symbol === selected);

  const handleTrade = () => {
    if (!selected || !livePrice) return;
    if (orderType === 'buy' && Number(user?.balance || 0) < livePrice * quantity) {
      setShowDeposit(true); return;
    }
    const d = { symbol: selected, quantity, price: livePrice };
    const mutation = orderType === 'buy' ? buyMutation : sellMutation;
    mutation.mutate(d, {
      onSuccess: () => {
        setSuccess(`${orderType === 'buy' ? 'Bought' : 'Sold'} ${quantity} share${quantity > 1 ? 's' : ''} of ${selected}`);
        setTimeout(() => setSuccess(''), 3000);
        setQuantity(1);
      }
    });
  };

  return (
    <div className="bg-card rounded-2xl overflow-hidden flex flex-col"
      style={{ minHeight: 320 }}>
      {/* Header */}
      <div className="px-5 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid hsl(var(--border))' }}>
        <h3 className="flex items-center gap-2 text-foreground"
          style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 14 }}>
          <Zap style={{ width: 14, height: 14, color: 'hsl(var(--primary))' }} />
          Quick Trade
        </h3>
      </div>

      <div className="flex-1 p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search style={{ width: 13, height: 13 }}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search stock…"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(null); setSuccess(''); }}
            className="w-full bg-secondary rounded-xl pl-8 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
          {/* Dropdown */}
          {filtered && filtered.length > 0 && !selected && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card rounded-xl shadow-xl z-20 overflow-hidden"
              style={{ border: '1px solid hsl(var(--border))' }}>
              {filtered.map(s => {
                const live = prices[s.symbol];
                const p = live?.price ?? s.price;
                const pct = live?.changePercent ?? s.changePercent;
                const up = pct >= 0;
                return (
                  <button key={s.symbol}
                    onClick={() => { setSelected(s.symbol); setQuery(s.symbol); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-secondary transition-colors text-left">
                    <StockIcon symbol={s.symbol} size={24} />
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 12, fontWeight: 700, fontFamily: 'Manrope' }}
                        className="text-foreground">
                        {s.symbol.replace('.NS','').replace('.BO','')}
                      </p>
                      <p style={{ fontSize: 10 }} className="text-muted-foreground truncate">{s.company}</p>
                    </div>
                    <div className="text-right">
                      <p style={{ fontSize: 11, fontFamily: 'JetBrains Mono', fontWeight: 600 }}
                        className="text-foreground">₹{p.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                      <p style={{ fontSize: 10, fontWeight: 600, color: up ? 'hsl(var(--market-up))' : 'hsl(var(--market-down))' }}>
                        {up ? '+' : ''}{pct.toFixed(2)}%
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected stock info */}
        {selected && stock && (
          <div className="bg-secondary rounded-xl p-3 flex items-center gap-3">
            <StockIcon symbol={selected} size={32} />
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Manrope' }}
                className="text-foreground">
                {selected.replace('.NS','').replace('.BO','')}
              </p>
              <p style={{ fontSize: 11 }} className="text-muted-foreground truncate">{stock.company}</p>
            </div>
            <div className="text-right">
              <p style={{ fontSize: 14, fontFamily: 'JetBrains Mono', fontWeight: 700 }}
                className="text-foreground">
                {formatCurrency(livePrice)}
              </p>
              <p style={{ fontSize: 11, fontWeight: 600,
                color: isPositive ? 'hsl(var(--market-up))' : 'hsl(var(--market-down))' }}>
                {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
              </p>
            </div>
          </div>
        )}

        {selected && (
          <>
            {/* Buy / Sell toggle */}
            <div className="flex p-1 rounded-xl bg-secondary">
              <button onClick={() => setOrderType('buy')}
                className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: orderType === 'buy' ? 'hsl(var(--market-up))' : 'transparent',
                  color: orderType === 'buy' ? 'white' : 'hsl(var(--muted-foreground))',
                }}>Buy</button>
              <button onClick={() => setOrderType('sell')}
                disabled={!holding || Number(holding.quantity) === 0}
                className="flex-1 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-30"
                style={{
                  background: orderType === 'sell' ? 'hsl(var(--market-down))' : 'transparent',
                  color: orderType === 'sell' ? 'white' : 'hsl(var(--muted-foreground))',
                }}>Sell</button>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-2">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-foreground hover:bg-border transition-colors disabled:opacity-30">
                <Minus style={{ width: 12, height: 12 }} />
              </button>
              <div className="flex-1 text-center bg-secondary rounded-lg py-1.5">
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 700 }}
                  className="text-foreground">{quantity}</span>
              </div>
              <button onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-foreground hover:bg-border transition-colors">
                <Plus style={{ width: 12, height: 12 }} />
              </button>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center px-1">
              <span style={{ fontSize: 11 }} className="text-muted-foreground">Total</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 14, fontWeight: 700 }}
                className="text-foreground">
                {formatCurrency(livePrice * quantity)}
              </span>
            </div>

            {/* Success message */}
            {success && (
              <div className="text-xs font-semibold text-center py-2 rounded-lg"
                style={{ background: 'hsl(var(--market-up-bg))', color: 'hsl(var(--market-up))' }}>
                ✓ {success}
              </div>
            )}

            {/* Execute button */}
            <button onClick={handleTrade}
              disabled={buyMutation.isPending || sellMutation.isPending || !livePrice}
              className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
              style={{
                background: orderType === 'buy' ? 'hsl(var(--market-up))' : 'hsl(var(--market-down))',
                fontSize: 13,
              }}>
              {buyMutation.isPending || sellMutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                : `${orderType === 'buy' ? 'Buy' : 'Sell'} · ${formatCurrency(livePrice * quantity)}`
              }
            </button>
          </>
        )}

        {!selected && !query && (
          <div className="flex-1 flex items-center justify-center py-6">
            <p style={{ fontSize: 12 }} className="text-muted-foreground text-center">
              Search for a stock to trade instantly
            </p>
          </div>
        )}
      </div>

      <AddFundsDialog isOpen={showDeposit} onClose={() => setShowDeposit(false)} currentBalance={user?.balance || 0} />
    </div>
  );
}
