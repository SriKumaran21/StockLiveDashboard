import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Send } from 'lucide-react';
import { cn } from '@/lib/format';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  createdAt: string;
}

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-orange-500',
  'bg-teal-500', 'bg-pink-500', 'bg-amber-500',
];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function formatTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

export function CommunityPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;
    ws.onopen = () => {
      setConnected(true);
      if (user) ws.send(JSON.stringify({ type: 'auth', userId: user.id }));
    };
    ws.onclose = () => setConnected(false);
    ws.onmessage = (e) => {
      try {
        const p = JSON.parse(e.data);
        if (p.type === 'chat_history') setMessages(p.data || []);
        else if (p.type === 'chat_message') setMessages(prev => [...prev, p.data]);
      } catch {}
    };
    return () => ws.close();
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text || wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'chat_message', text }));
    setInput('');
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display font-bold text-xl">Community</h1>
          <p className="text-xs text-muted-foreground">Chat with fellow traders in real time</p>
        </div>
        <div className={cn(
          "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ",
          connected
            ? "text-[hsl(var(--market-up))] bg-[hsl(var(--market-up-bg))] border-[hsl(var(--market-up)/0.2)]"
            : "text-muted-foreground bg-secondary"
        )}>
          <span className={cn("w-1.5 h-1.5 rounded-full", connected ? "bg-[hsl(var(--market-up))] animate-pulse" : "bg-muted")} />
          {connected ? 'Live' : 'Connecting…'}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 bg-card border-0 rounded-2xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
            </div>
          )}
          {messages.map((msg) => {
            const isOwn = msg.userId === user?.id;
            return (
              <div key={msg.id} className={cn("flex items-end gap-2.5", isOwn ? "flex-row-reverse" : "flex-row")}>
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0",
                  avatarColor(msg.username)
                )}>
                  {msg.username.charAt(0).toUpperCase()}
                </div>
                <div className={cn("flex flex-col gap-1 max-w-[68%]", isOwn ? "items-end" : "items-start")}>
                  {!isOwn && <span className="text-[11px] text-muted-foreground font-medium px-1">{msg.username}</span>}
                  <div className={cn(
                    "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-secondary text-foreground rounded-bl-sm"
                  )}>
                    {msg.message}
                  </div>
                  <span className="text-[11px] text-muted-foreground px-1">{formatTime(msg.createdAt)}</span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t p-3">
          <div className="flex items-center gap-2 bg-secondary rounded-xl px-4 py-2 focus-within:ring-1 focus-within:ring-primary transition-all">
            <input
              type="text"
              placeholder={connected ? "Type a message…" : "Connecting…"}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
              disabled={!connected}
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground disabled:opacity-50"
            />
            <button
              onClick={send}
              disabled={!connected || !input.trim()}
              className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-30 hover:opacity-90 transition-opacity flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
