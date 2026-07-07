export type GameId = 'space' | 'brick' | 'snake' | 'memory';

export interface PlayerProfile {
  name: string;
  nim: string; // Student ID (NIM - Nomor Induk Mahasiswa) for college UAS
  nickname: string;
  avatar: string; // emoji or design
  color: string;  // theme color
  xp: number;
  level: number;
}

export interface Score {
  id: string;
  gameId: GameId;
  playerName: string;
  playerNim: string;
  playerAvatar: string;
  score: number;
  date: string;
  difficulty?: string;
}

export interface GameMetadata {
  id: GameId;
  title: string;
  tagline: string;
  description: string;
  genre: string;
  icon: string; // Lucide icon name or emoji
  color: string; // Tailwind color class
  howToPlay: string[];
}
