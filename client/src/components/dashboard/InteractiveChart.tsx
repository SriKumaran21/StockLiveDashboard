import React, { useState } from 'react';
import { useStockHistory } from '@/hooks/use-stocks';
import { useLiveMarket } from '@/hooks/use-live-market';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { cn } from '@/lib/format';
import { Loader2, ChevronDown } from 'lucide-react';
import { useAllStocks } from '@/hooks/use-stocks';

const RANGES = ['1D', '1W', '1M', '3M', '1Y', '5Y'];

export function InteractiveChart({ defaultSymbol = 'AAPL' }: { defaultSymbol?: string }) {
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [range, setRange] = useState('1M');
  const [showPicker, setShowPicker] = useState(false);
  const { data: allStocks } = useAllStocks();
  const { data: history, isLoading } = useStockHistory(symbol, range);
  
  const { prices, indices } = useLiveMarket();
  const livePrice = prices[symbol]?.price || indices[symbol]?.value;

  const chartData = history?.map(d => ({
    ...d,
    formattedTime: range === '1D' ? format(new Date(d.timestamp), 'HH:mm') : format(new Date(d.timestamp), 'dd MMM')
  })) || [];

  const isPositive = chartData.length > 0 
    ? chartData[chartData.length - 1].price >= chartData[0].price 
    : true;
    
  const strokeColor = isPositive ? 'hsl(var(--market-up))' : 'hsl(var(--market-down))';
  const fillColor = isPositive ? 'url(#colorPositive)' : 'url(#colorNegative)';

  return (
    <div className="card-fintech flex flex-col h-full min-h-[400px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="flex items-center gap-2 group"
          >
            <h2 className="text-2xl font-display font-bold text-foreground group-hover:text-primary transition-colors">{symbol}</h2>
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", showPicker && "rotate-180")} />
          </button>
          {livePrice && (
            <p className="text-sm font-mono text-muted-foreground mt-0.5">
              Live: ₹{livePrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          )}
          {showPicker && (
            <div className="absolute top-10 left-0 z-20 w-64 bg-card border border-border rounded-2xl shadow-2xl shadow-black/40 overflow-hidden animate-slide-up">
              <div className="p-2 max-h-64 overflow-y-auto">
                {allStocks?.map(s => (
                  <button key={s.symbol} onClick={() => { setSymbol(s.symbol); setShowPicker(false); }}
                    className={cn("w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm hover:bg-secondary transition-colors",
                      symbol === s.symbol && "bg-primary/10 text-primary")}
                  >
                    <div className="text-left">
                      <div className="font-bold font-display">{s.symbol}</div>
                      <div className="text-xs text-muted-foreground">{s.company}</div>
                    </div>
                    <span className={cn("text-xs font-mono font-semibold", s.changePercent >= 0 ? "text-[hsl(var(--market-up))]" : "text-[hsl(var(--market-down))]")}>
                      {s.changePercent >= 0 ? '+' : ''}{s.changePercent.toFixed(2)}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex bg-secondary/80 p-1 rounded-xl shadow-card">
          {RANGES.map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200",
                range === r 
                  ? "bg-gradient-to-r from-primary to-primary/80 text-foreground shadow-glow hover:scale-105" 
                  : "text-muted hover:text-foreground hover:bg-secondary/50"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/90 backdrop-blur-sm z-10 rounded-xl">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--market-up))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--market-up))" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--market-down))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--market-down))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis 
              dataKey="formattedTime" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
              dy={10}
              minTickGap={30}
            />
            <YAxis 
              domain={['auto', 'auto']} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
              dx={-10}
              tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                borderColor: 'hsl(var(--border))',
                borderRadius: '0.75rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
                fontFamily: 'JetBrains Mono'
              }}
              itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 700 }}
              labelStyle={{ color: 'hsl(var(--muted))', marginBottom: '0.25rem' }}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke={strokeColor} 
              strokeWidth={3} 
              fill={fillColor} 
              activeDot={{ r: 6, strokeWidth: 0, fill: strokeColor }}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
