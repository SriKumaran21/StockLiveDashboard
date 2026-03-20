import React, { useState } from 'react';
import { useParams, Link } from 'wouter';
import { useStockHistory, useStockBySymbol } from '@/hooks/use-stocks';
import { useQuery } from '@tanstack/react-query';
import { api } from '@shared/routes';
import { useLiveMarket } from '@/hooks/use-live-market';
import { useBuyStock, useSellStock, useHoldings } from '@/hooks/use-trading';
import { formatCurrency, formatNumber, cn } from '@/lib/format';
import { LivePrice } from '@/components/ui/LivePrice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, TrendingUp, TrendingDown, Plus, Minus, Loader2, ExternalLink, Newspaper,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

const RANGES = ['1D', '1W', '1M', '3M', '1Y', '5Y'] as const;
type Range = typeof RANGES[number];

export default function StockDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [range, setRange] = useState<Range>('1M');

  const { data: stock, isLoading: stockLoading } = useStockBySymbol(symbol || '');
  const { data: history, isLoading: historyLoading } = useStockHistory(symbol || '', range);
  const { prices } = useLiveMarket();
  const buyMutation = useBuyStock();
  const sellMutation = useSellStock();
  const { data: holdings } = useHoldings();

  const livePrice = prices[symbol?.toUpperCase() || ''];

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
  const currentPrice = livePrice?.price ?? stock?.price ?? 0;
  const holding = holdings?.find(h => h.symbol === symbol?.toUpperCase());

  const chartData = (history || []).map(d => ({
    timestamp: d.timestamp,
    price: d.price,
    formattedTime: range === '1D'
      ? format(new Date(d.timestamp), 'HH:mm')
      : range === '1W'
      ? format(new Date(d.timestamp), 'EEE dd')
      : range === '5Y'
      ? format(new Date(d.timestamp), 'MMM yy')
      : format(new Date(d.timestamp), 'dd MMM'),
  }));

  const isPositive = chartData.length > 1
    ? chartData[chartData.length - 1].price >= chartData[0].price
    : (stock?.change ?? 0) >= 0;

  const strokeColor = isPositive ? 'hsl(var(--market-up))' : 'hsl(var(--market-down))';
  const fillId = isPositive ? 'gradUp' : 'gradDown';

  const handleTrade = () => {
    if (!symbol || quantity <= 0) return;
    const tradeData = { symbol: symbol.toUpperCase(), quantity, price: currentPrice };
    if (orderType === 'buy') buyMutation.mutate(tradeData);
    else sellMutation.mutate(tradeData);
  };

  if (stockLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
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

  const changePct = livePrice?.changePercent ?? stock.changePercent ?? 0;
  const priceChange = stock.change ?? 0;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/explore">
          <button className="p-2 rounded-xl hover:bg-muted/40 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-display font-bold">{stock.symbol}</h1>
            <span className={cn(
              "flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full",
              isPositive ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
            )}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isPositive ? '+' : ''}{changePct.toFixed(2)}%
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">{stock.company}</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-2xl font-mono font-bold">{formatCurrency(currentPrice)}</p>
          <p className={cn("text-sm font-semibold", isPositive ? "text-green-500" : "text-red-500")}>
            {isPositive ? '+' : ''}{formatCurrency(Math.abs(priceChange))} today
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card-fintech flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Price History</h2>
              <div className="flex bg-secondary/80 p-1 rounded-xl shadow-sm">
                {RANGES.map(r => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200",
                      range === r
                        ? "bg-gradient-to-r from-primary to-primary/80 text-foreground shadow-glow"
                        : "text-muted hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full relative" style={{ height: '320px' }}>
              {historyLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm z-10 rounded-xl">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}
              {!historyLoading && chartData.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  No historical data available for this range
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradUp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(var(--market-up))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--market-up))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradDown" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(var(--market-down))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--market-down))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis
                    dataKey="formattedTime"
                    axisLine={false} tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    dy={10} minTickGap={40}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    axisLine={false} tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    dx={-10}
                    tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v.toFixed(0)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '0.75rem',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                      fontFamily: 'JetBrains Mono',
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Price']}
                    itemStyle={{ color: strokeColor, fontWeight: 700 }}
                    labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                  />
                  <Area
                    type="monotone" dataKey="price"
                    stroke={strokeColor} strokeWidth={2.5}
                    fill={`url(#${fillId})`}
                    activeDot={{ r: 5, strokeWidth: 0, fill: strokeColor }}
                    animationDuration={800}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden">
            {[
              { label: 'Current Price', value: <LivePrice symbol={stock.symbol} initialPrice={stock.price} initialChangePercent={stock.changePercent} showChange={false} className="text-lg font-bold font-mono" /> },
              { label: 'Day Change', value: <span className={cn("text-lg font-bold font-mono", isPositive ? "text-[hsl(var(--market-up))]" : "text-[hsl(var(--market-down))]")}>{isPositive ? '+' : ''}{formatCurrency(Math.abs(stock.change))}</span> },
              { label: 'Volume', value: <span className="text-lg font-bold font-mono">{formatNumber(stock.volume)}</span> },
              { label: 'Holdings', value: <span className="text-lg font-bold font-mono">{holding ? `${holding.quantity} shares` : '—'}</span> },
            ].map(({ label, value }) => (
              <div key={label} className="bg-card px-5 py-4">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
                <div>{value}</div>
              </div>
            ))}
          </div>
        {/* News Feed */}
          {news && news.length > 0 && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-display font-bold text-sm">Latest News</h3>
              </div>
              <div className="divide-y divide-border">
                {news.slice(0, 6).map((article: any, i: number) => (
                  <a key={i} href={article.url} target="_blank" rel="noopener noreferrer"
                    className="flex gap-4 p-4 hover:bg-secondary/40 transition-colors group">
                    {article.image && (
                      <img src={article.image} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-secondary" onError={e => (e.currentTarget.style.display='none')} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {article.headline}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] font-medium text-muted-foreground">{article.source}</span>
                        <span className="text-[11px] text-muted-foreground">·</span>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(article.datetime * 1000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </span>
                        <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Trading Panel */}
        <div className="lg:col-span-1">
          <div className="card-fintech sticky top-8 space-y-5">
            <h3 className="text-lg font-bold">Trade {stock.symbol}</h3>
            <div className="flex p-1 bg-secondary rounded-xl">
              <button
                onClick={() => setOrderType('buy')}
                className={cn("flex-1 py-2.5 rounded-lg text-sm font-bold transition-all",
                  orderType === 'buy' ? "bg-green-600 text-white shadow-md" : "text-muted-foreground hover:text-foreground")}
              >Buy</button>
              <button
                onClick={() => setOrderType('sell')}
                disabled={!holding || Number(holding.quantity) === 0}
                className={cn("flex-1 py-2.5 rounded-lg text-sm font-bold transition-all",
                  orderType === 'sell' ? "bg-red-600 text-white shadow-md" : "text-muted-foreground hover:text-foreground disabled:opacity-40")}
              >Sell</button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Quantity</label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>
                  <Minus className="w-4 h-4" />
                </Button>
                <Input type="number" min="1" value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="text-center font-mono font-bold" />
                <Button variant="outline" size="sm" onClick={() => setQuantity(quantity + 1)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="bg-muted/40 rounded-xl p-4 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price per share</span>
                <span className="font-mono font-semibold">{formatCurrency(currentPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Quantity</span>
                <span className="font-mono font-semibold">{quantity}</span>
              </div>
              <div className="border-t border-border/50 pt-2.5 flex justify-between">
                <span className="font-bold">Total</span>
                <span className="font-mono font-bold text-lg">{formatCurrency(currentPrice * quantity)}</span>
              </div>
            </div>

            <button
              onClick={handleTrade}
              disabled={buyMutation.isPending || sellMutation.isPending}
              className={cn(
                "w-full py-3.5 rounded-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50",
                orderType === 'buy' ? "bg-green-600 hover:bg-green-500" : "bg-red-600 hover:bg-red-500"
              )}
            >
              {buyMutation.isPending || sellMutation.isPending ? 'Processing…'
                : `${orderType === 'buy' ? 'Buy' : 'Sell'} ${quantity} share${quantity > 1 ? 's' : ''} · ${formatCurrency(currentPrice * quantity)}`}
            </button>

            {orderType === 'sell' && (!holding || Number(holding.quantity) === 0) && (
              <p className="text-xs text-muted-foreground text-center">You don't own any {stock.symbol} shares</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
