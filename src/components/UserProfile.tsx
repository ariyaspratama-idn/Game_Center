import { useState } from 'react';
import { PlayerProfile } from '../types';
import { playSound } from '../utils/audio';
import { savePlayerProfile } from '../utils/initialData';
import { User, CreditCard, Award, Check, Settings, Save, Sparkles } from 'lucide-react';

interface UserProfileProps {
  profile: PlayerProfile;
  onProfileChange: (newProfile: PlayerProfile) => void;
}

const AVATARS = ['🕹️', '👾', '🚀', '🐍', '🧠', '🧱', '👑', '🛸', '🎮', '⭐', '🎈', '🔥'];
const COLORS = [
  { name: 'Emerald', class: 'emerald', bg: 'bg-emerald-500', border: 'border-emerald-500' },
  { name: 'Indigo', class: 'indigo', bg: 'bg-indigo-500', border: 'border-indigo-500' },
  { name: 'Orange', class: 'orange', bg: 'bg-orange-500', border: 'border-orange-500' },
  { name: 'Pink', class: 'pink', bg: 'bg-pink-500', border: 'border-pink-500' },
  { name: 'Amber', class: 'amber', bg: 'bg-amber-500', border: 'border-amber-500' }
];

export default function UserProfile({ profile, onProfileChange }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [nim, setNim] = useState(profile.nim);
  const [nickname, setNickname] = useState(profile.nickname);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [color, setColor] = useState(profile.color);

  const handleSave = () => {
    playSound.powerup();
    const updated: PlayerProfile = {
      ...profile,
      name: name.trim() || 'Retro Legend',
      nim: nim.trim() || 'PL-999',
      nickname: nickname.trim() || 'RetroPlayer',
      avatar,
      color
    };
    savePlayerProfile(updated);
    onProfileChange(updated);
    setIsEditing(false);
  };

  const handleEditToggle = () => {
    playSound.click();
    setIsEditing(prev => !prev);
  };

  // Get color theme helper
  const getColorClass = () => {
    switch (profile.color) {
      case 'indigo': return 'text-indigo-400 border-indigo-500/20 shadow-indigo-500/10';
      case 'orange': return 'text-orange-400 border-orange-500/20 shadow-orange-500/10';
      case 'pink': return 'text-pink-400 border-pink-500/20 shadow-pink-500/10';
      case 'amber': return 'text-amber-400 border-amber-500/20 shadow-amber-500/10';
      case 'emerald':
      default: return 'text-emerald-400 border-emerald-500/20 shadow-emerald-500/10';
    }
  };

  const getBorderColor = () => {
    switch (profile.color) {
      case 'indigo': return 'border-indigo-500';
      case 'orange': return 'border-orange-500';
      case 'pink': return 'border-pink-500';
      case 'amber': return 'border-amber-500';
      case 'emerald':
      default: return 'border-emerald-500';
    }
  };

  const getBgColor = () => {
    switch (profile.color) {
      case 'indigo': return 'bg-indigo-600 hover:bg-indigo-500';
      case 'orange': return 'bg-orange-600 hover:bg-orange-500';
      case 'pink': return 'bg-pink-600 hover:bg-pink-500';
      case 'amber': return 'bg-amber-600 hover:bg-amber-500';
      case 'emerald':
      default: return 'bg-emerald-600 hover:bg-emerald-500';
    }
  };

  return (
    <div id="user-profile-section" className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Background radial glow */}
      <div className={`absolute -right-16 -top-16 w-36 h-36 rounded-full filter blur-2xl opacity-10 bg-${profile.color}-500`} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Side: Photo Avatar & Name Details */}
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl bg-black border-2 ${getBorderColor()} flex items-center justify-center text-3xl shadow-lg relative`}>
            <span>{profile.avatar}</span>
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-zinc-850 border border-zinc-800 flex items-center justify-center text-[11px] font-mono font-bold text-${profile.color}-400`}>
              {profile.level}
            </div>
          </div>

          <div className="font-mono">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-zinc-100">{profile.name}</h3>
              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-${profile.color}-400 border border-zinc-700`}>
                LV {profile.level}
              </span>
            </div>
            <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
              <CreditCard size={12} /> PLAYER ID: <span className="text-zinc-300 font-bold">{profile.nim}</span>
            </p>
            <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
              <User size={12} /> Nickname: <span className="text-zinc-300">{profile.nickname}</span>
            </p>
          </div>
        </div>

        {/* Right Side: XP Progress bar & Action Button */}
        <div className="flex-1 md:max-w-xs flex flex-col gap-2 font-mono">
          <div className="flex justify-between items-end text-xs">
            <span className="text-zinc-500 flex items-center gap-1"><Sparkles size={12} className="text-amber-500" /> TOTAL XP</span>
            <span className="text-zinc-300">{profile.xp} XP</span>
          </div>
          {/* XP Progress Slider (Visual) */}
          <div className="w-full h-3 bg-black border border-zinc-800 rounded-full overflow-hidden p-0.5">
            {/* Level XP math: level 1 = 0-100, level 2 = 100-400, etc */}
            {/* We will render simple progression relative to next tier */}
            <div
              className={`h-full rounded-full bg-${profile.color}-500 shadow-[0_0_8px_currentColor] transition-all duration-500`}
              style={{ width: `${Math.min(100, (profile.xp % 100) || 10)}%` }}
            />
          </div>
          <p className="text-[10px] text-zinc-500 text-right">
            {(profile.xp % 100)} / 100 XP untuk level selanjutnya
          </p>
        </div>

        {/* Profile Settings Edit Button */}
        <div>
          <button
            onClick={handleEditToggle}
            id="btn-edit-profile"
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-xl px-4 py-2.5 text-xs font-mono transition-all"
          >
            <Settings size={14} /> {isEditing ? 'BATAL' : 'EDIT PROFIL'}
          </button>
        </div>
      </div>

      {/* Editing Dropdown Screen */}
      {isEditing && (
        <div className="mt-6 border-t border-zinc-800 pt-6 animate-fadeIn font-mono">
          <h4 className="text-sm font-bold text-zinc-300 mb-4 flex items-center gap-2">
            <User size={16} className={`text-${profile.color}-400`} /> DETAIL PROFIL PEMAIN ARCADE
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">NAMA LENGKAP PEMAIN</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nama Anda"
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-700"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">PLAYER ID / UNIQUE ID</label>
              <input
                type="text"
                value={nim}
                onChange={e => setNim(e.target.value)}
                placeholder="ID Anda"
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-700"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">NICKNAME ARCADE (SAMARAN)</label>
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="Ex: RetroMaster"
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>

          {/* Avatar selector */}
          <div className="mb-6">
            <label className="block text-xs text-zinc-500 mb-2">PILIH AVATAR RETRO</label>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map(av => (
                <button
                  key={av}
                  onClick={() => { playSound.click(); setAvatar(av); }}
                  className={`w-10 h-10 rounded-xl bg-black border text-lg flex items-center justify-center transition-all ${
                    avatar === av ? `border-${color}-500 bg-zinc-900` : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Color Selector */}
          <div className="mb-6">
            <label className="block text-xs text-zinc-500 mb-2">PILIH WARNA TEMA ARCADE</label>
            <div className="flex flex-wrap gap-3">
              {COLORS.map(col => (
                <button
                  key={col.class}
                  onClick={() => { playSound.click(); setColor(col.class); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                    color === col.class
                      ? `${col.border} bg-zinc-900/60 font-bold`
                      : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${col.bg}`} />
                  {col.name}
                </button>
              ))}
            </div>
          </div>

          {/* Action Save Bar */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              id="btn-save-profile"
              className={`flex items-center gap-2 ${getBgColor()} text-black font-bold rounded-xl px-6 py-2.5 text-xs transition-all shadow-lg`}
            >
              <Save size={14} /> SIMPAN IDENTITAS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
