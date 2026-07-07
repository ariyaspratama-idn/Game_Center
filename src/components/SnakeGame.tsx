import { useState, useEffect, useRef } from 'react';
import { playSound } from '../utils/audio';
import { getPlayerProfile, addLeaderboardScore } from '../utils/initialData';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play, Pause, RotateCcw, Award, ShieldAlert } from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export default function SnakeGame() {
  const GRID_SIZE = 20;
  const INITIAL_SPEED = 150; // ms

  const [snake, setSnake] = useState<Position[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
  ]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('UP');
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [scoreSaved, setScoreSaved] = useState(false);

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const directionRef = useRef<Direction>('UP');

  // Set speed based on difficulty
  const getSpeed = () => {
    switch (difficulty) {
      case 'Easy': return 200;
      case 'Hard': return 80;
      case 'Medium':
      default: return 130;
    }
  };

  // Generate random food position not on snake
  const generateFood = (currentSnake: Position[]): Position => {
    let newFood: Position;
    let isOnSnake = true;
    while (isOnSnake) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      isOnSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
    }
    return newFood!;
  };

  // Handle keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || isGameOver) return;
      
      let newDir: Direction | null = null;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (directionRef.current !== 'DOWN') newDir = 'UP';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (directionRef.current !== 'UP') newDir = 'DOWN';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (directionRef.current !== 'RIGHT') newDir = 'LEFT';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (directionRef.current !== 'LEFT') newDir = 'RIGHT';
          break;
      }

      if (newDir) {
        setDirection(newDir);
        directionRef.current = newDir;
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isGameOver]);

  // Main game loop
  useEffect(() => {
    if (!isPlaying || isGameOver) {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      return;
    }

    gameLoopRef.current = setInterval(() => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        let newHead = { ...head };

        switch (direction) {
          case 'UP': newHead.y -= 1; break;
          case 'DOWN': newHead.y += 1; break;
          case 'LEFT': newHead.x -= 1; break;
          case 'RIGHT': newHead.x += 1; break;
        }

        // Check wall collision
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          handleGameOver();
          return prevSnake;
        }

        // Check self collision (skip the tail itself if it moves)
        const selfCollision = prevSnake.slice(0, -1).some(
          segment => segment.x === newHead.x && segment.y === newHead.y
        );
        if (selfCollision) {
          handleGameOver();
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check food eating
        if (newHead.x === food.x && newHead.y === food.y) {
          playSound.score();
          setScore(prev => prev + (difficulty === 'Easy' ? 10 : difficulty === 'Medium' ? 20 : 30));
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop(); // Remove tail segment
        }

        return newSnake;
      });
    }, getSpeed());

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [isPlaying, isGameOver, direction, food, difficulty]);

  const handleGameOver = () => {
    setIsGameOver(true);
    setIsPlaying(false);
    playSound.gameOver();
  };

  const startGame = () => {
    playSound.click();
    setSnake([
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ]);
    setFood({ x: 5, y: 5 });
    setDirection('UP');
    directionRef.current = 'UP';
    setScore(0);
    setIsGameOver(false);
    setScoreSaved(false);
    setIsPlaying(true);
  };

  const togglePause = () => {
    playSound.click();
    setIsPlaying(prev => !prev);
  };

  const saveScore = () => {
    if (scoreSaved) return;
    const profile = getPlayerProfile();
    addLeaderboardScore('snake', score, profile, difficulty);
    setScoreSaved(true);
    playSound.powerup();
  };

  const triggerDirection = (newDir: Direction) => {
    if (!isPlaying || isGameOver) return;
    playSound.click();
    
    const currentDir = directionRef.current;
    if (newDir === 'UP' && currentDir !== 'DOWN') {
      setDirection('UP');
      directionRef.current = 'UP';
    } else if (newDir === 'DOWN' && currentDir !== 'UP') {
      setDirection('DOWN');
      directionRef.current = 'DOWN';
    } else if (newDir === 'LEFT' && currentDir !== 'RIGHT') {
      setDirection('LEFT');
      directionRef.current = 'LEFT';
    } else if (newDir === 'RIGHT' && currentDir !== 'LEFT') {
      setDirection('RIGHT');
      directionRef.current = 'RIGHT';
    }
  };

  return (
    <div id="snake-game-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4">
      {/* Game Stage (Col 8) */}
      <div className="lg:col-span-8 flex flex-col items-center">
        {/* Upper Dashboard */}
        <div className="w-full flex justify-between items-center bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 mb-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-zinc-500 font-mono">SKOR SEKARANG</p>
              <p className="text-2xl font-mono font-bold text-emerald-400 leading-none">{score}</p>
            </div>
            <div className="border-l border-zinc-800 pl-4">
              <p className="text-xs text-zinc-500 font-mono">TINGKAT KESULITAN</p>
              <div className="flex gap-1 mt-1">
                {(['Easy', 'Medium', 'Hard'] as const).map(d => (
                  <button
                    key={d}
                    disabled={isPlaying || isGameOver}
                    onClick={() => { playSound.click(); setDifficulty(d); }}
                    className={`text-[10px] px-2 py-0.5 rounded font-mono transition-colors ${
                      difficulty === d
                        ? 'bg-emerald-500 text-black font-bold'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-750 disabled:opacity-50'
                    }`}
                  >
                    {d === 'Easy' ? 'MUDAH' : d === 'Medium' ? 'SEDANG' : 'SULIT'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {!isPlaying && !isGameOver ? (
              <button
                onClick={startGame}
                id="btn-snake-start"
                className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 rounded-lg text-sm font-mono transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                <Play size={16} className="fill-black" /> {snake.length === 3 && score === 0 ? 'MULAI' : 'LANJUT'}
              </button>
            ) : isPlaying ? (
              <button
                onClick={togglePause}
                id="btn-snake-pause"
                className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm font-mono transition-all border border-zinc-700"
              >
                <Pause size={16} /> PAUSE
              </button>
            ) : null}

            {isGameOver && (
              <button
                onClick={startGame}
                id="btn-snake-reset"
                className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 px-4 py-2 rounded-lg text-sm font-mono transition-all border border-zinc-700"
              >
                <RotateCcw size={16} /> RESTART
              </button>
            )}
          </div>
        </div>

        {/* Board Arena */}
        <div className="relative aspect-square w-full max-w-[450px] bg-black border-4 border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-wrap">
          {/* Render Grid cells */}
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const x = i % GRID_SIZE;
            const y = Math.floor(i / GRID_SIZE);
            const isHead = snake[0].x === x && snake[0].y === y;
            const isBody = snake.slice(1).some(segment => segment.x === x && segment.y === y);
            const isFood = food.x === x && food.y === y;

            return (
              <div
                key={i}
                style={{ width: `${100 / GRID_SIZE}%`, height: `${100 / GRID_SIZE}%` }}
                className="box-border p-[1px] flex items-center justify-center bg-zinc-950/20"
              >
                <div
                  className={`w-full h-full rounded-[2px] transition-all duration-75 ${
                    isHead
                      ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                      : isBody
                      ? 'bg-emerald-600/80'
                      : isFood
                      ? 'bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_#f43f5e]'
                      : 'bg-zinc-900/10'
                  }`}
                />
              </div>
            );
          })}

          {/* Pause overlay */}
          {!isPlaying && !isGameOver && score > 0 && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-6 backdrop-blur-sm">
              <Pause size={48} className="text-zinc-500 mb-2 animate-bounce" />
              <h3 className="text-xl font-mono font-bold text-zinc-300">GAME DIHENTIKAN</h3>
              <p className="text-xs text-zinc-500 font-mono mt-1 max-w-xs">
                Tekan tombol "LANJUT" di atas atau tekan tombol Pause untuk melanjutkan permainan.
              </p>
              <button
                onClick={togglePause}
                className="mt-4 bg-emerald-500 text-black px-6 py-2 rounded-lg font-mono font-bold text-sm shadow-[0_0_15px_rgba(16,185,129,0.4)]"
              >
                RESUME
              </button>
            </div>
          )}

          {/* Starting screen */}
          {!isPlaying && !isGameOver && score === 0 && (
            <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                <span className="text-3xl">🐍</span>
              </div>
              <h3 className="text-xl font-mono font-bold text-emerald-400">RETRO SNAKE</h3>
              <p className="text-xs text-zinc-400 max-w-[280px] mt-2 font-mono leading-relaxed">
                Kumpulkan apel merah untuk tumbuh lebih panjang. Jangan menabrak dinding atau ekormu sendiri!
              </p>
              <button
                onClick={startGame}
                className="mt-6 flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]"
              >
                <Play size={16} className="fill-black" /> MULAI GAME
              </button>
            </div>
          )}

          {/* Game Over Screen */}
          {isGameOver && (
            <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center text-center p-6 backdrop-blur-sm">
              <ShieldAlert size={48} className="text-rose-500 mb-2 animate-pulse" />
              <h3 className="text-2xl font-mono font-bold text-rose-500 tracking-wider">GAME OVER</h3>
              <p className="text-zinc-400 text-sm font-mono mt-1">Ular menabrak rintangan!</p>

              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 my-4 min-w-[240px] font-mono">
                <p className="text-xs text-zinc-500">SKOR AKHIR</p>
                <p className="text-4xl font-bold text-emerald-400 my-1">{score}</p>
                <p className="text-[10px] text-zinc-400">Tingkat: {difficulty === 'Easy' ? 'Mudah' : difficulty === 'Medium' ? 'Sedang' : 'Sulit'}</p>
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
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold px-4 py-2 rounded-lg text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  MAIN LAGI
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile controls */}
        <div className="mt-6 flex flex-col items-center gap-1 md:hidden">
          <button
            onClick={() => triggerDirection('UP')}
            className="w-12 h-12 bg-zinc-800 active:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-full flex items-center justify-center shadow-md"
          >
            <ArrowUp size={20} />
          </button>
          <div className="flex gap-10">
            <button
              onClick={() => triggerDirection('LEFT')}
              className="w-12 h-12 bg-zinc-800 active:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-full flex items-center justify-center shadow-md"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              onClick={() => triggerDirection('RIGHT')}
              className="w-12 h-12 bg-zinc-800 active:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-full flex items-center justify-center shadow-md"
            >
              <ArrowRight size={20} />
            </button>
          </div>
          <button
            onClick={() => triggerDirection('DOWN')}
            className="w-12 h-12 bg-zinc-800 active:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-full flex items-center justify-center shadow-md"
          >
            <ArrowDown size={20} />
          </button>
        </div>
      </div>

      {/* Side Information Panel (Col 4) */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h4 className="text-zinc-200 font-mono font-bold border-b border-zinc-800 pb-2 mb-3">PETUNJUK BERMAIN</h4>
          <ul className="text-xs font-mono text-zinc-400 space-y-3 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">1.</span>
              Gunakan tombol panah keyboard (↑, ↓, ←, →) atau tombol WASD untuk mengarahkan ular.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">2.</span>
              Setiap kali ular memakan buah merah (apel), ia akan bertambah panjang dan skor bertambah.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">3.</span>
              Kesulitan memengaruhi kecepatan berjalan: SULIT berjalan sangat cepat tetapi memberikan skor 3x lipat!
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">4.</span>
              Jika menabrak batas dinding atau ekor sendiri, permainan berakhir seketika.
            </li>
          </ul>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h4 className="text-zinc-200 font-mono font-bold border-b border-zinc-800 pb-2 mb-3">INFO SISTEM ARCADE</h4>
          <div className="space-y-2 text-xs font-mono text-zinc-400">
            <div className="flex justify-between py-1 border-b border-zinc-800/50">
              <span className="text-zinc-500">Engine:</span>
              <span className="text-zinc-300 font-bold">React Canvas 2D</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800/50">
              <span className="text-zinc-500">Audio:</span>
              <span className="text-zinc-300">Web Synth API</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-zinc-500">Status Sesi:</span>
              <span className="text-emerald-400 font-bold">TERKONEKSI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
