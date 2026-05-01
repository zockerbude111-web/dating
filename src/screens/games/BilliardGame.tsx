import { useRef, useEffect, useCallback, useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';

// Base proportions for 8-ball pool (realistic ratios)
// Standard pool table ratio is 2:1 (length:width), we use slightly less for mobile fit
const TABLE_WIDTH_RATIO = 0.9; // Table width as ratio of available space
const TABLE_HEIGHT_RATIO = 1.6; // Table height as ratio of width (close to 2:1)
const CUSHION_RATIO = 0.05; // Cushion as ratio of table width
const POCKET_RADIUS_RATIO = 0.04; // Pocket radius as ratio of table width
const BALL_RADIUS_RATIO = 0.025; // Ball radius as ratio of table width

// Realistic ball physics parameters based on actual billiard physics
// Rolling friction coefficient for pool balls on felt (typical range: 0.01-0.03)
// Lower value = balls roll longer before stopping
const ROLLING_FRICTION = 0.008;
// Air resistance / drag coefficient (small but present)
// Scaled to be more noticeable at high speeds, negligible at low speeds
const AIR_DRAG = 0.0003;
// Minimum velocity threshold - extremely low for natural-looking stops
// Allows balls to roll very slowly before finally stopping
const MIN_SPEED_RATIO = 0.0005;
// Power multiplier for shot strength
const POWER_MULTIPLIER = 0.75;

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

interface TableDimensions {
  W: number;
  H: number;
  CUSHION: number;
  POCKET_R: number;
  BALL_R: number;
  MIN_SPEED: number;
}

function calculateTableDimensions(canvasWidth: number, canvasHeight: number): TableDimensions {
  // Calculate table size based on available canvas space
  const maxTableWidth = canvasWidth * TABLE_WIDTH_RATIO;
  const maxTableHeight = canvasHeight * TABLE_HEIGHT_RATIO;
  
  // Maintain aspect ratio while fitting in available space
  let W = maxTableWidth;
  let H = W * TABLE_HEIGHT_RATIO;
  
  if (H > maxTableHeight) {
    H = maxTableHeight;
    W = H / TABLE_HEIGHT_RATIO;
  }
  
  // Ensure minimum playable size
  W = Math.max(W, 300);
  H = Math.max(H, 500);
  
  const CUSHION = W * CUSHION_RATIO;
  const POCKET_R = W * POCKET_RADIUS_RATIO;
  const BALL_R = W * BALL_RADIUS_RATIO;
  const MIN_SPEED = W * MIN_SPEED_RATIO;
  
  return { W, H, CUSHION, POCKET_R, BALL_R, MIN_SPEED };
}

function createBalls(dimensions: TableDimensions): Ball[] {
  const { W, H, BALL_R } = dimensions;
  const balls: Ball[] = [];
  
  // Cue ball position (behind head string)
  balls.push({ id: 0, x: W / 2, y: H * 0.15, vx: 0, vy: 0, color: '#FFFFFF', stripe: false, pocketed: false });
  
  const colors = [
    { c: '#E8D44D', s: false }, { c: '#1E3A8A', s: false }, { c: '#DC2626', s: false },
    { c: '#7C3AED', s: false }, { c: '#F97316', s: false }, { c: '#15803D', s: false },
    { c: '#7F1D1D', s: false }, { c: '#111111', s: false }, { c: '#E8D44D', s: true },
    { c: '#1E3A8A', s: true }, { c: '#DC2626', s: true }, { c: '#7C3AED', s: true },
    { c: '#F97316', s: true }, { c: '#15803D', s: true }, { c: '#7F1D1D', s: true },
  ];
  
  // Rack position (foot spot area)
  const startY = H * 0.42;
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

function createPockets(dimensions: TableDimensions) {
  const { W, H, CUSHION, POCKET_R } = dimensions;
  // 6 pockets: 4 corners + 2 side-center (left & right middle)
  return [
    { x: CUSHION + POCKET_R * 0.5, y: CUSHION + POCKET_R * 0.5 },           // top-left
    { x: W - CUSHION - POCKET_R * 0.5, y: CUSHION + POCKET_R * 0.5 },        // top-right
    { x: CUSHION - POCKET_R * 0.3, y: H / 2 },                               // middle-left
    { x: W - CUSHION + POCKET_R * 0.3, y: H / 2 },                           // middle-right
    { x: CUSHION + POCKET_R * 0.5, y: H - CUSHION - POCKET_R * 0.5 },        // bottom-left
    { x: W - CUSHION - POCKET_R * 0.5, y: H - CUSHION - POCKET_R * 0.5 },    // bottom-right
  ];
}

// Empty array - no fake players when playing alone
const ONLINE_PLAYERS: { name: string; avatar: string }[] = [];

const CHAT_RESPONSES = [
  'Schöner Stoß! 🎱', 'Wow, direkt versenkt!', 'Knapp daneben 😅',
  'Gut gespielt!', 'Die 8 ist noch drin', 'Viel Glück! 🍀',
  'Nächster Versuch 💪', 'Stark!', 'Haha nice!', 'Weiter so! 🔥',
];

export default function BilliardGame({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<TableDimensions>({ W: 400, H: 640, CUSHION: 20, POCKET_R: 16, BALL_R: 10, MIN_SPEED: 6 });
  
  const stateRef = useRef({
    balls: [] as Ball[],
    pockets: [] as ReturnType<typeof createPockets>,
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
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  const chatAutoReplyRef = useRef<number>(0);

  // Initialize or reset game with current dimensions
  const initGame = useCallback((dims: TableDimensions) => {
    stateRef.current.balls = createBalls(dims);
    stateRef.current.pockets = createPockets(dims);
    stateRef.current.aiming = false;
    stateRef.current.moving = false;
    stateRef.current.pocketed = [];
    stateRef.current.message = '';
    stateRef.current.messageTimer = 0;
    stateRef.current.gameOver = false;
    stateRef.current.gameLost = false;
  }, []);

  // Handle resize - calculate table dimensions based on container size
  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newDims = calculateTableDimensions(rect.width, rect.height);
      setDimensions(newDims);
      // Re-initialize game when dimensions change significantly
      if (Math.abs(newDims.W - dimensions.W) > 50 || Math.abs(newDims.H - dimensions.H) > 50) {
        initGame(newDims);
      }
    };
    
    updateDimensions();
    
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Initialize balls and pockets when dimensions are first set
  useEffect(() => {
    if (stateRef.current.balls.length === 0) {
      initGame(dimensions);
    }
  }, [dimensions, initGame]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMsgs]);

  const getCanvasPos = useCallback((e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = dimensions.W / rect.width;
    const scaleY = dimensions.H / rect.height;
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX ?? 0;
      clientY = e.touches[0]?.clientY ?? e.changedTouches[0]?.clientY ?? 0;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }, [dimensions]);

  const isMoving = useCallback((): boolean => {
    return stateRef.current.balls.some(b => !b.pocketed && (Math.abs(b.vx) > dimensions.MIN_SPEED || Math.abs(b.vy) > dimensions.MIN_SPEED));
  }, [dimensions]);

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
    
    // Add global event listeners to track mouse/touch outside canvas
    window.addEventListener('mousemove', handleGlobalMove as any);
    window.addEventListener('mouseup', handleGlobalUp as any);
    window.addEventListener('touchmove', handleGlobalMove as any, { passive: false });
    window.addEventListener('touchend', handleGlobalUp as any);
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
    if (cue.pocketed || s.moving || isMoving()) {
      // Remove global event listeners
      window.removeEventListener('mousemove', handleGlobalMove as any);
      window.removeEventListener('mouseup', handleGlobalUp as any);
      window.removeEventListener('touchmove', handleGlobalMove as any);
      window.removeEventListener('touchend', handleGlobalUp as any);
      return;
    }
    const dx = s.aimStart.x - s.aimEnd.x;
    const dy = s.aimStart.y - s.aimEnd.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // Only shoot if there was a meaningful drag distance (prevents accidental shots)
    if (dist < 15) {
      // Remove global event listeners
      window.removeEventListener('mousemove', handleGlobalMove as any);
      window.removeEventListener('mouseup', handleGlobalUp as any);
      window.removeEventListener('touchmove', handleGlobalMove as any);
      window.removeEventListener('touchend', handleGlobalUp as any);
      return;
    }
    const power = Math.min(dist / 12, 16) * POWER_MULTIPLIER;
    const angle = Math.atan2(dy, dx);
    cue.vx = Math.cos(angle) * power;
    cue.vy = Math.sin(angle) * power;
    s.moving = true;
    
    // Remove global event listeners
    window.removeEventListener('mousemove', handleGlobalMove as any);
    window.removeEventListener('mouseup', handleGlobalUp as any);
    window.removeEventListener('touchmove', handleGlobalMove as any);
    window.removeEventListener('touchend', handleGlobalUp as any);
  }, [getCanvasPos, isMoving]);

  // Global handlers for mouse/touch outside canvas
  const handleGlobalMove = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    const s = stateRef.current;
    if (!s.aiming) return;
    
    // Get coordinates from global event
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = (e as TouchEvent).touches[0]?.clientX ?? (e as TouchEvent).changedTouches[0]?.clientX ?? 0;
      clientY = (e as TouchEvent).touches[0]?.clientY ?? (e as TouchEvent).changedTouches[0]?.clientY ?? 0;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }
    
    // Calculate position relative to canvas even if outside bounds
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = dimensions.W / rect.width;
    const scaleY = dimensions.H / rect.height;
    s.aimEnd = { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }, [dimensions]);

  const handleGlobalUp = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    const s = stateRef.current;
    if (!s.aiming) return;
    s.aiming = false;
    
    // Get coordinates from global event
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = (e as TouchEvent).changedTouches[0]?.clientX ?? 0;
      clientY = (e as TouchEvent).changedTouches[0]?.clientY ?? 0;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }
    
    // Calculate position relative to canvas even if outside bounds
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = dimensions.W / rect.width;
    const scaleY = dimensions.H / rect.height;
    s.aimEnd = { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    
    const cue = s.balls[0];
    if (cue.pocketed || s.moving || isMoving()) {
      // Remove global event listeners
      window.removeEventListener('mousemove', handleGlobalMove as any);
      window.removeEventListener('mouseup', handleGlobalUp as any);
      window.removeEventListener('touchmove', handleGlobalMove as any);
      window.removeEventListener('touchend', handleGlobalUp as any);
      return;
    }
    const dx = s.aimStart.x - s.aimEnd.x;
    const dy = s.aimStart.y - s.aimEnd.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // Only shoot if there was a meaningful drag distance (prevents accidental shots)
    if (dist < 15) {
      // Remove global event listeners
      window.removeEventListener('mousemove', handleGlobalMove as any);
      window.removeEventListener('mouseup', handleGlobalUp as any);
      window.removeEventListener('touchmove', handleGlobalMove as any);
      window.removeEventListener('touchend', handleGlobalUp as any);
      return;
    }
    const power = Math.min(dist / 12, 16) * POWER_MULTIPLIER;
    const angle = Math.atan2(dy, dx);
    cue.vx = Math.cos(angle) * power;
    cue.vy = Math.sin(angle) * power;
    s.moving = true;
    
    // Remove global event listeners
    window.removeEventListener('mousemove', handleGlobalMove as any);
    window.removeEventListener('mouseup', handleGlobalUp as any);
    window.removeEventListener('touchmove', handleGlobalMove as any);
    window.removeEventListener('touchend', handleGlobalUp as any);
  }, [getCanvasPos, isMoving]);

  const sendChat = useCallback(() => {
    if (!chatInput.trim()) return;
    const now = new Date();
    const time = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    setChatMsgs(prev => [...prev, { id: `m-${Date.now()}`, name: 'Du', text: chatInput.trim(), time, isMe: true }]);
    setChatInput('');
    // Only send auto-reply if there are other players in the game (simulated)
    if (ONLINE_PLAYERS.length > 0) {
      chatAutoReplyRef.current = window.setTimeout(() => {
        const player = ONLINE_PLAYERS[Math.floor(Math.random() * ONLINE_PLAYERS.length)];
        const response = CHAT_RESPONSES[Math.floor(Math.random() * CHAT_RESPONSES.length)];
        const replyTime = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        setChatMsgs(prev => [...prev, { id: `r-${Date.now()}`, name: player.name, text: response, time: replyTime, isMe: false }]);
      }, 1500 + Math.random() * 3000);
    }
  }, [chatInput]);

  const update = useCallback(() => {
    const s = stateRef.current;
    const { W, H, CUSHION, BALL_R, MIN_SPEED } = dimensions;
    const pockets = s.pockets;
    
    if (s.messageTimer > 0) {
      s.messageTimer--;
      if (s.messageTimer === 0) s.message = '';
    }
    if (!s.moving) return;
    const balls = s.balls;
    for (const b of balls) {
      if (b.pocketed) continue;
      
      // Apply realistic deceleration using physics-based model
      // Rolling friction: constant deceleration proportional to normal force
      // Air drag: velocity-squared resistance (simplified as linear for low speeds)
      const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      
      if (speed > 0) {
        // Calculate total deceleration magnitude
        // Rolling friction provides constant deceleration
        let decelMagnitude = ROLLING_FRICTION;
        
        // Add air drag component (more significant at higher speeds)
        decelMagnitude += AIR_DRAG * speed;
        
        // Apply deceleration in the opposite direction of velocity
        const decelX = (b.vx / speed) * decelMagnitude;
        const decelY = (b.vy / speed) * decelMagnitude;
        
        b.vx -= decelX;
        b.vy -= decelY;
        
        // Ensure we don't reverse direction (overshoot zero)
        const newSpeed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (newSpeed < MIN_SPEED || (b.vx * (b.vx - decelX) < 0) || (b.vy * (b.vy - decelY) < 0)) {
          b.vx = 0;
          b.vy = 0;
        }
      } else {
        b.vx = 0;
        b.vy = 0;
      }
      
      // Move ball
      b.x += b.vx;
      b.y += b.vy;
      // Cushion collisions
      if (b.x - BALL_R < CUSHION) { b.x = CUSHION + BALL_R; b.vx = Math.abs(b.vx) * 0.85; }
      if (b.x + BALL_R > W - CUSHION) { b.x = W - CUSHION - BALL_R; b.vx = -Math.abs(b.vx) * 0.85; }
      if (b.y - BALL_R < CUSHION) { b.y = CUSHION + BALL_R; b.vy = Math.abs(b.vy) * 0.85; }
      if (b.y + BALL_R > H - CUSHION) { b.y = H - CUSHION - BALL_R; b.vy = -Math.abs(b.vy) * 0.85; }
      // Pocket detection
      for (const p of pockets) {
        const pd = Math.sqrt((b.x - p.x) ** 2 + (b.y - p.y) ** 2);
        if (pd < dimensions.POCKET_R) {
          b.pocketed = true;
          b.vx = 0;
          b.vy = 0;
          if (b.id === 0) {
            s.message = 'Foul! Weisse Kugel versenkt';
            s.messageTimer = 120;
            setTimeout(() => { b.pocketed = false; b.x = W / 2; b.y = H * 0.15; }, 800);
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
  }, [dimensions, isMoving]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;
    const { W, H, CUSHION, BALL_R } = dimensions;

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
    ctx.beginPath(); ctx.moveTo(CUSHION, H * 0.2); ctx.lineTo(W - CUSHION, H * 0.2); ctx.stroke();
    ctx.setLineDash([]);

    // Foot spot
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath(); ctx.arc(W / 2, H * 0.42, 2, 0, Math.PI * 2); ctx.fill();

    // Pockets
    for (const p of s.pockets) {
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(p.x, p.y, dimensions.POCKET_R, 0, Math.PI * 2); ctx.fill();
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
        ctx.lineTo(cue.x + Math.cos(angle) * (W * 0.5), cue.y + Math.sin(angle) * (W * 0.5));
        ctx.stroke();
        ctx.setLineDash([]);
        const dist = Math.sqrt(dx * dx + dy * dy);
        const power = Math.min(dist, W * 0.45);
        const cueLen = W * 0.25;
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
        const pct = Math.min(power / (W * 0.45), 1);
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
      const ballSize = BALL_R * 0.4;
      const spacing = BALL_R * 1.2;
      ctx.fillRect(5, H - ballSize * 2 - 3, pocketed.length * spacing + 6, ballSize * 2 + 3);
      pocketed.forEach((b, i) => {
        ctx.fillStyle = b.color;
        ctx.beginPath(); ctx.arc(11 + i * spacing, H - ballSize - 1.5, ballSize, 0, Math.PI * 2); ctx.fill();
      });
    }

    // Message
    if (s.message) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      const tw = ctx.measureText(s.message).width;
      ctx.fillRect(W / 2 - tw / 2 - 12, H / 2 - 14, tw + 24, 28);
      ctx.fillStyle = '#FFF';
      ctx.font = `bold ${Math.max(12, W * 0.03)}px Inter, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(s.message, W / 2, H / 2);
    }

    // Game over
    if (s.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = s.gameLost ? '#EF4444' : '#22C55E';
      ctx.font = `bold ${Math.max(22, W * 0.055)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(s.gameLost ? '😢 Verloren!' : '🏆 Gewonnen!', W / 2, H / 2 - 20);
      ctx.fillStyle = '#FFF';
      ctx.font = `${Math.max(13, W * 0.032)}px Inter, sans-serif`;
      ctx.fillText(`${s.pocketed.length}/15 Kugeln versenkt`, W / 2, H / 2 + 5);
      ctx.font = `${Math.max(11, W * 0.028)}px Inter, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('Tippe zum Neustarten', W / 2, H / 2 + 25);
    }
  }, [dimensions]);

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
      <div ref={containerRef} className="flex-1 flex items-center justify-center px-3 py-2 min-h-0">
        <canvas
          ref={canvasRef}
          width={dimensions.W}
          height={dimensions.H}
          className="w-full h-full rounded-xl shadow-2xl cursor-crosshair"
          style={{ touchAction: 'none' }}
          onMouseDown={handleDown}
          onMouseMove={handleMove}
          onMouseUp={handleUp}
          onTouchStart={handleDown}
          onTouchMove={handleMove}
          onTouchEnd={handleUp}
          onClick={() => {
            if (s.gameOver) {
              initGame(dimensions);
            }
          }}
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
