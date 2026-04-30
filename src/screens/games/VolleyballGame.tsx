import { useRef, useEffect, useCallback, useState } from 'react';
import { ArrowLeft } from 'lucide-react';

const W = 400;
const H = 300;
const GROUND_Y = 260;
const NET_X = W / 2;
const NET_TOP = 205;
const NET_W = 6;
const BALL_R = 10;
const BLOB_W = 40;
const BLOB_H = 36;
const GRAVITY = 0.06;
const JUMP_VEL = -2.8;
const MOVE_SPEED = 2.55;
const MAX_SCORE = 7;
const BALL_FRICTION = 0.985;
const BLOB_MAX_Y = GROUND_Y - BLOB_H;
const AI_SPEED = 1.1;

interface Blob {
  x: number;
  y: number;
  vy: number;
  onGround: boolean;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export default function VolleyballGame({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const stateRef = useRef({
    left: { x: 80, y: BLOB_MAX_Y, vy: 0, onGround: true } as Blob,
    right: { x: W - 80, y: BLOB_MAX_Y, vy: 0, onGround: true } as Blob,
    ball: { x: W / 2, y: 60, vx: 0, vy: 0 } as Ball,
    scoreL: 0,
    scoreR: 0,
    paused: false,
    resetTimer: 0,
    message: '',
    winner: null as string | null,
  });
  const animRef = useRef<number>(0);
  const [, forceRender] = useState(0);
  const [started, setStarted] = useState(false);
  const touchRef = useRef<{ leftTouch: number | null; rightTouch: number | null; leftX: number; jumpLeft: boolean; jumpRight: boolean }>({
    leftTouch: null, rightTouch: null, leftX: 0, jumpLeft: false, jumpRight: false,
  });

  const resetBall = useCallback((dir: number) => {
    const s = stateRef.current;
    // Start ball well into the serving side, not at the net
    s.ball.x = dir > 0 ? W * 0.75 : W * 0.25;
    s.ball.y = 60;
    // Gentle horizontal push toward the side, plus upward arc
    s.ball.vx = dir * (0.68 + Math.random() * 0.42);
    s.ball.vy = -2.1;
    s.paused = false;
    s.resetTimer = 0;
  }, []);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.scoreL = 0;
    s.scoreR = 0;
    s.winner = null;
    s.message = '';
    s.left = { x: 80, y: BLOB_MAX_Y, vy: 0, onGround: true };
    s.right = { x: W - 80, y: BLOB_MAX_Y, vy: 0, onGround: true };
    resetBall(Math.random() > 0.5 ? 1 : -1);
    setStarted(true);
    forceRender(n => n + 1);
  }, [resetBall]);

  const update = useCallback(() => {
    const s = stateRef.current;
    if (s.winner) return;

    if (s.resetTimer > 0) {
      s.resetTimer--;
      if (s.resetTimer === 0) {
        resetBall(s.ball.x < NET_X ? 1 : -1);
        s.message = ''; // Clear message
      }
      return;
    }

    const keys = keysRef.current;
    const tc = touchRef.current;

    // Left blob controls: A/D + W
    let leftMove = 0;
    if (keys.has('a') || keys.has('arrowleft')) leftMove = -1;
    if (keys.has('d') || keys.has('arrowright')) leftMove = 1;
    // Touch override
    if (tc.leftTouch !== null) {
      const dx = tc.leftX;
      if (dx < -20) leftMove = -1;
      else if (dx > 20) leftMove = 1;
    }

    s.left.x += leftMove * MOVE_SPEED;
    s.left.x = Math.max(BLOB_W / 2, Math.min(NET_X - NET_W / 2 - BLOB_W / 2, s.left.x));

    if ((keys.has('w') || keys.has('arrowup') || tc.jumpLeft) && s.left.onGround) {
      s.left.vy = JUMP_VEL;
      s.left.onGround = false;
      tc.jumpLeft = false;
    }
    s.left.vy += GRAVITY;
    s.left.y += s.left.vy;
    if (s.left.y >= BLOB_MAX_Y) {
      s.left.y = BLOB_MAX_Y;
      s.left.vy = 0;
      s.left.onGround = true;
    }

    // Right blob (AI)
    const ballOnAISide = s.ball.x > NET_X;
    const ballFalling = s.ball.vy > 0;
    const ballAboveNet = s.ball.y < NET_TOP;

    let aiTarget: number;
    if (ballOnAISide) {
      // AI positions itself to the RIGHT of the ball (aiTarget = s.ball.x + 14)
      // This ensures that the ball hits the LEFT side of the AI's head, 
      // launching it LEFT over the net toward the player's side.
      if (ballAboveNet) {
        aiTarget = s.ball.x + 14; 
      } else {
        // Ball is lower, position aggressively to the right to angle it over
        aiTarget = s.ball.x + 12;
      }
    } else {
      // Ball on player side: position near net ready to intercept
      aiTarget = NET_X + 60;
    }

    const diff = aiTarget - s.right.x;
    s.right.x += Math.sign(diff) * Math.min(Math.abs(diff), AI_SPEED * 1.2); // slightly faster tracking
    s.right.x = Math.max(NET_X + NET_W / 2 + BLOB_W / 2, Math.min(W - BLOB_W / 2, s.right.x));

    // AI jumping: tries to hit ball when it's above net height or falling toward it
    if (ballOnAISide && s.right.onGround) {
      const distToBallX = Math.abs(s.ball.x - s.right.x);
      const distToBallY = s.ball.y - s.right.y;
      
      // Jump when ball is nearby and above head level → hit it over the net
      // Since AI is slightly right of the ball, jumping hits the ball on the left side of the head
      if (distToBallX < 45 && distToBallY < BLOB_H * 1.2 && ballFalling && Math.random() < 0.45) {
        s.right.vy = JUMP_VEL * 0.65; // jump to hit ball over net
        s.right.onGround = false;
      }
      // Ball is low and close — emergency jump to save
      if (distToBallX < 35 && s.ball.y > GROUND_Y - 80 && Math.random() < 0.6) {
        s.right.vy = JUMP_VEL * 0.6;
        s.right.onGround = false;
      }
    }
    s.right.vy += GRAVITY;
    s.right.y += s.right.vy;
    if (s.right.y >= BLOB_MAX_Y) {
      s.right.y = BLOB_MAX_Y;
      s.right.vy = 0;
      s.right.onGround = true;
    }

    // Ball physics
    s.ball.vy += GRAVITY;
    s.ball.vx *= BALL_FRICTION;
    s.ball.x += s.ball.vx;
    s.ball.y += s.ball.vy;

    // Wall bounce
    if (s.ball.x - BALL_R < 0) { s.ball.x = BALL_R; s.ball.vx = Math.abs(s.ball.vx) * 0.55; }
    if (s.ball.x + BALL_R > W) { s.ball.x = W - BALL_R; s.ball.vx = -Math.abs(s.ball.vx) * 0.55; }
    if (s.ball.y - BALL_R < 0) { s.ball.y = BALL_R; s.ball.vy = Math.abs(s.ball.vy) * 0.55; }

    // Net collision: hitting the net is an immediate point for the other player!
    if (s.ball.y + BALL_R > NET_TOP && Math.abs(s.ball.x - NET_X) < NET_W / 2 + BALL_R) {
      if (s.ball.x < NET_X) {
        s.scoreR++;
        s.message = 'Netzberührung! Punkt für CPU';
      } else {
        s.scoreL++;
        s.message = 'Netzberührung! Punkt für dich!';
      }
      s.ball.vx = 0;
      s.ball.vy = 0;
      s.ball.y = GROUND_Y - BALL_R;
      s.resetTimer = 60;
      forceRender(n => n + 1);

      if (s.scoreL >= MAX_SCORE || s.scoreR >= MAX_SCORE) {
        s.winner = s.scoreL >= MAX_SCORE ? 'Du' : 'Gegner';
        forceRender(n => n + 1);
      }
      return;
    }

    // Blob-ball collision: ball bounces off head based on where it hits
    const blobBallCollide = (blob: Blob) => {
      const headCX = blob.x;
      const headCY = blob.y + BLOB_H * 0.3; // head center
      const headR = BLOB_W * 0.5;
      const dx = s.ball.x - headCX;
      const dy = s.ball.y - headCY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = BALL_R + headR;
      if (dist < minDist && dist > 0) {
        // Normal vector from head center to ball = bounce direction
        const nx = dx / dist;
        const ny = dy / dist;
        // Push ball out of head
        s.ball.x = headCX + nx * minDist;
        s.ball.y = headCY + ny * minDist;
        // Bounce direction depends on hit position:
        // - hit LEFT side of head → ball goes LEFT
        // - hit RIGHT side of head → ball goes RIGHT
        const hitSide = dx / headR; // -1 (far left) to +1 (far right)
        const bounceSpeed = 3.2;
        
        // Determine if hit goes toward the net
        const goingTowardNet = (blob.x < NET_X && hitSide > 0) || (blob.x > NET_X && hitSide < 0);
        
        // Horizontal push based on which side of head is hit
        s.ball.vx = hitSide * bounceSpeed * 1.2;
        
        // Use a higher arc if trying to hit the ball over the net
        if (goingTowardNet) {
          s.ball.vy = -bounceSpeed * (1.1 + Math.abs(ny) * 0.4);
        } else {
          s.ball.vy = -bounceSpeed * (0.75 + Math.abs(ny) * 0.3);
        }
        
        // Add blob's upward momentum if jumping
        if (blob.vy < 0) {
          s.ball.vy += blob.vy * 0.3;
        }
        // Clamp total speed
        const speed = Math.sqrt(s.ball.vx ** 2 + s.ball.vy ** 2);
        if (speed > 4.6) {
          s.ball.vx = (s.ball.vx / speed) * 4.6;
          s.ball.vy = (s.ball.vy / speed) * 4.6;
        }
      }
    };

    blobBallCollide(s.left);
    blobBallCollide(s.right);

    // Ground = score
    if (s.ball.y + BALL_R >= GROUND_Y) {
      if (s.ball.x < NET_X) {
        s.scoreR++;
      } else {
        s.scoreL++;
      }
      s.ball.vy = 0;
      s.ball.vx = 0;
      s.ball.y = GROUND_Y - BALL_R;
      s.resetTimer = 60;
      forceRender(n => n + 1);

      if (s.scoreL >= MAX_SCORE || s.scoreR >= MAX_SCORE) {
        s.winner = s.scoreL >= MAX_SCORE ? 'Du' : 'Gegner';
        forceRender(n => n + 1);
      }
    }
  }, [resetBall]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;

    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#87CEEB');
    skyGrad.addColorStop(0.5, '#B0E0FF');
    skyGrad.addColorStop(0.85, '#F4D35E');
    skyGrad.addColorStop(1, '#D4A843');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Sun
    ctx.fillStyle = '#FFE066';
    ctx.beginPath();
    ctx.arc(340, 40, 25, 0, Math.PI * 2);
    ctx.fill();

    // Sand
    ctx.fillStyle = '#F4D35E';
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    ctx.fillStyle = '#E8C84A';
    ctx.fillRect(0, GROUND_Y, W, 3);

    // Net pole
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(NET_X - 2, NET_TOP - 10, 4, GROUND_Y - NET_TOP + 10);
    // Net
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    for (let y = NET_TOP; y < GROUND_Y; y += 12) {
      ctx.beginPath();
      ctx.moveTo(NET_X - 8, y);
      ctx.lineTo(NET_X + 8, y);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(NET_X, NET_TOP);
    ctx.lineTo(NET_X, GROUND_Y);
    ctx.stroke();

    // Draw blob helper
    const drawBlob = (blob: Blob, color: string, eyeColor: string) => {
      // Body (half circle on bottom)
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(blob.x, blob.y + BLOB_H, BLOB_W / 2, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(blob.x - BLOB_W / 2, blob.y + BLOB_H - 1, BLOB_W, 2);

      // Head (circle on top)
      ctx.beginPath();
      ctx.arc(blob.x, blob.y + BLOB_H * 0.4, BLOB_W * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(blob.x - 8, blob.y + BLOB_H * 0.3, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(blob.x + 8, blob.y + BLOB_H * 0.3, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = eyeColor;
      ctx.beginPath();
      ctx.arc(blob.x - 6, blob.y + BLOB_H * 0.32, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(blob.x + 10, blob.y + BLOB_H * 0.32, 3, 0, Math.PI * 2);
      ctx.fill();
    };

    drawBlob(s.left, '#4A90D9', '#1A5276');
    drawBlob(s.right, '#E74C3C', '#7B241C');

    // Ball
    ctx.fillStyle = '#FFFACD';
    ctx.beginPath();
    ctx.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Ball stripe
    ctx.strokeStyle = '#F0D060';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(s.ball.x, s.ball.y, BALL_R * 0.7, -0.5, 0.8);
    ctx.stroke();

    // Score
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${s.scoreL}`, NET_X - 50, 35);
    ctx.fillText(`${s.scoreR}`, NET_X + 50, 35);
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(':', NET_X, 33);

    // Labels
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('Du', NET_X - 50, 50);
    ctx.fillText('CPU', NET_X + 50, 50);

    // Winner overlay
    if (s.winner) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.fillText(`🏆 ${s.winner} gewinnt!`, W / 2, H / 2 - 10);
      ctx.font = '14px Inter, sans-serif';
      ctx.fillText('Tippe zum Neustarten', W / 2, H / 2 + 20);
    }

    // Reset timer message
    if (s.resetTimer > 0 && !s.winner) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      const text = s.message || 'Punkt!';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const tw = ctx.measureText(text).width;
      
      ctx.fillRect(W / 2 - tw / 2 - 12, H / 2 - 14, tw + 24, 28);
      ctx.fillStyle = '#FFF';
      ctx.fillText(text, W / 2, H / 2);
    }
  }, []);

  const loop = useCallback(() => {
    if (started) {
      update();
      draw();
    }
    animRef.current = requestAnimationFrame(loop);
  }, [started, update, draw]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [loop]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => keysRef.current.add(e.key.toLowerCase());
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const handleCanvasTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;

    const s = stateRef.current;
    if (s.winner) { startGame(); return; }

    for (let i = 0; i < e.touches.length; i++) {
      const tx = (e.touches[i].clientX - rect.left) * scaleX;
      const ty = (e.touches[i].clientY - rect.top) * (H / rect.height);
      // Left side = movement for player
      if (tx < NET_X) {
        // Tap top half = jump
        if (ty < H * 0.5) {
          touchRef.current.jumpLeft = true;
        }
        touchRef.current.leftTouch = i;
        touchRef.current.leftX = tx - s.left.x;
      }
    }
  }, [startGame]);

  const handleCanvasTouchEnd = useCallback(() => {
    touchRef.current.leftTouch = null;
    touchRef.current.leftX = 0;
  }, []);

  const handleCanvasClick = useCallback(() => {
    const s = stateRef.current;
    if (s.winner) { startGame(); }
  }, [startGame]);

  const s = stateRef.current;

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-sky-100 to-amber-50">
      <div className="pt-10 pb-3 px-5 glass-card border-b border-white/20 flex items-center gap-3">
        <button onClick={onBack} className="text-gray-500"><ArrowLeft size={20} /></button>
        <h2 className="text-lg font-bold text-gray-800">🏐 Beach Volleyball</h2>
        {started && <span className="ml-auto text-sm font-bold text-primary-600">{s.scoreL} : {s.scoreR}</span>}
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-3 pb-20 gap-3">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="w-full max-w-[400px] rounded-2xl shadow-xl border-4 border-amber-300"
          style={{ touchAction: 'none', imageRendering: 'auto' }}
          onTouchStart={handleCanvasTouch}
          onTouchMove={handleCanvasTouch}
          onTouchEnd={handleCanvasTouchEnd}
          onClick={handleCanvasClick}
        />

        {!started ? (
          <button
            onClick={startGame}
            className="px-8 py-3 gradient-primary text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all"
          >
            🏐 Spiel starten!
          </button>
        ) : (
          <div className="text-center max-w-[340px]">
            <p className="text-xs text-gray-500 mb-1 font-medium">
              ⌨️ A/D oder ←/→ = Bewegen &nbsp;|&nbsp; W oder ↑ = Springen
            </p>
            <p className="text-xs text-gray-400">
              📱 Tippe links um zu bewegen, oben tippen = springen
            </p>
            <p className="text-[10px] text-gray-300 mt-1">Wer zuerst {MAX_SCORE} Punkte hat, gewinnt!</p>
          </div>
        )}
      </div>
    </div>
  );
}
