import { useState, useRef } from 'react';
import { useStore } from '../services/store';
import { BADGE_INFO, INTENTION_INFO } from '../types';
import Avatar from '../components/Avatar';
import { Heart, X, Star, MapPin, Sparkles, RotateCcw, Info } from 'lucide-react';

export default function MatchingScreen() {
  const { matchQueue, matchIndex, swipeRight, swipeLeft } = useStore();
  const [showDetails, setShowDetails] = useState(false);
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const startX = useRef(0);
  const isDragging = useRef(false);

  const current = matchQueue[matchIndex];
  const hasMore = matchIndex < matchQueue.length;

  const handleSwipe = (dir: 'left' | 'right') => {
    setSwipeDir(dir);
    setTimeout(() => {
      if (dir === 'right') swipeRight();
      else swipeLeft();
      setSwipeDir(null);
      setOffsetX(0);
      setShowDetails(false);
    }, 300);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const diff = e.touches[0].clientX - startX.current;
    setOffsetX(diff);
  };

  const onTouchEnd = () => {
    isDragging.current = false;
    if (Math.abs(offsetX) > 80) {
      handleSwipe(offsetX > 0 ? 'right' : 'left');
    } else {
      setOffsetX(0);
    }
  };

  const onMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    isDragging.current = true;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const diff = e.clientX - startX.current;
    setOffsetX(diff);
  };

  const onMouseUp = () => {
    isDragging.current = false;
    if (Math.abs(offsetX) > 80) {
      handleSwipe(offsetX > 0 ? 'right' : 'left');
    } else {
      setOffsetX(0);
    }
  };

  if (!hasMore) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-8 pb-20">
        <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mb-4 animate-pulse-soft">
          <RotateCcw size={32} className="text-primary-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Keine weiteren Profile</h2>
        <p className="text-sm text-gray-500 text-center">Komm später wieder – wir finden ständig neue Matches für dich! 💜</p>
      </div>
    );
  }

  const scoreColor = current.soulScore >= 70 ? 'text-green-500' : current.soulScore >= 40 ? 'text-amber-500' : 'text-gray-400';

  return (
    <div className="h-full flex flex-col pt-10 pb-20">
      {/* Header */}
      <div className="px-5 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Entdecken</h1>
          <p className="text-xs text-gray-400">Swipe oder tippe zum Matchen</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-50">
          <Sparkles size={14} className="text-primary-600" />
          <span className="text-xs font-semibold text-primary-600">SoulScore</span>
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 px-5 flex items-center justify-center">
        <div
          className="w-full max-w-sm relative select-none cursor-grab active:cursor-grabbing"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          style={{
            transform: swipeDir === 'right'
              ? 'translateX(120%) rotate(15deg)'
              : swipeDir === 'left'
              ? 'translateX(-120%) rotate(-15deg)'
              : `translateX(${offsetX}px) rotate(${offsetX * 0.05}deg)`,
            transition: swipeDir || !isDragging.current ? 'transform 0.3s ease-out' : 'none',
            opacity: swipeDir ? 0 : 1,
          }}
        >
          {/* Swipe indicators */}
          {offsetX > 30 && (
            <div className="absolute top-8 left-6 z-10 px-4 py-2 rounded-xl bg-green-500 text-white font-bold text-sm rotate-[-15deg] shadow-lg">
              LIKE 💚
            </div>
          )}
          {offsetX < -30 && (
            <div className="absolute top-8 right-6 z-10 px-4 py-2 rounded-xl bg-red-500 text-white font-bold text-sm rotate-[15deg] shadow-lg">
              NOPE ✋
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Profile header */}
            <div className="relative h-52 gradient-primary flex items-center justify-center">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-4 left-8 w-16 h-16 bg-white rounded-full blur-xl" />
                <div className="absolute bottom-6 right-12 w-20 h-20 bg-white rounded-full blur-xl" />
              </div>
              <Avatar name={current.name} color={current.avatar} size={96} verified={current.verified} />
              
              {/* Score badge */}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-2xl px-3 py-2 shadow-lg">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={14} className={scoreColor} />
                  <span className={`text-lg font-extrabold ${scoreColor}`}>{current.soulScore}</span>
                </div>
                <p className="text-[9px] text-gray-400 font-medium text-center">SoulScore</p>
              </div>
            </div>

            {/* Profile info */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-gray-800">{current.name}, {current.age}</h2>
              </div>
              <div className="flex items-center gap-1 text-gray-400 text-xs mb-3">
                <MapPin size={12} />
                <span>{current.city} • {current.distance} km entfernt</span>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                {current.badges.map(b => (
                  <span
                    key={b}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                      ${current.commonBadges.includes(b)
                        ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-300'
                        : 'bg-gray-100 text-gray-600'
                      }`}
                  >
                    {BADGE_INFO[b].icon} {BADGE_INFO[b].label}
                  </span>
                ))}
              </div>

              {/* Commonalities */}
              {(current.commonBadges.length > 0 || current.commonInterests.length > 0) && (
                <div className="p-3 rounded-xl bg-green-50 border border-green-100 mb-3">
                  <p className="text-xs font-semibold text-green-700 mb-1.5">🤝 Gemeinsamkeiten</p>
                  <div className="flex flex-wrap gap-1">
                    {current.commonBadges.map(b => (
                      <span key={b} className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-medium">
                        {BADGE_INFO[b].icon} {BADGE_INFO[b].label}
                      </span>
                    ))}
                    {current.commonInterests.map(i => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-medium">
                        {i}
                      </span>
                    ))}
                    {current.commonIntentions.map(i => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-medium">
                        {INTENTION_INFO[i].icon} {INTENTION_INFO[i].label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              <p className="text-sm text-gray-600 leading-relaxed mb-3">{current.bio}</p>

              {/* Details toggle */}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1.5 text-xs text-primary-600 font-medium"
              >
                <Info size={14} />
                {showDetails ? 'Weniger anzeigen' : 'Mehr anzeigen'}
              </button>

              {showDetails && (
                <div className="mt-3 space-y-2 animate-fade-in-up">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Interessen</p>
                    <div className="flex flex-wrap gap-1">
                      {current.interests.map(i => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px]">{i}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Sucht</p>
                    <div className="flex flex-wrap gap-1">
                      {current.intentions.map(i => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 text-[10px]">
                          {INTENTION_INFO[i].icon} {INTENTION_INFO[i].label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Kommunikation</p>
                    <span className="text-xs text-gray-600">{current.communicationStyle}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-6 pt-3 px-5">
        <button
          onClick={() => handleSwipe('left')}
          className="w-14 h-14 rounded-full bg-white border-2 border-red-200 flex items-center justify-center shadow-lg hover:border-red-400 active:scale-90 transition-all"
        >
          <X size={24} className="text-red-400" />
        </button>
        <button
          onClick={() => handleSwipe('right')}
          className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-xl shadow-primary-500/30 active:scale-90 transition-all"
        >
          <Heart size={28} className="text-white" fill="white" />
        </button>
        <button className="w-14 h-14 rounded-full bg-white border-2 border-amber-200 flex items-center justify-center shadow-lg hover:border-amber-400 active:scale-90 transition-all">
          <Star size={24} className="text-amber-400" />
        </button>
      </div>
    </div>
  );
}
