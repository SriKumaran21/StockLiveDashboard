import { db } from "./db";
import {
  users, watchlists, transactions, holdings, chatMessages, sips,
  type User, type InsertUser, type Watchlist, type InsertWatchlist,
  type Transaction, type InsertTransaction, type Holding, type InsertHolding,
  type ChatMessage, type Sip
} from "@shared/schema";
import { eq, and, asc, lte } from "drizzle-orm";

export interface IStorage {
  getSips(userId: string): Promise<Sip[]>;
  createSip(data: { userId: string; symbol: string; companyName: string; amount: number; frequency: string; nextRunAt: Date }): Promise<Sip>;
  deleteSip(id: string, userId: string): Promise<void>;
  toggleSip(id: string, userId: string, active: boolean): Promise<Sip>;
  getDueSips(): Promise<Sip[]>;
  updateSipNextRun(id: string, nextRunAt: Date): Promise<void>;

  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: string, newBalance: string): Promise<User>;
  
  getWatchlist(userId: string): Promise<Watchlist[]>;
  addToWatchlist(item: InsertWatchlist & { userId: string }): Promise<Watchlist>;
  removeFromWatchlist(userId: string, symbol: string): Promise<void>;
  
  addTransaction(transaction: InsertTransaction & { userId: string }): Promise<Transaction>;
  
  getHoldings(userId: string): Promise<Holding[]>;
  buyStock(userId: string, data: { symbol: string; companyName: string; quantity: string; price: number; totalCost: number }): Promise<{ success: boolean; holding: Holding; transaction: User }>;
  sellStock(userId: string, data: { symbol: string; companyName: string; quantity: string; price: number; totalValue: number }): Promise<{ success: boolean; holding?: Holding; transaction: User }>;

  getChatMessages(limit: number): Promise<ChatMessage[]>;
  addChatMessage(userId: string, username: string, message: string): Promise<ChatMessage>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserBalance(userId: string, newBalance: string): Promise<User> {
    const [user] = await db.update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getWatchlist(userId: string): Promise<Watchlist[]> {
    return await db.select().from(watchlists).where(eq(watchlists.userId, userId));
  }

  async addToWatchlist(item: InsertWatchlist & { userId: string }): Promise<Watchlist> {
    const [watchlist] = await db.insert(watchlists).values({
      userId: item.userId,
      symbol: item.symbol,
      companyName: item.companyName
    }).returning();
    return watchlist;
  }

  async removeFromWatchlist(userId: string, symbol: string): Promise<void> {
    await db.delete(watchlists).where(and(eq(watchlists.userId, userId), eq(watchlists.symbol, symbol)));
  }

  async addTransaction(transaction: InsertTransaction & { userId: string }): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values({
      userId: transaction.userId,
      amount: transaction.amount,
      type: transaction.type
    }).returning();
    return newTransaction;
  }

  async getHoldings(userId: string): Promise<Holding[]> {
    return await db.select().from(holdings).where(eq(holdings.userId, userId));
  }

  async buyStock(userId: string, data: { symbol: string; companyName: string; quantity: string; price: number; totalCost: number }): Promise<{ success: boolean; holding: Holding; transaction: User }> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const currentBalance = Number(user.balance);
    if (currentBalance < data.totalCost) {
      throw new Error("Insufficient balance");
    }

    const existingHoldings = await this.getHoldings(userId);
    const existingHolding = existingHoldings.find(h => h.symbol === data.symbol);

    let holding: Holding;

    if (existingHolding) {
      const currentQuantity = Number(existingHolding.quantity);
      const currentTotalCost = Number(existingHolding.totalCost);
      const newQuantity = currentQuantity + Number(data.quantity);
      const newTotalCost = currentTotalCost + data.totalCost;
      const newAveragePrice = newTotalCost / newQuantity;

      const [updatedHolding] = await db.update(holdings)
        .set({
          quantity: newQuantity.toString(),
          averagePrice: newAveragePrice.toString(),
          totalCost: newTotalCost.toString(),
          updatedAt: new Date()
        })
        .where(eq(holdings.id, existingHolding.id))
        .returning();

      holding = updatedHolding;
    } else {
      const [newHolding] = await db.insert(holdings).values({
        userId,
        symbol: data.symbol,
        companyName: data.companyName,
        quantity: data.quantity,
        averagePrice: data.price.toString(),
        totalCost: data.totalCost.toString()
      }).returning();

      holding = newHolding;
    }

    const newBalance = currentBalance - data.totalCost;
    const updatedUser = await this.updateUserBalance(userId, newBalance.toString());

    await this.addTransaction({
      userId,
      amount: (-data.totalCost).toString(),
      type: 'debit'
    });

    return { success: true, holding, transaction: updatedUser };
  }

  async sellStock(userId: string, data: { symbol: string; companyName: string; quantity: string; price: number; totalValue: number }): Promise<{ success: boolean; holding?: Holding; transaction: User }> {
    const userHoldings = await this.getHoldings(userId);
    const holding = userHoldings.find(h => h.symbol === data.symbol);

    if (!holding || Number(holding.quantity) < Number(data.quantity)) {
      throw new Error("Insufficient holdings");
    }

    const currentQuantity = Number(holding.quantity);
    const currentTotalCost = Number(holding.totalCost);
    const sellQuantity = Number(data.quantity);
    const proportionalCost = (currentTotalCost / currentQuantity) * sellQuantity;

    let updatedHolding: Holding | undefined;

    if (currentQuantity === sellQuantity) {
      await db.delete(holdings).where(eq(holdings.id, holding.id));
    } else {
      const newQuantity = currentQuantity - sellQuantity;
      const newTotalCost = currentTotalCost - proportionalCost;

      const [updated] = await db.update(holdings)
        .set({
          quantity: newQuantity.toString(),
          totalCost: newTotalCost.toString(),
          updatedAt: new Date()
        })
        .where(eq(holdings.id, holding.id))
        .returning();

      updatedHolding = updated;
    }

    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const newBalance = Number(user.balance) + data.totalValue;
    const updatedUser = await this.updateUserBalance(userId, newBalance.toString());

    await this.addTransaction({
      userId,
      amount: data.totalValue.toString(),
      type: 'credit'
    });

    return { success: true, holding: updatedHolding, transaction: updatedUser };
  }

  // ── SIP Plans ─────────────────────────────────────────────
  async getSips(userId: string): Promise<Sip[]> {
    return await db.select().from(sips).where(eq(sips.userId, userId)).orderBy(asc(sips.createdAt));
  }

  async createSip(data: { userId: string; symbol: string; companyName: string; amount: number; frequency: string; nextRunAt: Date }): Promise<Sip> {
    const [sip] = await db.insert(sips).values({
      userId: data.userId,
      symbol: data.symbol,
      companyName: data.companyName,
      amount: data.amount.toString(),
      frequency: data.frequency,
      active: 'true',
      nextRunAt: data.nextRunAt,
    }).returning();
    return sip;
  }

  async deleteSip(id: string, userId: string): Promise<void> {
    await db.delete(sips).where(and(eq(sips.id, id), eq(sips.userId, userId)));
  }

  async toggleSip(id: string, userId: string, active: boolean): Promise<Sip> {
    const [sip] = await db.update(sips)
      .set({ active: active ? 'true' : 'false' })
      .where(and(eq(sips.id, id), eq(sips.userId, userId)))
      .returning();
    return sip;
  }

  async getDueSips(): Promise<Sip[]> {
    return await db.select().from(sips)
      .where(and(eq(sips.active, 'true'), lte(sips.nextRunAt, new Date())));
  }

  async updateSipNextRun(id: string, nextRunAt: Date): Promise<void> {
    await db.update(sips).set({ nextRunAt }).where(eq(sips.id, id));
  }

  // ── Community Chat ───────────────────────────────────────
  async getChatMessages(limit: number): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .orderBy(asc(chatMessages.createdAt))
      .limit(limit);
  }

  async addChatMessage(userId: string, username: string, message: string): Promise<ChatMessage> {
    const [msg] = await db
      .insert(chatMessages)
      .values({ userId, username, message })
      .returning();
    return msg;
  }
}

export const storage = new DatabaseStorage();