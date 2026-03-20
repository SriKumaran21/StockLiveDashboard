import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { AddFundsDialog } from '@/components/user/AddFundsDialog';
import { cn, formatCurrency } from '@/lib/format';
import {
  LayoutDashboard, Search, PieChart, TrendingUp,
  LogOut, Menu, MessageCircle, ChevronRight,
  Sun, Moon,
} from 'lucide-react';
import { NotificationsPanel } from './NotificationsPanel';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);

  const [dark, setDark] = React.useState(true);
  const navItems = [
    { label: 'Dashboard',   path: '/',            icon: LayoutDashboard },
    { label: 'Explore',     path: '/explore',     icon: Search },
    { label: 'Portfolio',   path: '/portfolio',   icon: PieChart },
    { label: 'Community',   path: '/community',   icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-[hsl(0,0%,7%)] border-r border-border flex flex-col transition-transform duration-300 lg:static lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <TrendingUp className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <span className="font-display font-bold text-base text-foreground">StockLive</span>
              <span className="block text-[10px] text-muted font-medium tracking-widest uppercase">Dashboard</span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
                onClick={() => setIsSidebarOpen(false)}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                {item.label}
                {isActive && <ChevronRight className="w-3 h-3 ml-auto text-primary/50" />}
              </Link>
            );
          })}
        </nav>

        {/* User card */}
        {user && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm font-display">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <button onClick={() => logout()} className="btn-danger w-full text-sm py-2">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-background border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
              onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base font-display font-bold hidden sm:block">
              {navItems.find(n => n.path === location)?.label || 'Overview'}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setDark(!dark)}
              className="p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <NotificationsPanel />

            {user && (
              <div className="flex items-center gap-3 border-l border-border pl-3 sm:pl-4">
                <div className="hidden sm:block text-right">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Balance</p>
                  <p className="text-sm font-bold font-mono text-foreground">{formatCurrency(Number(user.balance))}</p>
                </div>
                <button onClick={() => setIsAddFundsOpen(true)}
                  className="btn-primary text-sm py-2 px-4">
                  Add Funds
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      <AddFundsDialog isOpen={isAddFundsOpen} onClose={() => setIsAddFundsOpen(false)} currentBalance={user?.balance || 0} />
    </div>
  );
}
