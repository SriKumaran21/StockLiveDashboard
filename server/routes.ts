import type { Express } from "express";
import type { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { db } from "./db";
import { users, holdings, transactions, priceAlerts } from "@shared/schema";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
const scryptAsync = promisify(scrypt);
import {
  getQuote,
  getYahooQuote,
  getCandles,
  getCompanyNews,
  getIPOCalendar,
  DEFAULT_STOCKS,
  INDEX_SYMBOLS,
} from "./finnhub";

const MemoryStore = createMemoryStore(session);
// In-memory price history cache — stores last 500 points per symbol
const priceCache = new Map<string, Array<{ timestamp: string; price: number }>>();

function pushToCache(symbol: string, price: number) {
  if (!priceCache.has(symbol)) priceCache.set(symbol, []);
  const arr = priceCache.get(symbol)!;
  arr.push({ timestamp: new Date().toISOString(), price });
  if (arr.length > 500) arr.shift(); // keep last 500 points
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Session setup
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "super-secret-stocklive",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({ checkPeriod: 86400000 }),
      cookie: { secure: false },
    })
  );

  // Index symbol mapping
  const INDEX_SYMBOL_MAP: Record<string, string> = {
    'NIFTY50': '^NSEI',
    'SENSEX':  '^BSESN',
  };

  // ── Auth Routes ─────────────────────────────────────────
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existing = await storage.getUserByEmail(input.email);
      if (existing) {
        return res.status(400).json({ message: "Email already exists" });
      }
      const hashedPassword = await hashPassword(input.password);
      const user = await storage.createUser({ ...input, password: hashedPassword });
      req.session.userId = user.id;
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("LOGIN ERROR:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      const user = await storage.getUserByEmail(input.email);
      if (!user || !(await comparePasswords(input.password, user.password))) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      req.session.userId = user.id;
      res.json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy(() => res.json({ message: "Logged out" }));
  });

  app.get(api.auth.me.path, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    res.json(user);
  });

  // ── User Balance ────────────────────────────────────────
  app.put(api.user.balance.path, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const input = api.user.balance.input.parse(req.body);
      const user = await storage.getUser(req.session.userId);
      if (!user) return res.status(401).json({ message: "User not found" });
      const newBalance = (parseFloat(user.balance) + input.amount).toString();
      const updatedUser = await storage.updateUserBalance(user.id, newBalance);
      await storage.addTransaction({
        userId: user.id,
        amount: input.amount.toString(),
        type: "credit",
      });
      res.json(updatedUser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal error" });
    }
  });

  // ── Stocks — Real Finnhub Data ──────────────────────────
  app.get(api.stocks.indices.path, async (req, res) => {
    try {
      const results = await Promise.all(
        INDEX_SYMBOLS.map(async ({ symbol, name }) => {
          const q = await getYahooQuote(symbol);
          return { name, value: q.price, change: q.change, changePercent: q.changePercent };
        })
      );
      res.json(results);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch indices" });
    }
  });

  app.get(api.stocks.all.path, async (req, res) => {
    try {
      const results = await Promise.all(
        DEFAULT_STOCKS.map(async ({ symbol, company, sector }) => {
          try {
            const q = await getQuote(symbol);
            // Retry once if price is 0
            if (q.price === 0) {
              await new Promise(r => setTimeout(r, 300));
              const retry = await getQuote(symbol);
              return { symbol, company, price: retry.price, change: retry.change, changePercent: retry.changePercent, volume: 0, sector };
            }
            return { symbol, company, price: q.price, change: q.change, changePercent: q.changePercent, volume: 0, sector };
          } catch {
            return { symbol, company, price: 0, change: 0, changePercent: 0, volume: 0, sector };
          }
        })
      );
      res.json(results);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch stocks" });
    }
  });

  app.get(api.stocks.gainers.path, async (req, res) => {
    try {
      const results = await Promise.all(
        DEFAULT_STOCKS.map(async ({ symbol, company, sector }) => {
          try {
            const q = await getQuote(symbol);
            // Retry once if price is 0
            if (q.price === 0) {
              await new Promise(r => setTimeout(r, 300));
              const retry = await getQuote(symbol);
              return { symbol, company, price: retry.price, change: retry.change, changePercent: retry.changePercent, volume: 0, sector };
            }
            return { symbol, company, price: q.price, change: q.change, changePercent: q.changePercent, volume: 0, sector };
          } catch {
            return { symbol, company, price: 0, change: 0, changePercent: 0, volume: 0, sector };
          }
        })
      );
      res.json(results.filter(s => s.change > 0).sort((a, b) => b.changePercent - a.changePercent));
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch gainers" });
    }
  });

  app.get(api.stocks.losers.path, async (req, res) => {
    try {
      const results = await Promise.all(
        DEFAULT_STOCKS.map(async ({ symbol, company, sector }) => {
          try {
            const q = await getQuote(symbol);
            // Retry once if price is 0
            if (q.price === 0) {
              await new Promise(r => setTimeout(r, 300));
              const retry = await getQuote(symbol);
              return { symbol, company, price: retry.price, change: retry.change, changePercent: retry.changePercent, volume: 0, sector };
            }
            return { symbol, company, price: q.price, change: q.change, changePercent: q.changePercent, volume: 0, sector };
          } catch {
            return { symbol, company, price: 0, change: 0, changePercent: 0, volume: 0, sector };
          }
        })
      );
      res.json(results.filter(s => s.change < 0).sort((a, b) => a.changePercent - b.changePercent));
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch losers" });
    }
  });

  app.get(api.stocks.search.path, async (req, res) => {
    const q = (req.query.q as string)?.toLowerCase();

    const INDEX_MAP: Record<string,string> = { "NIFTY50": "^NSEI", "SENSEX": "^BSESN" };

    const ALL_SEARCHABLE = [
      ...DEFAULT_STOCKS,
      { symbol: "SPY",     company: "S&P 500 ETF",   sector: "Index" },
      { symbol: "QQQ",     company: "Nasdaq ETF",     sector: "Index" },
      { symbol: "DIA",     company: "Dow Jones ETF",  sector: "Index" },
      { symbol: "NIFTY50", company: "Nifty 50 Index", sector: "Index" },
      { symbol: "SENSEX",  company: "BSE Sensex",     sector: "Index" },
    ];

    const sourceList = q
      ? ALL_SEARCHABLE.filter(s =>
          s.symbol.toLowerCase().includes(q) ||
          s.company.toLowerCase().includes(q)
        )
      : DEFAULT_STOCKS;

    try {
      const results = await Promise.all(
        sourceList.map(async (stock) => {
          try {
            const fetchSym = INDEX_MAP[stock.symbol] || stock.symbol;
            const quote = await getYahooQuote(fetchSym);
            return {
              symbol: stock.symbol,
              company: stock.company,
              price: quote.price,
              change: quote.change,
              changePercent: quote.changePercent,
              volume: 0,
              sector: (stock as any).sector || null,
            };
          } catch {
            return {
              symbol: stock.symbol,
              company: stock.company,
              price: 0, change: 0, changePercent: 0, volume: 0,
              sector: (stock as any).sector || null,
            };
          }
        })
      );
      return res.json(results);
    } catch (err) {
      console.error("[Search] Error:", err);
      return res.status(500).json({ message: "Search failed" });
    }
  });


  app.get(api.stocks.history.path, async (req, res) => {
    const rawSymbol = ((req.query.symbol as string) || "AAPL");
    const symbol = INDEX_SYMBOL_MAP[rawSymbol] || rawSymbol;
    const range = (req.query.range as string) || "1M";
    try {
      const candles = await getCandles(symbol, range);
      if (candles.length > 0) return res.json(candles);
      const cached = priceCache.get(symbol.toUpperCase()) || [];
      if (cached.length > 0) return res.json(cached);
      const q = await getQuote(symbol);
      pushToCache(symbol.toUpperCase(), q.price);
      return res.json([{ timestamp: new Date().toISOString(), price: q.price }]);
    } catch (err) {
      console.error("[History] Failed for " + symbol + ":", err);
      return res.status(500).json({ message: "Failed to fetch price history" });
    }
  });

  // ── IPOs ────────────────────────────────────────────────
  app.get(api.ipos.list.path, async (req, res) => {
    try {
      const ipos = await getIPOCalendar();
      res.json(ipos);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch IPOs" });
    }
  });

  // ── News ────────────────────────────────────────────────
  app.get(api.news.bySymbol.path, async (req, res) => {
    const symbol = (req.query.symbol as string) || "AAPL";
    try {
      const news = await getCompanyNews(symbol);
      res.json(news);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch news" });
    }
  });

  // ── Watchlist ───────────────────────────────────────────
  app.get(api.watchlist.list.path, async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
    const list = await storage.getWatchlist(req.session.userId);
    res.json(list);
  });

  app.post(api.watchlist.add.path, async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
    try {
      const input = api.watchlist.add.input.parse(req.body);
      const item = await storage.addToWatchlist({ ...input, userId: req.session.userId });
      res.status(201).json(item);
    } catch {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.delete(api.watchlist.remove.path, async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
    await storage.removeFromWatchlist(req.session.userId, req.params.symbol);
    res.json({ success: true });
  });

  // ── Trading ─────────────────────────────────────────────
  app.post(api.trading.buy.path, async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
    try {
      const { symbol, quantity, price } = api.trading.buy.input.parse(req.body);
      const stock = DEFAULT_STOCKS.find(s => s.symbol === symbol.toUpperCase());
      if (!stock) return res.status(400).json({ message: "Stock not found" });
      const result = await storage.buyStock(req.session.userId, {
        symbol: symbol.toUpperCase(),
        companyName: stock.company,
        quantity: quantity.toString(),
        price,
        totalCost: quantity * price,
      });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Transaction failed" });
    }
  });

  app.post(api.trading.sell.path, async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
    try {
      const { symbol, quantity, price } = api.trading.sell.input.parse(req.body);
      const stock = DEFAULT_STOCKS.find(s => s.symbol === symbol.toUpperCase());
      if (!stock) return res.status(400).json({ message: "Stock not found" });
      const result = await storage.sellStock(req.session.userId, {
        symbol: symbol.toUpperCase(),
        companyName: stock.company,
        quantity: quantity.toString(),
        price,
        totalValue: quantity * price,
      });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Transaction failed" });
    }
  });

  app.get(api.trading.holdings.path, async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
    const userHoldings = await storage.getHoldings(req.session.userId);
    res.json(userHoldings);
  });

  app.get(api.trading.portfolio.path, async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
    const userHoldings = await storage.getHoldings(req.session.userId);

    let totalCost = 0;
    let totalValue = 0;

    const holdingsWithLivePrices = await Promise.all(
      userHoldings.map(async (holding) => {
        let currentPrice = Number(holding.averagePrice);
        try {
          const quote = await getQuote(holding.symbol);
          currentPrice = quote.price;
        } catch {
          // fallback to average price if quote fails
        }
        const currentValue = currentPrice * Number(holding.quantity);
        const cost = Number(holding.totalCost);
        const returns = currentValue - cost;
        const returnsPercent = cost > 0 ? (returns / cost) * 100 : 0;
        totalCost += cost;
        totalValue += currentValue;
        return {
          ...holding,
          currentPrice,
          currentValue,
          returns,
          returnsPercent,
        };
      })
    );

    res.json({
      totalValue,
      totalCost,
      totalReturns: totalValue - totalCost,
      returnsPercent: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
      holdings: holdingsWithLivePrices,
    });
  });

  // ── WebSocket — Live Prices + Community Chat ────────────
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  // Track authenticated WS sessions
  const wsUsers = new Map<WebSocket, { userId: string; username: string }>();

  wss.on("connection", (ws, req) => {
    console.log("Client connected to WebSocket");

    // Send last 50 chat messages on connect
    storage.getChatMessages(50).then((messages) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "chat_history", data: messages }));
      }
    });

    ws.on("message", async (raw) => {
      try {
        const parsed = JSON.parse(raw.toString());

        // ── Auth handshake: client sends { type: "auth", userId }
        if (parsed.type === "auth" && parsed.userId) {
          const user = await storage.getUser(parsed.userId);
          if (user) {
            wsUsers.set(ws, { userId: user.id, username: user.name });
          }
          return;
        }

        // ── Chat message: client sends { type: "chat_message", text }
        if (parsed.type === "chat_message" && parsed.text) {
          const wsUser = wsUsers.get(ws);
          if (!wsUser) {
            ws.send(JSON.stringify({ type: "error", data: "Not authenticated" }));
            return;
          }
          const msg = await storage.addChatMessage(
            wsUser.userId,
            wsUser.username,
            parsed.text
          );
          // Broadcast to all connected clients
          const payload = JSON.stringify({ type: "chat_message", data: msg });
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(payload);
            }
          });
        }
      } catch (e) {
        console.error("[WS] Failed to handle message:", e);
      }
    });

    ws.on("error", console.error);
    ws.on("close", () => {
      wsUsers.delete(ws);
      console.log("Client disconnected");
    });
  });

  // ── Live Price Push every 15s ───────────────────────────
  // Finnhub free tier: 60 calls/min — 8 stocks + 3 indices = 11 calls per tick
  setInterval(async () => {
    if (wss.clients.size === 0) return; // skip if no clients connected

    try {
      // Push stock prices
      for (const { symbol } of DEFAULT_STOCKS) {
        const q = await getQuote(symbol);
        pushToCache(symbol, q.price);
        const payload = JSON.stringify({
          type: "priceUpdate",
          data: {
            symbol,
            price: q.price,
            change: q.change,
            changePercent: q.changePercent,
          },
        });
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) client.send(payload);
        });
      }

      // Push index updates
      for (const { symbol, name } of INDEX_SYMBOLS) {
        const q = await getQuote(symbol);
        const payload = JSON.stringify({
          type: "indexUpdate",
          data: {
            name,
            value: q.price,
            change: q.change,
            changePercent: q.changePercent,
          },
        });
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) client.send(payload);
        });
      }
    } catch (e) {
      console.error("[WS] Price push failed:", e);
    }
  }, 15000);

  return httpServer;
}

