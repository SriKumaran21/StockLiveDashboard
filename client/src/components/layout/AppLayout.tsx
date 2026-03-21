import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { AddFundsDialog } from '@/components/user/AddFundsDialog';
import { MarketHours } from '@/components/ui/MarketHours';
import { NotificationsPanel } from './NotificationsPanel';
import { NewsTicker } from '@/components/ui/NewsTicker';
import { formatCurrency, cn } from '@/lib/format';
import {
  LayoutDashboard, Search, PieChart, MessageCircle,
  TrendingUp, LogOut, Menu, X, Sun, Moon,
} from 'lucide-react';

const NAV = [
  { label: 'Dashboard',  path: '/',          icon: LayoutDashboard },
  { label: 'Explore',    path: '/explore',    icon: Search },
  { label: 'Portfolio',  path: '/portfolio',  icon: PieChart },
  { label: 'Community',  path: '/community',  icon: MessageCircle },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [dark, setDark] = useState(true); // ← DARK by default

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dark]);

  const NavItems = ({ show }: { show: boolean }) => (
    <>
      {NAV.map(({ label, path, icon: Icon }) => {
        const isActive = location === path;
        return (
          <Link key={path} href={path}
            onClick={() => setMobileOpen(false)}
            className={cn('nav-item group', isActive && 'active')}
            style={{ justifyContent: show ? 'flex-start' : 'center' }}>
            <Icon className="flex-shrink-0" style={{ width: 17, height: 17 }} />
            <span style={{
              opacity: show ? 1 : 0,
              maxWidth: show ? 160 : 0,
              transition: 'opacity 200ms ease, max-width 200ms ease',
              overflow: 'hidden', whiteSpace: 'nowrap',
              fontSize: 13, fontWeight: 500,
            }}>
              {label}
            </span>
            {!show && (
              <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-semibold
                              whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none
                              shadow-lg z-50 transition-opacity bg-card text-foreground"
                >
                {label}
              </div>
            )}
          </Link>
        );
      })}
    </>
  );

  const UserBlock = ({ show }: { show: boolean }) => user ? (
    <div className="m-2 p-3 rounded-xl bg-secondary" style={{ flexShrink: 0 }}>
      <div className="flex items-center gap-2.5 overflow-hidden">
        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center
                        text-primary font-bold text-sm flex-shrink-0"
          style={{ fontFamily: 'Manrope' }}>
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div style={{
          opacity: show ? 1 : 0,
          maxWidth: show ? 160 : 0,
          transition: 'opacity 180ms ease, max-width 180ms ease',
          overflow: 'hidden', whiteSpace: 'nowrap', flex: 1,
        }}>
          <p className="text-foreground font-semibold truncate" style={{ fontSize: 12 }}>{user.name}</p>
          <p className="text-muted-foreground truncate" style={{ fontSize: 10 }}>{user.email}</p>
        </div>
      </div>
      {show && (
        <>
          <div className="my-2.5 h-px bg-" />
          <button onClick={() => logout()}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg
                       text-destructive hover:bg-destructive/10 transition-colors"
            style={{ fontSize: 12, fontWeight: 600 }}>
            <LogOut style={{ width: 13, height: 13 }} />
            Sign Out
          </button>
        </>
      )}
    </div>
  ) : null;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)} />
      )}

      {/* Desktop Sidebar — fixed */}
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className="hidden lg:flex flex-col bg-card"
        style={{
          position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 50,
          width: expanded ? 224 : 56,
          transition: 'width 250ms ease-in-out',
          borderRight: '1px solid hsl(var(--))',
          overflow: 'hidden',
        }}>
        {/* Logo */}
        <div className="flex items-center px-3 flex-shrink-0"
          style={{ height: 56, borderBottom: '1px solid hsl(var(--))' }}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <TrendingUp className="text-primary-foreground" style={{ width: 14, height: 14 }} />
            </div>
            <span style={{
              opacity: expanded ? 1 : 0,
              maxWidth: expanded ? 160 : 0,
              transition: 'opacity 180ms ease, max-width 180ms ease',
              overflow: 'hidden', whiteSpace: 'nowrap',
              fontFamily: 'Manrope', fontWeight: 800, fontSize: 14,
            }} className="text-foreground">
              StockLive
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-hidden">
          <NavItems show={expanded} />
        </nav>

        {/* User */}
        <UserBlock show={expanded} />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <aside className="fixed inset-y-0 left-0 z-50 flex flex-col bg-card lg:hidden"
          style={{ width: 240, borderRight: '1px solid hsl(var(--))' }}>
          <div className="flex items-center justify-between px-4 flex-shrink-0"
            style={{ height: 56, borderBottom: '1px solid hsl(var(--))' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-primary flex items-center justify-center">
                <TrendingUp className="text-primary-foreground" style={{ width: 13, height: 13 }} />
              </div>
              <span className="text-foreground font-bold" style={{ fontFamily: 'Manrope', fontSize: 14 }}>StockLive</span>
            </div>
            <button onClick={() => setMobileOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>
          <nav className="flex-1 py-2 overflow-y-auto"><NavItems show={true} /></nav>
          <UserBlock show={true} />
        </aside>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-14">
        {/* Top bar */}
        <header className="flex items-center justify-between sticky top-0 z-30 flex-shrink-0 bg-card/95 backdrop-blur-sm"
          style={{ height: 56, padding: '0 16px', borderBottom: '1px solid hsl(var(--))' }}>
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
              onClick={() => setMobileOpen(true)}>
              <Menu style={{ width: 16, height: 16 }} />
            </button>
            <h1 className="hidden sm:block text-foreground font-bold"
              style={{ fontFamily: 'Manrope', fontSize: 15 }}>
              {NAV.find(n => n.path === location)?.label || 'Overview'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:block"><MarketHours /></div>
            <button onClick={() => setDark(!dark)}
              className="p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors">
              {dark ? <Sun style={{ width: 15, height: 15 }} /> : <Moon style={{ width: 15, height: 15 }} />}
            </button>
            <NotificationsPanel />
            {user && (
              <div className="flex items-center gap-2 pl-2"
                style={{ borderLeft: '1px solid hsl(var(--))' }}>
                <div className="hidden sm:block text-right">
                  <p className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: 9, fontWeight: 600 }}>Balance</p>
                  <p className="text-foreground font-bold" style={{ fontSize: 13, fontFamily: 'JetBrains Mono' }}>
                    {formatCurrency(Number(user.balance))}
                  </p>
                </div>
                <button onClick={() => setAddFundsOpen(true)} className="btn-primary">Add Funds</button>
              </div>
            )}
          </div>
        </header>

        <NewsTicker />

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ padding: '16px' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            {children}
          </div>
        </div>
      </div>

      <AddFundsDialog isOpen={addFundsOpen} onClose={() => setAddFundsOpen(false)} currentBalance={user?.balance || 0} />
    </div>
  );
}
