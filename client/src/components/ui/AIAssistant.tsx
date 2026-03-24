import React, { useState, useRef, useEffect } from 'react';
import { useAllStocks } from '@/hooks/use-stocks';
import { usePortfolio } from '@/hooks/use-trading';
import { useLiveMarket } from '@/hooks/use-live-market';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/format';
import { Bot, X, Send, Loader2, Sparkles, Trash2, ChevronRight } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  "How is my portfolio doing today?",
  "Which of my stocks are at a loss?",
  "Which sectors are performing best?",
  "Should I be worried about my holdings?",
  "What are the top gainers today?",
  "Give me a market summary",
];

export function AIAssistant() {
  const [open, setOpen]         = useState(false);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: "Hi! I\'m your AI stock market assistant. I can see your portfolio and live market data. Ask me anything — how your holdings are doing, market trends, or stock analysis.",
    timestamp: new Date(),
  }]);

  const { data: allStocks }  = useAllStocks();
  const { data: portfolio }  = usePortfolio();
  const { prices, indices }  = useLiveMarket();
  const { user }             = useAuth();
  const bottomRef            = useRef<HTMLDivElement>(null);
  const inputRef             = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const buildContext = () => {
    const stocks = (allStocks || []).map(s => ({
      symbol: s.symbol.replace('.NS','').replace('.BO',''),
      company: s.company,
      price: prices[s.symbol]?.price ?? s.price,
      changePercent: prices[s.symbol]?.changePercent ?? s.changePercent,
      sector: (s as any).sector,
    }));

    const gainers = stocks.filter(s => s.changePercent > 0).length;
    const losers  = stocks.filter(s => s.changePercent < 0).length;
    const topGainers = [...stocks].sort((a,b) => b.changePercent - a.changePercent).slice(0,3);
    const topLosers  = [...stocks].sort((a,b) => a.changePercent - b.changePercent).slice(0,3);

    const holdings = (portfolio?.holdings || []).map(h => ({
      symbol: h.symbol.replace('.NS','').replace('.BO',''),
      company: h.companyName,
      quantity: Number(h.quantity),
      avgCost: Number(h.averagePrice),
      currentPrice: (h as any).currentPrice ?? Number(h.averagePrice),
      currentValue: (h as any).currentValue ?? 0,
      returns: (h as any).returns ?? 0,
      returnsPercent: (h as any).returnsPercent ?? 0,
    }));

    return {
      user: user?.name || 'Investor',
      balance: user?.balance,
      marketSummary: { totalStocks: stocks.length, gainers, losers, topGainers, topLosers },
      indices: Object.entries(indices).map(([name, d]: [string, any]) => ({
        name, value: d.value, changePercent: d.changePercent
      })),
      portfolio: {
        totalValue: portfolio?.totalValue ?? 0,
        totalCost: portfolio?.totalCost ?? 0,
        totalReturns: portfolio?.totalReturns ?? 0,
        returnsPercent: portfolio?.returnsPercent ?? 0,
        holdings,
      },
    };
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      // Build conversation history for multi-turn
      const history = updatedMessages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history,
          context: buildContext(),
        }),
        credentials: 'include',
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply || 'Sorry, I could not process that.',
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connection error. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => setMessages([{
    role: 'assistant',
    content: "Chat cleared! Ask me anything about your portfolio or the market.",
    timestamp: new Date(),
  }]);

  const context = buildContext();
  const mood = context.marketSummary.gainers > context.marketSummary.losers ? 'bull'
    : context.marketSummary.losers > context.marketSummary.gainers ? 'bear' : 'neutral';
  const moodColor = mood === 'bull' ? '#22C55E' : mood === 'bear' ? '#EF4444' : '#F59E0B';

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 998,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Side Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 999,
        width: open ? 380 : 0,
        minWidth: open ? 320 : 0,
        maxWidth: '100vw',
        background: '#0F1520',
        borderLeft: open ? '1px solid rgba(255,255,255,0.07)' : 'none',
        boxShadow: open ? '-8px 0 40px rgba(0,0,0,0.5)' : 'none',
        display: 'flex', flexDirection: 'column',
        transition: 'width 280ms cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
      }}>
        {open && (
          <>
            {/* Header */}
            <div style={{
              padding: '16px 18px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', gap: 12,
              flexShrink: 0,
              background: 'linear-gradient(180deg, #161C27 0%, #0F1520 100%)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 12,
                background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
              }}>
                <Sparkles style={{ width: 16, height: 16, color: 'white' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#E5E7EB', fontFamily: 'Manrope' }}>
                  AI Assistant
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: moodColor }} />
                  <span style={{ fontSize: 10, color: '#6B7280' }}>
                    {context.marketSummary.gainers} up · {context.marketSummary.losers} down ·{' '}
                    {portfolio?.holdings?.length || 0} holdings
                  </span>
                </div>
              </div>
              <button onClick={clearChat} title="Clear chat"
                style={{ color: '#4B5563', cursor: 'pointer', background: 'none', border: 'none', padding: 4 }}>
                <Trash2 style={{ width: 14, height: 14 }} />
              </button>
              <button onClick={() => setOpen(false)}
                style={{ color: '#4B5563', cursor: 'pointer', background: 'none', border: 'none', padding: 4 }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {/* Portfolio snapshot strip */}
            {context.portfolio.totalValue > 0 && (
              <div style={{
                padding: '10px 18px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                display: 'flex', gap: 12, flexShrink: 0,
                background: 'rgba(255,255,255,0.02)',
              }}>
                {[
                  { label: 'Portfolio', value: `₹${(context.portfolio.totalValue/1000).toFixed(1)}K` },
                  { label: 'P&L', value: `${context.portfolio.returnsPercent >= 0 ? '+' : ''}${context.portfolio.returnsPercent.toFixed(2)}%`,
                    color: context.portfolio.returnsPercent >= 0 ? '#22C55E' : '#EF4444' },
                  { label: 'Holdings', value: String(context.portfolio.holdings.length) },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ flex: 1, textAlign: 'center' }}>
                    <p style={{ fontSize: 9, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</p>
                    <p style={{ fontSize: 12, fontFamily: 'JetBrains Mono', fontWeight: 700, color: color || '#E5E7EB', marginTop: 2 }}>{value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}
              className="no-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 4 }}>
                  {msg.role === 'assistant' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 2 }}>
                      <div style={{ width: 18, height: 18, borderRadius: 6,
                        background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Sparkles style={{ width: 9, height: 9, color: 'white' }} />
                      </div>
                      <span style={{ fontSize: 10, color: '#4B5563', fontWeight: 600 }}>AI Assistant</span>
                    </div>
                  )}
                  <div style={{
                    maxWidth: '88%',
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #3B82F6, #2563EB)'
                      : '#1A2235',
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: '#E5E7EB',
                    fontFamily: 'Inter',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}>
                    {msg.content}
                  </div>
                  <span style={{ fontSize: 10, color: '#374151', paddingLeft: 4, paddingRight: 4 }}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 2 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 6,
                      background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Sparkles style={{ width: 9, height: 9, color: 'white' }} />
                    </div>
                    <span style={{ fontSize: 10, color: '#4B5563', fontWeight: 600 }}>AI Assistant</span>
                  </div>
                  <div style={{
                    padding: '12px 16px', borderRadius: '16px 16px 16px 4px',
                    background: '#1A2235', border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    {[0,1,2].map(i => (
                      <span key={i} style={{
                        width: 6, height: 6, borderRadius: '50%', background: '#3B82F6',
                        display: 'inline-block',
                        animation: `bounce 1s ease-in-out ${i * 0.18}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick prompts */}
            {messages.length <= 1 && (
              <div style={{ padding: '0 16px 10px', display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                <p style={{ fontSize: 10, color: '#4B5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Suggested</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {QUICK_PROMPTS.map(p => (
                    <button key={p} onClick={() => sendMessage(p)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        fontSize: 12, padding: '8px 12px', borderRadius: 10, textAlign: 'left',
                        background: '#1A2235', color: '#9CA3AF', cursor: 'pointer',
                        border: '1px solid rgba(255,255,255,0.05)',
                        fontFamily: 'Inter', transition: 'all 150ms',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#E5E7EB'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}>
                      {p}
                      <ChevronRight style={{ width: 12, height: 12, flexShrink: 0 }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', gap: 8, flexShrink: 0,
              background: '#0F1520',
            }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
                placeholder="Ask about your portfolio or market…"
                style={{
                  flex: 1, background: '#1A2235', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12, padding: '10px 14px', fontSize: 13,
                  color: '#E5E7EB', fontFamily: 'Inter', outline: 'none',
                  transition: 'border-color 150ms',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(59,130,246,0.5)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.07)')}
              />
              <button onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: input.trim() && !loading ? 'linear-gradient(135deg, #3B82F6, #2563EB)' : '#1A2235',
                  border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 150ms',
                  boxShadow: input.trim() && !loading ? '0 4px 12px rgba(59,130,246,0.3)' : 'none',
                }}>
                {loading
                  ? <Loader2 style={{ width: 15, height: 15, color: '#6B7280', animation: 'spin 1s linear infinite' }} />
                  : <Send style={{ width: 15, height: 15, color: input.trim() ? 'white' : '#4B5563' }} />
                }
              </button>
            </div>
          </>
        )}
      </div>

      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 997,
          width: 52, height: 52, borderRadius: '50%',
          background: open ? '#1A2235' : 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
          border: '2px solid rgba(255,255,255,0.1)',
          boxShadow: open ? 'none' : '0 8px 24px rgba(59,130,246,0.35)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 220ms',
        }}>
        {open
          ? <X style={{ width: 20, height: 20, color: '#9CA3AF' }} />
          : <Bot style={{ width: 22, height: 22, color: 'white' }} />
        }
        {!open && (
          <span style={{
            position: 'absolute', inset: -4, borderRadius: '50%',
            border: `2px solid ${moodColor}`,
            opacity: 0.4,
            animation: 'ping 2s ease-in-out infinite',
          }} />
        )}
      </button>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
        @keyframes ping {
          0% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.15); opacity: 0.1; }
          100% { transform: scale(1); opacity: 0.4; }
        }
      `}</style>
    </>
  );
}
