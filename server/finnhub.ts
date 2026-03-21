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
  if (symbol.endsWith(".NS") || symbol.endsWith(".BO")) return getYahooQuote(symbol);
  const data = await get<any>(`/quote?symbol=${symbol}`);
  return {
    symbol,
    price: data.c ?? 0, change: data.d ?? 0, changePercent: data.dp ?? 0,
    high: data.h ?? 0, low: data.l ?? 0, open: data.o ?? 0,
  };
}

export async function getYahooQuote(symbol: string) {
  return new Promise<{ symbol: string; price: number; change: number; changePercent: number; high: number; low: number; open: number }>((resolve, reject) => {
    const options = {
      hostname: "query1.finance.yahoo.com",
      path: `/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
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
    const options = {
      hostname: "query1.finance.yahoo.com",
      path: `/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${yahooRange}`,
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
  if (symbol.endsWith(".NS") || symbol.endsWith(".BO")) return getYahooCandles(symbol, range);
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

// ── Indices — Indian + US ─────────────────────────────────
export const INDEX_SYMBOLS = [
  { symbol: "^NSEI",  name: "Nifty 50" },
  { symbol: "^BSESN", name: "Sensex" },
  { symbol: "SPY",    name: "S&P 500" },
  { symbol: "QQQ",    name: "Nasdaq" },
];

// ── Stocks with sector tags ───────────────────────────────
export const DEFAULT_STOCKS = [
  // 🇮🇳 Nifty 50 / Sensex — Banking & Finance
  { symbol: "HDFCBANK.NS",    company: "HDFC Bank",              sector: "Banking" },
  { symbol: "ICICIBANK.NS",   company: "ICICI Bank",             sector: "Banking" },
  { symbol: "SBIN.NS",        company: "State Bank of India",    sector: "Banking" },
  { symbol: "KOTAKBANK.NS",   company: "Kotak Mahindra Bank",    sector: "Banking" },
  { symbol: "AXISBANK.NS",    company: "Axis Bank",              sector: "Banking" },
  { symbol: "BAJFINANCE.NS",  company: "Bajaj Finance",          sector: "Finance" },
  // 🇮🇳 IT
  { symbol: "TCS.NS",         company: "Tata Consultancy",       sector: "IT" },
  { symbol: "INFY.NS",        company: "Infosys",                sector: "IT" },
  { symbol: "WIPRO.NS",       company: "Wipro",                  sector: "IT" },
  { symbol: "HCLTECH.NS",     company: "HCL Technologies",       sector: "IT" },
  { symbol: "TECHM.NS",       company: "Tech Mahindra",          sector: "IT" },
  // 🇮🇳 Energy & Industrial
  { symbol: "RELIANCE.NS",    company: "Reliance Industries",    sector: "Energy" },
  { symbol: "NTPC.NS",        company: "NTPC",                   sector: "Energy" },
  { symbol: "POWERGRID.NS",   company: "Power Grid Corp",        sector: "Energy" },
  { symbol: "ONGC.NS",        company: "ONGC",                   sector: "Energy" },
  { symbol: "LT.NS",          company: "Larsen & Toubro",        sector: "Industrial" },
  // 🇮🇳 Consumer & Auto
  { symbol: "HINDUNILVR.NS",  company: "Hindustan Unilever",     sector: "Consumer" },
  { symbol: "ITC.NS",         company: "ITC Ltd",                sector: "Consumer" },
  { symbol: "MARUTI.NS",      company: "Maruti Suzuki",          sector: "Auto" },
  { symbol: "TATAMOTORS.NS",  company: "Tata Motors",            sector: "Auto" },
  { symbol: "TITAN.NS",       company: "Titan Company",          sector: "Consumer" },
  // 🇮🇳 Pharma & Telecom
  { symbol: "SUNPHARMA.NS",   company: "Sun Pharma",             sector: "Pharma" },
  { symbol: "BHARTIARTL.NS",  company: "Bharti Airtel",          sector: "Telecom" },
  { symbol: "ADANIENT.NS",    company: "Adani Enterprises",      sector: "Industrial" },
  // 🇺🇸 US Tech
  { symbol: "AAPL",           company: "Apple Inc.",             sector: "Tech" },
  { symbol: "MSFT",           company: "Microsoft",              sector: "Tech" },
  { symbol: "GOOGL",          company: "Alphabet",               sector: "Tech" },
  { symbol: "NVDA",           company: "NVIDIA",                 sector: "Tech" },
  { symbol: "META",           company: "Meta Platforms",         sector: "Tech" },
  { symbol: "AMZN",           company: "Amazon",                 sector: "Tech" },
  { symbol: "TSLA",           company: "Tesla",                  sector: "Auto" },
  { symbol: "NFLX",           company: "Netflix",                sector: "Tech" },
  { symbol: "AMD",            company: "AMD",                    sector: "Tech" },
  { symbol: "INTC",           company: "Intel",                  sector: "Tech" },
  { symbol: "V",              company: "Visa",                   sector: "Finance" },
];
