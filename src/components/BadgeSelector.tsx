import { BADGE_INFO } from '../types';
import type { AccessibilityBadge } from '../types';

interface BadgeSelectorProps {
  selected: AccessibilityBadge[];
  onChange: (badges: AccessibilityBadge[]) => void;
}

export default function BadgeSelector({ selected, onChange }: BadgeSelectorProps) {
  const toggle = (badge: AccessibilityBadge) => {
    if (selected.includes(badge)) {
      onChange(selected.filter(b => b !== badge));
    } else {
      onChange([...selected, badge]);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-gray-700">
        Barrierefrei-Pass
      </label>
      <div className="grid grid-cols-2 gap-2">
        {(Object.entries(BADGE_INFO) as [AccessibilityBadge, { icon: string; label: string }][]).map(
          ([key, { icon, label }]) => {
            const isSelected = selected.includes(key);
            return (
              <button
                key={key}
                onClick={() => toggle(key)}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200
                  ${isSelected
                    ? 'border-primary-500 bg-primary-50 shadow-md scale-[1.02]'
                    : 'border-gray-200 bg-white hover:border-primary-200 hover:bg-primary-50/30'
                  }`}
              >
                <span className="text-2xl">{icon}</span>
                <span className={`text-sm font-medium ${isSelected ? 'text-primary-700' : 'text-gray-600'}`}>
                  {label}
                </span>
              </button>
            );
          }
        )}
      </div>
    </div>
  );
}
