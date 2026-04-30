import { useState } from 'react';
import { MINIGAME_INFO } from '../types';
import type { MiniGame } from '../types';
import { ArrowLeft, Users, Star } from 'lucide-react';
import VolleyballGame from './games/VolleyballGame';
import BilliardGame from './games/BilliardGame';
import MafiaGame from './games/MafiaGame';

function ChessGame({ onBack }: { onBack: () => void }) {
  const pieces: Record<string, string> = {
    '0,0': '♜', '1,0': '♞', '2,0': '♝', '3,0': '♛', '4,0': '♚', '5,0': '♝', '6,0': '♞', '7,0': '♜',
    '0,1': '♟', '1,1': '♟', '2,1': '♟', '3,1': '♟', '4,1': '♟', '5,1': '♟', '6,1': '♟', '7,1': '♟',
    '0,6': '♙', '1,6': '♙', '2,6': '♙', '3,6': '♙', '4,6': '♙', '5,6': '♙', '6,6': '♙', '7,6': '♙',
    '0,7': '♖', '1,7': '♘', '2,7': '♗', '3,7': '♕', '4,7': '♔', '5,7': '♗', '6,7': '♘', '7,7': '♖',
  };

  return (
    <div className="h-full flex flex-col">
      <div className="pt-10 pb-3 px-5 glass-card border-b border-white/20 flex items-center gap-3">
        <button onClick={onBack} className="text-gray-500"><ArrowLeft size={20} /></button>
        <h2 className="text-lg font-bold text-gray-800">♟️ Schach</h2>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 pb-20">
        <div className="w-full max-w-[340px]">
          <div className="grid grid-cols-8 gap-0 rounded-xl overflow-hidden shadow-xl border-2 border-gray-800">
            {Array.from({ length: 64 }, (_, i) => {
              const x = i % 8, y = Math.floor(i / 8);
              const isDark = (x + y) % 2 === 1;
              const piece = pieces[`${x},${y}`];
              return (
                <div
                  key={i}
                  className={`aspect-square flex items-center justify-center text-xl sm:text-2xl cursor-pointer hover:ring-2 hover:ring-primary-400 transition-all
                    ${isDark ? 'bg-primary-400/70' : 'bg-primary-50'}`}
                >
                  {piece || ''}
                </div>
              );
            })}
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">Tippe auf eine Figur zum Spielen</p>
        </div>
      </div>
    </div>
  );
}



export default function MiniGamesScreen() {
  const [activeGame, setActiveGame] = useState<MiniGame | null>(null);

  if (activeGame === 'chess') return <ChessGame onBack={() => setActiveGame(null)} />;
  if (activeGame === 'volleyball') return <VolleyballGame onBack={() => setActiveGame(null)} />;
  if (activeGame === 'billiard') return <BilliardGame onBack={() => setActiveGame(null)} />;
  if (activeGame === 'mafia') return <MafiaGame onBack={() => setActiveGame(null)} />;

  return (
    <div className="h-full flex flex-col">
      <div className="pt-10 pb-3 px-5 glass-card border-b border-white/20">
        <h1 className="text-xl font-bold text-gray-800">Minispiele</h1>
        <p className="text-xs text-gray-400">Spiel mit deinem Match oder der Community</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 pb-24 space-y-3">
        {/* Featured */}
        <div className="gradient-primary rounded-2xl p-5 text-white relative overflow-hidden mb-4">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl -mr-8 -mt-8" />
          <div className="flex items-center gap-2 mb-2">
            <Star size={18} className="text-amber-300" />
            <span className="text-xs font-bold text-white/80">FEATURED</span>
          </div>
          <h2 className="text-lg font-bold mb-1">Werwölfe Nacht</h2>
          <p className="text-xs text-white/70 mb-3">Das beliebte Partyspiel – perfekt für die Community!</p>
          <button
            onClick={() => setActiveGame('mafia')}
            className="px-4 py-2 bg-white text-primary-600 font-bold text-sm rounded-xl active:scale-95 transition-all"
          >
            Jetzt spielen
          </button>
        </div>

        {/* Game Grid */}
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(MINIGAME_INFO) as [MiniGame, typeof MINIGAME_INFO[MiniGame]][]).map(
            ([key, { name, icon, desc, players }]) => (
              <button
                key={key}
                onClick={() => setActiveGame(key)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left
                  hover:shadow-md active:scale-[0.98] transition-all"
              >
                <span className="text-4xl block mb-2">{icon}</span>
                <h3 className="text-sm font-bold text-gray-800 mb-0.5">{name}</h3>
                <p className="text-[10px] text-gray-400 mb-2 leading-relaxed">{desc}</p>
                <div className="flex items-center gap-1 text-[10px] text-primary-500 font-medium">
                  <Users size={10} />
                  {players}
                </div>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
