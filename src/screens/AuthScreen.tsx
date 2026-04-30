import { useState } from 'react';
import { useStore } from '../services/store';
import { Heart, Mail, Lock, User, Eye, EyeOff, ArrowRight, Shield, Sparkles, Users } from 'lucide-react';

// Admin credentials (hidden)
const ADMIN_EMAIL = 'admin@amara.de';
const ADMIN_PASSWORD = 'admin2026';

export default function AuthScreen() {
  const register = useStore(s => s.register);
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    // Check for admin login
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Skip registration and create admin with premium
      useStore.getState().setAdminUser(name || 'Admin');
      return;
    }

    if (mode === 'register' && !name.trim()) {
      setError('Bitte gib deinen Namen ein');
      return;
    }
    if (!email.includes('@')) {
      setError('Bitte gib eine gültige E-Mail ein');
      return;
    }
    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen haben');
      return;
    }
    setError('');
    register(name || 'Benutzer', email, password);
  };

  return (
    <div className="h-full flex flex-col relative overflow-y-auto">
      {/* Header Area */}
      <div className="relative pt-12 pb-8 px-6">
        <div className="absolute inset-0 gradient-primary opacity-[0.07]" />
        <div className="absolute top-8 right-8 w-20 h-20 bg-primary-300 rounded-full blur-2xl opacity-30" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-xl shadow-primary-500/20 mb-4">
            <Heart size={28} className="text-white" fill="white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gradient">Amara</h1>
          <p className="text-gray-500 text-sm mt-1">Miteinander verbunden</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 pb-8">
        {/* Toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          {(['register', 'login'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
                ${mode === m
                  ? 'bg-white text-primary-600 shadow-md'
                  : 'text-gray-400'
                }`}
            >
              {m === 'register' ? 'Registrieren' : 'Anmelden'}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {mode === 'register' && (
            <div className="relative animate-fade-in-up">
              <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Dein Name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 transition-all"
              />
            </div>
          )}

          <div className="relative">
            <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              placeholder="E-Mail Adresse"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 transition-all"
            />
          </div>

          <div className="relative">
            <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Passwort"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full pl-11 pr-11 py-3.5 bg-white border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 transition-all"
            />
            <button
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <p className="text-coral-500 text-xs font-medium px-1 animate-fade-in-up">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            className="w-full py-3.5 gradient-primary text-white font-semibold rounded-xl shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            {mode === 'register' ? 'Konto erstellen' : 'Anmelden'}
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">oder</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Social */}
        <div className="space-y-3">
          <button className="w-full py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
            <span className="text-lg">🔵</span> Mit Google fortfahren
          </button>
          <button className="w-full py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
            <span className="text-lg">🍎</span> Mit Apple fortfahren
          </button>
        </div>

        {/* Trust badges */}
        <div className="flex justify-center gap-6 mt-8 mb-4">
          {[
            { icon: <Shield size={16} />, label: 'Verschlüsselt' },
            { icon: <Sparkles size={16} />, label: 'KI-Matching' },
            { icon: <Users size={16} />, label: 'Community' },
          ].map((b, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="text-primary-400">{b.icon}</div>
              <span className="text-[10px] text-gray-400">{b.label}</span>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-gray-400 text-center leading-relaxed">
          Mit der Registrierung stimmst du unseren Nutzungsbedingungen und Datenschutzrichtlinien zu.
        </p>

        {/* Admin Login - Hidden button */}
        <button
          onClick={() => { setEmail(ADMIN_EMAIL); setPassword(ADMIN_PASSWORD); setMode('login'); }}
          className="mt-6 w-full py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-medium text-gray-300 hover:text-gray-400 transition-colors"
        >
          Admin Login (Eingabe: admin@amara.de / admin2026)
        </button>
      </div>
    </div>
  );
}
