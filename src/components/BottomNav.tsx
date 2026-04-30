import { useStore } from '../services/store';
import type { MainTab } from '../types';
import { Users, Heart, MessageCircle, Search, Gamepad2, User } from 'lucide-react';

const tabs: { key: MainTab; label: string; Icon: React.FC<any> }[] = [
  { key: 'community', label: 'Community', Icon: Users },
  { key: 'matching', label: 'Matching', Icon: Heart },
  { key: 'chat', label: 'Chat', Icon: MessageCircle },
  { key: 'search', label: 'Suche', Icon: Search },
  { key: 'games', label: 'Spiele', Icon: Gamepad2 },
  { key: 'profile', label: 'Profil', Icon: User },
];

export default function BottomNav() {
  const { activeTab, setActiveTab } = useStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-white/30 safe-area-bottom">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-1">
        {tabs.map(({ key, label, Icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-200 min-w-[48px]
                ${active 
                  ? 'text-primary-600 scale-110' 
                  : 'text-gray-400 hover:text-gray-600'
                }`}
              aria-label={label}
            >
              <Icon size={active ? 22 : 20} strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-[10px] font-medium ${active ? 'font-semibold' : ''}`}>
                {label}
              </span>
              {active && <></>}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
