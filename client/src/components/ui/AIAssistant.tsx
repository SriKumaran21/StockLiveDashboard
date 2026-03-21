import React, { useState, useRef, useEffect } from 'react';
import { useAllStocks } from '@/hooks/use-stocks';
import { useLiveMarket } from '@/hooks/use-live-market';
import { cn } from '@/lib/format';
import { Bot, X, Send, Loader2, Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  "Which stocks are trending up today?",
  "What's the overall market mood?",
  "Which sector is performing best?",
  "Any high volatility stocks today?",
];

export function AIAssistant() {
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: "Hi! I'm your AI market assistant. Ask me anything about the stocks in your dashboard — trends, sentiment, risk, or market overview.",
    timestamp: new Date(),
  }]);

  const { data: allStocks } = useAllStocks();
  const { prices } = useLiveMarket();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildContext = () => {
    const stocks = (allStocks || []).map(s => ({
      symbol: s.symbol,
      price: prices[s.symbol]?.price ?? s.price,
      changePercent: prices[s.symbol]?.changePercent ?? s.changePercent,
    }));
    const gainers = stocks.filter(s => s.changePercent > 0).length;
    const losers  = stocks.filter(s => s.changePercent < 0).length;
    const topGainer = [...stocks].sort((a,b) => b.changePercent - a.changePercent)[0];
    const topLoser  = [...stocks].sort((a,b) => a.changePercent - b.changePercent)[0];
    return { totalStocks: stocks.length, gainers, losers, topGainer, topLoser, stocks: stocks.slice(0,10) };
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, context: buildContext() }),
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

  // Pulse indicator based on market mood
  const context = buildContext();
  const mood = context.gainers > context.losers ? 'bull' : context.losers > context.gainers ? 'bear' : 'neutral';

  return (
    <>
      {/* Chat Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 84, right: 20, zIndex: 1000,
          width: 340, height: 480,
          background: '#161C27',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column',
          animation: 'slide-up 0.2s ease-out',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: 10,
            flexShrink: 0,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Sparkles style={{ width: 15, height: 15, color: 'white' }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#E5E7EB', fontFamily: 'Manrope' }}>
                AI Market Assistant
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: mood === 'bull' ? '#22C55E' : mood === 'bear' ? '#EF4444' : '#F59E0B',
                }} />
                <span style={{ fontSize: 10, color: '#6B7280' }}>
                  {context.gainers} up · {context.losers} down today
                </span>
              </div>
            </div>
            <button onClick={() => setOpen(false)}
              style={{ color: '#6B7280', cursor: 'pointer', background: 'none', border: 'none' }}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}
            className="no-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '8px 12px',
                  borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #3B82F6, #2563EB)'
                    : '#1E2738',
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: '#E5E7EB',
                  fontFamily: 'Inter',
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '10px 14px', borderRadius: '12px 12px 12px 2px',
                  background: '#1E2738', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {[0,1,2].map(i => (
                      <span key={i} style={{
                        width: 5, height: 5, borderRadius: '50%', background: '#6B7280',
                        animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          {messages.length <= 1 && (
            <div style={{ padding: '0 14px 8px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {QUICK_PROMPTS.map(p => (
                <button key={p} onClick={() => sendMessage(p)}
                  style={{
                    fontSize: 10, padding: '4px 10px', borderRadius: 20,
                    background: '#1E2738', color: '#9CA3AF', cursor: 'pointer',
                    border: '1px solid rgba(255,255,255,0.06)',
                    fontFamily: 'Inter', transition: 'all 150ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#E5E7EB')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}>
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: '10px 12px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', gap: 8, flexShrink: 0,
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
              placeholder="Ask about any stock…"
              style={{
                flex: 1, background: '#1E2738', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10, padding: '8px 12px', fontSize: 12,
                color: '#E5E7EB', fontFamily: 'Inter', outline: 'none',
              }}
            />
            <button onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: input.trim() ? 'linear-gradient(135deg, #3B82F6, #2563EB)' : '#1E2738',
                border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 150ms',
              }}>
              {loading
                ? <Loader2 style={{ width: 14, height: 14, color: '#6B7280', animation: 'spin 1s linear infinite' }} />
                : <Send style={{ width: 14, height: 14, color: input.trim() ? 'white' : '#6B7280' }} />
              }
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 1000,
          width: 52, height: 52, borderRadius: '50%',
          background: open ? '#1E2738' : 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
          border: '2px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 24px rgba(59,130,246,0.3)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 200ms',
        }}>
        {open
          ? <X style={{ width: 20, height: 20, color: '#9CA3AF' }} />
          : <Bot style={{ width: 22, height: 22, color: 'white' }} />
        }
        {/* Pulse ring */}
        {!open && (
          <span style={{
            position: 'absolute', inset: -4, borderRadius: '50%',
            border: `2px solid ${mood === 'bull' ? '#22C55E' : mood === 'bear' ? '#EF4444' : '#F59E0B'}`,
            opacity: 0.4,
            animation: 'ping 2s ease-in-out infinite',
          }} />
        )}
      </button>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
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
