import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { TrendingUp, Mail, Lock, User, Loader2 } from 'lucide-react';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  
  const { login, register, isLoggingIn, isRegistering } = useAuth();

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
      setError(err.message);
    }
  };

  const isPending = isLoggingIn || isRegistering;

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center relative overflow-hidden selection:bg-primary/30">
      {/* decorative background elements */}
      {/* marketing page abstract modern geometric dark theme */}
      <img
        src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover opacity-[0.03] pointer-events-none mix-blend-luminosity"
      />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full mx-auto relative z-10 px-4 sm:px-0">
        <div className="text-center mb-10">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-accent items-center justify-center text-primary-foreground shadow-2xl shadow-primary/30 mb-6">
            <TrendingUp className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight text-foreground mb-2">StockLive Dashboard</h1>
          <p className="text-muted-foreground text-lg">Next generation financial dashboard.</p>
        </div>

        <div className="glass-card rounded-3xl p-8 shadow-2xl">
          <div className="flex p-1 bg-secondary rounded-xl mb-8">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${isLogin ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${!isLogin ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 animate-in fade-in">
                {error}
              </div>
            )}

            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground px-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-background border-2 border-border/50 text-foreground rounded-xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground px-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-background border-2 border-border/50 text-foreground rounded-xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground px-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-background border-2 border-border/50 text-foreground rounded-xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 mt-4 rounded-xl font-bold text-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 transition-all duration-300 flex justify-center items-center"
            >
              {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
