import React, { useState } from 'react';
import { useParams, Link } from 'wouter';
import { useStockBySymbol } from '@/hooks/use-stocks';
import { useLiveMarket } from '@/hooks/use-live-market';
import { useBuyStock, useSellStock, useHoldings } from '@/hooks/use-trading';
import { useQuery } from '@tanstack/react-query';
import { api } from '@shared/routes';
import { formatCurrency, formatNumber, cn } from '@/lib/format';
import { LivePrice } from '@/components/ui/LivePrice';
import { StockChart } from '@/components/ui/StockChart';
import { StockIcon } from '@/components/ui/StockIcon';

const POSITIVE_WORDS = ['surge', 'rally', 'gain', 'rise', 'up', 'high', 'beat', 'profit', 'growth', 'bullish', 'strong', 'buy', 'upgrade', 'record', 'boost'];
const NEGATIVE_WORDS = ['fall', 'drop', 'loss', 'down', 'crash', 'bearish', 'sell', 'downgrade', 'weak', 'decline', 'cut', 'miss', 'risk', 'warn', 'low'];

function getSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lower = text.toLowerCase();
  const pos = POSITIVE_WORDS.filter(w => lower.includes(w)).length;
  const neg = NEGATIVE_WORDS.filter(w => lower.includes(w)).length;
  if (pos > neg) return 'positive';
  if (neg > pos) return 'negative';
  return 'neutral';
}
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, TrendingUp, TrendingDown, Plus, Minus,
  Loader2, ExternalLink, Newspaper, BarChart2, Clock, Wallet,
} from 'lucide-react';

export default function StockDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');

  const { data: stock, isLoading: stockLoading } = useStockBySymbol(symbol || '');
  const { prices } = useLiveMarket();
  const buyMutation = useBuyStock();
  const sellMutation = useSellStock();
  const { data: holdings } = useHoldings();

  const livePrice = prices[symbol?.toUpperCase() || ''];
  const isPositive = (stock?.change ?? 0) >= 0;
  const currentPrice = livePrice?.price ?? stock?.price ?? 0;
  const holding = holdings?.find(h => h.symbol === symbol?.toUpperCase());
  const changePct = livePrice?.changePercent ?? stock?.changePercent ?? 0;
  const priceChange = stock?.change ?? 0;

  const { data: news } = useQuery({
    queryKey: ['news', symbol],
    queryFn: async () => {
      const url = new URL(api.news.bySymbol.path, window.location.origin);
      url.searchParams.set('symbol', symbol || 'AAPL');
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to fetch news');
      return res.json();
    },
    enabled: !!symbol,
    staleTime: 300000,
  });

  const handleTrade = () => {
    if (!symbol || quantity <= 0) return;
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
        {/* Left — Chart + Stats + News */}
        <div className="lg:col-span-2 space-y-4">
          {/* Chart */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-muted-foreground" />
                <span className="font-display font-bold text-sm">Price Chart</span>
              </div>

            </div>
            <StockChart symbol={symbol || 'AAPL'} height={460} />
          </div>

          {/* Stats strip */}
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

          {/* News */}
          {news && news.length > 0 && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-muted-foreground" />
                <span className="font-display font-bold text-sm">Latest News</span>
              </div>
              <div className="divide-y divide-border">
                {news.slice(0, 5).map((article: any, i: number) => (
                  <a key={i} href={article.url} target="_blank" rel="noopener noreferrer"
                    className="flex gap-3 p-4 hover:bg-secondary/30 transition-colors group">
                    {article.image && (
                      <img src={article.image} alt=""
                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0 bg-secondary"
                        onError={e => (e.currentTarget.style.display = 'none')} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {article.headline}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-muted-foreground">{article.source}</span>
                        <span className="text-[11px] text-muted-foreground">·</span>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(article.datetime * 1000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </span>
                        {(() => {
                          const s = getSentiment(article.headline);
                          return s !== 'neutral' ? (
                            <span className={cn(
                              "ml-auto text-[10px] font-bold px-2 py-0.5 rounded-md",
                              s === 'positive'
                                ? "bg-[hsl(var(--market-up-bg))] text-[hsl(var(--market-up))]"
                                : "bg-[hsl(var(--market-down-bg))] text-[hsl(var(--market-down))]"
                            )}>
                              {s === 'positive' ? '▲ Bullish' : '▼ Bearish'}
                            </span>
                          ) : <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />;
                        })()}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — Trade Panel */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-2xl p-5 sticky top-20 space-y-5">
            {/* Price display */}
            <div className="pb-4 border-b border-border">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Market Price</p>
              <p className="text-3xl font-display font-bold font-mono">{formatCurrency(currentPrice)}</p>
              <p className={cn("text-xs font-mono mt-0.5", isPositive ? "text-[hsl(var(--market-up))]" : "text-[hsl(var(--market-down))]")}>
                {isPositive ? '+' : ''}{formatCurrency(Math.abs(priceChange))} ({isPositive ? '+' : ''}{changePct.toFixed(2)}%) today
              </p>
            </div>

            {/* Buy / Sell */}
            <div className="flex p-1 bg-secondary rounded-xl">
              <button onClick={() => setOrderType('buy')}
                className={cn("flex-1 py-2.5 rounded-lg text-sm font-bold transition-all",
                  orderType === 'buy' ? "bg-[hsl(var(--market-up))] text-black shadow-md" : "text-muted-foreground hover:text-foreground")}
              >Buy</button>
              <button onClick={() => setOrderType('sell')}
                disabled={!holding || Number(holding.quantity) === 0}
                className={cn("flex-1 py-2.5 rounded-lg text-sm font-bold transition-all",
                  orderType === 'sell' ? "bg-[hsl(var(--market-down))] text-white shadow-md" : "text-muted-foreground hover:text-foreground disabled:opacity-30")}
              >Sell</button>
            </div>

            {/* Quantity */}
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

            {/* Order summary */}
            <div className="bg-secondary rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Price per share</span>
                <span className="font-mono font-semibold text-foreground">{formatCurrency(currentPrice)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Quantity</span>
                <span className="font-mono font-semibold text-foreground">{quantity}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="text-sm font-bold">Total</span>
                <span className="font-mono font-bold text-lg">{formatCurrency(currentPrice * quantity)}</span>
              </div>
            </div>

            {/* Submit */}
            <button onClick={handleTrade}
              disabled={buyMutation.isPending || sellMutation.isPending}
              className={cn(
                "w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50",
                orderType === 'buy' ? "bg-[hsl(var(--market-up))] text-black" : "bg-[hsl(var(--market-down))] text-white"
              )}>
              {buyMutation.isPending || sellMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                `${orderType === 'buy' ? 'Buy' : 'Sell'} ${quantity} share${quantity > 1 ? 's' : ''} · ${formatCurrency(currentPrice * quantity)}`
              )}
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
        </div>
      </div>
    </div>
  );
}
