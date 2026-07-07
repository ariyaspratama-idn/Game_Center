import { GameMetadata, PlayerProfile, Score, GameId } from '../types';

export const DEFAULT_GAMES: GameMetadata[] = [
  {
    id: 'space',
    title: 'Space Defender',
    tagline: 'Retro Space Shooter Arcade Game',
    description: 'Defend the galaxy from waves of oncoming alien ships. Shoot them down, gather powerups, and survive as long as possible. Dynamic canvas-based shooter with retro pixel-style gameplay!',
    genre: 'Retro Shooter',
    icon: 'Rocket',
    color: 'from-purple-500 to-indigo-600',
    howToPlay: [
      'Gunakan tombol ← / → atau Mouse untuk menggerakkan pesawat.',
      'Tekan SPASI atau Klik Kiri Mouse untuk menembak.',
      'Hancurkan musuh dan hindari tembakan mereka.',
      'Dapatkan power-up untuk meningkatkan peluru atau menambah nyawa.'
    ]
  },
  {
    id: 'brick',
    title: 'Brick Breaker',
    tagline: 'Classic Atari Breakout Remake',
    description: 'Destroy colorful brick formations by bouncing your energy ball with a responsive paddle. Collect powerups and keep the ball in play!',
    genre: 'Arcade / Physics',
    icon: 'Grid3X3',
    color: 'from-orange-500 to-amber-600',
    howToPlay: [
      'Gunakan tombol ← / → atau gerakkan Mouse untuk mengontrol paddle.',
      'Pantulkan bola untuk menghancurkan semua bata berwarna di atas.',
      'Jangan biarkan bola jatuh ke bawah layar.',
      'Hancurkan bata emas untuk bonus skor tinggi.'
    ]
  },
  {
    id: 'snake',
    title: 'Retro Snake',
    tagline: 'Classic Nokia-Style Snake Game',
    description: 'Navigate your pixel snake to eat apples and grow. Be careful: crashing into the walls or your own tail means game over!',
    genre: 'Classic Arcade',
    icon: 'Zap',
    color: 'from-emerald-500 to-teal-600',
    howToPlay: [
      'Gunakan tombol panah (↑ ↓ ← →) atau WASD untuk berbelok.',
      'Makan buah apel merah untuk tumbuh lebih panjang dan mendapat skor.',
      'Hindari menabrak dinding batas arena.',
      'Hindari menabrak tubuh ular itu sendiri.'
    ]
  },
  {
    id: 'memory',
    title: 'Memory Match',
    tagline: 'Cognitive Card Matching Game',
    description: 'A beautifully animated card flipping memory game. Match pairs of gaming emojis in the shortest time and fewest moves possible!',
    genre: 'Casual / Brain',
    icon: 'Brain',
    color: 'from-pink-500 to-rose-600',
    howToPlay: [
      'Klik pada kartu untuk membalik dan melihat gambarnya.',
      'Cari kartu kedua dengan gambar yang sama untuk memasangkannya.',
      'Jika tidak cocok, kedua kartu akan tertutup kembali.',
      'Selesaikan permainan dengan langkah sesedikit mungkin.'
    ]
  }
];

const INITIAL_SCORES: Score[] = [
  {
    id: 's1',
    gameId: 'space',
    playerName: 'Nando Salva',
    playerNim: 'ARC-001',
    playerAvatar: '👾',
    score: 18500,
    date: '2026-06-30T10:00:00Z',
    difficulty: 'Hard'
  },
  {
    id: 's2',
    gameId: 'space',
    playerName: 'Galaga_Elite',
    playerNim: '22115002',
    playerAvatar: '🚀',
    score: 12400,
    date: '2026-06-29T15:30:00Z',
    difficulty: 'Medium'
  },
  {
    id: 's3',
    gameId: 'brick',
    playerName: 'Breakout_King',
    playerNim: '22115008',
    playerAvatar: '🧱',
    score: 4500,
    date: '2026-06-28T09:12:00Z',
    difficulty: 'Medium'
  },
  {
    id: 's4',
    gameId: 'brick',
    playerName: 'Nando Salva',
    playerNim: 'ARC-001',
    playerAvatar: '👾',
    score: 3800,
    date: '2026-06-30T10:15:00Z',
    difficulty: 'Hard'
  },
  {
    id: 's5',
    gameId: 'snake',
    playerName: 'Python_Master',
    playerNim: '22115045',
    playerAvatar: '🐍',
    score: 620,
    date: '2026-06-29T18:45:00Z',
    difficulty: 'Hard'
  },
  {
    id: 's6',
    gameId: 'snake',
    playerName: 'Arcade_Noob',
    playerNim: '22115012',
    playerAvatar: '🕹️',
    score: 240,
    date: '2026-06-27T11:20:00Z',
    difficulty: 'Easy'
  },
  {
    id: 's7',
    gameId: 'memory',
    playerName: 'Einstein_Junior',
    playerNim: '22115055',
    playerAvatar: '🧠',
    score: 280, // Score formula: 10000 / (moves * seconds)
    date: '2026-06-29T20:10:00Z',
    difficulty: 'Medium'
  },
  {
    id: 's8',
    gameId: 'memory',
    playerName: 'Nando Salva',
    playerNim: 'ARC-001',
    playerAvatar: '👾',
    score: 190,
    date: '2026-06-30T10:30:00Z',
    difficulty: 'Medium'
  }
];

const DEFAULT_PROFILE: PlayerProfile = {
  name: 'Retro Legend',
  nim: 'PL-999',
  nickname: 'RetroPlayer',
  avatar: '🕹️',
  color: 'emerald',
  xp: 0,
  level: 1
};

export function getPlayerProfile(): PlayerProfile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  const saved = localStorage.getItem('arcade_player_profile');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.name === 'Mahasiswa UAS' || parsed.nim === '221150001') {
        localStorage.setItem('arcade_player_profile', JSON.stringify(DEFAULT_PROFILE));
        return DEFAULT_PROFILE;
      }
      return parsed;
    } catch {
      return DEFAULT_PROFILE;
    }
  }
  return DEFAULT_PROFILE;
}

export function savePlayerProfile(profile: PlayerProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('arcade_player_profile', JSON.stringify(profile));
}

export function getLeaderboard(gameId?: GameId): Score[] {
  if (typeof window === 'undefined') return INITIAL_SCORES;
  const saved = localStorage.getItem('arcade_leaderboard');
  let scores = INITIAL_SCORES;
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const hasOldWatermark = parsed.some((s: any) => s.playerName.includes('Dosen') || s.playerNim === 'Dosen-101' || s.playerNim === '221150001');
      if (hasOldWatermark) {
        localStorage.setItem('arcade_leaderboard', JSON.stringify(INITIAL_SCORES));
        return INITIAL_SCORES;
      }
      scores = parsed;
    } catch {
      scores = INITIAL_SCORES;
    }
  } else {
    localStorage.setItem('arcade_leaderboard', JSON.stringify(INITIAL_SCORES));
  }
  
  if (gameId) {
    return scores.filter(s => s.gameId === gameId).sort((a, b) => b.score - a.score);
  }
  return scores.sort((a, b) => b.score - a.score);
}

export function addLeaderboardScore(gameId: GameId, scoreValue: number, profile: PlayerProfile, difficulty: string = 'Medium'): void {
  if (typeof window === 'undefined') return;
  const currentScores = getLeaderboard();
  const newScore: Score = {
    id: `score_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    gameId,
    playerName: profile.name || profile.nickname || 'Unknown Player',
    playerNim: profile.nim || 'N/A',
    playerAvatar: profile.avatar || '🕹️',
    score: scoreValue,
    date: new Date().toISOString(),
    difficulty
  };
  
  const updatedScores = [newScore, ...currentScores];
  localStorage.setItem('arcade_leaderboard', JSON.stringify(updatedScores));

  // Add XP to player profile
  const updatedProfile = { ...profile };
  const xpGained = Math.max(10, Math.floor(scoreValue / 10));
  updatedProfile.xp += xpGained;
  
  // XP formula for levels: Level = 1 + floor(sqrt(xp / 100))
  const newLevel = 1 + Math.floor(Math.sqrt(updatedProfile.xp / 100));
  if (newLevel > updatedProfile.level) {
    updatedProfile.level = newLevel;
  }
  savePlayerProfile(updatedProfile);
}
