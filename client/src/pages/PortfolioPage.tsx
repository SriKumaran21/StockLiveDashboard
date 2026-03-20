import React from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { usePortfolio, useHoldings } from '@/hooks/use-trading';
import { useLiveMarket } from '@/hooks/use-live-market';
import { formatCurrency, formatNumber } from '@/lib/format';
import { WatchlistWidget } from '@/components/dashboard/WatchlistWidget';
import { LivePrice } from '@/components/ui/LivePrice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, TrendingDown, History, ArrowRight } from 'lucide-react';

export function PortfolioPage() {
  const { user } = useAuth();
  const { data: portfolio } = usePortfolio();
  const { data: holdings } = useHoldings();
  const { prices } = useLiveMarket();

  const hasHoldings = holdings && holdings.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-primary to-accent rounded-3xl p-8 text-primary-foreground shadow-2xl shadow-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="text-primary-foreground/80 font-semibold mb-2 flex items-center gap-2">
              <Wallet className="w-5 h-5" /> Available Margin
            </h2>
            <p className="text-5xl font-display font-bold font-mono tracking-tight mb-8">
              {formatCurrency(Number(user?.balance || 0))}
            </p>
            
            <div className="flex gap-4">
              <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 flex-1">
                <p className="text-sm text-primary-foreground/70 mb-1">Invested Amount</p>
                <p className="text-xl font-bold font-mono">
                  {formatCurrency(portfolio?.totalCost || 0)}
                </p>
              </div>
              <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 flex-1">
                <p className="text-sm text-primary-foreground/70 mb-1">Total Returns</p>
                <p className="text-xl font-bold font-mono flex items-center gap-1">
                  {(portfolio?.returnsPercent || 0) >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-emerald-300" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-300" />
                  )}
                  {((portfolio?.returnsPercent || 0) >= 0 ? '+' : '')}{(portfolio?.returnsPercent || 0).toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-1 bg-card border border-border/50 rounded-3xl p-6 flex flex-col justify-center items-center text-center shadow-lg shadow-black/5">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
            {hasHoldings ? (
              <TrendingUp className="w-8 h-8 text-primary" />
            ) : (
              <History className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <h3 className="font-bold text-lg mb-2">
            {hasHoldings ? `${holdings.length} Holdings` : 'No active holdings'}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {hasHoldings 
              ? 'Your portfolio is performing well. Keep tracking your investments.'
              : 'You haven\'t bought any stocks yet. Use your available margin to start trading.'
            }
          </p>
          {!hasHoldings && (
            <Link href="/explore">
              <Button className="bg-primary hover:bg-primary/90">
                Start Trading
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Holdings Table */}
      {hasHoldings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Your Holdings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm font-medium text-muted-foreground border-b">
                    <th className="pb-3">Stock</th>
                    <th className="pb-3 text-right">Shares</th>
                    <th className="pb-3 text-right">Avg Cost</th>
                    <th className="pb-3 text-right">Current Price</th>
                    <th className="pb-3 text-right">Total Value</th>
                    <th className="pb-3 text-right">Returns</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {holdings.map((holding) => {
                    const livePrice = prices[holding.symbol];
                    const currentPrice = livePrice?.price || 0;
                    const currentValue = currentPrice * Number(holding.quantity);
                    const returns = currentValue - Number(holding.totalCost);
                    const returnsPercent = Number(holding.totalCost) > 0 
                      ? (returns / Number(holding.totalCost)) * 100 
                      : 0;
                    const isPositive = returns >= 0;

                    return (
                      <tr key={holding.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-4">
                          <div>
                            <div className="font-semibold">{holding.symbol}</div>
                            <div className="text-sm text-muted-foreground">{holding.companyName}</div>
                          </div>
                        </td>
                        <td className="py-4 text-right font-mono">{holding.quantity}</td>
                        <td className="py-4 text-right font-mono">
                          {formatCurrency(Number(holding.averagePrice))}
                        </td>
                        <td className="py-4 text-right">
                          <LivePrice 
                            symbol={holding.symbol}
                            initialPrice={currentPrice}
                            showChange={false}
                            className="justify-end font-mono"
                          />
                        </td>
                        <td className="py-4 text-right font-mono font-semibold">
                          {formatCurrency(currentValue)}
                        </td>
                        <td className="py-4 text-right">
                          <div className={`font-mono font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? '+' : ''}{formatCurrency(returns)}
                            <div className="text-xs">
                              ({isPositive ? '+' : ''}{returnsPercent.toFixed(2)}%)
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <Link href={`/stock/${holding.symbol}`}>
                            <Button variant="outline" size="sm">
                              Trade
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-8">
        <h2 className="text-2xl font-display font-bold mb-6">Your Watchlist</h2>
        <WatchlistWidget />
      </div>
    </div>
  );
}
