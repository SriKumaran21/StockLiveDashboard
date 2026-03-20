import { z } from 'zod';
import { insertUserSchema, insertWatchlistSchema, users, watchlists, insertHoldingSchema, holdings } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const stockSchema = z.object({
  symbol: z.string(),
  company: z.string(),
  price: z.number(),
  change: z.number(),
  changePercent: z.number(),
  volume: z.number()
});

export const ipoSchema = z.object({
  company: z.string(),
  openDate: z.string(),
  closeDate: z.string(),
  priceRange: z.string(),
  minQty: z.number()
});

export const indexSchema = z.object({
  name: z.string(),
  value: z.number(),
  change: z.number(),
  changePercent: z.number()
});

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/auth/register' as const,
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      }
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({ email: z.string().email(), password: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      }
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: {
        200: z.object({ message: z.string() })
      }
    },
    me: {
      method: 'GET' as const,
      path: '/api/user/profile' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      }
    }
  },
  user: {
    balance: {
      method: 'PUT' as const,
      path: '/api/user/balance' as const,
      input: z.object({ amount: z.coerce.number() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      }
    }
  },
  stocks: {
    indices: {
      method: 'GET' as const,
      path: '/api/stocks/indices' as const,
      responses: {
        200: z.array(indexSchema)
      }
    },
    all: {
      method: 'GET' as const,
      path: '/api/stocks/all' as const,
      responses: {
        200: z.array(stockSchema)
      }
    },
    gainers: {
      method: 'GET' as const,
      path: '/api/stocks/gainers' as const,
      responses: {
        200: z.array(stockSchema)
      }
    },
    losers: {
      method: 'GET' as const,
      path: '/api/stocks/losers' as const,
      responses: {
        200: z.array(stockSchema)
      }
    },
    search: {
      method: 'GET' as const,
      path: '/api/stocks/search' as const,
      input: z.object({ q: z.string() }).optional(),
      responses: {
        200: z.array(stockSchema)
      }
    },
    history: {
      method: 'GET' as const,
      path: '/api/stocks/history' as const,
      input: z.object({ symbol: z.string(), range: z.string() }).optional(),
      responses: {
        200: z.array(z.object({ timestamp: z.string(), price: z.number() }))
      }
    }
  },
  ipos: {
    list: {
      method: 'GET' as const,
      path: '/api/ipos' as const,
      responses: {
        200: z.array(ipoSchema)
      }
    }
  },
  news: {
    bySymbol: {
      method: 'GET' as const,
      path: '/api/news' as const,
      input: z.object({ symbol: z.string() }).optional(),
      responses: {
        200: z.array(z.object({
          headline: z.string(),
          summary: z.string(),
          url: z.string(),
          source: z.string(),
          datetime: z.number(),
          image: z.string(),
          symbol: z.string(),
        }))
      }
    }
  },
  watchlist: {
    list: {
      method: 'GET' as const,
      path: '/api/watchlist' as const,
      responses: {
        200: z.array(z.custom<typeof watchlists.$inferSelect>()),
        401: errorSchemas.unauthorized,
      }
    },
    add: {
      method: 'POST' as const,
      path: '/api/watchlist/add' as const,
      input: insertWatchlistSchema,
      responses: {
        201: z.custom<typeof watchlists.$inferSelect>(),
        401: errorSchemas.unauthorized,
      }
    },
    remove: {
      method: 'DELETE' as const,
      path: '/api/watchlist/remove/:symbol' as const,
      responses: {
        200: z.object({ success: z.boolean() }),
        401: errorSchemas.unauthorized,
      }
    }
  },
  trading: {
    buy: {
      method: 'POST' as const,
      path: '/api/trading/buy' as const,
      input: z.object({ 
        symbol: z.string(),
        quantity: z.number().positive(),
        price: z.number().positive()
      }),
      responses: {
        200: z.object({ 
          success: z.boolean(),
          holding: z.custom<typeof holdings.$inferSelect>(),
          transaction: z.custom<typeof users.$inferSelect>()
        }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      }
    },
    sell: {
      method: 'POST' as const,
      path: '/api/trading/sell' as const,
      input: z.object({ 
        symbol: z.string(),
        quantity: z.number().positive(),
        price: z.number().positive()
      }),
      responses: {
        200: z.object({ 
          success: z.boolean(),
          holding: z.custom<typeof holdings.$inferSelect>().optional(),
          transaction: z.custom<typeof users.$inferSelect>()
        }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      }
    },
    holdings: {
      method: 'GET' as const,
      path: '/api/trading/holdings' as const,
      responses: {
        200: z.array(z.custom<typeof holdings.$inferSelect>()),
        401: errorSchemas.unauthorized,
      }
    },
    portfolio: {
      method: 'GET' as const,
      path: '/api/trading/portfolio' as const,
      responses: {
        200: z.object({
          totalValue: z.number(),
          totalCost: z.number(),
          totalReturns: z.number(),
          returnsPercent: z.number(),
          holdings: z.array(z.object({
            id: z.string(),
            userId: z.string(),
            symbol: z.string(),
            companyName: z.string(),
            quantity: z.string(),
            averagePrice: z.string(),
            totalCost: z.string(),
            createdAt: z.string(),
            updatedAt: z.string(),
            currentPrice: z.number(),
            currentValue: z.number(),
            returns: z.number(),
            returnsPercent: z.number()
          }))
        }),
        401: errorSchemas.unauthorized,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export const ws = {
  receive: {
    priceUpdate: z.object({
      symbol: z.string(),
      price: z.number(),
      change: z.number(),
      changePercent: z.number()
    }),
    indexUpdate: z.object({
      name: z.string(),
      value: z.number(),
      change: z.number(),
      changePercent: z.number()
    })
  }
};
