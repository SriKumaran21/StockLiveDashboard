import {
  type User, type InsertUser, type Watchlist, type InsertWatchlist,
  type Transaction, type InsertTransaction, type Holding, type InsertHolding,
  type ChatMessage, type Sip
} from "@shared/schema";
import { randomUUID } from "crypto";

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

// ── In-Memory Storage ─────────────────────────────────────────────────────────
// Fully functional store — no database required.
// Data is reset on server restart (perfect for development / DB-quota situations).

class InMemoryStorage implements IStorage {
  private users       = new Map<string, User>();
  private watchlists  = new Map<string, Watchlist>();
  private transactions= new Map<string, Transaction>();
  private holdings    = new Map<string, Holding>();
  private chatMsgs    = new Map<string, ChatMessage>();
  private sipsMap     = new Map<string, Sip>();

  // ── Users ───────────────────────────────────────────────────
  async getUser(id: string) { return this.users.get(id); }

  async getUserByEmail(email: string) {
    return [...this.users.values()].find(u => u.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const user: User = {
      id,
      email: insertUser.email,
      password: insertUser.password,
      name: insertUser.name,
      balance: "100000", // ₹1,00,000 starting balance
      createdAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(userId: string, newBalance: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    const updated = { ...user, balance: newBalance };
    this.users.set(userId, updated);
    return updated;
  }

  // ── Watchlist ───────────────────────────────────────────────
  async getWatchlist(userId: string): Promise<Watchlist[]> {
    return [...this.watchlists.values()].filter(w => w.userId === userId);
  }

  async addToWatchlist(item: InsertWatchlist & { userId: string }): Promise<Watchlist> {
    const id = randomUUID();
    const wl: Watchlist = {
      id,
      userId: item.userId,
      symbol: item.symbol,
      companyName: item.companyName,
      addedAt: new Date(),
    };
    this.watchlists.set(id, wl);
    return wl;
  }

  async removeFromWatchlist(userId: string, symbol: string): Promise<void> {
    for (const [key, wl] of this.watchlists) {
      if (wl.userId === userId && wl.symbol === symbol) {
        this.watchlists.delete(key);
        break;
      }
    }
  }

  // ── Transactions ────────────────────────────────────────────
  async addTransaction(tx: InsertTransaction & { userId: string }): Promise<Transaction> {
    const id = randomUUID();
    const t: Transaction = {
      id,
      userId: tx.userId,
      amount: tx.amount,
      type: tx.type,
      symbol: tx.symbol ?? null,
      companyName: tx.companyName ?? null,
      quantity: tx.quantity ?? null,
      price: tx.price ?? null,
      timestamp: new Date(),
    };
    this.transactions.set(id, t);
    return t;
  }

  // ── Holdings ────────────────────────────────────────────────
  async getHoldings(userId: string): Promise<Holding[]> {
    return [...this.holdings.values()].filter(h => h.userId === userId);
  }

  async buyStock(userId: string, data: { symbol: string; companyName: string; quantity: string; price: number; totalCost: number }): Promise<{ success: boolean; holding: Holding; transaction: User }> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const currentBalance = Number(user.balance);
    if (currentBalance < data.totalCost) throw new Error("Insufficient balance");

    const existing = [...this.holdings.values()].find(h => h.userId === userId && h.symbol === data.symbol);
    let holding: Holding;

    if (existing) {
      const newQty   = Number(existing.quantity) + Number(data.quantity);
      const newCost  = Number(existing.totalCost) + data.totalCost;
      const newAvg   = newCost / newQty;
      const updated: Holding = {
        ...existing,
        quantity:     newQty.toString(),
        averagePrice: newAvg.toString(),
        totalCost:    newCost.toString(),
        updatedAt:    new Date(),
      };
      this.holdings.set(existing.id, updated);
      holding = updated;
    } else {
      const id = randomUUID();
      const now = new Date();
      const h: Holding = {
        id,
        userId,
        symbol:       data.symbol,
        companyName:  data.companyName,
        quantity:     data.quantity,
        averagePrice: data.price.toString(),
        totalCost:    data.totalCost.toString(),
        createdAt:    now,
        updatedAt:    now,
      };
      this.holdings.set(id, h);
      holding = h;
    }

    const updatedUser = await this.updateUserBalance(userId, (currentBalance - data.totalCost).toString());
    await this.addTransaction({ userId, amount: (-data.totalCost).toString(), type: "debit" });

    return { success: true, holding, transaction: updatedUser };
  }

  async sellStock(userId: string, data: { symbol: string; companyName: string; quantity: string; price: number; totalValue: number }): Promise<{ success: boolean; holding?: Holding; transaction: User }> {
    const holding = [...this.holdings.values()].find(h => h.userId === userId && h.symbol === data.symbol);
    if (!holding || Number(holding.quantity) < Number(data.quantity)) throw new Error("Insufficient holdings");

    const currentQty  = Number(holding.quantity);
    const currentCost = Number(holding.totalCost);
    const sellQty     = Number(data.quantity);
    const propCost    = (currentCost / currentQty) * sellQty;

    let updatedHolding: Holding | undefined;

    if (currentQty === sellQty) {
      this.holdings.delete(holding.id);
    } else {
      const updated: Holding = {
        ...holding,
        quantity:  (currentQty - sellQty).toString(),
        totalCost: (currentCost - propCost).toString(),
        updatedAt: new Date(),
      };
      this.holdings.set(holding.id, updated);
      updatedHolding = updated;
    }

    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const updatedUser = await this.updateUserBalance(userId, (Number(user.balance) + data.totalValue).toString());
    await this.addTransaction({ userId, amount: data.totalValue.toString(), type: "credit" });

    return { success: true, holding: updatedHolding, transaction: updatedUser };
  }

  // ── SIPs ────────────────────────────────────────────────────
  async getSips(userId: string): Promise<Sip[]> {
    return [...this.sipsMap.values()]
      .filter(s => s.userId === userId)
      .sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0));
  }

  async createSip(data: { userId: string; symbol: string; companyName: string; amount: number; frequency: string; nextRunAt: Date }): Promise<Sip> {
    const id = randomUUID();
    const sip: Sip = {
      id,
      userId:      data.userId,
      symbol:      data.symbol,
      companyName: data.companyName,
      amount:      data.amount.toString(),
      frequency:   data.frequency,
      active:      "true",
      nextRunAt:   data.nextRunAt,
      createdAt:   new Date(),
    };
    this.sipsMap.set(id, sip);
    return sip;
  }

  async deleteSip(id: string, userId: string): Promise<void> {
    const sip = this.sipsMap.get(id);
    if (sip && sip.userId === userId) this.sipsMap.delete(id);
  }

  async toggleSip(id: string, userId: string, active: boolean): Promise<Sip> {
    const sip = this.sipsMap.get(id);
    if (!sip || sip.userId !== userId) throw new Error("SIP not found");
    const updated = { ...sip, active: active ? "true" : "false" };
    this.sipsMap.set(id, updated);
    return updated;
  }

  async getDueSips(): Promise<Sip[]> {
    const now = new Date();
    return [...this.sipsMap.values()].filter(s => s.active === "true" && s.nextRunAt <= now);
  }

  async updateSipNextRun(id: string, nextRunAt: Date): Promise<void> {
    const sip = this.sipsMap.get(id);
    if (sip) this.sipsMap.set(id, { ...sip, nextRunAt });
  }

  // ── Chat ────────────────────────────────────────────────────
  async getChatMessages(limit: number): Promise<ChatMessage[]> {
    return [...this.chatMsgs.values()]
      .sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0))
      .slice(-limit);
  }

  async addChatMessage(userId: string, username: string, message: string): Promise<ChatMessage> {
    const id = randomUUID();
    const msg: ChatMessage = { id, userId, username, message, createdAt: new Date() };
    this.chatMsgs.set(id, msg);
    return msg;
  }
}

export const storage = new InMemoryStorage();