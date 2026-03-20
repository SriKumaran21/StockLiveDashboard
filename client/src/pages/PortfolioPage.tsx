import React from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { usePortfolio, useHoldings } from '@/hooks/use-trading';
import { useLiveMarket } from '@/hooks/use-live-market';
import { formatCurrency, cn } from '@/lib/format';

function compactNumber(n: number): string {
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e7) return (n / 1e7).toFixed(2) + 'Cr';
  if (Math.abs(n) >= 1e5) return (n / 1e5).toFixed(2) + 'L';
  return formatCurrency(n);
}
import { WatchlistWidget } from '@/components/dashboard/WatchlistWidget';
import { LivePrice } from '@/components/ui/LivePrice';
import { TrendingUp, TrendingDown, ArrowRight, Wallet, BarChart2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function PortfolioPage() {
  const { user } = useAuth();
  const { data: portfolio } = usePortfolio();
  const { data: holdings } = useHoldings();
  const { prices } = useLiveMarket();
  const hasHoldings = holdings && holdings.length > 0;

  const COLORS = ['#22c55e','#3b82f6','#f59e0b','#ec4899','#8b5cf6','#14b8a6','#f97316','#06b6d4'];

  const pieData = holdings?.map((h, i) => ({
    name: h.symbol,
    value: Number(h.totalCost),
    color: COLORS[i % COLORS.length],
  })) || [];
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
          <p className="text-2xl font-display font-bold font-mono tracking-tight text-foreground truncate">
            {compactNumber(Number(user?.balance || 0))}
          </p>
          <button onClick={() => {}} className="mt-4 text-xs font-semibold text-primary hover:underline">
            Add funds →
          </button>
        </div>

        {/* Invested */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Invested</p>
          <p className="text-2xl font-display font-bold font-mono tracking-tight truncate">
            {compactNumber(portfolio?.totalCost || 0)}
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
          <p className={cn("text-2xl font-display font-bold font-mono tracking-tight truncate", returnsPositive ? "text-[hsl(var(--market-up))]" : "text-[hsl(var(--market-down))]")}>
            {returnsPositive ? '+' : ''}{compactNumber(Math.abs(portfolio?.totalReturns || 0))}
          </p>
          <p className={cn("text-xs font-mono mt-1 font-semibold flex items-center gap-1", returnsPositive ? "text-[hsl(var(--market-up))]" : "text-[hsl(var(--market-down))]")}>
            {returnsPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {returnsPositive ? '+' : ''}{(portfolio?.returnsPercent || 0).toFixed(2)}% all time
          </p>
        </div>
      </div>

      {/* Pie Chart */}
      {hasHoldings && pieData.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-display font-bold text-sm mb-4">Portfolio Allocation</h2>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div style={{ width: 200, height: 200 }} className="flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                    paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(0 0% 9%)', border: '1px solid hsl(0 0% 14%)', borderRadius: '0.75rem' }}
                    formatter={(value: number) => [formatCurrency(value), 'Invested']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2 w-full">
              {pieData.map((entry, i) => {
                const total = pieData.reduce((s, d) => s + d.value, 0);
                const pct = total > 0 ? (entry.value / total * 100).toFixed(1) : '0';
                return (
                  <div key={entry.name} className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="font-display font-bold text-sm flex-1">{entry.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">{pct}%</span>
                    <span className="text-xs font-mono font-semibold">{formatCurrency(entry.value)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
                      <td className="px-6 py-4 text-right font-mono text-sm">{Number(holding.quantity).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-right font-mono text-sm">{compactNumber(Number(holding.averagePrice))}</td>
                      <td className="px-6 py-4 text-right">
                        <LivePrice symbol={holding.symbol} initialPrice={currentPrice} showChange={false} className="justify-end font-mono text-sm" />
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-semibold text-sm">{compactNumber(currentValue)}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={cn("font-mono font-bold text-sm", isPos ? "text-[hsl(var(--market-up))]" : "text-[hsl(var(--market-down))]")}>
                          {isPos ? '+' : ''}{compactNumber(returns)}
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
