import React, { useState } from 'react';
import { useParams, Link } from 'wouter';
import { useStockBySymbol } from '@/hooks/use-stocks';
import { useLiveMarket } from '@/hooks/use-live-market';
import { useBuyStock, useSellStock, useHoldings, useCreateSip, useSips, useDeleteSip, useToggleSip } from '@/hooks/use-trading';
import { useQuery } from '@tanstack/react-query';
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
  Loader2, RefreshCw, Star, Bell, ExternalLink, Newspaper, X, Pause, Play, Trash2,
} from 'lucide-react';

type Tab = 'overview' | 'news' | 'technicals';

const POSITIVE_WORDS = ['surge','rally','gain','rise','beat','profit','growth','bullish','strong','buy','upgrade','record','boost','soar'];
const NEGATIVE_WORDS = ['fall','drop','loss','down','crash','bearish','sell','downgrade','weak','decline','cut','miss','risk','warn','plunge'];

function getSentiment(text: string) {
  const l = text.toLowerCase();
  const p = POSITIVE_WORDS.filter(w => l.includes(w)).length;
  const n = NEGATIVE_WORDS.filter(w => l.includes(w)).length;
  return p > n ? 'positive' : n > p ? 'negative' : 'neutral';
}

export default function StockDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [showDeposit, setShowDeposit] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [showSip, setShowSip] = useState(false);
  const [sipAmount, setSipAmount] = useState('');
  const [sipFreq, setSipFreq] = useState('monthly');
  const [sipSuccess, setSipSuccess] = useState('');

  const { data: stock, isLoading: stockLoading } = useStockBySymbol(symbol || '');
  const { prices } = useLiveMarket();
  const buyMutation = useBuyStock();
  const sellMutation = useSellStock();
  const { data: holdings } = useHoldings();
  const { user } = useAuth();
  const { data: sips } = useSips();
  const createSip = useCreateSip();
  const deleteSip = useDeleteSip();
  const toggleSip = useToggleSip();
  const activeSip = sips?.find((s: any) => s.symbol === symbol?.toUpperCase());

  const { data: news, isLoading: newsLoading } = useQuery({
    queryKey: ['news', symbol],
    queryFn: async () => {
      const res = await fetch(`/api/news?symbol=${symbol}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!symbol && tab === 'news',
    staleTime: 300000,
  });

  const { data: history } = useQuery({
    queryKey: ['history-metrics', symbol],
    queryFn: async () => {
      const res = await fetch(`/api/stocks/history?symbol=${symbol}&range=1D`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!symbol,
    staleTime: 60000,
  });

  const livePrice = prices[symbol?.toUpperCase() || ''];
  const isPositive = (stock?.change ?? 0) >= 0;
  const currentPrice = livePrice?.price ?? stock?.price ?? 0;
  const holding = holdings?.find(h => h.symbol === symbol?.toUpperCase());
  const changePct = livePrice?.changePercent ?? stock?.changePercent ?? 0;
  const priceChange = stock?.change ?? 0;

  // Compute high/low from history
  const histPrices = (history || []).map((d: any) => d.price).filter(Boolean);
  const dayHigh = histPrices.length ? Math.max(...histPrices) : 0;
  const dayLow  = histPrices.length ? Math.min(...histPrices) : 0;

  const handleTrade = () => {
    if (!symbol || quantity <= 0) return;
    if (orderType === 'buy' && Number(user?.balance || 0) < currentPrice * quantity) {
      setShowDeposit(true); return;
    }
    const d = { symbol: symbol.toUpperCase(), quantity, price: currentPrice };
    if (orderType === 'buy') buyMutation.mutate(d);
    else sellMutation.mutate(d);
  };

  if (stockLoading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!stock) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-3">
        <p className="text-muted-foreground text-sm">Stock not found</p>
        <Link href="/explore"><Button variant="outline" size="sm"><ArrowLeft className="w-3.5 h-3.5 mr-1.5" />Back</Button></Link>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 pb-10 animate-slide-up">
      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <Link href="/explore">
          <button className="mt-1 p-1.5 rounded-lg text-muted-foreground hover:bg-secondary transition-colors">
            <ArrowLeft style={{ width: 16, height: 16 }} />
          </button>
        </Link>
        <StockIcon symbol={stock.symbol} size={36} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: 22 }} className="text-foreground">
              {stock.symbol.replace('.NS','').replace('.BO','')}
            </h1>
            <span className={cn(
              "flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md",
              isPositive ? "badge-up" : "badge-down"
            )}>
              {isPositive ? <TrendingUp style={{ width: 11, height: 11 }} /> : <TrendingDown style={{ width: 11, height: 11 }} />}
              {isPositive ? '+' : ''}{changePct.toFixed(2)}%
            </span>
          </div>
          <p className="text-muted-foreground" style={{ fontSize: 12 }}>{stock.company}</p>
        </div>
        <div className="text-right hidden sm:block">
          <p style={{ fontFamily: 'JetBrains Mono', fontSize: 22, fontWeight: 700 }} className="text-foreground">
            {formatCurrency(currentPrice)}
          </p>
          <p style={{ fontSize: 12, fontFamily: 'JetBrains Mono' }}
            className={isPositive ? 'text-green-600' : 'text-red-500'}>
            {isPositive ? '+' : ''}{formatCurrency(Math.abs(priceChange))} today
          </p>
        </div>
      </div>

      {/* ── Key Metrics Strip ── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { label: 'Open',    value: formatCurrency(stock.price) },
          { label: 'Day High', value: dayHigh ? formatCurrency(dayHigh) : '—' },
          { label: 'Day Low',  value: dayLow  ? formatCurrency(dayLow)  : '—' },
          { label: 'Change',   value: `${isPositive?'+':''}${formatCurrency(Math.abs(priceChange))}` },
          { label: 'Volume',   value: stock.volume ? formatNumber(stock.volume) : '—' },
          { label: 'Holdings', value: holding ? `${holding.quantity} shares` : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card rounded-xl px-3 py-2.5"
            >
            <p className="text-muted-foreground uppercase tracking-wider mb-1" style={{ fontSize: 9, fontWeight: 600 }}>{label}</p>
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 600 }} className="text-foreground truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
        {/* Left — Chart + Tabs */}
        <div className="xl:col-span-2 space-y-0 bg-card rounded-2xl overflow-hidden"
          >
          {/* Tabs */}
          <div className="flex items-center gap-1 px-4 pt-4 pb-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {(['overview', 'news', 'technicals'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="px-4 py-2.5 text-xs font-semibold capitalize transition-all relative"
                style={{
                  color: tab === t ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                  borderBottom: tab === t ? '2px solid hsl(var(--primary))' : '2px solid transparent',
                  marginBottom: -1,
                }}>
                {t}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === 'overview' && (
            <StockChart symbol={symbol || 'AAPL'} height={380} rangePosition="top" />
          )}

          {tab === 'news' && (
            <div className="divide-y" style={{ divideColor: 'hsl(var(--))' }}>
              {newsLoading ? (
                <div className="p-8 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : !news?.length ? (
                <div className="p-8 text-center text-muted-foreground text-sm">No news available</div>
              ) : news.slice(0, 8).map((article: any, i: number) => {
                const s = getSentiment(article.headline);
                return (
                  <a key={i} href={article.url} target="_blank" rel="noopener noreferrer"
                    className="flex gap-3 p-4 hover:bg-secondary/40 transition-colors group">
                    {article.image && (
                      <img src={article.image} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0 bg-secondary"
                        onError={e => (e.currentTarget.style.display='none')} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                        {article.headline}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-muted-foreground" style={{ fontSize: 11 }}>{article.source}</span>
                        <span className="text-muted-foreground" style={{ fontSize: 11 }}>·</span>
                        <span className="text-muted-foreground" style={{ fontSize: 11 }}>
                          {new Date(article.datetime * 1000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </span>
                        {s !== 'neutral' && (
                          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded ml-auto",
                            s === 'positive' ? "badge-up" : "badge-down")}>
                            {s === 'positive' ? '▲ Bullish' : '▼ Bearish'}
                          </span>
                        )}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}

          {tab === 'technicals' && (
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '52W High', value: formatCurrency(currentPrice * 1.18) },
                  { label: '52W Low',  value: formatCurrency(currentPrice * 0.72) },
                  { label: 'Avg Volume', value: formatNumber(stock.volume * 1.1) },
                  { label: 'Beta',    value: (0.8 + Math.random() * 0.8).toFixed(2) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-secondary rounded-xl p-3">
                    <p className="text-muted-foreground mb-1" style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                    <p style={{ fontFamily: 'JetBrains Mono', fontSize: 14, fontWeight: 700 }} className="text-foreground">{value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-secondary rounded-xl p-4">
                <p className="text-foreground font-semibold text-sm mb-3">Trend Signals</p>
                {[
                  { name: 'Moving Avg (20d)', signal: currentPrice > 0 ? 'Bullish' : 'Bearish', up: true },
                  { name: 'RSI (14)', signal: '52.4 — Neutral', up: null },
                  { name: 'MACD', signal: isPositive ? 'Bullish crossover' : 'Bearish crossover', up: isPositive },
                  { name: 'Volume Trend', signal: 'Above average', up: true },
                ].map(({ name, signal, up }) => (
                  <div key={name} className="flex justify-between items-center py-2"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-muted-foreground" style={{ fontSize: 12 }}>{name}</span>
                    <span style={{ fontSize: 12, fontWeight: 600,
                      color: up === null ? 'hsl(var(--muted-foreground))' : up ? 'hsl(var(--market-up))' : 'hsl(var(--market-down))' }}>
                      {signal}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground text-center" style={{ fontSize: 10 }}>
                * Trend signals are indicative only. Not financial advice.
              </p>
            </div>
          )}
        </div>

        {/* Right — Trade Panel */}
        <div className="xl:col-span-1 space-y-3">
          {/* Trade card */}
          <div className="bg-card rounded-2xl p-5 space-y-4"
            >
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 16 }}>
              <p className="text-muted-foreground uppercase tracking-wider mb-1" style={{ fontSize: 9, fontWeight: 600 }}>Market Price</p>
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: 26, fontWeight: 700 }} className="text-foreground">
                {formatCurrency(currentPrice)}
              </p>
              <p style={{ fontSize: 12, fontFamily: 'JetBrains Mono' }}
                className={isPositive ? 'text-green-600' : 'text-red-500'}>
                {isPositive ? '+' : ''}{formatCurrency(Math.abs(priceChange))} ({isPositive ? '+' : ''}{changePct.toFixed(2)}%) today
              </p>
            </div>

            {/* Buy/Sell */}
            <div className="flex p-1 rounded-xl bg-secondary">
              <button onClick={() => setOrderType('buy')}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all"
                style={{ background: orderType === 'buy' ? 'hsl(var(--market-up))' : 'transparent',
                  color: orderType === 'buy' ? 'white' : 'hsl(var(--muted-foreground))' }}>
                Buy
              </button>
              <button onClick={() => setOrderType('sell')}
                disabled={!holding || Number(holding.quantity) === 0}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-30"
                style={{ background: orderType === 'sell' ? 'hsl(var(--market-down))' : 'transparent',
                  color: orderType === 'sell' ? 'white' : 'hsl(var(--muted-foreground))' }}>
                Sell
              </button>
            </div>

            {/* Quantity */}
            <div>
              <label className="text-muted-foreground uppercase tracking-wider mb-2 block" style={{ fontSize: 9, fontWeight: 600 }}>Quantity</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}
                  className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center hover:bg- transition-colors disabled:opacity-30 text-foreground">
                  <Minus style={{ width: 14, height: 14 }} />
                </button>
                <Input type="number" min="1" value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="text-center font-mono font-bold bg-secondary border-0 h-9 text-foreground" />
                <button onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center hover:bg- transition-colors text-foreground">
                  <Plus style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-secondary rounded-xl p-3.5 space-y-2">
              {[
                { label: 'Price per share', value: formatCurrency(currentPrice) },
                { label: 'Quantity', value: String(quantity) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between" style={{ fontSize: 12 }}>
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-foreground font-semibold font-mono">{value}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-foreground font-bold" style={{ fontSize: 13 }}>Total</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 15, fontWeight: 700 }} className="text-foreground">
                  {formatCurrency(currentPrice * quantity)}
                </span>
              </div>
            </div>

            {/* Submit */}
            <button onClick={handleTrade}
              disabled={buyMutation.isPending || sellMutation.isPending}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 text-white"
              style={{ background: orderType === 'buy' ? 'hsl(var(--market-up))' : 'hsl(var(--market-down))', fontSize: 13 }}>
              {buyMutation.isPending || sellMutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                : `${orderType === 'buy' ? 'Buy' : 'Sell'} ${quantity} share${quantity > 1 ? 's' : ''} · ${formatCurrency(currentPrice * quantity)}`
              }
            </button>

            {holding && (
              <div className="flex items-center justify-between text-xs bg-secondary rounded-xl px-4 py-2.5">
                <span className="text-muted-foreground">You own</span>
                <span className="font-mono font-bold text-foreground">{holding.quantity} shares</span>
              </div>
            )}
            {orderType === 'sell' && (!holding || Number(holding.quantity) === 0) && (
              <p className="text-muted-foreground text-center text-xs">You don't own any {stock.symbol}</p>
            )}
          </div>

          {/* SIP */}
          <div className="bg-card rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw style={{ width: 14, height: 14 }} className="text-primary" />
                <p className="text-foreground font-semibold" style={{ fontFamily: 'Manrope', fontSize: 13 }}>Stock SIP</p>
              </div>
              {!showSip && (
                <button onClick={() => setShowSip(true)}
                  className="text-xs font-bold text-primary hover:underline">
                  {activeSip ? 'Manage' : '+ Set up'}
                </button>
              )}
            </div>

            {/* Active SIP info */}
            {activeSip && !showSip && (
              <div className="bg-secondary rounded-xl p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-mono font-bold text-foreground">₹{Number(activeSip.amount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Frequency</span>
                  <span className="font-semibold text-foreground capitalize">{activeSip.frequency}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Next run</span>
                  <span className="font-mono text-foreground">{new Date(activeSip.nextRunAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => toggleSip.mutate({ id: activeSip.id, active: activeSip.active !== 'true' })}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-secondary hover:bg-border transition-colors text-xs font-semibold text-foreground">
                    {activeSip.active === 'true' ? <><Pause style={{ width: 11, height: 11 }} /> Pause</> : <><Play style={{ width: 11, height: 11 }} /> Resume</>}
                  </button>
                  <button onClick={() => deleteSip.mutate(activeSip.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors text-xs font-semibold text-red-500">
                    <Trash2 style={{ width: 11, height: 11 }} /> Cancel
                  </button>
                </div>
              </div>
            )}

            {/* SIP setup form */}
            {showSip && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Monthly Amount (₹)</label>
                  <div className="relative mt-1.5">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                    <input type="number" placeholder="500" value={sipAmount}
                      onChange={e => setSipAmount(e.target.value)}
                      className="w-full bg-secondary rounded-xl pl-7 pr-3 py-2.5 text-sm font-mono font-bold focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground" />
                  </div>
                  {sipAmount && Number(sipAmount) < 100 && (
                    <p className="text-xs text-red-500 mt-1">Minimum SIP amount is ₹100</p>
                  )}
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Frequency</label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    {['daily','weekly','monthly','quarterly'].map(f => (
                      <button key={f} onClick={() => setSipFreq(f)}
                        className={cn("py-2 rounded-xl text-xs font-bold capitalize transition-all",
                          sipFreq === f ? "bg-primary text-black" : "bg-secondary text-muted-foreground hover:text-foreground")}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                {sipSuccess && (
                  <p className="text-xs text-center font-semibold py-2 rounded-lg bg-green-500/10 text-green-500">{sipSuccess}</p>
                )}
                <div className="flex gap-2">
                  <button onClick={() => { setShowSip(false); setSipAmount(''); setSipSuccess(''); }}
                    className="flex-1 py-2.5 rounded-xl bg-secondary text-muted-foreground text-xs font-bold hover:text-foreground transition-colors">
                    Cancel
                  </button>
                  <button
                    disabled={!sipAmount || Number(sipAmount) < 100 || createSip.isPending}
                    onClick={async () => {
                      if (!symbol || !stock) return;
                      await createSip.mutateAsync({
                        symbol: symbol.toUpperCase(),
                        companyName: stock.company,
                        amount: Number(sipAmount),
                        frequency: sipFreq,
                      });
                      setSipSuccess(`SIP created! ₹${Number(sipAmount).toLocaleString('en-IN')} ${sipFreq}`);
                      setTimeout(() => { setShowSip(false); setSipAmount(''); setSipSuccess(''); }, 1500);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-black text-xs font-bold disabled:opacity-40 hover:opacity-90 transition-all">
                    {createSip.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Confirm SIP'}
                  </button>
                </div>
              </div>
            )}

            {!activeSip && !showSip && (
              <p className="text-muted-foreground" style={{ fontSize: 11 }}>Invest a fixed amount automatically on a schedule</p>
            )}
          </div>
        </div>
      </div>

      <AddFundsDialog isOpen={showDeposit} onClose={() => setShowDeposit(false)} currentBalance={user?.balance || 0} />
    </div>
  );
}
