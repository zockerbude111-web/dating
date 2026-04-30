import { useRef, useEffect, useCallback, useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';

// Vertical table dimensions
const W = 220;
const H = 400;
const CUSHION = 16;
const POCKET_R = 12;
const BALL_R = 7;
const FRICTION = 0.985;
const MIN_SPEED = 0.15;

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  stripe: boolean;
  pocketed: boolean;
}

interface ChatMsg {
  id: string;
  name: string;
  text: string;
  time: string;
  isMe: boolean;
}

// 6 pockets: 4 corners + 2 side-center (left & right middle)
const POCKETS = [
  { x: CUSHION + 2, y: CUSHION + 2 },           // top-left
  { x: W - CUSHION - 2, y: CUSHION + 2 },        // top-right
  { x: CUSHION - 2, y: H / 2 },                  // middle-left
  { x: W - CUSHION + 2, y: H / 2 },              // middle-right
  { x: CUSHION + 2, y: H - CUSHION - 2 },        // bottom-left
  { x: W - CUSHION - 2, y: H - CUSHION - 2 },    // bottom-right
];

const ONLINE_PLAYERS = [
  { name: 'Lukas', avatar: '#7c3aed' },
  { name: 'Sophie', avatar: '#f43f5e' },
  { name: 'Emma', avatar: '#14b8a6' },
  { name: 'Felix', avatar: '#f59e0b' },
  { name: 'Clara', avatar: '#ec4899' },
];

const CHAT_RESPONSES = [
  'Schöner Stoß! 🎱', 'Wow, direkt versenkt!', 'Knapp daneben 😅',
  'Gut gespielt!', 'Die 8 ist noch drin', 'Viel Glück! 🍀',
  'Nächster Versuch 💪', 'Stark!', 'Haha nice!', 'Weiter so! 🔥',
];

function createBalls(): Ball[] {
  const balls: Ball[] = [];
  balls.push({ id: 0, x: W / 2, y: 100, vx: 0, vy: 0, color: '#FFFFFF', stripe: false, pocketed: false });
  const colors = [
    { c: '#E8D44D', s: false }, { c: '#1E3A8A', s: false }, { c: '#DC2626', s: false },
    { c: '#7C3AED', s: false }, { c: '#F97316', s: false }, { c: '#15803D', s: false },
    { c: '#7F1D1D', s: false }, { c: '#111111', s: false }, { c: '#E8D44D', s: true },
    { c: '#1E3A8A', s: true }, { c: '#DC2626', s: true }, { c: '#7C3AED', s: true },
    { c: '#F97316', s: true }, { c: '#15803D', s: true }, { c: '#7F1D1D', s: true },
  ];
  const startY = 280;
  const startX = W / 2;
  const spacing = BALL_R * 2 + 1;
  let idx = 0;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col <= row; col++) {
      const x = startX + (col - row / 2) * spacing;
      const y = startY + row * spacing * 0.866;
      balls.push({ id: idx + 1, x, y, vx: 0, vy: 0, color: colors[idx].c, stripe: colors[idx].s, pocketed: false });
      idx++;
    }
  }
  return balls;
}

export default function BilliardGame({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    balls: createBalls(),
    aiming: false,
    aimStart: { x: 0, y: 0 },
    aimEnd: { x: 0, y: 0 },
    moving: false,
    pocketed: [] as number[],
    message: '',
    messageTimer: 0,
    gameOver: false,
    gameLost: false,
  });
  const animRef = useRef<number>(0);
  const [, forceRender] = useState(0);
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([
    { id: '1', name: 'System', text: 'Willkommen am Tisch! 🎱', time: '12:00', isMe: false },
    { id: '2', name: 'Lukas', text: 'Viel Glück!', time: '12:01', isMe: false },
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  const chatAutoReplyRef = useRef<number>(0);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMsgs]);

  const getCanvasPos = useCallback((e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX ?? 0;
      clientY = e.touches[0]?.clientY ?? e.changedTouches[0]?.clientY ?? 0;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }, []);

  const isMoving = useCallback((): boolean => {
    return stateRef.current.balls.some(b => !b.pocketed && (Math.abs(b.vx) > MIN_SPEED || Math.abs(b.vy) > MIN_SPEED));
  }, []);

  const handleDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const s = stateRef.current;
    if (s.gameOver) return;
    if (s.moving || isMoving()) return;
    const pos = getCanvasPos(e);
    const cue = s.balls[0];
    if (cue.pocketed) return;
    s.aiming = true;
    s.aimStart = { x: cue.x, y: cue.y };
    s.aimEnd = { x: pos.x, y: pos.y };
  }, [getCanvasPos, isMoving]);

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const s = stateRef.current;
    if (!s.aiming) return;
    s.aimEnd = getCanvasPos(e);
  }, [getCanvasPos]);

  const handleUp = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const s = stateRef.current;
    if (!s.aiming) return;
    s.aiming = false;
    const endPos = getCanvasPos(e);
    s.aimEnd = endPos;
    const cue = s.balls[0];
    if (cue.pocketed || s.moving || isMoving()) return;
    const dx = s.aimStart.x - s.aimEnd.x;
    const dy = s.aimStart.y - s.aimEnd.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // Only shoot if there was a meaningful drag distance (prevents accidental shots)
    if (dist < 15) return;
    const power = Math.min(dist / 15, 12);
    const angle = Math.atan2(dy, dx);
    cue.vx = Math.cos(angle) * power;
    cue.vy = Math.sin(angle) * power;
    s.moving = true;
  }, [getCanvasPos, isMoving]);

  const sendChat = useCallback(() => {
    if (!chatInput.trim()) return;
    const now = new Date();
    const time = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    setChatMsgs(prev => [...prev, { id: `m-${Date.now()}`, name: 'Du', text: chatInput.trim(), time, isMe: true }]);
    setChatInput('');
    chatAutoReplyRef.current = window.setTimeout(() => {
      const player = ONLINE_PLAYERS[Math.floor(Math.random() * ONLINE_PLAYERS.length)];
      const response = CHAT_RESPONSES[Math.floor(Math.random() * CHAT_RESPONSES.length)];
      const replyTime = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
      setChatMsgs(prev => [...prev, { id: `r-${Date.now()}`, name: player.name, text: response, time: replyTime, isMe: false }]);
    }, 1500 + Math.random() * 3000);
  }, [chatInput]);

  const update = useCallback(() => {
    const s = stateRef.current;
    if (s.messageTimer > 0) {
      s.messageTimer--;
      if (s.messageTimer === 0) s.message = '';
    }
    if (!s.moving) return;
    const balls = s.balls;
    for (const b of balls) {
      if (b.pocketed) continue;
      b.x += b.vx;
      b.y += b.vy;
      b.vx *= FRICTION;
      b.vy *= FRICTION;
      if (Math.abs(b.vx) < MIN_SPEED * 0.5) b.vx = 0;
      if (Math.abs(b.vy) < MIN_SPEED * 0.5) b.vy = 0;
      if (b.x - BALL_R < CUSHION) { b.x = CUSHION + BALL_R; b.vx = Math.abs(b.vx) * 0.85; }
      if (b.x + BALL_R > W - CUSHION) { b.x = W - CUSHION - BALL_R; b.vx = -Math.abs(b.vx) * 0.85; }
      if (b.y - BALL_R < CUSHION) { b.y = CUSHION + BALL_R; b.vy = Math.abs(b.vy) * 0.85; }
      if (b.y + BALL_R > H - CUSHION) { b.y = H - CUSHION - BALL_R; b.vy = -Math.abs(b.vy) * 0.85; }
      for (const p of POCKETS) {
        const pd = Math.sqrt((b.x - p.x) ** 2 + (b.y - p.y) ** 2);
        if (pd < POCKET_R) {
          b.pocketed = true;
          b.vx = 0;
          b.vy = 0;
          if (b.id === 0) {
            s.message = 'Foul! Weisse Kugel versenkt';
            s.messageTimer = 120;
            setTimeout(() => { b.pocketed = false; b.x = W / 2; b.y = 100; }, 800);
          } else if (b.id === 8) {
            s.message = '🎱 8-Ball versenkt! Verloren!';
            s.messageTimer = 300;
            s.gameOver = true;
            s.gameLost = true;
            forceRender(n => n + 1);
          } else {
            s.pocketed.push(b.id);
            s.message = `Kugel ${b.id} versenkt!`;
            s.messageTimer = 60;
            forceRender(n => n + 1);
          }
          break;
        }
      }
    }
    for (let i = 0; i < balls.length; i++) {
      if (balls[i].pocketed) continue;
      for (let j = i + 1; j < balls.length; j++) {
        if (balls[j].pocketed) continue;
        const a = balls[i];
        const b = balls[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = BALL_R * 2;
        if (dist < minDist && dist > 0) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;
          a.x -= nx * overlap * 0.5;
          a.y -= ny * overlap * 0.5;
          b.x += nx * overlap * 0.5;
          b.y += ny * overlap * 0.5;
          const dvx = a.vx - b.vx;
          const dvy = a.vy - b.vy;
          const dvn = dvx * nx + dvy * ny;
          if (dvn > 0) {
            a.vx -= dvn * nx * 0.95;
            a.vy -= dvn * ny * 0.95;
            b.vx += dvn * nx * 0.95;
            b.vy += dvn * ny * 0.95;
          }
        }
      }
    }
    if (!isMoving()) {
      s.moving = false;
      for (const b of balls) { b.vx = 0; b.vy = 0; }
      const remaining = balls.filter(b => !b.pocketed && b.id !== 0 && b.id !== 8).length;
      if (remaining === 0 && !s.gameOver) {
        s.message = 'Jetzt die 8 versenken! 🎱';
        s.messageTimer = 120;
        forceRender(n => n + 1);
      }
    }
  }, [isMoving]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;

    ctx.fillStyle = '#5C3A1E';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);
    ctx.fillStyle = '#0B6623';
    ctx.fillRect(CUSHION, CUSHION, W - CUSHION * 2, H - CUSHION * 2);
    ctx.strokeStyle = '#0A5A1F';
    ctx.lineWidth = 2;
    ctx.strokeRect(CUSHION, CUSHION, W - CUSHION * 2, H - CUSHION * 2);

    // Diamond markers
    ctx.fillStyle = '#C0A030';
    const dPositions = [0.25, 0.5, 0.75];
    for (const d of dPositions) {
      ctx.beginPath(); ctx.arc(CUSHION + (W - CUSHION * 2) * d, CUSHION / 2, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(CUSHION + (W - CUSHION * 2) * d, H - CUSHION / 2, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(CUSHION / 2, CUSHION + (H - CUSHION * 2) * d, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(W - CUSHION / 2, CUSHION + (H - CUSHION * 2) * d, 2, 0, Math.PI * 2); ctx.fill();
    }

    // Head string
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(CUSHION, 130); ctx.lineTo(W - CUSHION, 130); ctx.stroke();
    ctx.setLineDash([]);

    // Foot spot
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath(); ctx.arc(W / 2, 280, 2, 0, Math.PI * 2); ctx.fill();

    // Pockets
    for (const p of POCKETS) {
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(p.x, p.y, POCKET_R, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#3A2A0A'; ctx.lineWidth = 2; ctx.stroke();
    }

    // Balls
    for (const b of s.balls) {
      if (b.pocketed) continue;
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath(); ctx.arc(b.x + 1.5, b.y + 1.5, BALL_R, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = b.color;
      ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2); ctx.fill();
      if (b.stripe) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R, -0.6, 0.6); ctx.lineTo(b.x, b.y); ctx.fill();
        ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R, Math.PI - 0.6, Math.PI + 0.6); ctx.lineTo(b.x, b.y); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.arc(b.x - 2, b.y - 2, BALL_R * 0.35, 0, Math.PI * 2); ctx.fill();
      if (b.id > 0) {
        if (b.stripe) {
          ctx.fillStyle = '#FFF';
          ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R * 0.45, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#000';
        } else {
          ctx.fillStyle = '#FFF';
        }
        ctx.font = `bold ${BALL_R * 0.9}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(b.id), b.x, b.y + 0.5);
      }
    }

    // Aim line
    if (s.aiming && !s.moving) {
      const cue = s.balls[0];
      if (!cue.pocketed) {
        const dx = s.aimStart.x - s.aimEnd.x;
        const dy = s.aimStart.y - s.aimEnd.y;
        const angle = Math.atan2(dy, dx);
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 5]);
        ctx.beginPath(); ctx.moveTo(cue.x, cue.y);
        ctx.lineTo(cue.x + Math.cos(angle) * 200, cue.y + Math.sin(angle) * 200);
        ctx.stroke();
        ctx.setLineDash([]);
        const dist = Math.sqrt(dx * dx + dy * dy);
        const power = Math.min(dist, 180);
        const cueLen = 100;
        const cueStartDist = BALL_R + 4 + power * 0.3;
        const sx = cue.x - Math.cos(angle) * cueStartDist;
        const sy = cue.y - Math.sin(angle) * cueStartDist;
        const ex = sx - Math.cos(angle) * cueLen;
        const ey = sy - Math.sin(angle) * cueLen;
        const grad = ctx.createLinearGradient(sx, sy, ex, ey);
        grad.addColorStop(0, '#F5DEB3'); grad.addColorStop(0.1, '#D2B48C'); grad.addColorStop(1, '#4A3728');
        ctx.strokeStyle = grad; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.fillStyle = '#6BC5E8';
        ctx.beginPath(); ctx.arc(sx, sy, 2.5, 0, Math.PI * 2); ctx.fill();
        // Power bar
        const pct = Math.min(power / 180, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(W - 22, CUSHION + 5, 10, H - CUSHION * 2 - 10);
        const barH = (H - CUSHION * 2 - 10) * pct;
        const barGrad = ctx.createLinearGradient(0, H - CUSHION - 5, 0, CUSHION + 5);
        barGrad.addColorStop(0, '#22C55E'); barGrad.addColorStop(0.5, '#EAB308'); barGrad.addColorStop(1, '#EF4444');
        ctx.fillStyle = barGrad;
        ctx.fillRect(W - 22, H - CUSHION - 5 - barH, 10, barH);
        ctx.strokeStyle = '#FFF'; ctx.lineWidth = 1;
        ctx.strokeRect(W - 22, CUSHION + 5, 10, H - CUSHION * 2 - 10);
      }
    }

    // Pocketed balls display at bottom
    const pocketed = s.balls.filter(b => b.pocketed && b.id > 0 && b.id !== 8);
    if (pocketed.length > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(5, H - 13, pocketed.length * 12 + 6, 11);
      pocketed.forEach((b, i) => {
        ctx.fillStyle = b.color;
        ctx.beginPath(); ctx.arc(11 + i * 12, H - 7.5, 4, 0, Math.PI * 2); ctx.fill();
      });
    }

    // Message
    if (s.message) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      const tw = ctx.measureText(s.message).width;
      ctx.fillRect(W / 2 - tw / 2 - 12, H / 2 - 14, tw + 24, 28);
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(s.message, W / 2, H / 2);
    }

    // Game over
    if (s.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = s.gameLost ? '#EF4444' : '#22C55E';
      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(s.gameLost ? '😢 Verloren!' : '🏆 Gewonnen!', W / 2, H / 2 - 20);
      ctx.fillStyle = '#FFF';
      ctx.font = '13px Inter, sans-serif';
      ctx.fillText(`${s.pocketed.length}/15 Kugeln versenkt`, W / 2, H / 2 + 5);
      ctx.font = '11px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('Tippe zum Neustarten', W / 2, H / 2 + 25);
    }
  }, []);

  const loop = useCallback(() => {
    update();
    draw();
    animRef.current = requestAnimationFrame(loop);
  }, [update, draw]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [loop]);

  useEffect(() => {
    return () => clearTimeout(chatAutoReplyRef.current);
  }, []);

  const s = stateRef.current;

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-900 to-gray-800 pb-16">
      {/* Header */}
      <div className="pt-10 pb-2 px-4 glass-card border-b border-white/20 flex items-center gap-3">
        <button onClick={onBack} className="text-gray-500"><ArrowLeft size={20} /></button>
        <h2 className="text-lg font-bold text-gray-800">🎱 8ball Pool</h2>
        <span className="ml-auto text-xs font-semibold text-primary-600">{s.pocketed.length}/15</span>
        {/* Online players indicator */}
        <div className="flex -space-x-1.5">
          {ONLINE_PLAYERS.slice(0, 3).map(p => (
            <div key={p.name} className="w-6 h-6 rounded-full border-2 border-gray-800 flex items-center justify-center text-white text-[8px] font-bold" style={{ backgroundColor: p.avatar }} title={p.name}>
              {p.name[0]}
            </div>
          ))}
          <div className="w-6 h-6 rounded-full border-2 border-gray-800 bg-gray-600 flex items-center justify-center text-white text-[8px] font-bold">
            +{ONLINE_PLAYERS.length - 3}
          </div>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="flex-1 flex items-center justify-center px-3 py-2 min-h-0">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="w-full max-w-[220px] rounded-xl shadow-2xl cursor-crosshair"
          style={{ touchAction: 'none', maxHeight: '44vh' }}
          onMouseDown={handleDown}
          onMouseMove={handleMove}
          onMouseUp={handleUp}
          onMouseLeave={handleUp}
          onTouchStart={handleDown}
          onTouchMove={handleMove}
          onTouchEnd={handleUp}
        />
      </div>

      {/* Chat - WhatsApp Style, always visible */}
      <div className="flex flex-col border-t border-gray-700 bg-gray-800 shrink-0" style={{ height: '230px' }}>
        {/* Online bar */}
        <div className="px-3 py-1.5 bg-gray-700/50 border-b border-gray-600 flex items-center gap-2 overflow-x-auto shrink-0">
          <span className="text-[10px] text-gray-400 shrink-0">Chat • Online:</span>
          {ONLINE_PLAYERS.map(p => (
            <div key={p.name} className="flex items-center gap-1 shrink-0">
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold" style={{ backgroundColor: p.avatar }}>
                {p.name[0]}
              </div>
              <span className="text-[10px] text-gray-300">{p.name}</span>
            </div>
          ))}
        </div>

        {/* Messages */}
        <div ref={chatRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
          {chatMsgs.map(m => (
            <div key={m.id} className={`flex gap-1.5 ${m.isMe ? 'flex-row-reverse' : ''}`}>
              <span className={`text-[10px] font-bold shrink-0 ${m.isMe ? 'text-primary-400' : 'text-green-400'}`}>
                {m.name}:
              </span>
              <span className={`text-[11px] leading-relaxed px-2 py-0.5 rounded-lg max-w-[75%] ${m.isMe ? 'bg-primary-600/30 text-primary-100' : 'bg-gray-700 text-gray-200'}`}>
                {m.text}
              </span>
              <span className="text-[8px] text-gray-500 shrink-0 self-end">{m.time}</span>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="px-2 py-2 bg-gray-700/50 border-t border-gray-600 flex gap-2 shrink-0">
          <input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendChat()}
            placeholder="Nachricht schreiben..."
            className="flex-1 py-1.5 px-3 bg-gray-600 border border-gray-500 rounded-lg text-xs text-white placeholder:text-gray-400"
          />
          <button
            onClick={sendChat}
            disabled={!chatInput.trim()}
            className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center disabled:opacity-50 active:scale-90 transition-all"
          >
            <Send size={12} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
