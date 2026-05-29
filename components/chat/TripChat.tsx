'use client';

import { useEffect, useRef, useState } from 'react';
import { useRide } from '@/context/RideContext';

export function ChatToggleButton() {
  const { chatOpen, setChatOpen, unreadChatCount, tripPhase } = useRide();
  const visible = ['arriving', 'reached', 'inTrip'].includes(tripPhase);
  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => setChatOpen(!chatOpen)}
      className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 transition hover:bg-cyan-500/20"
      title="Trip chat"
    >
      <span className="text-base">💬</span>
      {unreadChatCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white">
          {unreadChatCount}
        </span>
      )}
    </button>
  );
}

export function TripChat() {
  const {
    chatMessages,
    chatOpen,
    chatTyping,
    setChatOpen,
    sendChatMessage,
    userType,
    riderState,
  } = useRide();

  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const driverName = riderState.driver?.name ?? 'Driver';
  const peerName = userType === 'driver' ? 'Rider' : driverName;

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Focus input when chat opens
  useEffect(() => {
    if (chatOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [chatOpen]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendChatMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!chatOpen) return null;

  return (
    <>
      {/* Backdrop on mobile */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
        onClick={() => setChatOpen(false)}
      />

      {/* Chat panel */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl border border-white/[0.08] bg-[#080d18]/98 backdrop-blur-2xl shadow-2xl shadow-black/60 lg:bottom-4 lg:left-auto lg:right-4 lg:h-[440px] lg:w-80 lg:rounded-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-cyan-500/80">
                Trip chat
              </p>
              <p className="text-xs font-semibold text-white">{peerName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setChatOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-[11px] text-slate-500 transition hover:border-white/20 hover:text-slate-300"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 scrollbar-thin">
          {chatMessages.length === 0 ? (
            <p className="mt-4 text-center text-[11px] text-slate-600">
              No messages yet. Say hello! 👋
            </p>
          ) : (
            chatMessages.map((msg) => {
              const isMine =
                (userType === 'rider' && msg.sender === 'rider') ||
                (userType === 'driver' && msg.sender === 'driver');
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  {!isMine && (
                    <p className="mb-0.5 text-[9px] font-semibold text-slate-500">
                      {msg.senderName}
                    </p>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                      isMine
                        ? 'rounded-tr-sm bg-gradient-to-br from-orange-500/30 to-orange-500/15 text-white ring-1 ring-orange-500/20'
                        : 'rounded-tl-sm bg-white/[0.07] text-slate-200'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <p className="mt-0.5 text-[9px] text-slate-600">
                    {msg.timestamp}
                    {isMine && (
                      <span className="ml-1 text-cyan-500/60">✓✓</span>
                    )}
                  </p>
                </div>
              );
            })
          )}
          {/* Typing indicator */}
          {chatTyping && (
            <div className="flex items-start gap-2">
              <div className="rounded-2xl rounded-tl-sm bg-white/[0.07] px-3 py-2">
                <div className="flex gap-1 py-0.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-slate-400"
                      style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick replies */}
        <div className="shrink-0 overflow-x-auto border-t border-white/[0.04] px-3 py-2">
          <div className="flex gap-1.5">
            {(userType === 'rider'
              ? ["I'm at Gate 2 🚪", "Please call 📞", "Running late ⏱️"]
              : ["I'm here 📍", "On my way! 🚗", "2 min away ⏳"]
            ).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => sendChatMessage(q)}
                className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-slate-400 transition hover:border-cyan-500/30 hover:text-cyan-300"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="flex shrink-0 gap-2 border-t border-white/[0.06] p-3">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs text-white placeholder-slate-600 outline-none transition focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-sm font-bold text-white shadow-lg shadow-orange-900/30 transition hover:brightness-110 disabled:opacity-40"
          >
            ↑
          </button>
        </div>
      </div>
    </>
  );
}
