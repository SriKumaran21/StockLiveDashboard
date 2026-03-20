import React from 'react';
import { useIPOs } from '@/hooks/use-ipos';
import { format } from 'date-fns';
import { Calendar, Tag } from 'lucide-react';

export function IPOCarousel() {
  const { data: ipos, isLoading } = useIPOs();

  if (isLoading) return <div className="h-48 bg-muted animate-pulse rounded-2xl" />;
  if (!ipos || ipos.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-display font-bold">Upcoming IPOs</h3>
      
      <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {ipos.map((ipo, idx) => (
          <div 
            key={idx} 
            className="flex-none w-72 bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary rounded-full">IPO</span>
              </div>
              <h4 className="font-semibold text-lg mb-4 truncate text-foreground" title={ipo.company}>{ipo.company}</h4>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{format(new Date(ipo.openDate), 'MMM d')} - {format(new Date(ipo.closeDate), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Tag className="w-4 h-4 text-primary" />
                  <span className="font-mono">₹{ipo.priceRange}</span>
                </div>
                <div className="pt-3 mt-3 border-t border-border/50 flex justify-between items-center">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Min Qty</span>
                  <span className="text-sm font-bold">{ipo.minQty} Shares</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
