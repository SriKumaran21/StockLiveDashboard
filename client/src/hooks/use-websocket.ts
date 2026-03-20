import { useState, useEffect, useRef, useCallback } from "react";

export function useWebSocket(url: string) {
  const [connected, setConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const handlers = useRef<Map<string, Set<(data: any) => void>>>(new Map());

  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      // Connect using relative path so it works everywhere
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}${url}`;
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        setConnected(true);
        console.log(`[WS] Connected to ${wsUrl}`);
      };

      ws.current.onclose = () => {
        setConnected(false);
        console.log(`[WS] Disconnected, reconnecting in 3s...`);
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.current.onerror = (error) => {
        console.error(`[WS] Error:`, error);
      };

      ws.current.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          // Assuming structure { type: 'event_name', data: payload }
          // Or from backend: { receive: { priceUpdate: payload } }
          
          if (parsed.type && parsed.data) {
            const callbacks = handlers.current.get(parsed.type);
            if (callbacks) {
              callbacks.forEach(cb => cb(parsed.data));
            }
          } else if (parsed.receive) {
            // Mapping for the specific routes_manifest structure
            Object.entries(parsed.receive).forEach(([type, data]) => {
              const callbacks = handlers.current.get(type);
              if (callbacks) {
                callbacks.forEach(cb => cb(data));
              }
            });
          }
        } catch (e) {
          console.error('[WS] Failed to parse message', e);
        }
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws.current) {
        ws.current.onclose = null;
        ws.current.close();
      }
    };
  }, [url]);

  const emit = useCallback((type: string, data: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, data }));
    } else {
      console.warn('[WS] Cannot emit, not connected');
    }
  }, []);

  const on = useCallback((type: string, callback: (data: any) => void) => {
    if (!handlers.current.has(type)) {
      handlers.current.set(type, new Set());
    }
    handlers.current.get(type)!.add(callback);

    return () => {
      const callbacks = handlers.current.get(type);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }, []);

  return { connected, emit, on };
}
