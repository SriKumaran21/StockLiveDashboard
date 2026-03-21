import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { TrendingUp, Mail, Lock, User, Loader2, ArrowRight, BarChart2, Shield, Zap } from 'lucide-react';
import { cn } from '@/lib/format';

const TICKER = [
  { s: 'RELIANCE', p: '₹1,414', c: '+2.14%', up: true },
  { s: 'TCS', p: '₹3,890', c: '+1.47%', up: true },
  { s: 'AAPL', p: '$248', c: '-0.38%', up: false },
  { s: 'NIFTY 50', p: '23,114', c: '+0.82%', up: true },
  { s: 'NVDA', p: '$875', c: '+3.21%', up: true },
  { s: 'INFY', p: '₹1,255', c: '-0.29%', up: false },
  { s: 'SENSEX', p: '76,295', c: '+0.61%', up: true },
  { s: 'TSLA', p: '$182', c: '-1.43%', up: false },
  { s: 'MSFT', p: '$384', c: '+0.91%', up: true },
  { s: 'HDFC', p: '₹1,892', c: '+0.44%', up: true },
];

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { login, register, isLoggingIn, isRegistering } = useAuth();
  const isLoading = isLoggingIn || isRegistering;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) await login({ email, password });
      else await register({ email, password, name });
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    }
  };

  const inputClass = "w-full bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,18%)] rounded-xl px-4 py-3 pl-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all";

  return (
    <div className="min-h-screen bg-[hsl(0,0%,6%)] flex flex-col lg:flex-row relative">
      {/* ── Left Panel ── */}
      <div className="hidden lg:flex lg:w-[48%] flex-col relative overflow-hidden bg-[hsl(0,0%,6%)]">
        {/* Diagonal gradient blend into right panel */}
        <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-r from-transparent to-[hsl(0,0%,8%)] z-10 pointer-events-none" />
        {/* Subtle radial glow only */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px] pointer-events-none" />

        {/* Logo */}
        <div className="relative p-10 pb-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <TrendingUp className="w-5 h-5 text-black" />
            </div>
            <div>
              <span className="font-display font-bold text-lg text-foreground">StockLive</span>
              <span className="block text-[10px] text-muted-foreground font-medium tracking-widest uppercase">Trading Platform</span>
            </div>
          </div>
        </div>

        {/* Main copy */}
        <div className="relative flex-1 flex flex-col justify-center px-16">
          <h1 className="font-display font-bold text-[48px] leading-[1.1] text-foreground mb-4">
            Trade smarter.<br />
            <span className="text-primary">Grow faster.</span>
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mb-8">
            Real-time NSE, BSE & US market data. Practice trading with virtual funds — zero risk, full experience.
          </p>

          {/* App stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { value: '35+', label: 'Stocks tracked' },
              { value: '4', label: 'Index markets' },
              { value: '100%', label: 'Free to use' },
            ].map(({ value, label }) => (
              <div key={label} className="bg-[hsl(0,0%,10%)] rounded-xl p-3 text-center">
                <p className="font-display font-bold text-xl text-primary">{value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Feature list */}
          <div className="space-y-2.5 mb-8">
            {[
              { icon: Zap,       text: 'Live NSE/BSE & US stock prices' },
              { icon: BarChart2, text: 'Professional candlestick charts' },
              { icon: Shield,    text: 'Paper trading — no real money' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">{text}</span>
              </div>
            ))}
          </div>

          {/* Scrolling ticker */}
          <div className="rounded-2xl border border-[hsl(0,0%,14%)] bg-[hsl(0,0%,8%)] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[hsl(0,0%,14%)] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Live Market Feed</span>
            </div>
            <div className="overflow-hidden relative py-2">
              <style>{`
                @keyframes ticker {
                  0%   { transform: translateX(0); }
                  100% { transform: translateX(-50%); }
                }
                .ticker-track {
                  display: flex;
                  width: max-content;
                  animation: ticker 30s linear infinite;
                }
                .ticker-track:hover { animation-play-state: paused; }
              `}</style>
              <div className="ticker-track">
                {[...TICKER, ...TICKER].map((s, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-4 py-1 flex-shrink-0 border-r border-[hsl(0,0%,14%)]">
                    <span className="text-xs font-bold font-display text-foreground">{s.s}</span>
                    <span className="text-xs font-mono text-muted-foreground">{s.p}</span>
                    <span className={cn("text-[11px] font-bold font-mono", s.up ? "text-green-500" : "text-red-500")}>
                      {s.c}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="relative px-10 py-8">
          <p className="text-xs text-muted-foreground">© 2026 StockLive · For educational purposes only</p>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[hsl(0,0%,8%)]">
        <div className="w-full max-w-[360px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-black" />
            </div>
            <span className="font-display font-bold text-base">StockLive</span>
          </div>

          <div className="mb-7">
            <h2 className="font-display font-bold text-2xl text-foreground">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isLogin ? 'Sign in to continue trading' : 'Start paper trading in seconds'}
            </p>
          </div>

          {/* Toggle */}
          <div className="flex p-1 bg-[hsl(0,0%,11%)] rounded-xl mb-5 border border-[hsl(0,0%,16%)]">
            <button onClick={() => { setIsLogin(true); setError(''); }}
              className={cn("flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all",
                isLogin ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground")}>
              Sign In
            </button>
            <button onClick={() => { setIsLogin(false); setError(''); }}
              className={cn("flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all",
                !isLogin ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground")}>
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" placeholder="Full name" value={name}
                  onChange={e => setName(e.target.value)} required className={inputClass} />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="email" placeholder="Email address" value={email}
                onChange={e => setEmail(e.target.value)} required className={inputClass} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="password" placeholder="Password" value={password}
                onChange={e => setPassword(e.target.value)} required className={inputClass} />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {isLogin && (
              <div className="text-right -mt-1">
                <button type="button" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  Forgot password?
                </button>
              </div>
            )}

            <button type="submit" disabled={isLoading}
              className="w-full py-3.5 bg-primary text-black font-bold rounded-xl hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-1">
              {isLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>

          {!isLogin && (
            <p className="text-[11px] text-muted-foreground text-center mt-4 leading-relaxed">
              By signing up you agree to our Terms of Service.
            </p>
          )}

          <p className="text-sm text-muted-foreground text-center mt-5">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-primary font-semibold hover:underline">
              {isLogin ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
