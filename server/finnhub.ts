import https from "https";

const API_KEY = process.env.FINNHUB_API_KEY!;
const BASE_URL = "finnhub.io";

function get<T>(path: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      path: `/api/v1${path}&token=${API_KEY}`,
      method: "GET",
      headers: { "Content-Type": "application/json" },
    };
    https.get(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error("Failed to parse Finnhub response")); }
      });
    }).on("error", reject);
  });
}

export async function getQuote(symbol: string) {
  if (symbol.endsWith(".NS") || symbol.endsWith(".BO")) {
    return getYahooQuote(symbol);
  }
  const data = await get<any>(`/quote?symbol=${symbol}`);
  return {
    symbol,
    price: data.c ?? 0,
    change: data.d ?? 0,
    changePercent: data.dp ?? 0,
    high: data.h ?? 0,
    low: data.l ?? 0,
    open: data.o ?? 0,
  };
}

export async function getYahooQuote(symbol: string) {
  return new Promise<{ symbol: string; price: number; change: number; changePercent: number; high: number; low: number; open: number }>((resolve, reject) => {
    const encodedSymbol = encodeURIComponent(symbol);
    const options = {
      hostname: "query1.finance.yahoo.com",
      path: `/v8/finance/chart/${encodedSymbol}?interval=1d&range=1d`,
      method: "GET",
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
    };
    https.get(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          const meta = json?.chart?.result?.[0]?.meta;
          if (!meta) return resolve({ symbol, price: 0, change: 0, changePercent: 0, high: 0, low: 0, open: 0 });
          const price = meta.regularMarketPrice ?? 0;
          const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
          const change = parseFloat((price - prevClose).toFixed(2));
          const changePercent = prevClose ? parseFloat(((change / prevClose) * 100).toFixed(2)) : 0;
          resolve({ symbol, price, change, changePercent, high: meta.regularMarketDayHigh ?? 0, low: meta.regularMarketDayLow ?? 0, open: meta.regularMarketOpen ?? 0 });
        } catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}

export async function getYahooCandles(symbol: string, range: string) {
  const { interval, yahooRange } = rangeToYahooParams(range);
  return new Promise<Array<{ timestamp: string; price: number; open: number; high: number; low: number; volume: number }>>((resolve, reject) => {
    const encodedSymbol = encodeURIComponent(symbol);
    const options = {
      hostname: "query1.finance.yahoo.com",
      path: `/v8/finance/chart/${encodedSymbol}?interval=${interval}&range=${yahooRange}`,
      method: "GET",
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
    };
    https.get(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          const result = json?.chart?.result?.[0];
          if (!result?.timestamp) return resolve([]);
          const q = result.indicators?.quote?.[0] ?? {};
          const candles = result.timestamp
            .map((ts: number, i: number) => ({
              timestamp: new Date(ts * 1000).toISOString(),
              price: q.close?.[i] ?? null,
              open: q.open?.[i] ?? 0,
              high: q.high?.[i] ?? 0,
              low: q.low?.[i] ?? 0,
              volume: q.volume?.[i] ?? 0,
            }))
            .filter((c: any) => c.price !== null && c.price > 0);
          resolve(candles);
        } catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}

function rangeToYahooParams(range: string): { interval: string; yahooRange: string } {
  switch (range) {
    case "1D": return { interval: "5m",  yahooRange: "1d" };
    case "1W": return { interval: "30m", yahooRange: "5d" };
    case "1M": return { interval: "1d",  yahooRange: "1mo" };
    case "3M": return { interval: "1d",  yahooRange: "3mo" };
    case "1Y": return { interval: "1wk", yahooRange: "1y" };
    case "5Y": return { interval: "1mo", yahooRange: "5y" };
    default:   return { interval: "1d",  yahooRange: "1mo" };
  }
}

function rangeToFinnhubParams(range: string): { resolution: string; fromOffset: number } {
  const DAY = 86400;
  switch (range) {
    case "1D": return { resolution: "5",  fromOffset: DAY };
    case "1W": return { resolution: "30", fromOffset: 7 * DAY };
    case "1M": return { resolution: "D",  fromOffset: 30 * DAY };
    case "3M": return { resolution: "D",  fromOffset: 90 * DAY };
    case "1Y": return { resolution: "W",  fromOffset: 365 * DAY };
    case "5Y": return { resolution: "M",  fromOffset: 5 * 365 * DAY };
    default:   return { resolution: "D",  fromOffset: 30 * DAY };
  }
}

export async function getCandles(symbol: string, range: string = "1M") {
  if (symbol.endsWith(".NS") || symbol.endsWith(".BO")) {
    return getYahooCandles(symbol, range);
  }
  try {
    const { resolution, fromOffset } = rangeToFinnhubParams(range);
    const to = Math.floor(Date.now() / 1000);
    const from = to - fromOffset;
    const data = await get<any>(`/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}`);
    if (data.s === "ok" && data.t?.length > 0) {
      return data.t.map((timestamp: number, i: number) => ({
        timestamp: new Date(timestamp * 1000).toISOString(),
        price: data.c[i], open: data.o[i], high: data.h[i], low: data.l[i], volume: data.v[i],
      }));
    }
  } catch (e) {
    console.warn(`[Finnhub] Candles failed for ${symbol}, falling back to Yahoo`);
  }
  return getYahooCandles(symbol, range);
}

export async function getCompanyNews(symbol: string) {
  const to = new Date().toISOString().split("T")[0];
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const data = await get<any[]>(`/company-news?symbol=${symbol}&from=${from}&to=${to}`);
  return (Array.isArray(data) ? data : []).slice(0, 20).map((n) => ({
    headline: n.headline, summary: n.summary, url: n.url,
    source: n.source, datetime: n.datetime, image: n.image, symbol,
  }));
}

export async function getIPOCalendar() {
  const from = new Date().toISOString().split("T")[0];
  const to = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const data = await get<any>(`/calendar/ipo?from=${from}&to=${to}`);
  return (data.ipoCalendar || []).slice(0, 10).map((ipo: any) => ({
    company: ipo.name, symbol: ipo.symbol, openDate: ipo.date, closeDate: ipo.date,
    priceRange: ipo.price ? `$${ipo.price}` : "TBD",
    minQty: ipo.shares ? Math.ceil(ipo.shares / 1000) : 1,
  }));
}

export const INDEX_SYMBOLS = [
  { symbol: "SPY", name: "S&P 500" },
  { symbol: "QQQ", name: "Nasdaq 100" },
  { symbol: "DIA", name: "Dow Jones" },
];

export const DEFAULT_STOCKS = [
  { symbol: "AAPL",          company: "Apple Inc." },
  { symbol: "MSFT",          company: "Microsoft Corp." },
  { symbol: "GOOGL",         company: "Alphabet Inc." },
  { symbol: "TSLA",          company: "Tesla Inc." },
  { symbol: "AMZN",          company: "Amazon.com Inc." },
  { symbol: "NVDA",          company: "NVIDIA Corp." },
  { symbol: "META",          company: "Meta Platforms" },
  { symbol: "NFLX",          company: "Netflix Inc." },
  { symbol: "AMD",           company: "Advanced Micro Devices" },
  { symbol: "INTC",          company: "Intel Corp." },
  { symbol: "V",             company: "Visa Inc." },
  { symbol: "BABA",          company: "Alibaba Group" },
  { symbol: "RELIANCE.NS",   company: "Reliance Industries" },
  { symbol: "TCS.NS",        company: "Tata Consultancy Services" },
  { symbol: "INFY.NS",       company: "Infosys Ltd." },
  { symbol: "HDFCBANK.NS",   company: "HDFC Bank Ltd." },
  { symbol: "ICICIBANK.NS",  company: "ICICI Bank Ltd." },
  { symbol: "WIPRO.NS",      company: "Wipro Ltd." },
  { symbol: "SBIN.NS",       company: "State Bank of India" },
  { symbol: "TATAMOTORS.NS", company: "Tata Motors Ltd." },
  { symbol: "BAJFINANCE.NS", company: "Bajaj Finance Ltd." },
  { symbol: "ADANIENT.NS",   company: "Adani Enterprises" },
];
