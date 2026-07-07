import { useState, useEffect } from 'react';
import { Score, GameId } from '../types';
import { playSound } from '../utils/audio';
import { getLeaderboard, DEFAULT_GAMES } from '../utils/initialData';
import { Trophy, Search, Gamepad2, Calendar, User, Hash, Star } from 'lucide-react';

interface LeaderboardProps {
  activeGameFilter?: GameId;
}

export default function Leaderboard({ activeGameFilter }: LeaderboardProps) {
  const [scores, setScores] = useState<Score[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameId | 'all'>(activeGameFilter || 'all');
  const [searchQuery, setSearchQuery] = useState('');

  // Update lists
  useEffect(() => {
    const list = getLeaderboard(selectedGame === 'all' ? undefined : selectedGame);
    setScores(list);
  }, [selectedGame, activeGameFilter]);

  // Sync with prop when player shifts active playing game
  useEffect(() => {
    if (activeGameFilter) {
      setSelectedGame(activeGameFilter);
    }
  }, [activeGameFilter]);

  const handleFilterChange = (id: GameId | 'all') => {
    playSound.click();
    setSelectedGame(id);
  };

  const getGameTitle = (id: GameId) => {
    const match = DEFAULT_GAMES.find(g => g.id === id);
    return match ? match.title : id;
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  // Filtered list by query
  const filteredScores = scores.filter(s => {
    const nameMatch = s.playerName.toLowerCase().includes(searchQuery.toLowerCase());
    const nimMatch = s.playerNim.toLowerCase().includes(searchQuery.toLowerCase());
    const gameMatch = getGameTitle(s.gameId).toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || nimMatch || gameMatch;
  });

  return (
    <div id="leaderboard-section" className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl font-mono">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-zinc-800 pb-5">
        <div>
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Trophy className="text-yellow-500 animate-pulse" size={20} /> LEADERBOARD RETRO ARCADE
          </h3>
          <p className="text-xs text-zinc-500 mt-1">Daftar skor tertinggi para pemain Retro Arcade</p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xs w-full">
          <input
            type="text"
            placeholder="Cari nama / ID / game..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-black border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 placeholder-zinc-600"
          />
          <Search className="absolute left-3 top-2.5 text-zinc-600" size={14} />
        </div>
      </div>

      {/* Game Filters Tab */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => handleFilterChange('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
            selectedGame === 'all'
              ? 'bg-zinc-100 text-black border-zinc-100 shadow-md'
              : 'bg-zinc-950 text-zinc-400 border-zinc-850 hover:border-zinc-800'
          }`}
        >
          🎮 SEMUA GAME
        </button>
        {DEFAULT_GAMES.map(g => (
          <button
            key={g.id}
            onClick={() => handleFilterChange(g.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              selectedGame === g.id
                ? 'bg-zinc-100 text-black border-zinc-100 shadow-md'
                : 'bg-zinc-950 text-zinc-400 border-zinc-850 hover:border-zinc-800'
            }`}
          >
            {g.title}
          </button>
        ))}
      </div>

      {/* Table List */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-black/45">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-950/60 text-zinc-500 text-[10px] tracking-wider border-b border-zinc-800">
              <th className="px-4 py-3 text-center">RANK</th>
              <th className="px-4 py-3">PLAYER (DEVELOPER)</th>
              <th className="px-4 py-3">PLAYER ID</th>
              <th className="px-4 py-3">GAME</th>
              <th className="px-4 py-3">TINGKAT</th>
              <th className="px-4 py-3">TANGGAL</th>
              <th className="px-4 py-3 text-right">SKOR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-850 text-xs">
            {filteredScores.length > 0 ? (
              filteredScores.map((score, index) => {
                // Rank styling
                const isTop3 = index < 3;
                const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;

                return (
                  <tr
                    key={score.id}
                    className={`hover:bg-zinc-900/30 transition-colors ${
                      isTop3 ? 'bg-zinc-950/20' : ''
                    }`}
                  >
                    {/* Rank cell */}
                    <td className="px-4 py-3 text-center font-bold">
                      {rankIcon ? (
                        <span className="text-lg">{rankIcon}</span>
                      ) : (
                        <span className="text-zinc-600">#{index + 1}</span>
                      )}
                    </td>

                    {/* Student details */}
                    <td className="px-4 py-3 font-semibold text-zinc-200">
                      <div className="flex items-center gap-2">
                        <span className="text-lg bg-zinc-900 border border-zinc-800 w-8 h-8 rounded-lg flex items-center justify-center">
                          {score.playerAvatar || '🕹️'}
                        </span>
                        <span>{score.playerName}</span>
                      </div>
                    </td>

                    {/* NIM */}
                    <td className="px-4 py-3 text-zinc-500">
                      {score.playerNim}
                    </td>

                    {/* Game title */}
                    <td className="px-4 py-3 text-zinc-400 font-bold">
                      {getGameTitle(score.gameId)}
                    </td>

                    {/* Difficulty */}
                    <td className="px-4 py-3">
                      <span className="bg-zinc-800/60 text-zinc-400 border border-zinc-800 text-[10px] px-2 py-0.5 rounded uppercase">
                        {score.difficulty || 'Medium'}
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td className="px-4 py-3 text-zinc-500">
                      {formatDate(score.date)}
                    </td>

                    {/* Scoring cell */}
                    <td className="px-4 py-3 text-right text-emerald-400 font-bold text-sm">
                      {score.score.toLocaleString()}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-600 text-xs font-mono">
                  Belum ada catatan skor. Mainkan game sekarang untuk mencatatkan skor tertinggi Anda!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
