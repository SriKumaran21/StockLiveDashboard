import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { TrendingUp, Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/format';

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
      if (isLogin) {
        await login({ email, password });
      } else {
        await register({ email, password, name });
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    }
  };

  const inputClass = "w-full bg-secondary border border-border rounded-xl px-4 py-3 pl-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[hsl(0,0%,7%)] border-r border-border flex-col justify-between p-12">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <TrendingUp className="w-4 h-4 text-black" />
          </div>
          <div>
            <span className="font-display font-bold text-base text-foreground">StockLive</span>
            <span className="block text-[10px] text-muted-foreground font-medium tracking-widest uppercase">Dashboard</span>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="font-display font-bold text-4xl leading-tight text-foreground mb-4">
              Trade smarter.<br />
              <span className="text-primary">Grow faster.</span>
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed max-w-sm">
              Real-time market data, Indian & US stocks, live portfolio tracking — all in one place.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { stat: '22+', label: 'Stocks tracked live' },
              { stat: '₹10,000', label: 'Starting virtual balance' },
              { stat: '0ms', label: 'Delay on price updates' },
            ].map(({ stat, label }) => (
              <div key={label} className="flex items-center gap-4">
                <span className="font-display font-bold text-2xl text-primary w-28">{stat}</span>
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">© 2026 StockLive. For educational purposes only.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-black" />
            </div>
            <span className="font-display font-bold text-sm">StockLive</span>
          </div>

          <div className="mb-8">
            <h2 className="font-display font-bold text-2xl text-foreground mb-1">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Sign in to your account" : "Start trading with ₹10,000 virtual balance"}
            </p>
          </div>

          {/* Toggle */}
          <div className="flex p-1 bg-secondary rounded-xl mb-6">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={cn("flex-1 py-2 rounded-lg text-sm font-semibold transition-all", isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >Sign In</button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={cn("flex-1 py-2 rounded-lg text-sm font-semibold transition-all", !isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >Sign Up</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required className={inputClass} />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className={inputClass} />
            </div>

            {error && (
              <div className="bg-[hsl(var(--market-down-bg))] border border-[hsl(var(--market-down)/0.3)] text-[hsl(var(--market-down))] text-xs px-4 py-2.5 rounded-xl">
                {error}
              </div>
            )}

            <button type="submit" disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3 mt-2 disabled:opacity-50">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-primary font-semibold hover:underline">
              {isLogin ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
