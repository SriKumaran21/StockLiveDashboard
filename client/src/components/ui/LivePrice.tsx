import React, { useEffect, useState, useRef } from 'react';
import { cn, formatCurrency } from '@/lib/format';
import { useLiveMarket } from '@/hooks/use-live-market';

interface LivePriceProps {
  symbol: string;
  initialPrice: number;
  initialChangePercent?: number;
  className?: string;
  showChange?: boolean;
}

export function LivePrice({ symbol, initialPrice, initialChangePercent = 0, className, showChange = false }: LivePriceProps) {
  const { prices } = useLiveMarket();
  const liveData = prices[symbol];
  
  const currentPrice = liveData?.price ?? initialPrice;
  const currentChange = liveData?.changePercent ?? initialChangePercent;
  
  const [flashClass, setFlashClass] = useState<string>('');
  const prevPriceRef = useRef(currentPrice);

  useEffect(() => {
    if (liveData && liveData.price !== prevPriceRef.current) {
      if (liveData.price > prevPriceRef.current) {
        setFlashClass('animate-flash-green');
      } else if (liveData.price < prevPriceRef.current) {
        setFlashClass('animate-flash-red');
      }
      prevPriceRef.current = liveData.price;
      
      const timer = setTimeout(() => setFlashClass(''), 1500);
      return () => clearTimeout(timer);
    }
  }, [liveData?.price]);

  return (
    <div className={cn("inline-flex items-center gap-2 rounded-lg px-2 -mx-2 transition-all duration-200", flashClass, className)}>
      <span className="font-mono tracking-tight font-bold text-foreground">
        {formatCurrency(currentPrice)}
      </span>
      {showChange && (
        <span className={cn(
          "text-xs font-bold px-2 py-1 rounded-md font-mono transition-all duration-200",
          currentChange >= 0 ? "text-white bg-profit shadow-glow-green" : "text-white bg-loss shadow-glow-red"
        )}>
          {currentChange >= 0 ? '+' : ''}{currentChange.toFixed(2)}%
        </span>
      )}
    </div>
  );
}
