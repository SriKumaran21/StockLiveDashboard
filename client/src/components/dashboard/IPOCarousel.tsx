import React from 'react';
import { useIPOs } from '@/hooks/use-ipos';
import { format } from 'date-fns';
import { Calendar, Tag } from 'lucide-react';

const CONTAINER_HEIGHT = 480;

export function IPOCarousel() {
  const { data: ipos, isLoading } = useIPOs();

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col"
      style={{ height: CONTAINER_HEIGHT, background: '#161C27', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
      {/* Header */}
      <div className="flex-shrink-0 px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h3 style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 14, color: '#E5E7EB' }}>
          Upcoming IPOs
        </h3>
      </div>

      {/* Scrollable 2-column grid */}
      <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="skeleton rounded-xl" style={{ height: 130 }} />
            ))}
          </div>
        ) : !ipos?.length ? (
          <div className="flex items-center justify-center h-full">
            <p style={{ fontSize: 12, color: '#6B7280' }}>No upcoming IPOs</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
          }}>
            {ipos.map((ipo: any, i: number) => (
              <div key={i} className="rounded-xl p-3 flex flex-col justify-between"
                style={{
                  background: '#1E2738',
                  height: 130,
                  flexShrink: 0,
                }}>
                {/* Badge */}
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                    style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}>
                    IPO
                  </span>
                  <span style={{ fontSize: 9, color: '#6B7280', fontFamily: 'Inter' }}>
                    {ipo.exchange || 'NSE'}
                  </span>
                </div>

                {/* Company */}
                <p style={{
                  fontSize: 12, fontWeight: 700, fontFamily: 'Manrope',
                  color: '#E5E7EB', lineHeight: 1.3,
                  display: '-webkit-box', WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }} title={ipo.company}>
                  {ipo.company}
                </p>

                {/* Details */}
                <div className="space-y-1 mt-auto">
                  <div className="flex items-center gap-1.5" style={{ fontSize: 10, color: '#9CA3AF' }}>
                    <Calendar style={{ width: 10, height: 10, color: '#3B82F6', flexShrink: 0 }} />
                    <span>{format(new Date(ipo.openDate), 'MMM d')} – {format(new Date(ipo.closeDate), 'MMM d')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5" style={{ fontSize: 10, color: '#9CA3AF' }}>
                      <Tag style={{ width: 10, height: 10, color: '#3B82F6', flexShrink: 0 }} />
                      <span style={{ fontFamily: 'JetBrains Mono' }}>
                        {ipo.priceRange === 'TBD' ? '₹TBD' : `₹${ipo.priceRange}`}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 9, fontWeight: 600, color: '#6B7280',
                      fontFamily: 'JetBrains Mono',
                    }}>
                      Min {ipo.minQty}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
