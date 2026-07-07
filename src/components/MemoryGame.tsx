import { useEffect, useState } from 'react';
import { playSound } from '../utils/audio';
import { getPlayerProfile, addLeaderboardScore } from '../utils/initialData';
import { Play, RotateCcw, Award, ShieldAlert, Timer, Eye } from 'lucide-react';

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const GAMING_EMOJIS = [
  '🎮', '🕹️', '👾', '🚀', '🧱', '🛡️', '💎', '🏆',
  '👑', '🔮', '🛸', '🦖', '🍎', '🪙', '⭐', '🎈'
];

export default function MemoryGame() {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium'>('Medium');
  const [scoreSaved, setScoreSaved] = useState(false);

  const gridSize = difficulty === 'Easy' ? 12 : 16; // 3x4 or 4x4 grid

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && !isGameFinished) {
      timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, isGameFinished]);

  const initGame = () => {
    playSound.click();
    const count = gridSize / 2;
    const selectedEmojis = GAMING_EMOJIS.slice(0, count);
    const doubleEmojis = [...selectedEmojis, ...selectedEmojis];
    
    // Shuffle array
    const shuffled = doubleEmojis
      .map((emoji, index) => ({ id: index, emoji, isFlipped: false, isMatched: false }))
      .sort(() => Math.random() - 0.5);

    setCards(shuffled);
    setFlippedIds([]);
    setMoves(0);
    setTimeElapsed(0);
    setScore(0);
    setIsGameFinished(false);
    setScoreSaved(false);
    setIsPlaying(true);
  };

  const handleCardClick = (id: number) => {
    if (!isPlaying || isGameFinished) return;
    
    // Check if card is already flipped/matched, or if we have 2 cards flipped already
    const clickedCard = cards.find(c => c.id === id);
    if (!clickedCard || clickedCard.isFlipped || clickedCard.isMatched || flippedIds.length >= 2) return;

    playSound.click();

    // Flip clicked card
    const updatedCards = cards.map(c => c.id === id ? { ...c, isFlipped: true } : c);
    setCards(updatedCards);

    const newFlippedIds = [...flippedIds, id];
    setFlippedIds(newFlippedIds);

    // If this is the second card flipped, check for match
    if (newFlippedIds.length === 2) {
      setMoves(prev => prev + 1);
      const [firstId, secondId] = newFlippedIds;
      const firstCard = cards.find(c => c.id === firstId)!;
      const secondCard = cards.find(c => c.id === id)!;

      if (firstCard.emoji === secondCard.emoji) {
        // MATCH FOUND
        setTimeout(() => {
          playSound.score();
          setCards(prevCards => 
            prevCards.map(c => 
              c.id === firstId || c.id === id 
                ? { ...c, isMatched: true, isFlipped: true } 
                : c
            )
          );
          setFlippedIds([]);

          // Check if all matched
          const allMatched = updatedCards.every(c => c.isMatched || c.id === firstId || c.id === id);
          if (allMatched) {
            handleGameFinished(moves + 1);
          }
        }, 500);
      } else {
        // NO MATCH, flip back
        setTimeout(() => {
          playSound.hit();
          setCards(prevCards => 
            prevCards.map(c => 
              c.id === firstId || c.id === id 
                ? { ...c, isFlipped: false } 
                : c
            )
          );
          setFlippedIds([]);
        }, 1000);
      }
    }
  };

  const handleGameFinished = (finalMoves: number) => {
    setIsGameFinished(true);
    // Score formula based on efficiency: (Base 5000 - time*15 - moves*50) bounded to min 100
    const calculatedScore = Math.max(100, Math.floor(5000 - (timeElapsed * 12) - (finalMoves * 60)));
    setScore(calculatedScore);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const saveScore = () => {
    if (scoreSaved) return;
    const profile = getPlayerProfile();
    addLeaderboardScore('memory', score, profile, difficulty);
    setScoreSaved(true);
    playSound.powerup();
  };

  return (
    <div id="memory-game-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4">
      {/* Game Stage */}
      <div className="lg:col-span-8 flex flex-col items-center">
        {/* Upper Dashboard */}
        <div className="w-full flex justify-between items-center bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 mb-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-zinc-500 font-mono">LANGKAH (MOVES)</p>
              <p className="text-2xl font-mono font-bold text-pink-400 leading-none">{moves}</p>
            </div>
            <div className="border-l border-zinc-800 pl-4">
              <p className="text-xs text-zinc-500 font-mono mb-1">DURASI</p>
              <div className="flex items-center gap-1.5 text-zinc-200 font-mono text-xl font-bold leading-none">
                <Timer size={18} className="text-pink-500" />
                {formatTime(timeElapsed)}
              </div>
            </div>
            <div className="border-l border-zinc-800 pl-4">
              <p className="text-xs text-zinc-500 font-mono">UKURAN GRID</p>
              <div className="flex gap-1 mt-1">
                {(['Easy', 'Medium'] as const).map(d => (
                  <button
                    key={d}
                    disabled={isPlaying && !isGameFinished}
                    onClick={() => { playSound.click(); setDifficulty(d); }}
                    className={`text-[10px] px-2 py-0.5 rounded font-mono transition-colors ${
                      difficulty === d
                        ? 'bg-pink-500 text-black font-bold'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-750 disabled:opacity-50'
                    }`}
                  >
                    {d === 'Easy' ? '3x4 (MUDAH)' : '4x4 (SEDANG)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {!isPlaying ? (
              <button
                onClick={initGame}
                id="btn-memory-start"
                className="flex items-center gap-1 bg-pink-500 hover:bg-pink-400 text-black font-semibold px-4 py-2 rounded-lg text-sm font-mono transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)]"
              >
                <Play size={16} className="fill-black" /> MULAI GAME
              </button>
            ) : (
              <button
                onClick={initGame}
                id="btn-memory-reset"
                className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-pink-400 px-4 py-2 rounded-lg text-sm font-mono transition-all border border-zinc-700"
              >
                <RotateCcw size={16} /> RESTART
              </button>
            )}
          </div>
        </div>

        {/* Card Grid Area */}
        <div className="relative w-full max-w-[440px] aspect-square bg-zinc-950 border-4 border-zinc-800 rounded-2xl p-4 flex flex-col justify-center items-center shadow-2xl">
          {isPlaying ? (
            <div
              className={`grid gap-3 w-full h-full ${
                difficulty === 'Easy' ? 'grid-cols-4 grid-rows-3' : 'grid-cols-4 grid-rows-4'
              }`}
            >
              {cards.map(card => {
                const showFace = card.isFlipped || card.isMatched;

                return (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(card.id)}
                    className="relative w-full h-full perspective-1000 group focus:outline-none"
                    style={{ minHeight: '60px' }}
                  >
                    {/* Inner wrapper with absolute sizing */}
                    <div
                      className={`relative w-full h-full rounded-xl transition-all duration-300 transform-style-3d ${
                        showFace ? 'rotate-y-180' : ''
                      }`}
                    >
                      {/* Card Back (Active) */}
                      <div className="absolute inset-0 bg-zinc-900 hover:bg-zinc-800 border-2 border-zinc-800 hover:border-pink-500/50 rounded-xl flex items-center justify-center backface-hidden shadow-md transition-colors">
                        <span className="text-xl text-zinc-500 font-bold group-hover:scale-115 transition-transform">?</span>
                      </div>

                      {/* Card Face (Solved/Flipped) */}
                      <div
                        className={`absolute inset-0 border-2 rounded-xl flex items-center justify-center rotate-y-180 backface-hidden shadow-lg ${
                          card.isMatched
                            ? 'bg-zinc-900/60 border-emerald-500/30 text-zinc-400'
                            : 'bg-zinc-850 border-pink-500 text-3xl'
                        }`}
                      >
                        <span className={card.isMatched ? 'opacity-60 grayscale' : ''}>{card.emoji}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}

          {/* Intro Screen */}
          {!isPlaying && (
            <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center text-center p-6 rounded-xl">
              <div className="w-16 h-16 bg-pink-500/10 border border-pink-500/30 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(244,63,94,0.1)]">
                <span className="text-3xl">🧠</span>
              </div>
              <h3 className="text-xl font-mono font-bold text-pink-400">MEMORY MATCH</h3>
              <p className="text-xs text-zinc-400 max-w-[280px] mt-2 font-mono leading-relaxed">
                Temukan pasangan gambar game retro yang sama. Selesaikan dalam waktu sesingkat dan langkah sesedikit mungkin!
              </p>
              <button
                onClick={initGame}
                className="mt-6 flex items-center gap-2 bg-pink-500 hover:bg-pink-400 text-black font-mono font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(244,63,94,0.4)]"
              >
                <Play size={16} className="fill-black" /> MULAI GAME
              </button>
            </div>
          )}

          {/* Victory Overlay */}
          {isGameFinished && (
            <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center text-center p-6 rounded-xl backdrop-blur-sm">
              <span className="text-5xl animate-bounce mb-2">💎</span>
              <h3 className="text-2xl font-mono font-bold text-pink-400 tracking-wider">SELESAI!</h3>
              <p className="text-zinc-300 text-sm font-mono mt-1">Anda memiliki ingatan luar biasa!</p>

              <div className="grid grid-cols-2 gap-3 bg-zinc-900 border border-zinc-800 rounded-lg p-4 my-4 w-full max-w-[280px] font-mono text-center">
                <div>
                  <p className="text-[10px] text-zinc-500">WAKTU</p>
                  <p className="text-lg font-bold text-zinc-200">{formatTime(timeElapsed)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500">LANGKAH</p>
                  <p className="text-lg font-bold text-zinc-200">{moves} langkah</p>
                </div>
                <div className="col-span-2 border-t border-zinc-800 pt-2 mt-2">
                  <p className="text-[10px] text-zinc-500">SKOR EFISIENSI</p>
                  <p className="text-3xl font-bold text-emerald-400">{score}</p>
                </div>
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
                  onClick={initGame}
                  className="w-full bg-pink-500 hover:bg-pink-400 text-black font-mono font-bold px-4 py-2 rounded-lg text-xs transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                >
                  COBA LAGI
                </button>
              </div>
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
              <span className="text-pink-500 font-bold">1.</span>
              Klik pada salah satu kotak kosong untuk membalik kartu.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pink-500 font-bold">2.</span>
              Ingat gambar emoji di kartu tersebut, lalu klik kartu kedua.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pink-500 font-bold">3.</span>
              Jika gambarnya sama, kartu akan menetap dalam keadaan terbuka (hijau redup).
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pink-500 font-bold">4.</span>
              Skor akhir dipengaruhi secara eksponensial oleh durasi pengerjaan dan efisiensi langkah Anda!
            </li>
          </ul>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h4 className="text-zinc-200 font-mono font-bold border-b border-zinc-800 pb-2 mb-3">SISTEM SKORING</h4>
          <p className="text-xs font-mono text-zinc-400 leading-relaxed">
            Formula komputasi skor didasarkan pada bobot penalti waktu dan langkah tidak efektif:
          </p>
          <div className="mt-3 bg-black/40 border border-zinc-800/80 rounded p-2 text-[10px] text-zinc-500 font-mono leading-relaxed">
            {`// Scoring Formula
const penalty = (seconds * 12) + (moves * 60);
const score = Math.max(100, 5000 - penalty);`}
          </div>
        </div>
      </div>
    </div>
  );
}
