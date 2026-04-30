import { useState } from 'react';
import { useStore } from '../services/store';
import { BADGE_INFO, INTENTION_INFO } from '../types';
import Avatar from '../components/Avatar';
import {
  Settings, Crown, Shield, Eye, ChevronRight, LogOut, Bell,
  Moon, HelpCircle, Lock, Phone, CreditCard, CheckCircle, Users, Heart
} from 'lucide-react';

export default function ProfileScreen() {
  const { currentUser, togglePremium, verify, setScreen, likedProfiles, allUsers, profileViewers } = useStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [phone, setPhone] = useState('');

  if (!currentUser) return null;

  const viewerProfiles = profileViewers.map(id => allUsers.find(u => u.id === id)).filter(Boolean);
  const viewerCounts: Record<string, number> = {};
  profileViewers.forEach(id => { viewerCounts[id] = (viewerCounts[id] || 0) + 1; });

  if (showVerify) {
    return (
      <div className="h-full flex flex-col">
        <div className="pt-10 pb-3 px-5 glass-card border-b border-white/20 flex items-center gap-3">
          <button onClick={() => setShowVerify(false)} className="text-gray-500">←</button>
          <h2 className="text-lg font-bold text-gray-800">Verifizierung</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-6 pb-24 space-y-6">
          {currentUser.verified ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={40} className="text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-green-700">Verifiziert ✓</h3>
              <p className="text-sm text-gray-500 mt-2">Dein Profil ist verifiziert und vertrauenswürdig.</p>
            </div>
          ) : (
            <>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-3">
                  <Shield size={28} className="text-primary-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Werde verifiziert</h3>
                <p className="text-sm text-gray-500 mt-1">Zeige anderen, dass du echt bist</p>
              </div>

              {/* Phone verify */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Phone size={18} className="text-blue-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Handynummer</h4>
                    <p className="text-xs text-gray-400">SMS-Verifizierung</p>
                  </div>
                </div>
                <input
                  type="tel"
                  placeholder="+49 123 456789"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm mb-3"
                />
                <button
                  onClick={() => { verify(); setShowVerify(false); }}
                  className="w-full py-3 gradient-primary text-white font-semibold rounded-xl"
                >
                  Code senden
                </button>
              </div>

              {/* ID verify */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                    <CreditCard size={18} className="text-green-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Ausweis-Check</h4>
                    <p className="text-xs text-gray-400">Foto deines Ausweises hochladen</p>
                  </div>
                </div>
                <button
                  onClick={() => { verify(); setShowVerify(false); }}
                  className="w-full py-3 bg-green-50 text-green-700 font-semibold rounded-xl border border-green-200"
                >
                  Ausweis hochladen
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (showViewers) {
    return (
      <div className="h-full flex flex-col">
        <div className="pt-10 pb-3 px-5 glass-card border-b border-white/20 flex items-center gap-3">
          <button onClick={() => setShowViewers(false)} className="text-gray-500">←</button>
          <h2 className="text-lg font-bold text-gray-800">Profilbesucher</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 pb-24 space-y-3">
          {!currentUser.premium ? (
            <div className="text-center py-12">
              <Lock size={32} className="text-gray-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-gray-600">Premium Feature</h3>
              <p className="text-xs text-gray-400 mt-1">Sieh wer dein Profil besucht hat</p>
              <button onClick={togglePremium} className="mt-4 px-6 py-2.5 gradient-primary text-white text-sm font-semibold rounded-xl">
                Premium aktivieren
              </button>
            </div>
          ) : (
            viewerProfiles.map((user, i) => user && (
              <div key={`${user.id}-${i}`} className="flex items-center gap-3 p-3.5 bg-white rounded-2xl shadow-sm border border-gray-100">
                <Avatar name={user.name} color={user.avatar} size={44} verified={user.verified} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{user.name}, {user.age}</p>
                  <p className="text-xs text-gray-400">{user.city}</p>
                </div>
                {viewerCounts[user.id] > 1 && (
                  <span className="px-2 py-1 rounded-full bg-coral-400/10 text-coral-500 text-[10px] font-bold">
                    {viewerCounts[user.id]}x 👀
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (showSettings) {
    return (
      <div className="h-full flex flex-col">
        <div className="pt-10 pb-3 px-5 glass-card border-b border-white/20 flex items-center gap-3">
          <button onClick={() => setShowSettings(false)} className="text-gray-500">←</button>
          <h2 className="text-lg font-bold text-gray-800">Einstellungen</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 pb-24 space-y-2">
          {[
            { icon: <Bell size={18} />, label: 'Benachrichtigungen', sub: 'Push & E-Mail' },
            { icon: <Lock size={18} />, label: 'Privatsphäre', sub: 'Wer kann mich sehen?' },
            { icon: <Moon size={18} />, label: 'Darstellung', sub: 'Dark Mode, Schriftgröße' },
            { icon: <Shield size={18} />, label: 'Sicherheit', sub: 'Passwort, 2FA' },
            { icon: <HelpCircle size={18} />, label: 'Hilfe & Support', sub: 'FAQ, Kontakt' },
          ].map((item, i) => (
            <button key={i} className="w-full flex items-center gap-3.5 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 text-left">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                {item.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-400">{item.sub}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </button>
          ))}

          <button
            onClick={() => setScreen('auth')}
            className="w-full flex items-center gap-3.5 p-4 bg-red-50 rounded-2xl border border-red-100 mt-4"
          >
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-500">
              <LogOut size={18} />
            </div>
            <span className="text-sm font-semibold text-red-500">Abmelden</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="pt-10 pb-3 px-5 glass-card border-b border-white/20 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Mein Profil</h1>
        <button onClick={() => setShowSettings(true)} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
          <Settings size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Profile Card */}
        <div className="px-5 pt-5">
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100">
            <div className="h-28 gradient-primary relative">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-3 right-10 w-14 h-14 bg-white rounded-full blur-xl" />
              </div>
            </div>
            <div className="px-5 pb-5 -mt-10">
              <Avatar name={currentUser.name} color={currentUser.avatar} size={72} verified={currentUser.verified} className="ring-4 ring-white" />
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-800">{currentUser.name}, {currentUser.age}</h2>
                  {currentUser.premium && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center gap-0.5">
                      <Crown size={10} /> Premium
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{currentUser.city}</p>
                {currentUser.bio && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{currentUser.bio}</p>}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                {currentUser.badges.map(b => (
                  <span key={b} className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
                    {BADGE_INFO[b].icon} {BADGE_INFO[b].label}
                  </span>
                ))}
              </div>

              {/* Intentions */}
              <div className="flex flex-wrap gap-2 mt-2">
                {currentUser.intentions.map(i => (
                  <span key={i} className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-medium">
                    {INTENTION_INFO[i].icon} {INTENTION_INFO[i].label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-5 mt-4 grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
            <Heart size={18} className="text-coral-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-800">{likedProfiles.length}</p>
            <p className="text-[10px] text-gray-400">Likes</p>
          </div>
          <button onClick={() => setShowViewers(true)} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
            <Eye size={18} className="text-primary-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-800">{profileViewers.length}</p>
            <p className="text-[10px] text-gray-400">Besucher</p>
          </button>
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
            <Users size={18} className="text-teal-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-800">12</p>
            <p className="text-[10px] text-gray-400">Matches</p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 mt-4 space-y-2">
          {/* Verify */}
          <button
            onClick={() => setShowVerify(true)}
            className={`w-full flex items-center gap-3.5 p-4 rounded-2xl shadow-sm border text-left
              ${currentUser.verified ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center
              ${currentUser.verified ? 'bg-green-100 text-green-600' : 'bg-primary-50 text-primary-600'}`}>
              <Shield size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">
                {currentUser.verified ? 'Verifiziert ✓' : 'Jetzt verifizieren'}
              </p>
              <p className="text-xs text-gray-400">
                {currentUser.verified ? 'Dein Profil ist vertrauenswürdig' : 'Handynummer oder Ausweis-Check'}
              </p>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </button>

          {/* Premium */}
          <button
            onClick={togglePremium}
            className={`w-full flex items-center gap-3.5 p-4 rounded-2xl shadow-sm border text-left
              ${currentUser.premium ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center
              ${currentUser.premium ? 'bg-amber-100 text-amber-600' : 'bg-primary-50 text-primary-600'}`}>
              <Crown size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">
                {currentUser.premium ? 'Premium aktiv ⭐' : 'Premium werden'}
              </p>
              <p className="text-xs text-gray-400">
                {currentUser.premium ? 'Alle Features freigeschaltet' : '4,99€/Monat • Alle Features'}
              </p>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </button>

          {/* Premium features list */}
          {!currentUser.premium && (
            <div className="bg-gradient-to-br from-primary-50 to-pink-50 rounded-2xl p-4 border border-primary-100">
              <p className="text-xs font-bold text-primary-700 mb-2">⭐ Premium Features</p>
              <div className="space-y-1.5">
                {[
                  'Accessibility-Badge-Matching',
                  'Wer hat mich geliked?',
                  'Profilbesucher sehen',
                  'Globaler Chat',
                  'Forum-Threads erstellen',
                  'Inkognito-Modus',
                  'Erweiterte Filter',
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle size={12} className="text-primary-500" />
                    <span className="text-xs text-gray-600">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Interests */}
        <div className="px-5 mt-4">
          <h3 className="text-sm font-bold text-gray-700 mb-2">Deine Interessen</h3>
          <div className="flex flex-wrap gap-2">
            {currentUser.interests.map(i => (
              <span key={i} className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs">{i}</span>
            ))}
          </div>
        </div>

        {/* Values & Goals */}
        {currentUser.values.length > 0 && (
          <div className="px-5 mt-3">
            <h3 className="text-sm font-bold text-gray-700 mb-2">Werte</h3>
            <div className="flex flex-wrap gap-2">
              {currentUser.values.map(v => (
                <span key={v} className="px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 text-xs">{v}</span>
              ))}
            </div>
          </div>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
