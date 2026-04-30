import { useState, useRef, useEffect } from 'react';
import { useStore } from '../services/store';
import Avatar from '../components/Avatar';
import { Send, Lock, Clock, AlertTriangle } from 'lucide-react';

export default function ChatScreen() {
  const { chatMessages, sendChatMessage, currentUser, lastChatTime } = useStore();
  const [msg, setMsg] = useState('');
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastChatTime;
      const remaining = Math.max(0, 30000 - elapsed);
      setCooldownLeft(Math.ceil(remaining / 1000));
    }, 500);
    return () => clearInterval(interval);
  }, [lastChatTime]);

  const handleSend = () => {
    if (!msg.trim()) return;
    if (!currentUser?.premium) {
      setError('Globaler Chat ist nur für Premium-Nutzer verfügbar.');
      setTimeout(() => setError(''), 3000);
      return;
    }
    // Check for emails, phone numbers, links
    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(msg);
    const hasPhone = /(?:\+49|0049|0)\s*[1-9][0-9\s-]{6,}/.test(msg);
    const hasLink = /(?:https?:\/\/|www\.)[^\s]+/.test(msg);
    if (hasEmail || hasPhone || hasLink) {
      setError('Keine E-Mails, Telefonnummern oder Links erlaubt.');
      setTimeout(() => setError(''), 3000);
      return;
    }
    const success = sendChatMessage(msg.trim());
    if (success) {
      setMsg('');
      setError('');
    } else {
      setError(`Bitte warte ${cooldownLeft} Sekunden.`);
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="pt-10 pb-3 px-5 glass-card border-b border-white/20">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Globaler Chat</h1>
          <p className="text-xs text-gray-400">{chatMessages.length} Nachrichten • Premium Feature</p>
        </div>
      </div>

      {/* Premium notice */}
      {!currentUser?.premium && (
        <div className="mx-5 mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2">
          <Lock size={16} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-700">Premium Feature</p>
            <p className="text-[10px] text-amber-600">Der globale Chat ist nur für Premium-Nutzer verfügbar (4,99€/Monat). Du kannst lesen, aber nicht schreiben.</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 pb-4">
        {chatMessages.map((m) => {
          const isMine = m.senderId === currentUser?.id;
          return (
            <div key={m.id} className={`flex gap-2.5 ${isMine ? 'flex-row-reverse' : ''}`}>
              {!isMine && <Avatar name={m.senderName} color={m.senderAvatar} size={32} />}
              <div className={`max-w-[75%] ${isMine ? 'items-end' : ''}`}>
                {!isMine && (
                  <p className="text-[10px] font-semibold text-gray-500 mb-0.5 px-1">{m.senderName}</p>
                )}
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
                  ${isMine
                    ? 'gradient-primary text-white rounded-tr-sm'
                    : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm'
                  }`}>
                  {m.content}
                </div>
                <p className={`text-[9px] text-gray-400 mt-0.5 px-1 ${isMine ? 'text-right' : ''}`}>{m.timestamp}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-5 mb-2 p-2.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 animate-fade-in-up">
          <AlertTriangle size={14} className="text-red-500" />
          <span className="text-xs text-red-600 font-medium">{error}</span>
        </div>
      )}

      {/* Input */}
      <div className="px-5 pb-20 pt-2 glass-card border-t border-white/20">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              value={msg}
              onChange={e => setMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={currentUser?.premium ? 'Nachricht schreiben...' : 'Premium erforderlich...'}
              disabled={!currentUser?.premium}
              className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 disabled:opacity-50"
            />
          </div>
          {cooldownLeft > 0 && currentUser?.premium && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={12} />
              <span>{cooldownLeft}s</span>
            </div>
          )}
          <button
            onClick={handleSend}
            disabled={!msg.trim() || !currentUser?.premium}
            className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-md disabled:opacity-50 active:scale-90 transition-all"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
