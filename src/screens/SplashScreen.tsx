import { useEffect } from 'react';
import { useStore } from '../services/store';
import { Heart, Shield, Sparkles } from 'lucide-react';

export default function SplashScreen() {
  const setScreen = useStore(s => s.setScreen);

  useEffect(() => {
    const timer = setTimeout(() => setScreen('auth'), 2800);
    return () => clearTimeout(timer);
  }, [setScreen]);

  return (
    <div className="h-full flex flex-col items-center justify-center px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 gradient-primary opacity-10" />
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary-300 rounded-full blur-3xl opacity-30 animate-float" />
      <div className="absolute bottom-32 right-8 w-40 h-40 bg-coral-400 rounded-full blur-3xl opacity-20 animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-40 right-12 w-20 h-20 bg-teal-400 rounded-full blur-2xl opacity-30 animate-float" style={{ animationDelay: '0.5s' }} />

      {/* Logo */}
      <div className="relative z-10 animate-fade-in-up">
        <div className="w-28 h-28 rounded-3xl gradient-primary flex items-center justify-center shadow-2xl shadow-primary-500/30 mb-8 mx-auto animate-pulse-soft">
          <Heart size={48} className="text-white" fill="white" />
        </div>

        <h1 className="text-5xl font-extrabold text-gradient text-center mb-2">
          Amara
        </h1>
        <p className="text-xl font-medium text-primary-600 text-center tracking-wide">
          Miteinander
        </p>
        <p className="text-sm text-gray-500 text-center mt-4 max-w-[250px]">
          Dating & Community für Menschen mit Behinderung
        </p>

        {/* Features */}
        <div className="flex justify-center gap-6 mt-10">
          {[
            { icon: <Sparkles size={18} />, label: 'Smart Match' },
            { icon: <Shield size={18} />, label: '100% Sicher' },
            { icon: <Heart size={18} />, label: 'Inklusion' },
          ].map((f, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-1 animate-fade-in-up"
              style={{ animationDelay: `${0.3 + i * 0.2}s` }}
            >
              <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center text-primary-600 shadow-md">
                {f.icon}
              </div>
              <span className="text-[10px] text-gray-500 font-medium">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Loading indicator */}
      <div className="absolute bottom-16 flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-primary-400"
            style={{
              animation: 'pulse-soft 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
