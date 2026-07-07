import { useState, useEffect } from 'react';
import { Gamepad2, Volume2, VolumeX, Terminal, Cpu, Clock } from 'lucide-react';
import { PlayerProfile } from './types';
import { getPlayerProfile } from './utils/initialData';
import { playSound } from './utils/audio';
import Dashboard from './components/Dashboard';

export default function App() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Initial load
  useEffect(() => {
    setProfile(getPlayerProfile());
  }, []);

  // Update time dynamic clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleProfileChange = (newProfile: PlayerProfile) => {
    setProfile(newProfile);
  };

  const handleSoundToggle = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    
    // Web audio bypass mocking
    if (nextMuted) {
      // Stub the play sound object
      (window as any)._oldPlaySound = { ...playSound };
      Object.keys(playSound).forEach(key => {
        (playSound as any)[key] = () => {};
      });
    } else {
      // Restore
      if ((window as any)._oldPlaySound) {
        Object.assign(playSound, (window as any)._oldPlaySound);
      }
    }
    
    playSound.click();
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-500 font-mono flex flex-col items-center justify-center">
        <Cpu className="animate-spin text-emerald-400 mb-2" size={32} />
        <p className="text-xs">LOADING GAME CENTER ENGINE...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070d] text-zinc-300 font-sans antialiased selection:bg-emerald-500 selection:text-black">
      {/* Outer Glow Effects */}
      <div className="fixed top-0 left-1/4 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Navigation Header */}
        <header className="border-b border-zinc-800 py-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl text-${profile.color}-400 shadow-lg shadow-${profile.color}-500/5`}>
              🎮
            </div>
            <div>
              <h1 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5 uppercase">
                <Gamepad2 size={16} className={`text-${profile.color}-400`} />
                GAME CENTER LOBBY
              </h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                Retro Arcade Platform • High Performance Port
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-center">
            {/* Live Clock */}
            <div className="flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-850 px-3 py-1.5 rounded-xl text-[11px] text-zinc-400">
              <Clock size={12} className="text-emerald-400" />
              <span>{currentTime}</span>
            </div>

            {/* Mute Button */}
            <button
              onClick={handleSoundToggle}
              id="btn-sound-toggle"
              className="flex items-center justify-center gap-1.5 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-850 rounded-xl px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              {isMuted ? (
                <>
                  <VolumeX size={14} className="text-rose-500" />
                  <span>Muted</span>
                </>
              ) : (
                <>
                  <Volume2 size={14} className="text-emerald-400" />
                  <span>Sound ON</span>
                </>
              )}
            </button>

            {/* Engine Status */}
            <div className="hidden md:flex items-center gap-1.5 text-[10px] text-emerald-500/80 bg-black/40 px-3 py-1.5 rounded-xl border border-emerald-950/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>SYSTEM ONLINE v1.0.0</span>
            </div>
          </div>
        </header>

        {/* Dashboard Main Lobby Component */}
        <main>
          <Dashboard profile={profile} onProfileChange={handleProfileChange} />
        </main>

        {/* Footer info section */}
        <footer className="border-t border-zinc-850 mt-16 py-8 text-center text-xs font-mono text-zinc-600 space-y-2">
          <p className="uppercase tracking-widest text-[10px] text-zinc-500 font-bold">
            RETRO ARCADE PORTAL
          </p>
          <p>
            © 2026 Retro Arcade. Designed for highly interactive high-performance client-side gameplay.
          </p>
          <div className="flex items-center justify-center gap-4 pt-2 text-[10px] text-zinc-500">
            <span>React v19</span>
            <span>•</span>
            <span>TypeScript</span>
            <span>•</span>
            <span>Vite</span>
            <span>•</span>
            <span>Web Audio API Synth</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
