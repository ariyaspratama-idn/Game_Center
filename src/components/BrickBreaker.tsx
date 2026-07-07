import { useEffect, useRef, useState, MouseEvent } from 'react';
import { playSound } from '../utils/audio';
import { getPlayerProfile, addLeaderboardScore } from '../utils/initialData';
import { Play, Pause, RotateCcw, Award, Heart, ShieldAlert } from 'lucide-react';

export default function BrickBreaker() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameWon, setIsGameWon] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [scoreSaved, setScoreSaved] = useState(false);

  // Ball & Paddle state ref to prevent React stale closures in canvas animation frame
  const gameStateRef = useRef({
    ballX: 240,
    ballY: 280,
    ballDX: 3,
    ballDY: -3,
    ballRadius: 7,
    paddleWidth: 80,
    paddleHeight: 12,
    paddleX: 200,
    brickRows: 5,
    brickCols: 8,
    brickWidth: 50,
    brickHeight: 18,
    brickPadding: 8,
    brickOffsetTop: 40,
    brickOffsetLeft: 12,
    bricks: [] as { x: number; y: number; status: number; color: string; value: number }[],
    keys: { ArrowLeft: false, ArrowRight: false },
    score: 0,
    lives: 3,
    level: 1,
    paddleSpeed: 7,
    colors: ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6'] // red, orange, amber, emerald, blue
  });

  const initBricks = (lvl: number) => {
    const state = gameStateRef.current;
    const list = [];
    const rows = 3 + lvl; // increase difficulty with levels
    const cols = 8;
    
    state.brickRows = rows;
    state.brickCols = cols;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Different row gets different color and scoring value
        const colorIndex = r % state.colors.length;
        const color = state.colors[colorIndex];
        const value = (rows - r) * 10; // top rows give more score

        list.push({
          x: 0,
          y: 0,
          status: 1, // 1 = visible, 0 = destroyed
          color,
          value
        });
      }
    }
    state.bricks = list;
  };

  const resetBallAndPaddle = () => {
    const state = gameStateRef.current;
    state.ballX = 240;
    state.ballY = 280;
    // Set speed based on level
    const speedMult = 1 + (state.level - 1) * 0.25;
    state.ballDX = (Math.random() > 0.5 ? 2.5 : -2.5) * speedMult;
    state.ballDY = -3 * speedMult;
    state.paddleX = (480 - state.paddleWidth) / 2;
  };

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        gameStateRef.current.keys.ArrowLeft = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        gameStateRef.current.keys.ArrowRight = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        gameStateRef.current.keys.ArrowLeft = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        gameStateRef.current.keys.ArrowRight = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Initialize game parameters
  useEffect(() => {
    initBricks(1);
    resetBallAndPaddle();
  }, []);

  // Main Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const state = gameStateRef.current;
      const width = canvas.width;
      const height = canvas.height;

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // Draw background board grid
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);
      
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let j = 0; j < height; j += 40) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(width, j);
        ctx.stroke();
      }

      // 1. Move Paddle
      if (state.keys.ArrowLeft) {
        state.paddleX = Math.max(0, state.paddleX - state.paddleSpeed);
      }
      if (state.keys.ArrowRight) {
        state.paddleX = Math.min(width - state.paddleWidth, state.paddleX + state.paddleSpeed);
      }

      // 2. Physics & Ball movement if playing
      if (isPlaying && !isGameOver && !isGameWon) {
        state.ballX += state.ballDX;
        state.ballY += state.ballDY;

        // Bounce left/right walls
        if (state.ballX - state.ballRadius < 0 || state.ballX + state.ballRadius > width) {
          state.ballDX = -state.ballDX;
          playSound.hit();
        }

        // Bounce ceiling
        if (state.ballY - state.ballRadius < 0) {
          state.ballDY = -state.ballDY;
          playSound.hit();
        }

        // Paddle Collision check
        const ballOnPaddleLevel = state.ballY + state.ballRadius >= height - state.paddleHeight - 10 && 
                                  state.ballY - state.ballRadius <= height - 10;
        const ballWithinPaddleWidth = state.ballX >= state.paddleX && state.ballX <= state.paddleX + state.paddleWidth;

        if (ballOnPaddleLevel && ballWithinPaddleWidth && state.ballDY > 0) {
          playSound.hit();
          // Angle depends on where it hits the paddle
          const relativeHit = (state.ballX - (state.paddleX + state.paddleWidth / 2)) / (state.paddleWidth / 2);
          const speed = Math.sqrt(state.ballDX * state.ballDX + state.ballDY * state.ballDY);
          state.ballDX = relativeHit * speed * 0.95;
          state.ballDY = -Math.sqrt(Math.max(4, speed * speed - state.ballDX * state.ballDX));
        }

        // Fall bottom wall (loss of life)
        if (state.ballY + state.ballRadius > height) {
          state.lives -= 1;
          setLives(state.lives);
          playSound.gameOver();

          if (state.lives <= 0) {
            setIsGameOver(true);
            setIsPlaying(false);
          } else {
            resetBallAndPaddle();
          }
        }

        // Brick collision
        let bricksLeft = 0;
        state.bricks.forEach((b, idx) => {
          if (b.status === 0) return;
          bricksLeft++;

          const r = Math.floor(idx / state.brickCols);
          const c = idx % state.brickCols;
          const bx = state.brickOffsetLeft + c * (state.brickWidth + state.brickPadding);
          const by = state.brickOffsetTop + r * (state.brickHeight + state.brickPadding);

          b.x = bx;
          b.y = by;

          // Simple circle-box overlap detection
          const isOverlap = state.ballX + state.ballRadius >= bx &&
                            state.ballX - state.ballRadius <= bx + state.brickWidth &&
                            state.ballY + state.ballRadius >= by &&
                            state.ballY - state.ballRadius <= by + state.brickHeight;

          if (isOverlap) {
            playSound.score();
            b.status = 0;
            state.score += b.value;
            setScore(state.score);
            state.ballDY = -state.ballDY; // Bounce ball back vertically

            // Golden brick bonus
            if (b.color === '#f59e0b') {
              state.score += 20; // extra point
              setScore(state.score);
            }
          }
        });

        // Check level clear / Game Won
        if (bricksLeft === 0) {
          if (state.level >= 3) {
            setIsGameWon(true);
            setIsPlaying(false);
            playSound.powerup();
          } else {
            playSound.powerup();
            state.level += 1;
            setLevel(state.level);
            initBricks(state.level);
            resetBallAndPaddle();
          }
        }
      }

      // Draw Bricks
      state.bricks.forEach((b, idx) => {
        if (b.status === 0) return;
        const r = Math.floor(idx / state.brickCols);
        const c = idx % state.brickCols;
        const bx = state.brickOffsetLeft + c * (state.brickWidth + state.brickPadding);
        const by = state.brickOffsetTop + r * (state.brickHeight + state.brickPadding);

        ctx.fillStyle = b.color;
        // Rounded brick edges
        ctx.beginPath();
        ctx.roundRect(bx, by, state.brickWidth, state.brickHeight, 3);
        ctx.fill();

        // Neon border glow
        ctx.strokeStyle = '#ffffff20';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Draw Paddle
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.roundRect(state.paddleX, height - state.paddleHeight - 10, state.paddleWidth, state.paddleHeight, 6);
      ctx.fill();
      // Paddle accent highlight
      ctx.fillStyle = '#60a5fa';
      ctx.beginPath();
      ctx.roundRect(state.paddleX + 10, height - state.paddleHeight - 8, state.paddleWidth - 20, 4, 2);
      ctx.fill();

      // Draw Ball
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(state.ballX, state.ballY, state.ballRadius, 0, Math.PI * 2);
      ctx.fill();
      // Glowing aura
      ctx.strokeStyle = 'rgba(250,204,21,0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(state.ballX, state.ballY, state.ballRadius + 2, 0, Math.PI * 2);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, isGameOver, isGameWon]);

  // Restart Game entirely
  const restartGame = () => {
    playSound.click();
    const state = gameStateRef.current;
    state.score = 0;
    state.lives = 3;
    state.level = 1;
    setScore(0);
    setLives(3);
    setLevel(1);
    setIsGameOver(false);
    setIsGameWon(false);
    setScoreSaved(false);
    initBricks(1);
    resetBallAndPaddle();
    setIsPlaying(true);
  };

  const handlePauseToggle = () => {
    playSound.click();
    setIsPlaying(prev => !prev);
  };

  // Paddle touch control helper for Mouse Movement
  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !isPlaying || isGameOver || isGameWon) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const state = gameStateRef.current;
    
    // Smooth boundary positioning
    state.paddleX = Math.max(0, Math.min(canvas.width - state.paddleWidth, mouseX - state.paddleWidth / 2));
  };

  const saveScore = () => {
    if (scoreSaved) return;
    const profile = getPlayerProfile();
    addLeaderboardScore('brick', score, profile, `Level ${level}`);
    setScoreSaved(true);
    playSound.powerup();
  };

  return (
    <div id="brick-game-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4">
      {/* Game Stage */}
      <div className="lg:col-span-8 flex flex-col items-center">
        {/* Upper Dashboard */}
        <div className="w-full flex justify-between items-center bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 mb-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-zinc-500 font-mono">SKOR SEKARANG</p>
              <p className="text-2xl font-mono font-bold text-amber-400 leading-none">{score}</p>
            </div>
            <div className="border-l border-zinc-800 pl-4">
              <p className="text-xs text-zinc-500 font-mono">LEVEL</p>
              <p className="text-xl font-mono font-bold text-zinc-200 mt-1 leading-none">{level} / 3</p>
            </div>
            <div className="border-l border-zinc-800 pl-4">
              <p className="text-xs text-zinc-500 font-mono mb-1">NYAWA</p>
              <div className="flex gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Heart
                    key={i}
                    size={16}
                    className={`transition-colors ${
                      i < lives ? 'fill-rose-500 text-rose-500' : 'text-zinc-700 fill-zinc-900'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {!isPlaying && !isGameOver && !isGameWon ? (
              <button
                onClick={() => { playSound.click(); setIsPlaying(true); }}
                id="btn-brick-start"
                className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg text-sm font-mono transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
              >
                <Play size={16} className="fill-black" /> {score === 0 ? 'MULAI' : 'LANJUT'}
              </button>
            ) : isPlaying ? (
              <button
                onClick={handlePauseToggle}
                id="btn-brick-pause"
                className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm font-mono transition-all border border-zinc-700"
              >
                <Pause size={16} /> PAUSE
              </button>
            ) : null}

            {(isGameOver || isGameWon) && (
              <button
                onClick={restartGame}
                id="btn-brick-restart"
                className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-amber-400 px-4 py-2 rounded-lg text-sm font-mono transition-all border border-zinc-700"
              >
                <RotateCcw size={16} /> RESTART
              </button>
            )}
          </div>
        </div>

        {/* Canvas Arena */}
        <div
          ref={containerRef}
          className="relative w-full max-w-[480px] bg-black border-4 border-zinc-800 rounded-xl overflow-hidden shadow-2xl"
        >
          <canvas
            ref={canvasRef}
            width={480}
            height={360}
            onMouseMove={handleMouseMove}
            className="block w-full cursor-none h-auto bg-black"
          />

          {/* Pause overlay */}
          {!isPlaying && !isGameOver && !isGameWon && score > 0 && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-6 backdrop-blur-sm">
              <Pause size={48} className="text-zinc-500 mb-2 animate-bounce" />
              <h3 className="text-xl font-mono font-bold text-zinc-300">GAME DIHENTIKAN</h3>
              <p className="text-xs text-zinc-500 font-mono mt-1 max-w-xs">
                Arahkan kursor atau gerakkan paddle untuk memantulkan bola. Tekan LANJUT untuk melanjutkan!
              </p>
              <button
                onClick={() => setIsPlaying(true)}
                className="mt-4 bg-amber-500 text-black px-6 py-2 rounded-lg font-mono font-bold text-sm shadow-[0_0_15px_rgba(245,158,11,0.4)]"
              >
                RESUME
              </button>
            </div>
          )}

          {/* Screen overlay for Game Over */}
          {isGameOver && (
            <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center text-center p-6">
              <ShieldAlert size={48} className="text-rose-500 mb-2 animate-bounce" />
              <h3 className="text-2xl font-mono font-bold text-rose-500 tracking-wider">GAME OVER</h3>
              <p className="text-zinc-400 text-sm font-mono mt-1">Semua nyawa habis!</p>

              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 my-4 min-w-[240px] font-mono">
                <p className="text-xs text-zinc-500">SKOR AKHIR</p>
                <p className="text-4xl font-bold text-amber-400 my-1">{score}</p>
                <p className="text-[10px] text-zinc-400">Level Tercapai: {level}</p>
              </div>

              <div className="flex flex-col gap-2 w-full max-w-[240px]">
                <button
                  onClick={saveScore}
                  disabled={scoreSaved || score === 0}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    scoreSaved
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]'
                  }`}
                >
                  <Award size={14} /> {scoreSaved ? 'SKOR TELAH DISIMPAN' : 'SIMPAN KE LEADERBOARD'}
                </button>
                <button
                  onClick={restartGame}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold px-4 py-2 rounded-lg text-xs transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                >
                  COBA LAGI
                </button>
              </div>
            </div>
          )}

          {/* Screen overlay for Game Won */}
          {isGameWon && (
            <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center text-center p-6">
              <span className="text-5xl animate-bounce mb-2">🏆</span>
              <h3 className="text-2xl font-mono font-bold text-amber-400 tracking-wider">GAME CLEAR!</h3>
              <p className="text-zinc-300 text-sm font-mono mt-1">Anda berhasil menghancurkan semua level!</p>

              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 my-4 min-w-[240px] font-mono">
                <p className="text-xs text-zinc-500">SKOR TERBAIK</p>
                <p className="text-4xl font-bold text-emerald-400 my-1">{score}</p>
                <p className="text-[10px] text-zinc-400">Sempurna! Skor luar biasa!</p>
              </div>

              <div className="flex flex-col gap-2 w-full max-w-[240px]">
                <button
                  onClick={saveScore}
                  disabled={scoreSaved}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    scoreSaved
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]'
                  }`}
                >
                  <Award size={14} /> {scoreSaved ? 'SKOR TELAH DISIMPAN' : 'SIMPAN KE LEADERBOARD'}
                </button>
                <button
                  onClick={restartGame}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold px-4 py-2 rounded-lg text-xs transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                >
                  MAIN LAGI
                </button>
              </div>
            </div>
          )}

          {/* Game Idle / Starter Screen */}
          {!isPlaying && !isGameOver && !isGameWon && score === 0 && (
            <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                <span className="text-3xl">🧱</span>
              </div>
              <h3 className="text-xl font-mono font-bold text-amber-400">BRICK BREAKER</h3>
              <p className="text-xs text-zinc-400 max-w-[300px] mt-2 font-mono leading-relaxed">
                Hancurkan semua baris bata berwarna dengan memantulkan bola kuning. Gerakkan paddle dengan tombol panah atau Mouse!
              </p>
              <button
                onClick={restartGame}
                className="mt-6 flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)]"
              >
                <Play size={16} className="fill-black" /> MULAI GAME
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Side info panel */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h4 className="text-zinc-200 font-mono font-bold border-b border-zinc-800 pb-2 mb-3">PETUNJUK BERMAIN</h4>
          <ul className="text-xs font-mono text-zinc-400 space-y-3 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold">1.</span>
              Gunakan mouse dengan menggesernya ke kiri dan kanan di atas layar game untuk kontrol instan dan halus.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold">2.</span>
              Atau gunakan tombol ← / → pada keyboard untuk menggeser secara manual.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold">3.</span>
              Grup bata emas (bata kuning tua) memberikan poin ganda saat hancur!
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold">4.</span>
              Bila semua bata hancur, Anda naik tingkat ke level berikutnya dengan kecepatan bola yang lebih menantang.
            </li>
          </ul>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h4 className="text-zinc-200 font-mono font-bold border-b border-zinc-800 pb-2 mb-3">KONSEP PEMROGRAMAN</h4>
          <p className="text-xs font-mono text-zinc-400 leading-relaxed">
            Game ini dibangun menggunakan <span className="text-amber-400 font-bold">HTML5 Canvas API</span> dan algoritma deteksi tabrakan fisik bounding-box sederhana.
          </p>
          <div className="mt-3 bg-black/40 border border-zinc-800/80 rounded p-2 text-[10px] text-zinc-500 font-mono">
            {`// Physics Formula
if (ballX + ballRadius >= paddleX && 
    ballX - ballRadius <= paddleX + paddleWidth) {
  ballDY = -ballDY;
}`}
          </div>
        </div>
      </div>
    </div>
  );
}
