import React from 'react';
import { useIPOs } from '@/hooks/use-ipos';
import { format } from 'date-fns';
import { Calendar, Tag } from 'lucide-react';

export function IPOCarousel() {
  const { data: ipos, isLoading } = useIPOs();

  if (isLoading) return (
    <div className="space-y-3">
      <div className="skeleton h-4 w-32 rounded" />
      <div className="flex gap-3">
        {[1,2].map(i => <div key={i} className="skeleton h-40 w-56 rounded-2xl flex-shrink-0" />)}
      </div>
    </div>
  );

  if (!ipos?.length) return null;

  return (
    <div className="space-y-3">
      <h3 style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 14, color: '#E5E7EB' }}>
        Upcoming IPOs
      </h3>
      <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar -mx-1 px-1">
        {ipos.map((ipo, i) => (
          <div key={i} className="flex-none rounded-2xl p-4 transition-all hover:scale-[1.01]"
            style={{ width: 220, background: '#111827', border: 'none' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6' }}>
                IPO
              </span>
            </div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#E5E7EB', fontFamily: 'Manrope', marginBottom: 12 }}
              className="truncate" title={ipo.company}>
              {ipo.company}
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2" style={{ fontSize: 12, color: '#6B7280' }}>
                <Calendar style={{ width: 12, height: 12, color: '#3B82F6' }} />
                <span>{format(new Date(ipo.openDate), 'MMM d')} – {format(new Date(ipo.closeDate), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2" style={{ fontSize: 12, color: '#6B7280' }}>
                <Tag style={{ width: 12, height: 12, color: '#3B82F6' }} />
                <span style={{ fontFamily: 'JetBrains Mono' }}>₹{ipo.priceRange}</span>
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '8px 0' }} />
              <div className="flex justify-between">
                <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Min Qty</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#E5E7EB', fontFamily: 'JetBrains Mono' }}>{ipo.minQty} shares</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
