import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Send, MessageCircle, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  createdAt: string;
}

export function CommunityPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      // Authenticate the WebSocket session
      if (user) {
        ws.send(JSON.stringify({ type: 'auth', userId: user.id }));
      }
    };

    ws.onclose = () => setConnected(false);

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);

        if (parsed.type === 'chat_history') {
          setMessages(parsed.data || []);
        } else if (parsed.type === 'chat_message') {
          setMessages(prev => [...prev, parsed.data]);
        }
        // ignore priceUpdate / indexUpdate — not relevant here
      } catch (e) {
        console.error('[Chat] Failed to parse message', e);
      }
    };

    return () => {
      ws.close();
    };
  }, [user]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'chat_message', text }));
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getInitial = (name: string) => name?.charAt(0)?.toUpperCase() || '?';

  const avatarColor = (name: string) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-green-500 to-green-600',
      'from-orange-500 to-orange-600',
      'from-pink-500 to-pink-600',
      'from-teal-500 to-teal-600',
    ];
    let hash = 0;
    for (let i = 0; i < (name?.length || 0); i++) hash += name.charCodeAt(i);
    return colors[hash % colors.length];
  };

  return (
    <div className="animate-in fade-in duration-500 h-[calc(100vh-10rem)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Community Chat</h2>
            <p className="text-xs text-muted-foreground">Talk markets with fellow traders</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          {connected ? 'Live' : 'Disconnected'}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 bg-card border border-border/50 rounded-2xl overflow-hidden flex flex-col shadow-lg">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <MessageCircle className="w-16 h-16 opacity-10 mb-4" />
              <p className="text-lg font-semibold text-foreground">No messages yet</p>
              <p className="text-sm">Be the first to start a conversation!</p>
            </div>
          )}

          {messages.map((msg) => {
            const isOwn = msg.userId === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColor(msg.username)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {getInitial(msg.username)}
                </div>

                {/* Bubble */}
                <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  {!isOwn && (
                    <span className="text-xs text-muted-foreground px-1">{msg.username}</span>
                  )}
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isOwn
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted/50 text-foreground rounded-bl-sm'
                    }`}
                  >
                    {msg.message}
                  </div>
                  <span className="text-xs text-muted-foreground px-1">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border/50 p-4 bg-muted/10">
          <div className="flex items-center gap-3 bg-background border border-border rounded-xl px-4 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <input
              type="text"
              placeholder={connected ? "Type a message… (Enter to send)" : "Connecting…"}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!connected}
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/60 disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={!connected || !input.trim()}
              className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
