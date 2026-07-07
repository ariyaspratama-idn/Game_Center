import { useEffect, useRef, useState, MouseEvent } from 'react';
import { playSound } from '../utils/audio';
import { getPlayerProfile, addLeaderboardScore } from '../utils/initialData';
import { Play, Pause, RotateCcw, Award, Heart, ShieldAlert, Zap } from 'lucide-react';

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
}

interface Bullet {
  x: number;
  y: number;
  dx: number;
  dy: number;
  power: number;
  fromEnemy: boolean;
}

interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  hp: number;
  maxHp: number;
  color: string;
  points: number;
  shootCooldown: number;
}

interface PowerUp {
  x: number;
  y: number;
  type: 'triple' | 'shield' | 'nuke';
  size: number;
  speed: number;
}

interface Explosion {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

export default function SpaceGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [shields, setShields] = useState(3);
  const [hasTripleShot, setHasTripleShot] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);

  // References for rendering state to keep game tick highly performant and non-stale
  const stateRef = useRef({
    playerX: 240,
    playerY: 310,
    playerWidth: 32,
    playerHeight: 28,
    playerSpeed: 6,
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    stars: [] as Star[],
    powerups: [] as PowerUp[],
    explosions: [] as Explosion[],
    keys: { ArrowLeft: false, ArrowRight: false, Space: false },
    score: 0,
    shields: 3,
    tripleShotTimer: 0,
    spawnCooldown: 0,
    shootCooldown: 0,
  });

  // Handle keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current.keys.ArrowLeft = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current.keys.ArrowRight = true;
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        stateRef.current.keys.Space = true;
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current.keys.ArrowLeft = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current.keys.ArrowRight = false;
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        stateRef.current.keys.Space = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Set up starfield backdrop
  useEffect(() => {
    const list: Star[] = [];
    for (let i = 0; i < 60; i++) {
      list.push({
        x: Math.random() * 480,
        y: Math.random() * 360,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 1.5 + 0.5
      });
    }
    stateRef.current.stars = list;
  }, []);

  // Main Canvas Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const gameTick = () => {
      const state = stateRef.current;
      const width = canvas.width;
      const height = canvas.height;

      // 1. CLEAR CANVAS
      ctx.fillStyle = '#06060c';
      ctx.fillRect(0, 0, width, height);

      // 2. STARS BACKDROP
      ctx.fillStyle = '#ffffff';
      state.stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Scroll stars
        star.y += star.speed;
        if (star.y > height) {
          star.y = 0;
          star.x = Math.random() * width;
        }
      });

      // Move player left/right
      if (state.keys.ArrowLeft) {
        state.playerX = Math.max(16, state.playerX - state.playerSpeed);
      }
      if (state.keys.ArrowRight) {
        state.playerX = Math.min(width - 16, state.playerX + state.playerSpeed);
      }

      // If actually playing...
      if (isPlaying && !isGameOver) {
        // Player shooting logic
        if (state.shootCooldown > 0) state.shootCooldown--;
        if (state.keys.Space && state.shootCooldown === 0) {
          playSound.laser();
          state.shootCooldown = 12; // cooldown ticks
          
          if (state.tripleShotTimer > 0) {
            // Triple Shot bullets
            state.bullets.push(
              { x: state.playerX, y: state.playerY - 14, dx: 0, dy: -6, power: 1, fromEnemy: false },
              { x: state.playerX - 10, y: state.playerY - 6, dx: -1.5, dy: -5.5, power: 1, fromEnemy: false },
              { x: state.playerX + 10, y: state.playerY - 6, dx: 1.5, dy: -5.5, power: 1, fromEnemy: false }
            );
          } else {
            // Single shot bullets
            state.bullets.push({
              x: state.playerX,
              y: state.playerY - 14,
              dx: 0,
              dy: -6,
              power: 1,
              fromEnemy: false
            });
          }
        }

        // Keep counting down active powerup timer
        if (state.tripleShotTimer > 0) {
          state.tripleShotTimer--;
          if (state.tripleShotTimer === 0) setHasTripleShot(false);
        }

        // Enemy spawning
        if (state.spawnCooldown > 0) {
          state.spawnCooldown--;
        } else {
          // Dynamic difficulty: spawns faster as score increases
          state.spawnCooldown = Math.max(25, 80 - Math.floor(state.score / 250));
          
          // Randomize enemy type
          const rand = Math.random();
          let enemy: Enemy;
          if (rand > 0.82) {
            // Heavy elite cruiser
            enemy = {
              x: Math.random() * (width - 44) + 22,
              y: -20,
              width: 38,
              height: 24,
              speed: 1.2,
              hp: 3,
              maxHp: 3,
              color: '#d946ef', // purple
              points: 150,
              shootCooldown: Math.random() * 40 + 40
            };
          } else if (rand > 0.55) {
            // Aggressive interceptor
            enemy = {
              x: Math.random() * (width - 32) + 16,
              y: -20,
              width: 28,
              height: 20,
              speed: 2.2,
              hp: 1,
              maxHp: 1,
              color: '#f43f5e', // rose
              points: 80,
              shootCooldown: Math.random() * 60 + 60
            };
          } else {
            // Light scout drone
            enemy = {
              x: Math.random() * (width - 24) + 12,
              y: -20,
              width: 22,
              height: 16,
              speed: 1.6,
              hp: 1,
              maxHp: 1,
              color: '#3b82f6', // blue
              points: 50,
              shootCooldown: 99999 // doesn't shoot
            };
          }
          state.enemies.push(enemy);
        }

        // Spawning floaty powerups randomly (0.3% chance per tick)
        if (Math.random() < 0.0035 && state.powerups.length < 2) {
          const types: ('triple' | 'shield' | 'nuke')[] = ['triple', 'shield', 'nuke'];
          const pickedType = types[Math.floor(Math.random() * types.length)];
          state.powerups.push({
            x: Math.random() * (width - 30) + 15,
            y: -10,
            type: pickedType,
            size: 15,
            speed: 1.5
          });
        }

        // Bullets physics
        state.bullets = state.bullets.filter(b => {
          b.x += b.dx;
          b.y += b.dy;

          // Out of bounds filter
          if (b.y < -10 || b.y > height + 10 || b.x < -10 || b.x > width + 10) return false;

          // Collision checking: Enemy bullets hit player
          if (b.fromEnemy) {
            const hitPlayer = Math.abs(b.x - state.playerX) < 18 && Math.abs(b.y - state.playerY) < 16;
            if (hitPlayer) {
              handlePlayerHit();
              return false;
            }
          }
          return true;
        });

        // Powerups physics & capture
        state.powerups = state.powerups.filter(p => {
          p.y += p.speed;
          
          if (p.y > height + 20) return false;

          // Grab checking
          const collected = Math.abs(p.x - state.playerX) < 24 && Math.abs(p.y - state.playerY) < 22;
          if (collected) {
            playSound.powerup();
            if (p.type === 'triple') {
              state.tripleShotTimer = 450; // ~7.5 seconds of triple shot
              setHasTripleShot(true);
            } else if (p.type === 'shield') {
              state.shields = Math.min(3, state.shields + 1);
              setShields(state.shields);
            } else if (p.type === 'nuke') {
              // Destroy all current active enemies and award points!
              state.enemies.forEach(e => {
                state.score += e.points;
                state.explosions.push({
                  x: e.x,
                  y: e.y,
                  radius: 5,
                  maxRadius: 35,
                  alpha: 1
                });
              });
              state.enemies = [];
              setScore(state.score);
              playSound.explosion();
            }
            return false;
          }
          return true;
        });

        // Enemies physics
        state.enemies = state.enemies.filter(enemy => {
          enemy.y += enemy.speed;

          if (enemy.y > height + 30) {
            // Deduct slight shield or points for breaching defenses
            return false;
          }

          // Crash into player check
          const crashed = Math.abs(enemy.x - state.playerX) < (enemy.width / 2 + 14) &&
                          Math.abs(enemy.y - state.playerY) < (enemy.height / 2 + 12);
          if (crashed) {
            playSound.explosion();
            state.explosions.push({
              x: enemy.x,
              y: enemy.y,
              radius: 5,
              maxRadius: 30,
              alpha: 1
            });
            handlePlayerHit();
            return false;
          }

          // Enemy shooting logic
          if (enemy.shootCooldown > 0) {
            enemy.shootCooldown--;
          } else {
            enemy.shootCooldown = Math.random() * 120 + 80;
            // Aim slightly towards player
            const angle = Math.atan2(state.playerY - enemy.y, state.playerX - enemy.x);
            state.bullets.push({
              x: enemy.x,
              y: enemy.y + 10,
              dx: Math.cos(angle) * 2.5,
              dy: Math.sin(angle) * 2.5,
              power: 1,
              fromEnemy: true
            });
          }

          // Check hit by player bullets
          let enemyDead = false;
          state.bullets = state.bullets.filter(b => {
            if (b.fromEnemy) return true;
            
            const hitEnemy = Math.abs(b.x - enemy.x) < (enemy.width / 2 + 4) &&
                             Math.abs(b.y - enemy.y) < (enemy.height / 2 + 4);
            if (hitEnemy) {
              enemy.hp -= b.power;
              if (enemy.hp <= 0) {
                enemyDead = true;
                playSound.explosion();
                // Spawn scoring explosion
                state.explosions.push({
                  x: enemy.x,
                  y: enemy.y,
                  radius: 5,
                  maxRadius: enemy.points > 100 ? 32 : 22,
                  alpha: 1
                });
                state.score += enemy.points;
                setScore(state.score);
              } else {
                playSound.hit();
              }
              return false; // delete bullet
            }
            return true;
          });

          return !enemyDead;
        });

        // Particle explosions progression
        state.explosions = state.explosions.filter(exp => {
          exp.radius += 1.5;
          exp.alpha -= 0.05;
          return exp.alpha > 0;
        });
      }

      // 3. DRAW POWERUPS
      state.powerups.forEach(p => {
        ctx.save();
        if (p.type === 'triple') {
          ctx.fillStyle = '#facc15'; // yellow triple
          ctx.strokeStyle = '#eab308';
        } else if (p.type === 'shield') {
          ctx.fillStyle = '#10b981'; // green shield heal
          ctx.strokeStyle = '#059669';
        } else {
          ctx.fillStyle = '#f43f5e'; // red nuke blast
          ctx.strokeStyle = '#e11d48';
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner letter icon
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.type === 'triple' ? '3x' : p.type === 'shield' ? 'S' : '💣', p.x, p.y);
        ctx.restore();
      });

      // 4. DRAW BULLETS
      state.bullets.forEach(b => {
        ctx.fillStyle = b.fromEnemy ? '#f43f5e' : '#a855f7'; // red vs purple laser
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.fromEnemy ? 3 : 2.5, 0, Math.PI * 2);
        ctx.fill();
        // trail
        ctx.strokeStyle = b.fromEnemy ? 'rgba(244,63,94,0.3)' : 'rgba(168,85,247,0.3)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x - b.dx * 1.5, b.y - b.dy * 1.5);
        ctx.stroke();
      });

      // 5. DRAW ENEMIES
      state.enemies.forEach(enemy => {
        ctx.save();
        ctx.fillStyle = enemy.color;
        
        // Draw spacecraft polygon
        ctx.beginPath();
        ctx.moveTo(enemy.x, enemy.y + enemy.height / 2);
        ctx.lineTo(enemy.x - enemy.width / 2, enemy.y - enemy.height / 2);
        ctx.lineTo(enemy.x - enemy.width / 4, enemy.y - enemy.height / 4);
        ctx.lineTo(enemy.x, enemy.y + enemy.height / 4);
        ctx.lineTo(enemy.x + enemy.width / 4, enemy.y - enemy.height / 4);
        ctx.lineTo(enemy.x + enemy.width / 2, enemy.y - enemy.height / 2);
        ctx.closePath();
        ctx.fill();

        // Healthbar for elites
        if (enemy.maxHp > 1) {
          ctx.fillStyle = '#1e1b4b';
          ctx.fillRect(enemy.x - 15, enemy.y - enemy.height / 2 - 8, 30, 4);
          ctx.fillStyle = '#10b981';
          ctx.fillRect(enemy.x - 15, enemy.y - enemy.height / 2 - 8, 30 * (enemy.hp / enemy.maxHp), 4);
        }
        ctx.restore();
      });

      // 6. DRAW EXPLOSIONS
      state.explosions.forEach(exp => {
        ctx.save();
        ctx.strokeStyle = `rgba(249,115,22,${exp.alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = `rgba(239,68,68,${exp.alpha * 0.5})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, exp.radius * 0.6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      // 7. DRAW PLAYER
      ctx.save();
      // Spaceship body
      ctx.fillStyle = '#a855f7'; // Purple player
      ctx.beginPath();
      ctx.moveTo(state.playerX, state.playerY - state.playerHeight / 2);
      ctx.lineTo(state.playerX - state.playerWidth / 2, state.playerY + state.playerHeight / 2);
      ctx.lineTo(state.playerX - state.playerWidth / 4, state.playerY + state.playerHeight / 4);
      ctx.lineTo(state.playerX, state.playerY + state.playerHeight / 3);
      ctx.lineTo(state.playerX + state.playerWidth / 4, state.playerY + state.playerHeight / 4);
      ctx.lineTo(state.playerX + state.playerWidth / 2, state.playerY + state.playerHeight / 2);
      ctx.closePath();
      ctx.fill();

      // Wing engines
      ctx.fillStyle = '#f97316'; // orange engine flame
      ctx.beginPath();
      ctx.moveTo(state.playerX - 10, state.playerY + 12);
      ctx.lineTo(state.playerX - 6, state.playerY + 12 + Math.random() * 8);
      ctx.lineTo(state.playerX - 2, state.playerY + 12);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(state.playerX + 6, state.playerY + 12);
      ctx.lineTo(state.playerX + 10, state.playerY + 12 + Math.random() * 8);
      ctx.lineTo(state.playerX + 2, state.playerY + 12);
      ctx.closePath();
      ctx.fill();

      // Shield overlay indicator
      if (state.shields > 1) {
        ctx.strokeStyle = 'rgba(56,189,248,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(state.playerX, state.playerY, 26, 0, Math.PI * 2);
        ctx.stroke();
      } else if (state.shields === 1) {
        // Red critical shield warning flashing
        ctx.strokeStyle = `rgba(244,63,94,${Math.sin(Date.now() / 100) * 0.4 + 0.5})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(state.playerX, state.playerY, 26, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();

      animId = requestAnimationFrame(gameTick);
    };

    animId = requestAnimationFrame(gameTick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isGameOver]);

  const handlePlayerHit = () => {
    const state = stateRef.current;
    state.shields -= 1;
    setShields(state.shields);
    playSound.hit();
    
    // Add visual damage screen flash
    if (canvasRef.current) {
      canvasRef.current.classList.add('animate-shake');
      setTimeout(() => canvasRef.current?.classList.remove('animate-shake'), 300);
    }

    if (state.shields <= 0) {
      setIsGameOver(true);
      setIsPlaying(false);
      playSound.gameOver();
    }
  };

  const startGame = () => {
    playSound.click();
    const state = stateRef.current;
    state.score = 0;
    state.shields = 3;
    state.playerX = 240;
    state.playerY = 310;
    state.bullets = [];
    state.enemies = [];
    state.powerups = [];
    state.explosions = [];
    state.spawnCooldown = 20;
    state.shootCooldown = 0;
    state.tripleShotTimer = 0;
    
    setScore(0);
    setShields(3);
    setHasTripleShot(false);
    setIsGameOver(false);
    setScoreSaved(false);
    setIsPlaying(true);
  };

  const saveScore = () => {
    if (scoreSaved) return;
    const profile = getPlayerProfile();
    addLeaderboardScore('space', score, profile, 'Arcade Mode');
    setScoreSaved(true);
    playSound.powerup();
  };

  // Direct mouse movement of spaceship inside canvas
  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !isPlaying || isGameOver) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    stateRef.current.playerX = Math.max(16, Math.min(canvas.width - 16, mouseX));
  };

  return (
    <div id="space-game-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4">
      {/* Game Stage */}
      <div className="lg:col-span-8 flex flex-col items-center">
        {/* Upper Dashboard */}
        <div className="w-full flex justify-between items-center bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 mb-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-zinc-500 font-mono">SKOR SEKARANG</p>
              <p className="text-2xl font-mono font-bold text-indigo-400 leading-none">{score}</p>
            </div>
            <div className="border-l border-zinc-800 pl-4">
              <p className="text-xs text-zinc-500 font-mono mb-1">SHIELD (PERTAHANAN)</p>
              <div className="flex gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Heart
                    key={i}
                    size={16}
                    className={`transition-colors ${
                      i < shields ? 'fill-indigo-500 text-indigo-500 shadow-glow' : 'text-zinc-700 fill-zinc-900'
                    }`}
                  />
                ))}
              </div>
            </div>
            {hasTripleShot && (
              <div className="border-l border-zinc-800 pl-4 flex items-center gap-1 bg-amber-500/10 text-amber-400 text-xs font-bold font-mono px-2 py-1 rounded border border-amber-500/20 animate-pulse">
                <Zap size={12} className="fill-amber-400" /> 3-SHOT AKTIF
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {!isPlaying && !isGameOver ? (
              <button
                onClick={() => { playSound.click(); setIsPlaying(true); }}
                id="btn-space-start"
                className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg text-sm font-mono transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]"
              >
                <Play size={16} className="fill-white" /> {score === 0 ? 'MULAI' : 'LANJUT'}
              </button>
            ) : isPlaying ? (
              <button
                onClick={() => { playSound.click(); setIsPlaying(false); }}
                id="btn-space-pause"
                className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm font-mono transition-all border border-zinc-700"
              >
                <Pause size={16} /> PAUSE
              </button>
            ) : null}

            {isGameOver && (
              <button
                onClick={startGame}
                id="btn-space-reset"
                className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-indigo-400 px-4 py-2 rounded-lg text-sm font-mono transition-all border border-zinc-700"
              >
                <RotateCcw size={16} /> RESTART
              </button>
            )}
          </div>
        </div>

        {/* Canvas Area with cursor tracking */}
        <div
          ref={containerRef}
          className="relative w-full max-w-[480px] bg-black border-4 border-zinc-800 rounded-xl overflow-hidden shadow-2xl"
        >
          <canvas
            ref={canvasRef}
            width={480}
            height={360}
            onMouseMove={handleMouseMove}
            className="block w-full cursor-crosshair h-auto"
          />

          {/* Pause overlay */}
          {!isPlaying && !isGameOver && score > 0 && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-6 backdrop-blur-sm">
              <Pause size={48} className="text-zinc-500 mb-2 animate-bounce" />
              <h3 className="text-xl font-mono font-bold text-zinc-300">GAME DIHENTIKAN</h3>
              <p className="text-xs text-zinc-500 font-mono mt-1 max-w-xs">
                Geser mouse untuk menggerakkan kapal luar angkasa. Tekan tombol LANJUT untuk melanjutkan menembak musuh!
              </p>
              <button
                onClick={() => setIsPlaying(true)}
                className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg font-mono font-bold text-sm shadow-[0_0_15px_rgba(99,102,241,0.4)]"
              >
                RESUME
              </button>
            </div>
          )}

          {/* Screen overlay for Game Over */}
          {isGameOver && (
            <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center text-center p-6 rounded-xl">
              <ShieldAlert size={48} className="text-rose-500 mb-2 animate-bounce" />
              <h3 className="text-2xl font-mono font-bold text-rose-500 tracking-wider">DEFENSE BREACHED!</h3>
              <p className="text-zinc-400 text-sm font-mono mt-1">Perisai kapal hancur total!</p>

              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 my-4 min-w-[240px] font-mono">
                <p className="text-xs text-zinc-500">SKOR PERTAHANAN</p>
                <p className="text-4xl font-bold text-indigo-400 my-1">{score}</p>
                <p className="text-[10px] text-zinc-400">Survival Mode Completed</p>
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
                  onClick={startGame}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold px-4 py-2 rounded-lg text-xs transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                >
                  MENCOBA LAGI
                </button>
              </div>
            </div>
          )}

          {/* Game Idle / Starter Screen */}
          {!isPlaying && !isGameOver && score === 0 && (
            <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center text-center p-6 rounded-xl">
              <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/30 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                <span className="text-3xl">🚀</span>
              </div>
              <h3 className="text-xl font-mono font-bold text-indigo-400">SPACE DEFENDER</h3>
              <p className="text-xs text-zinc-400 max-w-[300px] mt-2 font-mono leading-relaxed">
                Tembak semua armada kapal alien yang turun dari langit! Ambil koin power-up untuk mengaktifkan senjata Triple Shot atau memulihkan perisai kapal.
              </p>
              <button
                onClick={startGame}
                className="mt-6 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)]"
              >
                <Play size={16} className="fill-white" /> TERBANGKAN KAPAL
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
              <span className="text-indigo-400 font-bold">1.</span>
              Gunakan gerakan Mouse Anda ke kiri / kanan untuk mengendalikan pesawat secara instan di area game.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 font-bold">2.</span>
              Kapal Anda akan otomatis meluncurkan laser saat Anda menahan tombol <kbd className="bg-zinc-850 px-1 border border-zinc-700 rounded">Spasi</kbd>.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 font-bold">3.</span>
              Dapatkan power-up berbentuk lingkaran bersinar:
              <div className="mt-1.5 space-y-1 pl-3 text-[11px]">
                <div className="flex gap-1.5 text-amber-400"><span className="font-bold">3x</span> Triple laser beam shooter</div>
                <div className="flex gap-1.5 text-emerald-400"><span className="font-bold">S</span> Shield repair (+1 nyawa)</div>
                <div className="flex gap-1.5 text-rose-400"><span className="font-bold">💣</span> Nuke blast: hancurkan semua musuh</div>
              </div>
            </li>
          </ul>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h4 className="text-zinc-200 font-mono font-bold border-b border-zinc-800 pb-2 mb-3">KOMPILASI PROGRAM</h4>
          <p className="text-xs font-mono text-zinc-400 leading-relaxed">
            Game ini dibangun menggunakan framework berkinerja tinggi yang memanipulasi frame grafis pixel lewat antarmuka HTML5 2D Context.
          </p>
          <div className="mt-3 bg-black/40 border border-zinc-800/80 rounded p-2 text-[10px] text-zinc-500 font-mono leading-relaxed">
            {`// Space Laser Generation
ctx.beginPath();
ctx.arc(bullet.x, bullet.y, 2.5, 0, Math.PI * 2);
ctx.fill();`}
          </div>
        </div>
      </div>
    </div>
  );
}
