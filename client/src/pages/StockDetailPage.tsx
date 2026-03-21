import React, { useState } from 'react';
import { useParams, Link } from 'wouter';
import { useStockBySymbol } from '@/hooks/use-stocks';
import { useLiveMarket } from '@/hooks/use-live-market';
import { useBuyStock, useSellStock, useHoldings } from '@/hooks/use-trading';
import { formatCurrency, formatNumber, cn } from '@/lib/format';
import { LivePrice } from '@/components/ui/LivePrice';
import { StockChart } from '@/components/ui/StockChart';
import { StockIcon } from '@/components/ui/StockIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AddFundsDialog } from '@/components/user/AddFundsDialog';
import { useAuth } from '@/hooks/use-auth';
import {
  ArrowLeft, TrendingUp, TrendingDown, Plus, Minus,
  Loader2, BarChart2, Clock, Wallet, RefreshCw,
} from 'lucide-react';

export default function StockDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [showDeposit, setShowDeposit] = useState(false);

  const { data: stock, isLoading: stockLoading } = useStockBySymbol(symbol || '');
  const { prices } = useLiveMarket();
  const buyMutation = useBuyStock();
  const sellMutation = useSellStock();
  const { data: holdings } = useHoldings();
  const { user } = useAuth();

  const livePrice = prices[symbol?.toUpperCase() || ''];
  const isPositive = (stock?.change ?? 0) >= 0;
  const currentPrice = livePrice?.price ?? stock?.price ?? 0;
  const holding = holdings?.find(h => h.symbol === symbol?.toUpperCase());
  const changePct = livePrice?.changePercent ?? stock?.changePercent ?? 0;
  const priceChange = stock?.change ?? 0;

  const handleTrade = () => {
    if (!symbol || quantity <= 0) return;
    if (orderType === 'buy' && Number(user?.balance || 0) < currentPrice * quantity) {
      setShowDeposit(true);
      return;
    }
    const tradeData = { symbol: symbol.toUpperCase(), quantity, price: currentPrice };
    if (orderType === 'buy') buyMutation.mutate(tradeData);
    else sellMutation.mutate(tradeData);
  };

  if (stockLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Stock not found</p>
          <Link href="/explore">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Explore
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/explore">
          <button className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <StockIcon symbol={stock.symbol} size={40} />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display font-bold text-2xl">{stock.symbol}</h1>
            <span className={cn(
              "flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg",
              isPositive ? "bg-[hsl(var(--market-up-bg))] text-[hsl(var(--market-up))]" : "bg-[hsl(var(--market-down-bg))] text-[hsl(var(--market-down))]"
            )}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isPositive ? '+' : ''}{changePct.toFixed(2)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{stock.company}</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-2xl font-display font-bold font-mono">{formatCurrency(currentPrice)}</p>
          <p className={cn("text-xs font-mono font-semibold", isPositive ? "text-[hsl(var(--market-up))]" : "text-[hsl(var(--market-down))]")}>
            {isPositive ? '+' : ''}{formatCurrency(Math.abs(priceChange))} today
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Left — Chart + Stats */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border-0 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-muted-foreground" />
              <span className="font-display font-bold text-sm">Price Chart</span>
            </div>
            <StockChart symbol={symbol || 'AAPL'} height={420} rangePosition="bottom" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden">
            {[
              { label: 'Current Price', value: <LivePrice symbol={stock.symbol} initialPrice={stock.price} initialChangePercent={stock.changePercent} showChange={false} className="text-base font-bold font-mono" /> },
              { label: 'Day Change', value: <span className={cn("text-base font-bold font-mono", isPositive ? "text-[hsl(var(--market-up))]" : "text-[hsl(var(--market-down))]")}>{isPositive ? '+' : ''}{formatCurrency(Math.abs(stock.change))}</span> },
              { label: 'Volume', value: <span className="text-base font-bold font-mono">{formatNumber(stock.volume)}</span> },
              { label: 'Holdings', value: <span className="text-base font-bold font-mono">{holding ? `${holding.quantity} shares` : '—'}</span> },
            ].map(({ label, value }) => (
              <div key={label} className="bg-card px-5 py-4">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</p>
                {value}
              </div>
            ))}
          </div>
        </div>

        {/* Right — Trade Panel */}
        <div className="lg:col-span-1">
          <div className="bg-card border-0 rounded-2xl p-5 sticky top-20 space-y-5">
            <div className="pb-4 border-b">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Market Price</p>
              <p className="text-3xl font-display font-bold font-mono">{formatCurrency(currentPrice)}</p>
              <p className={cn("text-xs font-mono mt-0.5", isPositive ? "text-[hsl(var(--market-up))]" : "text-[hsl(var(--market-down))]")}>
                {isPositive ? '+' : ''}{formatCurrency(Math.abs(priceChange))} ({isPositive ? '+' : ''}{changePct.toFixed(2)}%) today
              </p>
            </div>

            <div className="flex p-1 bg-secondary rounded-xl">
              <button onClick={() => setOrderType('buy')}
                className={cn("flex-1 py-2.5 rounded-lg text-sm font-bold transition-all",
                  orderType === 'buy' ? "bg-[hsl(var(--market-up))] text-black shadow-md" : "text-muted-foreground hover:text-foreground")}>
                Buy
              </button>
              <button onClick={() => setOrderType('sell')}
                disabled={!holding || Number(holding.quantity) === 0}
                className={cn("flex-1 py-2.5 rounded-lg text-sm font-bold transition-all",
                  orderType === 'sell' ? "bg-[hsl(var(--market-down))] text-white shadow-md" : "text-muted-foreground hover:text-foreground disabled:opacity-30")}>
                Sell
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quantity</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}
                  className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-border transition-colors disabled:opacity-30">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <Input type="number" min="1" value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="text-center font-mono font-bold bg-secondary border-0 h-9" />
                <button onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-border transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-secondary rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Price per share</span>
                <span className="font-mono font-semibold text-foreground">{formatCurrency(currentPrice)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Quantity</span>
                <span className="font-mono font-semibold text-foreground">{quantity}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-sm font-bold">Total</span>
                <span className="font-mono font-bold text-lg">{formatCurrency(currentPrice * quantity)}</span>
              </div>
            </div>

            <button onClick={handleTrade}
              disabled={buyMutation.isPending || sellMutation.isPending}
              className={cn(
                "w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50",
                orderType === 'buy' ? "bg-[hsl(var(--market-up))] text-black" : "bg-[hsl(var(--market-down))] text-white"
              )}>
              {buyMutation.isPending || sellMutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                : `${orderType === 'buy' ? 'Buy' : 'Sell'} ${quantity} share${quantity > 1 ? 's' : ''} · ${formatCurrency(currentPrice * quantity)}`
              }
            </button>

            {holding && (
              <div className="flex items-center justify-between text-xs bg-secondary rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>You own</span>
                </div>
                <span className="font-mono font-bold">{holding.quantity} shares</span>
              </div>
            )}

            {orderType === 'sell' && (!holding || Number(holding.quantity) === 0) && (
              <p className="text-xs text-muted-foreground text-center">You don't own any {stock.symbol} shares</p>
            )}
          </div>
        {/* SIP Banner */}
          <div className="bg-secondary/50 rounded-2xl px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-4 h-4 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold">Create Stock SIP</p>
                <p className="text-xs text-muted-foreground">Automate your {stock.symbol} investments</p>
              </div>
            </div>
            <button onClick={() => alert('Coming soon!')}
              className="text-xs font-semibold text-primary hover:underline">
              Set up →
            </button>
          </div>
        </div>
      </div>

      <AddFundsDialog
        isOpen={showDeposit}
        onClose={() => setShowDeposit(false)}
        currentBalance={user?.balance || 0}
      />
    </div>
  );
}
