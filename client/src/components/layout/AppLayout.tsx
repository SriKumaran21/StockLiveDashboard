import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { AddFundsDialog } from '@/components/user/AddFundsDialog';
import { MarketHours } from '@/components/ui/MarketHours';
import { NotificationsPanel } from './NotificationsPanel';
import { NewsTicker } from '@/components/ui/NewsTicker';
import { formatCurrency, cn } from '@/lib/format';
import {
  LayoutDashboard, Search, PieChart, MessageCircle,
  TrendingUp, LogOut, Menu, X, Sun, Moon, Bell,
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
  const [dark, setDark] = useState(true);

  React.useEffect(() => {
    const r = document.documentElement;
    if (dark) {
      r.style.setProperty('--background', '220 20% 6%');
      r.style.setProperty('--foreground', '216 12% 90%');
      r.style.setProperty('--card', '222 18% 11%');
      r.style.setProperty('--card-foreground', '216 12% 90%');
      r.style.setProperty('--secondary', '220 14% 16%');
      r.style.setProperty('--border', '220 14% 13%');
      r.style.setProperty('--muted-foreground', '215 10% 50%');
      document.body.style.backgroundColor = '#0B0F14';
    } else {
      r.style.setProperty('--background', '0 0% 97%');
      r.style.setProperty('--foreground', '0 0% 8%');
      r.style.setProperty('--card', '0 0% 100%');
      r.style.setProperty('--card-foreground', '0 0% 8%');
      r.style.setProperty('--secondary', '0 0% 93%');
      r.style.setProperty('--border', '0 0% 88%');
      r.style.setProperty('--muted-foreground', '0 0% 45%');
      document.body.style.backgroundColor = '#F7F7F8';
    }
  }, [dark]);

  const SidebarContent = ({ isExpanded }: { isExpanded: boolean }) => (
    <>
      {/* ── Zone 1: Brand ── */}
      <div style={{ height: 64, flexShrink: 0 }}
        className="flex items-center px-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0"
            style={{ boxShadow: '0 0 16px rgba(34,197,94,0.2)' }}>
            <TrendingUp className="w-4 h-4 text-black" />
          </div>
          <div style={{
            opacity: isExpanded ? 1 : 0,
            maxWidth: isExpanded ? 160 : 0,
            transition: 'opacity 200ms ease, max-width 200ms ease',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 15, color: '#E5E7EB', lineHeight: 1.2 }}>StockLive</p>
            <p style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Trading Platform</p>
          </div>
        </div>
      </div>

      {/* ── Zone 2: Navigation ── */}
      <nav className="flex-1 py-3" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV.map(({ label, path, icon: Icon }) => {
          const isActive = location === path;
          return (
            <Link key={path} href={path}
              onClick={() => setMobileOpen(false)}
              className={cn('nav-item', isActive && 'active')}
              style={{ justifyContent: isExpanded ? 'flex-start' : 'center' }}>
              <Icon style={{ width: 18, height: 18, flexShrink: 0,
                color: isActive ? '#3B82F6' : '#9CA3AF' }} />
              <span style={{
                opacity: isExpanded ? 1 : 0,
                maxWidth: isExpanded ? 140 : 0,
                transition: 'opacity 180ms ease, max-width 180ms ease',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                fontWeight: 500,
                color: isActive ? '#3B82F6' : '#9CA3AF',
              }}>
                {label}
              </span>
              {/* Tooltip when collapsed */}
              {!isExpanded && (
                <div style={{
                  position: 'absolute', left: '100%', marginLeft: 12,
                  padding: '4px 10px', background: '#1F2937',
                  borderRadius: 8, fontSize: 12, fontWeight: 500,
                  color: '#E5E7EB', whiteSpace: 'nowrap',
                  pointerEvents: 'none', zIndex: 100,
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity">
                  {label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Zone 3: User Block ── */}
      {user && (
        <div style={{ padding: 12, flexShrink: 0 }}>
          <div style={{
            background: '#111827',
            borderRadius: 12,
            padding: 12,
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(59,130,246,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, color: '#3B82F6',
                fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 13,
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div style={{
                opacity: isExpanded ? 1 : 0,
                maxWidth: isExpanded ? 140 : 0,
                transition: 'opacity 180ms ease, max-width 180ms ease',
                overflow: 'hidden', whiteSpace: 'nowrap', flex: 1,
              }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#E5E7EB' }}>{user.name}</p>
                <p style={{ fontSize: 10, color: '#6B7280' }} className="truncate">{user.email}</p>
              </div>
            </div>

            {isExpanded && (
              <>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '10px 0' }} />
                <button onClick={() => logout()}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                  style={{ color: '#EF4444', fontSize: 12, fontWeight: 600 }}>
                  <LogOut style={{ width: 14, height: 14 }} />
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen flex bg-background" style={{ background: '#0B0F14' }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Desktop Sidebar (fixed) ── */}
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className="hidden lg:flex flex-col"
        style={{
          position: 'fixed', top: 0, left: 0,
          height: '100vh', zIndex: 50,
          width: expanded ? 240 : 64,
          transition: 'width 250ms ease-in-out',
          background: '#0D1117',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          overflow: 'hidden',
        }}>
        <SidebarContent isExpanded={expanded} />
      </aside>

      {/* ── Mobile Sidebar ── */}
      {mobileOpen && (
        <aside className="fixed inset-y-0 left-0 z-50 lg:hidden flex flex-col"
          style={{ width: 240, background: '#0D1117', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between px-4"
            style={{ height: 64, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-primary flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-black" />
              </div>
              <span style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: 14, color: '#E5E7EB' }}>StockLive</span>
            </div>
            <button onClick={() => setMobileOpen(false)} style={{ color: '#6B7280' }}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <SidebarContent isExpanded={true} />
        </aside>
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0" style={{ marginLeft: 64 }}>
        {/* Top Bar */}
        <header className="flex items-center justify-between px-5 sticky top-0 z-30 flex-shrink-0"
          style={{
            height: 56,
            background: 'rgba(13,17,23,0.95)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-lg transition-colors hover:bg-white/5"
              onClick={() => setMobileOpen(true)} style={{ color: '#9CA3AF' }}>
              <Menu className="w-4 h-4" />
            </button>
            <h1 style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 15, color: '#E5E7EB' }}
              className="hidden sm:block">
              {NAV.find(n => n.path === location)?.label || 'Overview'}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:block"><MarketHours /></div>
            <button onClick={() => setDark(!dark)}
              className="p-2 rounded-lg transition-colors hover:bg-white/5"
              style={{ color: '#9CA3AF' }}>
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <NotificationsPanel />
            {user && (
              <div className="flex items-center gap-2 sm:gap-3 pl-3"
                style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="hidden sm:block text-right">
                  <p style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Balance</p>
                  <p style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono', color: '#E5E7EB' }}>
                    {formatCurrency(Number(user.balance))}
                  </p>
                </div>
                <button onClick={() => setAddFundsOpen(true)} className="btn-primary">
                  Add Funds
                </button>
              </div>
            )}
          </div>
        </header>

        {/* News Ticker */}
        <NewsTicker />

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ padding: '20px 24px' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            {children}
          </div>
        </div>
      </div>

      <AddFundsDialog isOpen={addFundsOpen} onClose={() => setAddFundsOpen(false)} currentBalance={user?.balance || 0} />
    </div>
  );
}
