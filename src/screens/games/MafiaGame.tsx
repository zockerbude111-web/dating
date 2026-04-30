import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, UserPlus, Play, Skull, Eye, Vote, RefreshCw, Send, Clock } from 'lucide-react';

type Role = 'Mafia' | 'Detective' | 'Civilian';
type Phase = 'setup' | 'night_mafia_vote' | 'night_mafia' | 'night_detective' | 'night_action_execute' | 'day_reveal' | 'day_voting' | 'game_over';

interface Player {
  id: string;
  name: string;
  role: Role;
  isAlive: boolean;
  isAI: boolean;
}

interface ChatMsg {
  id: string;
  sender: string;
  text: string;
  time: string;
  type: 'system' | 'user' | 'ai' | 'danger' | 'detective';
}

const DEATH_CARDS = ['Friedhofsspaziergang', 'Rattengift im Aperitif'];
const AI_NAMES = ['Don Corleone', 'Lucky Luciano', 'Tony Soprano', 'Al Capone', 'John Gotti', 'Pablo Escobar'];

export default function MafiaGame({ onBack }: { onBack: () => void }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [phase, setPhase] = useState<Phase>('setup');
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  const [hasBegruessungskill, setHasBegruessungskill] = useState(true);
  const [isBegruessungskillActive, setIsBegruessungskillActive] = useState(false);
  const [mafiaTarget, setMafiaTarget] = useState<string>('');
  const [mafiaVotes, setMafiaVotes] = useState<Record<string, string>>({});
  const [detectiveTarget, setDetectiveTarget] = useState<string>('');
  const [detectiveLog, setDetectiveLog] = useState<{ target: string; isMafia: boolean }[]>([]);
  const [winner, setWinner] = useState<string | null>(null);

  const [currentVotes, setCurrentVotes] = useState<Record<string, string>>({});
  const [voteTimer, setVoteTimer] = useState<number>(30);
  const [discussTimer, setDiscussTimer] = useState<number>(30);
  const [hasShownDefeat, setHasShownDefeat] = useState(false);

  const chatRef = useRef<HTMLDivElement>(null);
  const mafiaTargetRef = useRef(mafiaTarget);
  const detectiveTargetRef = useRef(detectiveTarget);
  const userRoleRef = useRef<Role | null>(null);

  useEffect(() => { mafiaTargetRef.current = mafiaTarget; }, [mafiaTarget]);
  useEffect(() => { detectiveTargetRef.current = detectiveTarget; }, [detectiveTarget]);

  // Handle mafia voting countdown timer (30 seconds)
  const [mafiaVoteTimer, setMafiaVoteTimer] = useState<number>(30);

  // Handle mafia voting phase
  useEffect(() => {
    if (phase === 'night_mafia_vote') {
      setMafiaVotes({});
      setMafiaVoteTimer(30);

      // Set up AI mafia members to vote at different intervals
      const livingMafia = players.filter(p => p.role === 'Mafia' && p.isAlive);
      const timeouts: number[] = [];

      livingMafia.forEach((p, index) => {
        // Skip AI voting for the user (human player) - they will vote manually
        if (!p.isAI) return;
        
        const delay = 6000 + (index * 2000) + Math.random() * 4000;
        const t = window.setTimeout(() => {
          // Mafia should never vote for other mafia members
          const potentialTargets = players.filter(t => t.role !== 'Mafia' && t.isAlive && t.id !== p.id);
          if (potentialTargets.length > 0) {
            const targetId = potentialTargets[Math.floor(Math.random() * potentialTargets.length)].id;
            setMafiaVotes(prev => {
              // Prevent duplicate votes from same AI
              if (prev[p.id]) return prev;
              return { ...prev, [p.id]: targetId };
            });
          }
        }, delay);
        timeouts.push(t);
      });

      const timer = setInterval(() => {
        setMafiaVoteTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(timer);
        timeouts.forEach(t => clearTimeout(t));
      };
    }
  }, [phase, players]);

  // Execute mafia vote resolution when timer hits 0 or all votes are in
  const resolvedRef = useRef(false);
  useEffect(() => {
    if (phase === 'night_mafia_vote') {
      resolvedRef.current = false;
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'night_mafia_vote' && !resolvedRef.current && (mafiaVoteTimer === 0 || Object.keys(mafiaVotes).length === players.filter(p => p.role === 'Mafia' && p.isAlive).length)) {
      resolvedRef.current = true;
      resolveMafiaVoting();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mafiaVoteTimer, mafiaVotes, phase]);

  const addLog = useCallback((text: string, type: 'system' | 'user' | 'ai' | 'danger' | 'detective' = 'system', sender: string = 'System') => {
    const time = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    setChatMsgs(prev => [...prev, { id: Math.random().toString(), sender, text, time, type }]);
  }, []);

  useEffect(() => {
    initGame();
  }, [addLog]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMsgs]);

  // Handle voting countdown timer
  useEffect(() => {
    if (phase === 'day_voting') {
      setVoteTimer(30);
      setCurrentVotes({});

      // Set up AI players to vote at different intervals (6-12 seconds)
      const livingAIs = players.filter(p => p.isAI && p.isAlive);
      const timeouts: number[] = [];

      // Get revealed mafia from detective log if detective is dead
      const revealedMafiaIds: string[] = [];
      const detDead = players.find(p => p.role === 'Detective' && !p.isAlive);
      if (detDead && detectiveLog.length > 0) {
        detectiveLog.forEach(log => {
          if (log.isMafia) {
            const mafiaPlayer = players.find(p => p.name === log.target && p.isAlive);
            if (mafiaPlayer) {
              revealedMafiaIds.push(mafiaPlayer.id);
            }
          }
        });
      }

      livingAIs.forEach((p, index) => {
        // Stagger votes between 6-12 seconds
        const delay = 6000 + (index * (6000 / Math.max(livingAIs.length - 1, 1))) + Math.random() * 1000;
        const t = window.setTimeout(() => {
          let voteId: string | null = null;
          
          // Detective AI always votes for mafia if they know one (from detective log)
          if (p.role === 'Detective' && detectiveLog.length > 0) {
            const knownMafiaIds: string[] = [];
            detectiveLog.forEach(log => {
              if (log.isMafia) {
                const mafiaPlayer = players.find(mp => mp.name === log.target && mp.isAlive);
                if (mafiaPlayer) {
                  knownMafiaIds.push(mafiaPlayer.id);
                }
              }
            });
            if (knownMafiaIds.length > 0) {
              voteId = knownMafiaIds[Math.floor(Math.random() * knownMafiaIds.length)];
            }
          }
          
          // If no detective-based vote, check if detective died and revealed mafia
          if (!voteId && revealedMafiaIds.length > 0 && Math.random() > 0.2) {
            // 80% chance to vote for revealed mafia
            voteId = revealedMafiaIds[Math.floor(Math.random() * revealedMafiaIds.length)];
          } else if (!voteId) {
            // Normal random voting among alive players (not themselves)
            const potentialVotes = players.filter(v => v.isAlive && v.id !== p.id);
            if (potentialVotes.length > 0) {
              voteId = potentialVotes[Math.floor(Math.random() * potentialVotes.length)].id;
            }
          }
          
          if (voteId) {
            setCurrentVotes(prev => ({ ...prev, [p.id]: voteId! }));
          }
        }, delay);
        timeouts.push(t);
      });

      const timer = setInterval(() => {
        setVoteTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(timer);
        timeouts.forEach(t => clearTimeout(t));
      };
    }
  }, [phase, players, detectiveLog]);

  // Execute voting resolution when timer hits 0
  useEffect(() => {
    if (phase === 'day_voting' && voteTimer === 0) {
      resolveVoting();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voteTimer, phase]);

  // Discussion timer: 30s then auto-move to voting
  useEffect(() => {
    if (phase === 'day_reveal') {
      setDiscussTimer(30);
      const timer = setInterval(() => {
        setDiscussTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setPhase('day_voting');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [phase]);

  const initGame = () => {
    const initialPlayers: Player[] = [
      { id: 'p0', name: 'Du', role: 'Civilian', isAlive: true, isAI: false },
      { id: 'p1', name: 'Al Capone', role: 'Civilian', isAlive: true, isAI: true },
      { id: 'p2', name: 'Tony Soprano', role: 'Civilian', isAlive: true, isAI: true },
      { id: 'p3', name: 'Lucky Luciano', role: 'Civilian', isAlive: true, isAI: true },
    ];
    setPlayers(initialPlayers);
    setPhase('setup');
    setChatMsgs([]);
    addLog('Spieler einrichten. Min. 4, Max. 8 Spieler.');
    setHasBegruessungskill(true);
    setIsBegruessungskillActive(false);
    setMafiaTarget('');
    setDetectiveTarget('');
    setDetectiveLog([]);
    setCurrentVotes({});
    setWinner(null);
  };

  const addAIPlayer = () => {
    if (players.length >= 8) return;
    const usedNames = players.map(p => p.name);
    const availableNames = AI_NAMES.filter(n => !usedNames.includes(n));
    const name = availableNames.length > 0 ? availableNames[0] : `Spieler ${players.length + 1}`;
    
    // Generate unique id by finding max existing id index + 1
    const existingIds = players.map(p => parseInt(p.id.replace('p', ''), 10)).filter(n => !isNaN(n));
    const newIdNum = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 0;
    const newPlayer: Player = { id: `p${newIdNum}`, name, role: 'Civilian', isAlive: true, isAI: true };
    setPlayers([...players, newPlayer]);
    addLog(`${name} ist dem Spiel beigetreten.`);

    if (phase !== 'setup' && hasBegruessungskill) {
      setIsBegruessungskillActive(true);
      setHasBegruessungskill(false);
      addLog(`🔥 Mafia-Spezialregel: Begrüßungskill aktiviert für diese Runde!`);
    }
  };

  const removePlayer = (id: string) => {
    if (phase !== 'setup' || players.length <= 4) return;
    setPlayers(players.filter(p => p.id !== id));
  };

  const startGame = () => {
    if (players.length < 4) return;

    // Calculate role distribution based on player count
    const numPlayers = players.length;
    let numMafia = 1;
    let numDetective = 1;
    
    // Adjust mafia count based on total players for better balance
    // 4 players: 1 Mafia, 1 Detective, 2 Civilians (25%)
    // 6 players: 1 Mafia, 1 Detective, 4 Civilians (16.67%)
    // 8 players: 2 Mafia, 1 Detective, 5 Civilians (25%)
    if (numPlayers <= 5) {
      numMafia = 1;
      numDetective = 1;
    } else if (numPlayers === 6 || numPlayers === 7) {
      numMafia = 1;
      numDetective = 1;
    } else if (numPlayers >= 8) {
      numMafia = 2;
      numDetective = 1;
    }
    
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    
    // Assign roles
    for (let i = 0; i < numMafia; i++) {
      shuffled[i].role = 'Mafia';
    }
    shuffled[numMafia].role = 'Detective';
    for (let i = numMafia + 1; i < shuffled.length; i++) {
      shuffled[i].role = 'Civilian';
    }

    const finalPlayers = players.map(p => {
      const match = shuffled.find(s => s.id === p.id);
      return { ...p, role: match ? match.role : 'Civilian' };
    });

    setPlayers(finalPlayers);
    addLog('Das Spiel beginnt! Die Nacht bricht herein.');
    
    // Store user's role in ref for later use
    const userPlayer = finalPlayers.find(p => !p.isAI);
    if (userPlayer) {
      userRoleRef.current = userPlayer.role;
    }
    setHasShownDefeat(false);
    
    // Check win instantly (edge case)
    const m = finalPlayers.filter(p => p.role === 'Mafia' && p.isAlive).length;
    const c = finalPlayers.filter(p => p.role !== 'Mafia' && p.isAlive).length;
    if (m === 0 || m >= c) {
      checkGameOver(finalPlayers);
    } else {
      setPhase('night_mafia_vote');
    }
  };

  const resolveMafiaVoting = () => {
    // Count votes for each target
    const votes: Record<string, number> = {};
    const livingMafia = players.filter(p => p.role === 'Mafia' && p.isAlive);
    
    Object.values(mafiaVotes).forEach(targetId => {
      if (targetId) {
        votes[targetId] = (votes[targetId] || 0) + 1;
      }
    });

    // Find the target with most votes
    let maxVotes = 0;
    let selectedTarget = '';
    
    Object.entries(votes).forEach(([id, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        selectedTarget = id;
      }
    });

    if (selectedTarget) {
      setMafiaTarget(selectedTarget);
      addLog(`Die Mafia hat sich entschieden.`, 'system');
    }
    
    setTimeout(() => setPhase('night_detective'), 1000);
  };

  // Phase state machine
  useEffect(() => {
    const user = players.find(p => !p.isAI);
    
    if (phase === 'night_mafia_vote') {
      // Mafia voting phase - all mafia members vote on who to kill
      if (!user || user.role !== 'Mafia' || !user.isAlive) {
        // AI mafia will vote via the useEffect hook above
        return;
      }
    }
    else if (phase === 'night_mafia') {
      if (!user || user.role !== 'Mafia' || !user.isAlive) {
        // Fallback for single mafia or when voting is skipped
        const livingMafia = players.filter(p => p.role === 'Mafia' && p.isAlive);
        if (livingMafia.length > 0) {
          const targets = players.filter(p => p.role !== 'Mafia' && p.isAlive);
          if (targets.length > 0) {
            const t1 = setTimeout(() => {
              setMafiaTarget(targets[Math.floor(Math.random() * targets.length)].id);
            }, 2000);
            const t2 = setTimeout(() => setPhase('night_detective'), 4000);
            return () => { clearTimeout(t1); clearTimeout(t2); };
          }
        }
        const t = setTimeout(() => setPhase('night_detective'), 1500);
        return () => clearTimeout(t);
      }
    } 
    else if (phase === 'night_detective') {
      if (!user || user.role !== 'Detective' || !user.isAlive) {
        // AI Detective turn
        const det = players.find(p => p.role === 'Detective' && p.isAlive);
        if (det) {
          const targets = players.filter(p => p.id !== det.id && p.isAlive);
          if (targets.length > 0) {
            setDetectiveTarget(targets[Math.floor(Math.random() * targets.length)].id);
          }
        }
        const t = setTimeout(() => setPhase('night_action_execute'), 1500);
        return () => clearTimeout(t);
      }
    }
    else if (phase === 'night_action_execute') {
      executeNightActions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const executeNightActions = () => {
    const sReason = DEATH_CARDS[Math.floor(Math.random() * DEATH_CARDS.length)];
    let killedId = mafiaTargetRef.current;
    let extraKilledId = '';

    if (isBegruessungskillActive) {
      const potentialExtraTargets = players.filter(p => p.role !== 'Mafia' && p.isAlive && p.id !== killedId);
      if (potentialExtraTargets.length > 0) {
        extraKilledId = potentialExtraTargets[Math.floor(Math.random() * potentialExtraTargets.length)].id;
      }
      setIsBegruessungskillActive(false);
    }

    const detTargetPlayer = players.find(p => p.id === detectiveTargetRef.current);
    const detective = players.find(p => p.role === 'Detective' && p.isAlive);
    const userIsDetective = detective && !detective.isAI;

    if (detTargetPlayer && detective) {
      setDetectiveLog(prev => [...prev, { target: detTargetPlayer.name, isMafia: detTargetPlayer.role === 'Mafia' }]);
      
      // If user is the detective, show them result immediately as a private message
      if (userIsDetective) {
        const isMafia = detTargetPlayer.role === 'Mafia';
        addLog(
          `🕵️‍♂️ Untersuchungsergebnis: ${detTargetPlayer.name} ist ${isMafia ? 'MAFIA 🔴' : 'KEIN Mafia ✅'}`,
          'detective'
        );
      }
    }

    const updatedPlayers = players.map(p => {
      if (p.id === killedId || p.id === extraKilledId) {
        return { ...p, isAlive: false };
      }
      return p;
    });

    setPlayers(updatedPlayers);
    const deadPlayer = players.find(p => p.id === killedId);

    // Show defeat notification if user died and hasn't seen it yet
    const user = players.find(p => !p.isAI);
    if (user && !user.isAlive && !hasShownDefeat) {
      addLog('Niederlage! Du wurdest eliminiert.', 'danger');
      setHasShownDefeat(true);
    }

    addLog('Die Nacht ist vorbei.');
    if (deadPlayer) {
      addLog(`${deadPlayer.name} wurde getötet durch "${sReason}". (Rolle: ${deadPlayer.role})`, 'danger');
    }
    if (extraKilledId) {
      const extraDead = players.find(p => p.id === extraKilledId);
      if (extraDead) addLog(`Zusatzkill: ${extraDead.name} wurde ebenfalls eliminiert!`, 'danger');
    }

    const detDead = updatedPlayers.find(p => p.role === 'Detective' && !p.isAlive);
    if (detDead && detectiveLog.length > 0) {
      addLog(`🕵️‍♂️ Das Tagebuch des Detektivs wurde gefunden:`, 'detective');
      detectiveLog.forEach(l => {
        addLog(`- ${l.target} war ${l.isMafia ? 'Mafia 🔴' : 'Bürger 🟢'}`, 'detective');
      });
      if (detTargetPlayer) {
        addLog(`- Letzter Eintrag: ${detTargetPlayer.name} war ${detTargetPlayer.role === 'Mafia' ? 'Mafia 🔴' : 'Bürger 🟢'}`, 'detective');
      }
    }

    setMafiaTarget('');
    setDetectiveTarget('');
    
    if (!checkGameOver(updatedPlayers)) {
      setPhase('day_reveal');
    }
  };

  const handlePlayerVote = (votedId: string) => {
    const user = players.find(p => !p.isAI);
    // BUG FIX: Killed players cannot vote
    if (!user || !user.isAlive) return;

    setCurrentVotes(prev => ({ ...prev, [user.id]: votedId }));
  };

  const resolveVoting = () => {
    const votes: Record<string, number> = {};
    players.forEach(p => { if (p.isAlive) votes[p.id] = 0; });

    Object.values(currentVotes).forEach(votedId => {
      if (votedId && votes[votedId] !== undefined) {
        votes[votedId] = (votes[votedId] || 0) + 1;
      }
    });

    let maxVotes = 0;
    let eliminatedId = '';
    let tie = false;

    Object.entries(votes).forEach(([id, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        eliminatedId = id;
        tie = false;
      } else if (count === maxVotes && count > 0) {
        tie = true;
      }
    });

    if (tie || maxVotes === 0) {
      addLog(`Die Abstimmung endete unentschieden. Niemand wird hingerichtet.`);
      setPhase('night_mafia');
    } else {
      const dead = players.find(p => p.id === eliminatedId);
      if (dead) {
        const updatedPlayers = players.map(p => p.id === eliminatedId ? { ...p, isAlive: false } : p);
        setPlayers(updatedPlayers);
        // Put vote text into RED
        addLog(`Mit ${maxVotes} Stimmen wurde ${dead.name} eliminiert! (Rolle: ${dead.role})`, 'danger');
        
        if (!checkGameOver(updatedPlayers)) {
          setPhase('night_mafia');
        }
      }
    }
  };

  const getVotesForPlayer = (playerId: string) => {
    return Object.values(currentVotes).filter(id => id === playerId).length;
  };

  const checkGameOver = (currentPlayers: Player[]): boolean => {
    const mafiaCount = currentPlayers.filter(p => p.role === 'Mafia' && p.isAlive).length;
    const innocentCount = currentPlayers.filter(p => p.role !== 'Mafia' && p.isAlive).length;

    if (mafiaCount === 0) {
      setWinner('Bürger & Detektiv');
      setPhase('game_over');
      return true;
    } else if (mafiaCount >= innocentCount) {
      setWinner('Die Mafia');
      setPhase('game_over');
      return true;
    }
    return false;
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    addLog(chatInput.trim(), 'user', 'Du');
    setChatInput('');
    
    const aliveAIs = players.filter(p => p.isAI && p.isAlive);
    if (aliveAIs.length > 0 && Math.random() > 0.3) {
      const ai = aliveAIs[Math.floor(Math.random() * aliveAIs.length)];
      const replies = ['Ich bin unschuldig!', 'Wer war das?', 'Ich vertraue niemanden.', 'Wir müssen zusammenhalten!', 'Verdächtig...'];
      setTimeout(() => {
        addLog(replies[Math.floor(Math.random() * replies.length)], 'ai', ai.name);
      }, 1000 + Math.random() * 2000);
    }
  };

  const handlePlayerSelect = (id: string) => {
    const user = players.find(p => !p.isAI);
    if (!user || !user.isAlive) return;

    if (phase === 'night_mafia_vote' && user.role === 'Mafia') {
      // User mafia member votes for a target
      const p = players.find(p => p.id === id);
      if (p && p.role !== 'Mafia' && p.isAlive) {
        setMafiaVotes(prev => ({ ...prev, [user.id]: id }));
      }
    } else if (phase === 'night_mafia' && user.role === 'Mafia') {
      const p = players.find(p => p.id === id);
      if (p && p.role !== 'Mafia' && p.isAlive) {
        setMafiaTarget(id);
        setTimeout(() => setPhase('night_detective'), 500);
      }
    } else if (phase === 'night_detective' && user.role === 'Detective') {
      const p = players.find(p => p.id === id);
      if (p && p.id !== user.id && p.isAlive) {
        setDetectiveTarget(id);
        setTimeout(() => setPhase('night_action_execute'), 500);
      }
    }
  };

  // Prevent dead users from voting during day_voting and mafia voting phases
  useEffect(() => {
    const user = players.find(p => !p.isAI);
    if (!user) return;
    
    // If user is dead and in a voting phase, ensure they can't vote
    if (!user.isAlive && (phase === 'day_voting' || phase === 'night_mafia_vote')) {
      // Clear any existing votes from this user
      setCurrentVotes(prev => {
        const newVotes = { ...prev };
        delete newVotes[user.id];
        return newVotes;
      });
      setMafiaVotes(prev => {
        const newVotes = { ...prev };
        delete newVotes[user.id];
        return newVotes;
      });
    }
  }, [phase, players]);

  const user = players.find(p => !p.isAI);

  return (
    <div className="h-full flex flex-col bg-stone-950 text-stone-200 pb-16">
      {/* Header */}
      <div className="pt-10 pb-2 px-4 border-b border-red-900/30 flex items-center gap-3 bg-stone-900 shrink-0">
        <button onClick={onBack} className="text-stone-400 hover:text-stone-100"><ArrowLeft size={20} /></button>
        <h2 className="text-lg font-black text-red-700 tracking-wider">🕵️‍♂️ MAFIA</h2>
        {phase !== 'setup' && (
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-red-900/30 text-red-400 border border-red-800/50 truncate max-w-[120px]">
            {phase === 'night_mafia_vote' && 'Nacht: Mafia Abstimmung'}
            {phase === 'night_mafia' && 'Nacht: Mafia'}
            {phase === 'night_detective' && 'Nacht: Detektiv'}
            {phase === 'day_reveal' && 'Tag: Enthüllung'}
            {phase === 'day_voting' && 'Tag: Abstimmung'}
            {phase === 'game_over' && 'Spiel vorbei'}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {phase === 'setup' && (
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-3 flex flex-col gap-2">
            <p className="text-xs text-stone-400">Richte dein Spiel ein. (4-8 Spieler)</p>
            <div className="flex gap-2">
              <button onClick={addAIPlayer} disabled={players.length >= 8} className="flex-1 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-stone-200 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 border border-stone-700">
                <UserPlus size={14} /> KI hinzufügen
              </button>
              <button onClick={startGame} disabled={players.length < 4} className="flex-1 py-2 bg-red-800 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-red-900/40">
                <Play size={14} /> Starten
              </button>
            </div>
          </div>
        )}

        {phase === 'night_mafia_vote' && user?.role === 'Mafia' && user.isAlive && (
          <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-3 text-center">
            <h3 className="text-xs font-bold text-red-500 flex items-center justify-center gap-1.5">
              <Skull size={14} /> Mafia Abstimmung: {mafiaVoteTimer}s - Wähle dein Ziel!
            </h3>
            <p className="text-[10px] text-red-400 mt-1">Deine Stimme: {mafiaVotes[user.id] ? players.find(p => p.id === mafiaVotes[user.id])?.name : 'Noch keine'}</p>
          </div>
        )}

        {phase === 'night_mafia_vote' && (!user || user.role !== 'Mafia' || !user.isAlive) && (
          <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-3 text-center">
            <h3 className="text-xs font-bold text-red-500 flex items-center justify-center gap-1.5">
              <Skull size={14} /> Mafia stimmt ab: {mafiaVoteTimer}s
            </h3>
          </div>
        )}

        {phase === 'night_mafia' && user?.role === 'Mafia' && user.isAlive && (
          <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-3 text-center">
            <h3 className="text-xs font-bold text-red-500 flex items-center justify-center gap-1.5">
              <Skull size={14} /> Mafia: Wähle dein Ziel durch Klick auf ein Profil!
            </h3>
          </div>
        )}

        {phase === 'night_detective' && user?.role === 'Detective' && user.isAlive && (
          <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-3 text-center">
            <h3 className="text-xs font-bold text-blue-400 flex items-center justify-center gap-1.5">
              <Eye size={14} /> Detektiv: Wähle ein Ziel durch Klick auf ein Profil!
            </h3>
          </div>
        )}

        {phase === 'day_reveal' && user?.isAlive && (
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-3 text-center flex flex-col items-center justify-center gap-2">
            <div className="flex items-center justify-center gap-2 text-amber-500 text-xs font-bold">
              <Clock size={16} /> <span>Diskussion läuft: {discussTimer}s</span>
            </div>
            <button onClick={() => setPhase('day_voting')} className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-bold rounded-lg shadow-md border border-stone-700">
              Diskussion beenden & zur Abstimmung
            </button>
          </div>
        )}

        {phase === 'day_voting' && user?.isAlive && (
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-3 text-center flex flex-col items-center justify-center gap-2">
            <div className="flex items-center justify-center gap-2 text-red-500 text-xs font-bold">
              <Clock size={16} /> <span>Abstimmung läuft: {voteTimer}s</span>
            </div>
            <button
              onClick={resolveVoting}
              className="px-4 py-1.5 bg-red-900 hover:bg-red-800 text-white text-[11px] font-bold rounded-lg shadow-md border border-red-700"
            >
              Abstimmung jetzt auswerten
            </button>
          </div>
        )}

        {phase === 'game_over' && (
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 text-center">
            <h3 className="text-lg font-bold text-red-500 mb-1">🎉 {winner} gewinnen!</h3>
            <button onClick={initGame} className="w-full mt-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 border border-stone-700">
              <RefreshCw size={14} /> Neu starten
            </button>
          </div>
        )}

        {/* Players Grid */}
        <div className="grid grid-cols-2 gap-2">
          {players.map(player => {
            const isSelf = !player.isAI;
            const isRevealed = !player.isAlive || phase === 'setup' || phase === 'game_over' || (player.role === 'Mafia' && user?.role === 'Mafia') || isSelf;
            const isSelectable = player.isAlive && !isSelf && (
              (phase === 'night_mafia_vote' && user?.role === 'Mafia' && player.role !== 'Mafia') ||
              (phase === 'night_mafia' && user?.role === 'Mafia' && player.role !== 'Mafia') ||
              (phase === 'night_detective' && user?.role === 'Detective')
            );
            const isTarget = (phase === 'night_mafia_vote' && mafiaVotes[user?.id || ''] === player.id) || 
                            (phase === 'night_mafia' && mafiaTarget === player.id) || 
                            (phase === 'night_detective' && detectiveTarget === player.id);
            const voteCount = getVotesForPlayer(player.id);
            const mafiaVoteCount = phase === 'night_mafia_vote' ? Object.values(mafiaVotes).filter(id => id === player.id).length : 0;

            return (
              <button
                key={player.id}
                onClick={() => isSelectable && handlePlayerSelect(player.id)}
                disabled={!isSelectable && phase !== 'day_voting' && phase !== 'setup'}
                className={`relative rounded-xl border p-2 flex flex-col items-center text-center transition-all
                  ${player.isAlive ? 'bg-stone-900 border-stone-800' : 'bg-stone-950 border-red-950 opacity-60'}
                  ${isSelectable ? 'cursor-pointer hover:border-stone-500' : 'cursor-default'}
                  ${isTarget ? 'ring-2 ring-red-500' : ''}
                `}
              >
                {/* Mafia Vote Bubble (Night Voting) - Only visible to mafia members */}
                {phase === 'night_mafia_vote' && player.isAlive && player.role !== 'Mafia' && mafiaVoteCount > 0 && user?.role === 'Mafia' && user.isAlive && (
                  <div className="absolute -top-1 -right-1 bg-red-800 border border-red-600 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white shadow animate-pulse">
                    {mafiaVoteCount}
                  </div>
                )}

                {/* Day Vote Bubble (Day Voting) */}
                {phase === 'day_voting' && player.isAlive && voteCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-800 border border-red-600 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white shadow animate-pulse">
                    {voteCount}
                  </div>
                )}

                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold mb-1 shadow-md
                  ${player.isAlive ? 'bg-stone-800 border border-stone-700' : 'bg-red-950 border border-red-900'}`}>
                  {player.isAlive ? (isSelf ? '🎭' : '👤') : '💀'}
                </div>

                <span className="text-[10px] font-bold text-stone-300 truncate max-w-full">
                  {player.name}
                </span>

                {isRevealed && (
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 mt-1 rounded border flex items-center gap-1
                    ${player.role === 'Mafia' ? 'bg-red-950/40 text-red-400 border-red-900/40' : ''}
                    ${player.role === 'Detective' ? 'bg-yellow-950/60 text-yellow-300 border-yellow-700/50 font-bold' : ''}
                    ${player.role === 'Civilian' ? 'bg-stone-800 text-stone-400 border-stone-700/50' : ''}
                  `}>
                    {player.role === 'Detective' && !player.isAlive && detectiveLog.length > 0 && '🕵️‍♂️'}
                    {player.role}
                  </span>
                )}

                {!isRevealed && player.isAlive && (
                  <span className="text-[9px] text-stone-600 bg-stone-950 px-1.5 py-0.5 mt-1 rounded border border-stone-900">
                    ? ? ?
                  </span>
                )}

                {phase === 'day_voting' && player.isAlive && !isSelf && user?.isAlive && (
                  <div
                    onClick={(e) => { e.stopPropagation(); handlePlayerVote(player.id); }}
                    className={`mt-2 w-full py-1 border font-bold text-[9px] rounded flex items-center justify-center gap-1 cursor-pointer transition-all
                      ${currentVotes[user.id] === player.id 
                        ? 'bg-red-800 border-red-600 text-white' 
                        : 'bg-red-950/40 hover:bg-red-900/60 border-red-900/60 text-red-400'}`}
                  >
                    <Vote size={10} /> {currentVotes[user.id] === player.id ? 'Gewählt' : 'Abstimmen'}
                  </div>
                )}

                {phase === 'day_voting' && player.isAlive && isSelf && user?.isAlive && (
                  <div
                    onClick={(e) => { e.stopPropagation(); handlePlayerVote(''); }}
                    className={`mt-2 w-full py-1 text-[9px] rounded cursor-pointer transition-all
                      ${currentVotes[user.id] === '' 
                        ? 'bg-stone-700 text-white' 
                        : 'bg-stone-800 hover:bg-stone-700 text-stone-400 font-medium'}`}
                  >
                    Enthalten
                  </div>
                )}

                {phase === 'setup' && !isSelf && (
                  <div
                    onClick={(e) => { e.stopPropagation(); removePlayer(player.id); }}
                    className="absolute top-1 right-1.5 text-stone-600 hover:text-red-500 cursor-pointer text-xs"
                  >
                    ×
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex flex-col border-t border-stone-800 bg-stone-900 shrink-0" style={{ height: '220px' }}>
        <div ref={chatRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
          {chatMsgs.map(m => (
            <div key={m.id} className={`flex flex-col ${m.type === 'user' ? 'items-end' : 'items-start'}`}>
              {m.type === 'system' || m.type === 'danger' || m.type === 'detective' ? (
                <div className={`text-[10px] px-2 py-1 rounded w-full text-center border border-stone-800/50 shadow-inner
                  ${m.type === 'danger' ? 'bg-red-950/50 text-red-400 border-red-900/50 font-bold' : 
                    m.type === 'detective' ? 'bg-yellow-950/60 text-yellow-300 border-yellow-700/50 font-bold' : 
                    'bg-stone-950/50 text-stone-400'}`}>
                  {m.text}
                </div>
              ) : (
                <div className={`max-w-[85%] rounded-lg px-2.5 py-1.5 ${m.type === 'user' ? 'bg-red-900/40 text-stone-100 rounded-tr-sm border border-red-800/30' : 'bg-stone-800 text-stone-300 rounded-tl-sm border border-stone-700/50'}`}>
                  <div className="flex items-baseline justify-between gap-3 mb-0.5">
                    <span className={`text-[9px] font-bold ${m.type === 'user' ? 'text-red-400' : 'text-stone-400'}`}>{m.sender}</span>
                    <span className="text-[8px] text-stone-500">{m.time}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{m.text}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="px-2 py-2 bg-stone-950 border-t border-stone-800 flex gap-2 shrink-0">
          <input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendChat()}
            placeholder="Diskutieren..."
            disabled={!user?.isAlive || phase === 'game_over'}
            className="flex-1 py-1.5 px-3 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 placeholder:text-stone-500 disabled:opacity-50"
          />
          <button
            onClick={sendChat}
            disabled={!chatInput.trim() || !user?.isAlive || phase === 'game_over'}
            className="w-8 h-8 bg-stone-800 rounded-lg flex items-center justify-center disabled:opacity-50 border border-stone-700"
          >
            <Send size={12} className="text-stone-300" />
          </button>
        </div>
      </div>
    </div>
  );
}