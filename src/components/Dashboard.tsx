import { useState, useEffect } from 'react';
import { GameId, PlayerProfile } from '../types';
import { playSound } from '../utils/audio';
import { DEFAULT_GAMES, getLeaderboard } from '../utils/initialData';
import { Play, Sparkles, Trophy, Gamepad2, Users, Code, MonitorPlay, ChevronLeft, Award } from 'lucide-react';
import { motion } from 'motion/react';
import SnakeGame from './SnakeGame';
import BrickBreaker from './BrickBreaker';
import MemoryGame from './MemoryGame';
import SpaceGame from './SpaceGame';
import UserProfile from './UserProfile';
import Leaderboard from './Leaderboard';

interface DashboardProps {
  profile: PlayerProfile;
  onProfileChange: (profile: PlayerProfile) => void;
}

export default function Dashboard({ profile, onProfileChange }: DashboardProps) {
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [stats, setStats] = useState({ totalScores: 0, maxScore: 0, ranking: 1 });

  // Load real stats based on student NIM
  useEffect(() => {
    const scores = getLeaderboard();
    const myScores = scores.filter(s => s.playerNim === profile.nim);
    const max = myScores.length > 0 ? Math.max(...myScores.map(s => s.score)) : 0;
    
    setStats({
      totalScores: myScores.length,
      maxScore: max,
      ranking: scores.findIndex(s => s.playerNim === profile.nim) + 1 || 99
    });
  }, [profile, activeGame]);

  const selectGame = (id: GameId | null) => {
    playSound.click();
    setActiveGame(id);
  };

  // Render correct active game component
  const renderGameComponent = () => {
    switch (activeGame) {
      case 'snake': return <SnakeGame />;
      case 'brick': return <BrickBreaker />;
      case 'memory': return <MemoryGame />;
      case 'space': return <SpaceGame />;
      default: return null;
    }
  };

  const getActiveGameMetadata = () => {
    return DEFAULT_GAMES.find(g => g.id === activeGame);
  };

  return (
    <div id="dashboard-lobby" className="space-y-8 pb-16">
      {/* Active Game Console View */}
      {activeGame ? (
        <div className="space-y-6">
          {/* Top navigation back to Arcade Lobby */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 shadow-lg font-mono">
            <div className="flex items-center gap-3">
              <button
                onClick={() => selectGame(null)}
                id="btn-back-lobby"
                className="flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 hover:border-zinc-600 rounded-xl px-3 py-1.5 text-xs transition-colors"
              >
                <ChevronLeft size={14} /> KEMBALI LOBBY
              </button>
              <div className="border-l border-zinc-800 h-6 mx-1" />
              <div>
                <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5 uppercase">
                  <Gamepad2 size={16} className={`text-${profile.color}-400`} />
                  KONSOL AKTIF: {getActiveGameMetadata()?.title}
                </h2>
                <p className="text-[10px] text-zinc-500 mt-0.5">Retro Arcade Cabinet - Active Session</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 uppercase">Pemain:</span>
              <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-zinc-850">
                <span className="text-sm">{profile.avatar}</span>
                <span className="text-xs font-bold text-zinc-300">{profile.nickname}</span>
                <span className="text-[10px] text-zinc-500">(ID: {profile.nim})</span>
              </div>
            </div>
          </div>

          {/* Render Active Game Stage */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-zinc-950 border border-zinc-850 rounded-3xl p-2 md:p-6 shadow-2xl relative"
          >
            {renderGameComponent()}
          </motion.div>

          {/* Quick Active Game Leaderboard */}
          <Leaderboard activeGameFilter={activeGame} />
        </div>
      ) : (
        /* Arcade Cabinets Selection Lobby */
        <div className="space-y-8 animate-fadeIn">
          {/* Header Banner */}
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 overflow-hidden shadow-xl">
            {/* Background vector glow grids */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-25 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/30 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />

            <div className="max-w-xl space-y-4 relative font-mono">
              <div className="flex items-center gap-2">
                <span className="bg-zinc-800 text-zinc-300 text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full tracking-wider border border-zinc-700/60">
                  RETRO ARCADE PORTAL
                </span>
                <span className="animate-pulse bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-500/20">
                  ONLINE LOBBY
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                VIRTUAL RETRO <span className="text-emerald-400">ARCADE</span>
              </h1>

              <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
                Selamat datang di portal Game Center Retro Arcade. Nikmati 4 buah arcade mini-game interaktif yang dikembangkan menggunakan standar React TypeScript berperforma tinggi.
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs pt-2">
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <MonitorPlay size={14} className="text-emerald-400" />
                  <span>4 Game Playable</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <Trophy size={14} className="text-amber-400" />
                  <span>Leaderboard Aktif</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <Users size={14} className="text-indigo-400" />
                  <span>Simpan Data Profil</span>
                </div>
              </div>
            </div>
          </div>

          {/* Student Profile Card */}
          <UserProfile profile={profile} onProfileChange={onProfileChange} />

          {/* Interactive Quick Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <MonitorPlay size={20} />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase">Game Dimainkan</p>
                <p className="text-lg font-bold text-zinc-200 mt-0.5">{stats.totalScores} Pertandingan</p>
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Award size={20} />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase">Skor Tertinggi Anda</p>
                <p className="text-lg font-bold text-zinc-200 mt-0.5">{stats.maxScore.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Trophy size={20} />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase">Posisi Peringkat</p>
                <p className="text-lg font-bold text-zinc-200 mt-0.5">Rank #{stats.ranking}</p>
              </div>
            </div>
          </div>

          {/* Game Cabinets Selection Grid */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase text-zinc-500 tracking-wider">
              PILIH KABINET GAME (KONSOL ARCADE)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {DEFAULT_GAMES.map(game => (
                <div
                  key={game.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all shadow-lg flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Subtle top edge bar coloring matching the game theme */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${game.color}`} />

                  <div className="space-y-3 font-mono">
                    <div className="flex justify-between items-start pt-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-black/50 border border-zinc-800 rounded-full text-zinc-400 uppercase">
                        {game.genre}
                      </span>
                    </div>

                    <h4 className="text-xl font-bold text-zinc-100 group-hover:text-white transition-colors">
                      {game.title}
                    </h4>

                    <p className="text-xs text-zinc-500 leading-relaxed">
                      {game.tagline}
                    </p>

                    <p className="text-[11px] text-zinc-400 leading-relaxed py-1">
                      {game.description}
                    </p>
                  </div>

                  {/* Play Action Bar */}
                  <div className="flex items-center justify-between mt-6 border-t border-zinc-850 pt-4 font-mono">
                    <span className="text-[10px] text-zinc-500">HIGH SCORES ACTIVE</span>
                    <button
                      onClick={() => selectGame(game.id)}
                      className={`flex items-center gap-1.5 bg-gradient-to-r ${game.color} text-white font-bold rounded-xl px-5 py-2.5 text-xs transition-all hover:scale-[1.03] shadow-md`}
                    >
                      <Play size={12} className="fill-white" /> MAIN SEKARANG
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Large Overall Leaderboard */}
          <Leaderboard />
        </div>
      )}
    </div>
  );
}
