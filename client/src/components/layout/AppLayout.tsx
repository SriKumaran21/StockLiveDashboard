import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { AddFundsDialog } from '@/components/user/AddFundsDialog';
import { cn, formatCurrency } from '@/lib/format';
import { 
  LayoutDashboard, 
  Search, 
  PieChart, 
  TrendingUp, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  UserCircle,
  MessageCircle
} from 'lucide-react';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Explore', path: '/explore', icon: Search },
    { label: 'Portfolio', path: '/portfolio', icon: PieChart },
    { label: 'Community', path: '/community', icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-card/90 backdrop-blur-xl border-r border-border/50 shadow-2xl lg:shadow-none lg:static lg:flex flex-col transition-transform duration-300 ease-out transform",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="h-20 flex items-center px-8 border-b border-border/50">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-primary/80 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 group-hover:shadow-glow group-hover:scale-105 transition-all duration-200">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-foreground">
              StockLive<span className="text-primary"> Dashboard</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          <div className="px-4 text-xs font-semibold text-muted uppercase tracking-wider mb-4">
            Menu
          </div>
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={cn(
                  "flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium transition-all duration-200 group relative overflow-hidden",
                  isActive 
                    ? "nav-active" 
                    : "text-muted hover:bg-secondary/50 hover:text-foreground hover:scale-[1.02]"
                )}
                onClick={() => setIsSidebarOpen(false)}
              >
                <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-primary" : "text-muted group-hover:text-foreground")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className="p-4 m-4 card-fintech">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold shadow-glow">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted truncate">{user.email}</p>
              </div>
            </div>
            <button 
              onClick={() => logout()}
              className="btn-danger w-full"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-background/80 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-4 sm:px-8 z-30 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 rounded-xl text-muted hover:bg-secondary/50 transition-all duration-200 hover:scale-105"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-display font-bold hidden sm:block text-foreground">
              {navItems.find(n => n.path === location)?.label || 'Overview'}
            </h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <button className="relative p-2.5 rounded-full text-muted hover:bg-secondary/50 transition-all duration-200 hover:scale-105">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-profit rounded-full border-2 border-background animate-pulse" />
            </button>
            
            {user && (
              <div className="flex items-center gap-4 border-l border-border/50 pl-4 sm:pl-6">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-semibold text-muted">Available Margin</p>
                  <p className="text-sm font-bold font-mono text-foreground tracking-tight">
                    {formatCurrency(Number(user.balance))}
                  </p>
                </div>
                <button 
                  onClick={() => setIsAddFundsOpen(true)}
                  className="btn-primary"
                >
                  Add Funds
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-8 relative">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[128px] pointer-events-none" />
          
          <div className="max-w-7xl mx-auto relative z-10">
            {children}
          </div>
        </div>
      </main>

      <AddFundsDialog 
        isOpen={isAddFundsOpen} 
        onClose={() => setIsAddFundsOpen(false)} 
        currentBalance={user?.balance || 0} 
      />
    </div>
  );
}
