import { useState } from 'react';
import { useStore } from '../services/store';
import { INTENTION_INFO, BADGE_INFO } from '../types';
import type { AccessibilityBadge, DatingIntention, Gender } from '../types';
import { ArrowRight, ArrowLeft, MapPin, Calendar, Sparkles } from 'lucide-react';

const STEPS = ['Basics', 'Badges', 'Interessen', 'Intention'];
const ALL_INTERESTS = ['Musik', 'Kochen', 'Reisen', 'Fotografie', 'Gaming', 'Wandern', 'Lesen', 'Yoga', 'Kunst', 'Film', 'Sport', 'Tanzen', 'Natur', 'Technik', 'Meditation', 'Tiere', 'Mode', 'Wissenschaft'];
const ALL_VALUES = ['Ehrlichkeit', 'Empathie', 'Humor', 'Treue', 'Offenheit', 'Respekt', 'Geduld', 'Kreativität'];
const ALL_GOALS = ['Familie gründen', 'Reisen', 'Karriere', 'Selbstfindung', 'Ehrenamt', 'Abenteuer'];
const COMM_STYLES = ['Direkt & ehrlich', 'Einfühlsam', 'Humorvoll', 'Geduldig', 'Aufmerksam'];

export default function ProfileSetupScreen() {
  const setupProfile = useStore(s => s.setupProfile);
  const currentUser = useStore(s => s.currentUser);
  const [step, setStep] = useState(0);
  
  const [age, setAge] = useState('25');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState<Gender>('other');
  const [badges, setBadges] = useState<AccessibilityBadge[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [intentions, setIntentions] = useState<DatingIntention[]>([]);
  const [values, setValues] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [commStyle, setCommStyle] = useState('');

  const toggleArr = <T extends string>(arr: T[], item: T, setter: (a: T[]) => void) => {
    setter(arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]);
  };

  const canNext = () => {
    if (step === 0) return age && city && gender !== 'other';
    if (step === 1) return badges.length > 0;
    if (step === 2) return interests.length >= 3;
    if (step === 3) return intentions.length > 0;
    return true;
  };

  const finish = () => {
    setupProfile({
      age: parseInt(age) || 25,
      city,
      bio,
      gender,
      badges,
      interests,
      intentions,
      values,
      lifeGoals: goals,
      communicationStyle: commStyle,
    });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="pt-10 pb-4 px-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Profil erstellen</h2>
          <span className="text-sm text-primary-600 font-semibold">{step + 1}/{STEPS.length}</span>
        </div>
        
        {/* Progress */}
        <div className="flex gap-2">
          {STEPS.map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-100">
              <div
                className="h-full gradient-primary rounded-full transition-all duration-500"
                style={{ width: i <= step ? '100%' : '0%' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-24">
        {step === 0 && (
          <div className="space-y-5 animate-fade-in-up">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">👋</span> Erzähl uns von dir
            </h3>
            
            <div>
              <label className="text-sm font-semibold text-gray-600 mb-1.5 block">Geschlecht</label>
              <div className="grid grid-cols-3 gap-2">
                {([['male', '👨', 'Männlich'], ['female', '👩', 'Weiblich'], ['nonbinary', '🌈', 'Non-Binary']] as const).map(([g, icon, label]) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`py-3 rounded-xl border-2 text-sm font-medium transition-all
                      ${gender === g ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500'}`}
                  >
                    <span className="text-xl block mb-1">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600 mb-1.5 block">
                <Calendar size={14} className="inline mr-1" /> Alter
              </label>
              <input
                type="number"
                min="18"
                max="99"
                value={age}
                onChange={e => setAge(e.target.value)}
                className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600 mb-1.5 block">
                <MapPin size={14} className="inline mr-1" /> Stadt
              </label>
              <input
                type="text"
                placeholder="z.B. Berlin"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600 mb-1.5 block">Über mich</label>
              <textarea
                placeholder="Erzähl etwas über dich... 💜"
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={3}
                className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none placeholder:text-gray-400"
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5 animate-fade-in-up">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">🎫</span> Dein Barrierefrei-Pass
            </h3>
            <p className="text-sm text-gray-500">Wähle die Badges die auf dich zutreffen. So können wir bessere Matches finden.</p>
            
            <div className="space-y-3">
              {(Object.entries(BADGE_INFO) as [AccessibilityBadge, { icon: string; label: string }][]).map(
                ([key, { icon, label }]) => {
                  const sel = badges.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleArr(badges, key, setBadges)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200
                        ${sel
                          ? 'border-primary-500 bg-primary-50 shadow-lg shadow-primary-100'
                          : 'border-gray-100 bg-white hover:border-primary-200'
                        }`}
                    >
                      <span className="text-3xl">{icon}</span>
                      <div className="text-left flex-1">
                        <span className={`text-sm font-semibold ${sel ? 'text-primary-700' : 'text-gray-700'}`}>{label}</span>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                        ${sel ? 'border-primary-500 bg-primary-500' : 'border-gray-300'}`}>
                        {sel && <span className="text-white text-xs">✓</span>}
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-fade-in-up">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">✨</span> Deine Interessen
            </h3>
            <p className="text-sm text-gray-500">Wähle mindestens 3 Interessen</p>
            
            <div className="flex flex-wrap gap-2">
              {ALL_INTERESTS.map(i => {
                const sel = interests.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() => toggleArr(interests, i, setInterests)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                      ${sel
                        ? 'gradient-primary text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-primary-50 hover:text-primary-600'
                      }`}
                  >
                    {i}
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <h4 className="text-sm font-semibold text-gray-600 mb-2">🌟 Deine Werte</h4>
              <div className="flex flex-wrap gap-2">
                {ALL_VALUES.map(v => {
                  const sel = values.includes(v);
                  return (
                    <button
                      key={v}
                      onClick={() => toggleArr(values, v, setValues)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                        ${sel ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-500'}`}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <h4 className="text-sm font-semibold text-gray-600 mb-2">🎯 Lebensziele</h4>
              <div className="flex flex-wrap gap-2">
                {ALL_GOALS.map(g => {
                  const sel = goals.includes(g);
                  return (
                    <button
                      key={g}
                      onClick={() => toggleArr(goals, g, setGoals)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                        ${sel ? 'border-coral-400 bg-red-50 text-coral-500' : 'border-gray-200 text-gray-500'}`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <h4 className="text-sm font-semibold text-gray-600 mb-2">💬 Kommunikationsstil</h4>
              <div className="flex flex-wrap gap-2">
                {COMM_STYLES.map(c => (
                  <button
                    key={c}
                    onClick={() => setCommStyle(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                      ${commStyle === c ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5 animate-fade-in-up">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">💫</span> Was suchst du?
            </h3>
            <p className="text-sm text-gray-500">Wähle deine Dating-Intention</p>
            
            <div className="space-y-3">
              {(Object.entries(INTENTION_INFO) as [DatingIntention, { icon: string; label: string }][]).map(
                ([key, { icon, label }]) => {
                  const sel = intentions.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleArr(intentions, key, setIntentions)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200
                        ${sel
                          ? 'border-primary-500 bg-primary-50 shadow-lg shadow-primary-100'
                          : 'border-gray-100 bg-white hover:border-primary-200'
                        }`}
                    >
                      <span className="text-3xl">{icon}</span>
                      <span className={`text-sm font-semibold ${sel ? 'text-primary-700' : 'text-gray-700'}`}>{label}</span>
                      <div className={`ml-auto w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                        ${sel ? 'border-primary-500 bg-primary-500' : 'border-gray-300'}`}>
                        {sel && <span className="text-white text-xs">✓</span>}
                      </div>
                    </button>
                  );
                }
              )}
            </div>

            {/* Summary preview */}
            <div className="mt-6 p-4 rounded-2xl gradient-card border border-primary-100">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-primary-600" />
                <span className="text-sm font-bold text-primary-700">Dein Profil-Preview</span>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm">
                  {(currentUser?.name || 'U')[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{currentUser?.name}, {age}</p>
                  <p className="text-xs text-gray-500">{city || 'Deine Stadt'}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {badges.map(b => (
                  <span key={b} className="text-lg">{BADGE_INFO[b].icon}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom buttons */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3.5 bg-gray-100 text-gray-600 font-semibold rounded-xl flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} />
              Zurück
            </button>
          )}
          <button
            onClick={() => step < STEPS.length - 1 ? setStep(s => s + 1) : finish()}
            disabled={!canNext()}
            className={`flex-1 py-3.5 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all
              ${canNext()
                ? 'gradient-primary text-white shadow-lg shadow-primary-500/30 active:scale-[0.98]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
          >
            {step < STEPS.length - 1 ? 'Weiter' : 'Los geht\'s!'}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
