import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { useStockHistory } from '@/hooks/use-stocks';
import { cn } from '@/lib/format';
import { Loader2 } from 'lucide-react';

const RANGES = ['1D', '1W', '1M', '3M', '1Y', '5Y'] as const;
type Range = typeof RANGES[number];

interface Props { symbol: string; isPositive: boolean; }

export function ProfessionalChart({ symbol, isPositive }: Props) {
  const [range, setRange] = useState<Range>('3M');
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candleRef = useRef<any>(null);
  const volRef = useRef<any>(null);
  const { data: history, isLoading } = useStockHistory(symbol, range);

  const UP = '#22c55e';
  const DN = '#ef4444';

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'rgba(0,0,0,0)' },
        textColor: 'rgba(255,255,255,0.4)',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.03)' },
        horzLines: { color: 'rgba(255,255,255,0.03)' },
      },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.06)' },
      timeScale: { borderColor: 'rgba(255,255,255,0.06)', timeVisible: true },
      width: containerRef.current.clientWidth,
      height: 380,
    });

    const candle = chart.addSeries(CandlestickSeries, {
      upColor: UP, downColor: DN,
      borderUpColor: UP, borderDownColor: DN,
      wickUpColor: UP, wickDownColor: DN,
    });

    const vol = chart.addSeries(HistogramSeries, {
      color: UP,
      priceFormat: { type: 'volume' },
      priceScaleId: 'vol',
    });

    chart.priceScale('vol').applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    chartRef.current = chart;
    candleRef.current = candle;
    volRef.current = vol;

    const ro = new ResizeObserver(e => {
      chartRef.current?.applyOptions({ width: e[0].contentRect.width });
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!history?.length || !candleRef.current) return;
    const seen = new Set<number>();
    const candles = history
      .map(d => ({
        time: Math.floor(new Date(d.timestamp).getTime() / 1000) as any,
        open:  Number((d as any).open)  || d.price,
        high:  Number((d as any).high)  || d.price,
        low:   Number((d as any).low)   || d.price,
        close: d.price,
        volume: Number((d as any).volume) || 0,
      }))
      .sort((a, b) => a.time - b.time)
      .filter(d => !seen.has(d.time) && seen.add(d.time));

    try {
      candleRef.current.setData(candles.map(({ time, open, high, low, close }) => ({ time, open, high, low, close })));
      volRef.current?.setData(candles.map(d => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? `${UP}60` : `${DN}60`,
      })));
      chartRef.current?.timeScale().fitContent();
    } catch(e) {
      console.error('Chart error:', e);
    }
  }, [history]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-5 py-3 border-b ">
        <div className="flex gap-1 bg-secondary p-1 rounded-xl">
          {RANGES.map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={cn("px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                range === r ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground")}>
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-green-500 inline-block"/>Bullish</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-red-500 inline-block"/>Bearish</span>
        </div>
      </div>
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/80 z-10 rounded-b-2xl">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        <div ref={containerRef} className="w-full" />
      </div>
    </div>
  );
}
