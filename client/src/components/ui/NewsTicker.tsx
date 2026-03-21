import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/format';

const POSITIVE_WORDS = ['surge', 'rally', 'gain', 'rise', 'up', 'high', 'beat', 'profit', 'growth', 'bullish', 'strong', 'buy', 'upgrade', 'record', 'boost', 'soar', 'jump'];
const NEGATIVE_WORDS = ['fall', 'drop', 'loss', 'down', 'crash', 'bearish', 'sell', 'downgrade', 'weak', 'decline', 'cut', 'miss', 'risk', 'warn', 'plunge', 'tumble'];

function getSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lower = text.toLowerCase();
  const pos = POSITIVE_WORDS.filter(w => lower.includes(w)).length;
  const neg = NEGATIVE_WORDS.filter(w => lower.includes(w)).length;
  if (pos > neg) return 'positive';
  if (neg > pos) return 'negative';
  return 'neutral';
}

export function NewsTicker() {
  const { data: news } = useQuery({
    queryKey: ['ticker-news'],
    queryFn: async () => {
      const res = await fetch('/api/news?symbol=AAPL');
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 300000,
    refetchInterval: 300000,
  });

  if (!news?.length) return null;

  const items = [...news, ...news]; // duplicate for seamless loop

  return (
    <div className="w-full bg-[hsl(0,0%,7%)] border-b  overflow-hidden">
      <style>{`
        @keyframes news-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .news-track {
          display: flex;
          width: max-content;
          animation: news-scroll 60s linear infinite;
        }
        .news-track:hover { animation-play-state: paused; }
      `}</style>
      <div className="flex items-center">
        {/* Label */}
        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-primary text-black text-[10px] font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
          Live News
        </div>
        {/* Scrolling track */}
        <div className="overflow-hidden flex-1">
          <div className="news-track">
            {items.map((article: any, i: number) => {
              const sentiment = getSentiment(article.headline);
              return (
                <a key={i} href={article.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-1.5 border-r  hover:bg-secondary/30 transition-colors flex-shrink-0 max-w-sm">
                  {sentiment !== 'neutral' && (
                    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0",
                      sentiment === 'positive' ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500")}>
                      {sentiment === 'positive' ? '▲ Bull' : '▼ Bear'}
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                    {article.headline}
                  </span>
                  <span className="text-[10px] text-muted-foreground/50 flex-shrink-0">{article.source}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
