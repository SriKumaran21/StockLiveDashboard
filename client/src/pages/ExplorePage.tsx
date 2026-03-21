import React, { useState } from 'react';
import { useSearchStocks, useAllStocks } from '@/hooks/use-stocks';
import { useAddWatchlist, useWatchlist } from '@/hooks/use-watchlist';
import { LivePrice } from '@/components/ui/LivePrice';
import { StockIcon } from '@/components/ui/StockIcon';
import { Search, Star, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/format';
import { useLocation } from 'wouter';

type Market = 'all' | 'in' | 'us';
type Sector = 'all' | 'IT' | 'Banking' | 'Finance' | 'Energy' | 'Auto' | 'Consumer' | 'Pharma' | 'Telecom' | 'Tech' | 'Industrial';

const SECTORS: Sector[] = ['all', 'IT', 'Banking', 'Finance', 'Tech', 'Energy', 'Auto', 'Consumer', 'Pharma', 'Telecom', 'Industrial'];

const SECTOR_COLORS: Record<string, string> = {
  IT:         'bg-blue-500/10 text-blue-400',
  Banking:    'bg-emerald-500/10 text-emerald-400',
  Finance:    'bg-cyan-500/10 text-cyan-400',
  Tech:       'bg-violet-500/10 text-violet-400',
  Energy:     'bg-orange-500/10 text-orange-400',
  Auto:       'bg-yellow-500/10 text-yellow-400',
  Consumer:   'bg-pink-500/10 text-pink-400',
  Pharma:     'bg-red-500/10 text-red-400',
  Telecom:    'bg-teal-500/10 text-teal-400',
  Industrial: 'bg-slate-500/10 text-slate-400',
};

export function ExplorePage() {
  const [query, setQuery] = useState('');
  const [market, setMarket] = useState<Market>('all');
  const [sector, setSector] = useState<Sector>('all');
  const [, navigate] = useLocation();
  const { data: searchResults, isLoading: isSearching } = useSearchStocks(query);
  const { data: allStocks, isLoading: isAllLoading } = useAllStocks();
  const { data: watchlist } = useWatchlist();
  const addWatchlist = useAddWatchlist();
  const { toast } = useToast();

  const baseData = query.length >= 2 ? searchResults : allStocks;

  const displayData = baseData?.filter(s => {
    const isIndian = s.symbol.includes('.NS') || s.symbol.includes('.BO');
    if (market === 'in' && !isIndian) return false;
    if (market === 'us' && isIndian) return false;
    if (sector !== 'all' && (s as any).sector !== sector) return false;
    return true;
  });

  const isLoading = query.length >= 2 ? isSearching : isAllLoading;
  const isInWatchlist = (symbol: string) => watchlist?.some(w => w.symbol === symbol);

  const handleAddWatchlist = async (e: React.MouseEvent, symbol: string, company: string) => {
    e.stopPropagation();
    try {
      await addWatchlist.mutateAsync({ symbol, companyName: company });
      toast({ title: `${symbol} added to watchlist` });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-slide-up">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Search by symbol or company…"
          value={query} onChange={e => setQuery(e.target.value)}
          className="w-full bg-card border-0 rounded-2xl pl-11 pr-12 py-3.5 text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
        />
        {isLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />}
      </div>

      {/* Market tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1.5">
          {([['all','🌐 All'], ['in','🇮🇳 Indian'], ['us','🇺🇸 US']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setMarket(key)}
              className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all",
                market === key ? "bg-primary text-black" : "bg-secondary text-muted-foreground hover:text-foreground")}>
              {label}
            </button>
          ))}
        </div>

        {/* Sector filter */}
        <div className="flex gap-1.5 flex-wrap">
          {SECTORS.map(s => (
            <button key={s} onClick={() => setSector(s)}
              className={cn("px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ",
                sector === s
                  ? "bg-primary text-black border-primary"
                  : "bg-secondary text-muted-foreground hover:text-foreground")}>
              {s === 'all' ? 'All Sectors' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-muted-foreground">
        Showing <span className="text-foreground font-semibold">{displayData?.length ?? 0}</span> stocks
      </p>

      {/* Table */}
      <div className="bg-card border-0 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-[10px] text-muted-foreground uppercase tracking-wider">
              <th className="px-5 py-3.5 text-left font-semibold">Symbol</th>
              <th className="px-5 py-3.5 text-left font-semibold hidden sm:table-cell">Company</th>
              <th className="px-5 py-3.5 text-left font-semibold hidden md:table-cell">Sector</th>
              <th className="px-5 py-3.5 text-right font-semibold">Price</th>
              <th className="px-5 py-3.5 text-center font-semibold w-12">★</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-">
            {displayData?.map((stock) => {
              const inWL = isInWatchlist(stock.symbol);
              const sectorTag = (stock as any).sector;
              return (
                <tr key={stock.symbol}
                  className="hover:bg-secondary/40 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/stock/${stock.symbol}`)}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <StockIcon symbol={stock.symbol} size={26} />
                      <span className="font-display font-bold text-sm group-hover:text-primary transition-colors">
                        {stock.symbol.replace('.NS','').replace('.BO','')}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell text-xs text-muted-foreground">{stock.company}</td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    {sectorTag && (
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md", SECTOR_COLORS[sectorTag] || 'bg-secondary text-muted-foreground')}>
                        {sectorTag}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <LivePrice symbol={stock.symbol} initialPrice={stock.price} initialChangePercent={stock.changePercent} showChange className="justify-end" />
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <button onClick={(e) => !inWL && handleAddWatchlist(e, stock.symbol, stock.company)}
                      disabled={inWL || addWatchlist.isPending}
                      className={cn("w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all",
                        inWL ? "text-yellow-500" : "text-muted-foreground hover:text-primary hover:bg-primary/10")}>
                      <Star className={cn("w-3.5 h-3.5", inWL && "fill-current")} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {displayData?.length === 0 && !isLoading && (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">No stocks found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
