import React from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { usePortfolio, useHoldings } from '@/hooks/use-trading';
import { useLiveMarket } from '@/hooks/use-live-market';
import { formatCurrency, cn } from '@/lib/format';
import { WatchlistWidget } from '@/components/dashboard/WatchlistWidget';
import { LivePrice } from '@/components/ui/LivePrice';
import { TrendingUp, TrendingDown, ArrowRight, Wallet, BarChart2 } from 'lucide-react';

export function PortfolioPage() {
  const { user } = useAuth();
  const { data: portfolio } = usePortfolio();
  const { data: holdings } = useHoldings();
  const { prices } = useLiveMarket();
  const hasHoldings = holdings && holdings.length > 0;
  const returnsPositive = (portfolio?.returnsPercent || 0) >= 0;

  return (
    <div className="space-y-6 pb-12 animate-slide-up">
      {/* Top stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Balance */}
        <div className="sm:col-span-1 bg-card border border-border rounded-2xl p-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5" /> Available Balance
          </p>
          <p className="text-3xl font-display font-bold font-mono tracking-tight text-foreground">
            {formatCurrency(Number(user?.balance || 0))}
          </p>
          <button onClick={() => {}} className="mt-4 text-xs font-semibold text-primary hover:underline">
            Add funds →
          </button>
        </div>

        {/* Invested */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Invested</p>
          <p className="text-3xl font-display font-bold font-mono tracking-tight">
            {formatCurrency(portfolio?.totalCost || 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{hasHoldings ? `${holdings.length} position${holdings.length > 1 ? 's' : ''}` : 'No positions'}</p>
        </div>

        {/* Returns */}
        <div className={cn(
          "rounded-2xl p-6 border",
          returnsPositive ? "bg-[hsl(var(--market-up-bg))] border-[hsl(var(--market-up)/0.2)]" : "bg-[hsl(var(--market-down-bg))] border-[hsl(var(--market-down)/0.2)]"
        )}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5" /> Total Returns
          </p>
          <p className={cn("text-3xl font-display font-bold font-mono tracking-tight", returnsPositive ? "text-[hsl(var(--market-up))]" : "text-[hsl(var(--market-down))]")}>
            {returnsPositive ? '+' : ''}{formatCurrency(Math.abs(portfolio?.totalReturns || 0))}
          </p>
          <p className={cn("text-xs font-mono mt-1 font-semibold flex items-center gap-1", returnsPositive ? "text-[hsl(var(--market-up))]" : "text-[hsl(var(--market-down))]")}>
            {returnsPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {returnsPositive ? '+' : ''}{(portfolio?.returnsPercent || 0).toFixed(2)}% all time
          </p>
        </div>
      </div>

      {/* Holdings */}
      {hasHoldings ? (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-display font-bold text-base">Your Holdings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                  <th className="px-6 py-3 text-left font-semibold">Stock</th>
                  <th className="px-6 py-3 text-right font-semibold">Shares</th>
                  <th className="px-6 py-3 text-right font-semibold">Avg Cost</th>
                  <th className="px-6 py-3 text-right font-semibold">Current Price</th>
                  <th className="px-6 py-3 text-right font-semibold">Total Value</th>
                  <th className="px-6 py-3 text-right font-semibold">Returns</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {holdings.map((holding) => {
                  const livePrice = prices[holding.symbol];
                  const currentPrice = livePrice?.price || Number(holding.averagePrice);
                  const currentValue = currentPrice * Number(holding.quantity);
                  const returns = currentValue - Number(holding.totalCost);
                  const returnsPercent = Number(holding.totalCost) > 0 ? (returns / Number(holding.totalCost)) * 100 : 0;
                  const isPos = returns >= 0;

                  return (
                    <tr key={holding.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-display font-bold text-foreground">{holding.symbol}</div>
                        <div className="text-xs text-muted-foreground">{holding.companyName}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono">{holding.quantity}</td>
                      <td className="px-6 py-4 text-right font-mono">{formatCurrency(Number(holding.averagePrice))}</td>
                      <td className="px-6 py-4 text-right">
                        <LivePrice symbol={holding.symbol} initialPrice={currentPrice} showChange={false} className="justify-end font-mono" />
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-semibold">{formatCurrency(currentValue)}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={cn("font-mono font-bold text-sm", isPos ? "text-[hsl(var(--market-up))]" : "text-[hsl(var(--market-down))]")}>
                          {isPos ? '+' : ''}{formatCurrency(returns)}
                        </span>
                        <div className={cn("text-xs font-mono", isPos ? "text-[hsl(var(--market-up))]" : "text-[hsl(var(--market-down))]")}>
                          {isPos ? '+' : ''}{returnsPercent.toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/stock/${holding.symbol}`}>
                          <button className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 ml-auto">
                            Trade <ArrowRight className="w-3 h-3" />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart2 className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="font-display font-bold text-lg mb-2">No holdings yet</h3>
          <p className="text-sm text-muted-foreground mb-6">Start investing to see your portfolio here.</p>
          <Link href="/explore">
            <button className="btn-primary">Browse Stocks <ArrowRight className="w-4 h-4 inline ml-1" /></button>
          </Link>
        </div>
      )}

      {/* Watchlist */}
      <div>
        <h2 className="font-display font-bold text-base mb-4">Your Watchlist</h2>
        <WatchlistWidget />
      </div>
    </div>
  );
}
