import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useWebSocket } from './use-websocket';
import { z } from 'zod';
import { ws } from '@shared/routes';

type LiveMarketContextType = {
  prices: Record<string, z.infer<typeof ws.receive.priceUpdate>>;
  indices: Record<string, z.infer<typeof ws.receive.indexUpdate>>;
  connected: boolean;
};

const LiveMarketContext = createContext<LiveMarketContextType>({
  prices: {},
  indices: {},
  connected: false,
});

export function LiveMarketProvider({ children }: { children: ReactNode }) {
  const { connected, on } = useWebSocket('/ws');
  const [prices, setPrices] = useState<LiveMarketContextType['prices']>({});
  const [indices, setIndices] = useState<LiveMarketContextType['indices']>({});

  useEffect(() => {
    const offPrice = on('priceUpdate', (raw) => {
      const result = ws.receive.priceUpdate.safeParse(raw);
      if (result.success) {
        const data = result.data;
        setPrices(prev => ({
          ...prev,
          [data.symbol]: data
        }));
      }
    });

    const offIndex = on('indexUpdate', (raw) => {
      const result = ws.receive.indexUpdate.safeParse(raw);
      if (result.success) {
        const data = result.data;
        setIndices(prev => ({
          ...prev,
          [data.name]: data
        }));
      }
    });

    return () => {
      offPrice();
      offIndex();
    };
  }, [on]);

  return (
    <LiveMarketContext.Provider value={{ prices, indices, connected }}>
      {children}
    </LiveMarketContext.Provider>
  );
}

export function useLiveMarket() {
  return useContext(LiveMarketContext);
}
