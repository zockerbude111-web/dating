import { useState, useRef, useEffect } from 'react';
import { useStore } from '../services/store';
import { BADGE_INFO, INTENTION_INFO } from '../types';
import type { Gender, UserProfile, ChatMessage } from '../types';
import Avatar from '../components/Avatar';
import { Search, Filter, MapPin, ArrowLeft, Send, Lock, MessageCircle } from 'lucide-react';

export default function ProfileSearchScreen() {
  const { allUsers, searchGenderFilter, setSearchGenderFilter, currentUser, 
    privateChatTarget, setPrivateChatTarget, privateChatMessages, sendPrivateMessage } = useStore();
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [pmMsg, setPmMsg] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  const filtered = allUsers.filter(u => {
    if (searchGenderFilter !== 'all' && u.gender !== searchGenderFilter) return false;
    if (searchText && !u.name.toLowerCase().includes(searchText.toLowerCase()) && 
        !u.city.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [privateChatMessages, privateChatTarget]);

  const handleSendPM = () => {
    if (!pmMsg.trim() || !privateChatTarget) return;
    sendPrivateMessage(privateChatTarget.id, pmMsg.trim());
    setPmMsg('');
  };

  // Private chat view
  if (privateChatTarget) {
    const msgs = privateChatMessages[privateChatTarget.id] || [];
    return (
      <div className="h-full flex flex-col">
        <div className="pt-10 pb-3 px-5 glass-card border-b border-white/20 flex items-center gap-3">
          <button onClick={() => setPrivateChatTarget(null)} className="text-gray-500">
            <ArrowLeft size={20} />
          </button>
          <Avatar name={privateChatTarget.name} color={privateChatTarget.avatar} size={36} verified={privateChatTarget.verified} />
          <div>
            <h2 className="text-sm font-bold text-gray-800">{privateChatTarget.name}</h2>
            <p className="text-[10px] text-gray-400">{privateChatTarget.city}</p>
          </div>
        </div>

        <div ref={chatRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 pb-4">
          {msgs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-sm text-gray-400">Starte eine Unterhaltung!</p>
            </div>
          )}
          {msgs.map((m: ChatMessage) => (
            <div key={m.id} className="flex gap-2.5 flex-row-reverse">
              <div className="max-w-[75%]">
                <div className="px-3.5 py-2.5 rounded-2xl rounded-tr-sm gradient-primary text-white text-sm leading-relaxed">
                  {m.content}
                </div>
                <p className="text-[9px] text-gray-400 mt-0.5 text-right px-1">{m.timestamp}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 pb-20 pt-2 glass-card border-t border-white/20">
          <div className="flex items-center gap-2">
            <input
              value={pmMsg}
              onChange={e => setPmMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendPM()}
              placeholder="Nachricht schreiben..."
              className="flex-1 py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder:text-gray-400"
            />
            <button
              onClick={handleSendPM}
              disabled={!pmMsg.trim()}
              className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-md disabled:opacity-50 active:scale-90 transition-all"
            >
              <Send size={16} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Profile detail view
  if (selectedProfile) {
    return (
      <div className="h-full flex flex-col">
        <div className="pt-10 pb-3 px-5 glass-card border-b border-white/20 flex items-center gap-3">
          <button onClick={() => setSelectedProfile(null)} className="text-gray-500">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-bold text-gray-800">Profil</h2>
        </div>

        <div className="flex-1 overflow-y-auto pb-24">
          <div className="h-48 gradient-primary flex items-center justify-center relative">
            <Avatar name={selectedProfile.name} color={selectedProfile.avatar} size={80} verified={selectedProfile.verified} />
          </div>
          <div className="px-5 pt-5 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">{selectedProfile.name}, {selectedProfile.age}</h2>
              <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
                <MapPin size={14} /> {selectedProfile.city}
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">{selectedProfile.bio}</p>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Barrierefrei-Pass</p>
              <div className="flex flex-wrap gap-2">
                {selectedProfile.badges.map(b => (
                  <span key={b} className="px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
                    {BADGE_INFO[b].icon} {BADGE_INFO[b].label}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Interessen</p>
              <div className="flex flex-wrap gap-2">
                {selectedProfile.interests.map(i => (
                  <span key={i} className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs">{i}</span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Sucht</p>
              <div className="flex flex-wrap gap-2">
                {selectedProfile.intentions.map(i => (
                  <span key={i} className="px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 text-xs font-medium">
                    {INTENTION_INFO[i].icon} {INTENTION_INFO[i].label}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => { setPrivateChatTarget(selectedProfile); setSelectedProfile(null); }}
              className="w-full py-3.5 gradient-primary text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30"
            >
              <MessageCircle size={18} />
              Nachricht senden
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="pt-10 pb-3 px-5 glass-card border-b border-white/20">
        <h1 className="text-xl font-bold text-gray-800 mb-3">Profilsuche</h1>
        
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchText}
              onChange={e => {
                setSearchText(e.target.value);
                if (e.target.value.trim() !== '' || searchGenderFilter !== 'all') {
                  setShowResults(true);
                }
              }}
              onFocus={() => setShowResults(true)}
              placeholder="Name oder Stadt suchen..."
              className="w-full py-2.5 pl-9 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder:text-gray-400"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all
              ${showFilters ? 'bg-primary-50 border-primary-300 text-primary-600' : 'border-gray-200 text-gray-400'}`}
          >
            <Filter size={16} />
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-3">
            <div className="flex gap-2 flex-wrap">
              {([['all', 'Alle'], ['male', '👨 Männlich'], ['female', '👩 Weiblich']] as [Gender | 'all', string][]).map(([g, label]) => (
                <button
                  key={g}
                  onClick={() => { setSearchGenderFilter(g); setShowResults(true); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                    ${searchGenderFilter === g ? 'gradient-primary text-white' : 'bg-gray-100 text-gray-500'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {!currentUser?.premium && (
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-600">
                <Lock size={10} />
                Erweiterte Filter nur für Premium-Nutzer
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-5 py-4 pb-24 space-y-3">
        {!showResults ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm text-gray-400 mb-1">Suche nach Profilen</p>
            <p className="text-xs text-gray-300">Gib einen Namen oder eine Stadt ein</p>
          </div>
        ) : (
          <>
            {filtered.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedProfile(user)}
                className="w-full flex items-center gap-3.5 p-3.5 bg-white rounded-2xl shadow-sm border border-gray-100 text-left"
              >
                <Avatar name={user.name} color={user.avatar} size={48} verified={user.verified} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">{user.name}, {user.age}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <MapPin size={10} />
                    <span>{user.city}</span>
                  </div>
                  <div className="flex gap-1 mt-1.5">
                    {user.badges.slice(0, 3).map(b => (
                      <span key={b} className="text-sm">{BADGE_INFO[b].icon}</span>
                    ))}
                  </div>
                </div>
                <div className="text-gray-300">
                  <MessageCircle size={18} />
                </div>
              </button>
            ))}
            {filtered.length === 0 && showResults && (
              <div className="text-center py-12">
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-sm text-gray-400">Keine Profile gefunden</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}