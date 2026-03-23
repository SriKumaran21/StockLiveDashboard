import { pgTable, text, timestamp, numeric, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  balance: numeric("balance").notNull().default('0'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const watchlists = pgTable("watchlists", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  symbol: text("symbol").notNull(),
  companyName: text("company_name").notNull(),
  addedAt: timestamp("added_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  amount: numeric("amount").notNull(),
  type: text("type").notNull(), // 'credit' | 'debit' | 'buy' | 'sell'
  symbol: text("symbol"),
  companyName: text("company_name"),
  quantity: numeric("quantity"),
  price: numeric("price"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const holdings = pgTable("holdings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  symbol: text("symbol").notNull(),
  companyName: text("company_name").notNull(),
  quantity: numeric("quantity").notNull(),
  averagePrice: numeric("average_price").notNull(),
  totalCost: numeric("total_cost").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  watchlists: many(watchlists),
  transactions: many(transactions),
  holdings: many(holdings),
}));

export const watchlistsRelations = relations(watchlists, ({ one }) => ({
  user: one(users, {
    fields: [watchlists.userId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const holdingsRelations = relations(holdings, ({ one }) => ({
  user: one(users, {
    fields: [holdings.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, balance: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertWatchlistSchema = createInsertSchema(watchlists).omit({ id: true, addedAt: true, userId: true });
export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;
export type Watchlist = typeof watchlists.$inferSelect;

export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, timestamp: true, userId: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export const insertHoldingSchema = createInsertSchema(holdings).omit({ id: true, createdAt: true, updatedAt: true, userId: true });
export type InsertHolding = z.infer<typeof insertHoldingSchema>;
export type Holding = typeof holdings.$inferSelect;

// ── SIP Plans ────────────────────────────────────────────────
export const sips = pgTable("sips", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  symbol: text("symbol").notNull(),
  companyName: text("company_name").notNull(),
  amount: numeric("amount").notNull(),
  frequency: text("frequency").notNull(), // 'daily' | 'weekly' | 'monthly' | 'quarterly'
  active: text("active").notNull().default('true'),
  nextRunAt: timestamp("next_run_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sipsRelations = relations(sips, ({ one }) => ({
  user: one(users, { fields: [sips.userId], references: [users.id] }),
}));

export type Sip = typeof sips.$inferSelect;
export type InsertSip = typeof sips.$inferInsert;

// ── Price Alerts ────────────────────────────────────────────
export const priceAlerts = pgTable("price_alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  symbol: text("symbol").notNull(),
  targetPrice: numeric("target_price").notNull(),
  condition: text("condition").notNull(), // 'above' | 'below'
  triggered: text("triggered").notNull().default('false'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const priceAlertsRelations = relations(priceAlerts, ({ one }) => ({
  user: one(users, { fields: [priceAlerts.userId], references: [users.id] }),
}));

export type PriceAlert = typeof priceAlerts.$inferSelect;
export type InsertPriceAlert = typeof priceAlerts.$inferInsert;

// ── Community Chat ───────────────────────────────────────────
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  username: text("username").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true, userId: true });
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
