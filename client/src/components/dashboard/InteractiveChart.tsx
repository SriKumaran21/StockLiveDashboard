import React, { useState } from 'react';
import { useAllStocks } from '@/hooks/use-stocks';
import { useLiveMarket } from '@/hooks/use-live-market';
import { StockChart } from '@/components/ui/StockChart';
import { formatCurrency, cn } from '@/lib/format';
import { ChevronDown } from 'lucide-react';

export function InteractiveChart({ defaultSymbol = 'AAPL' }: { defaultSymbol?: string }) {
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [showPicker, setShowPicker] = useState(false);
  const { data: allStocks } = useAllStocks();
  const { prices } = useLiveMarket();

  const livePrice = prices[symbol]?.price;
  const liveChange = prices[symbol]?.changePercent;
  const stock = allStocks?.find(s => s.symbol === symbol);
  const changePercent = liveChange ?? stock?.changePercent ?? 0;
  const isPositive = changePercent >= 0;

  return (
    <div className="card-fintech p-0 overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="relative">
          <button onClick={() => setShowPicker(!showPicker)}
            className="flex items-center gap-2 group">
            <span className="font-display font-bold text-xl group-hover:text-primary transition-colors">{symbol}</span>
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", showPicker && "rotate-180")} />
          </button>
          {livePrice && (
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              {formatCurrency(livePrice)}
              <span className={cn("ml-2 font-semibold", isPositive ? "text-green-500" : "text-red-500")}>
                {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
              </span>
            </p>
          )}

          {/* Stock Picker Dropdown */}
          {showPicker && (
            <div className="absolute top-12 left-0 z-30 w-64 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-2 max-h-64 overflow-y-auto">
                {allStocks?.map(s => (
                  <button key={s.symbol}
                    onClick={() => { setSymbol(s.symbol); setShowPicker(false); }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm hover:bg-secondary transition-colors",
                      symbol === s.symbol && "bg-primary/10 text-primary"
                    )}>
                    <div className="text-left">
                      <div className="font-display font-bold">{s.symbol}</div>
                      <div className="text-xs text-muted-foreground">{s.company}</div>
                    </div>
                    <span className={cn("text-xs font-mono font-semibold",
                      s.changePercent >= 0 ? "text-green-500" : "text-red-500")}>
                      {s.changePercent >= 0 ? '+' : ''}{s.changePercent.toFixed(2)}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <StockChart symbol={symbol} height={320} />
    </div>
  );
}
