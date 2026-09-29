import React from 'react';
import { GameEngine } from '../game/engine';
import { sound, MusicTrack } from '../game/audio';
import { GameSettings } from '../types/game';
import { Play, RotateCcw, Volume2, VolumeX, Sliders, Music, Smartphone, Monitor } from 'lucide-react';

interface PauseMenuProps {
  engine: GameEngine | null;
  settings: GameSettings;
  onResume: () => void;
  onRestart: () => void;
  onOpenFullSettings: () => void;
  touchMode: boolean;
  onToggleTouchMode: (val: boolean) => void;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  engine,
  settings,
  onResume,
  onRestart,
  onOpenFullSettings,
  touchMode,
  onToggleTouchMode,
  onUpdateSettings,
}) => {
  const [isMuted, setIsMuted] = React.useState(sound.getIsMuted());

  const handleMuteToggle = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleSensitivityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (touchMode) {
      onUpdateSettings({ touchSensitivity: val / 1000 });
      if (engine) engine.settings.touchSensitivity = val / 1000;
    } else {
      onUpdateSettings({ mouseSensitivity: val / 1000 });
      if (engine) engine.settings.mouseSensitivity = val / 1000;
    }
  };

  const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onUpdateSettings({ musicVolume: val });
    sound.setMusicVolume(val);
    if (engine) engine.settings.musicVolume = val;
  };

  const currentSensValue = touchMode
    ? settings.touchSensitivity * 1000
    : settings.mouseSensitivity * 1000;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="modal-frame relative w-full max-w-lg bg-[#18181b] border-2 border-[#e4e4e7] p-8 sm:p-10 text-[#e4e4e7] shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e4e4e7]/15 pb-4">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#38bdf8] font-bold">
              Combat Suspended
            </span>
            <h2 className="font-display text-3xl font-black text-white tracking-tight">
              System Paused
            </h2>
          </div>
          <button
            onClick={onResume}
            className="px-5 py-2.5 bg-[#e4e4e7] hover:bg-white text-[#0a0a0c] font-display font-extrabold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Resume
          </button>
        </div>

        {/* Quick Sensitivity & Music Sliders */}
        <div className="flex flex-col gap-4">
          {/* Quick Sensitivity */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center font-mono text-xs">
              <span className="text-[#e4e4e7]/70 uppercase">
                {touchMode ? 'Touch Aim Sensitivity' : 'Mouse Sensitivity'}
              </span>
              <span className="text-[#38bdf8] font-bold tabular-nums">
                {currentSensValue.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min={touchMode ? "1.0" : "0.5"}
              max={touchMode ? "10.0" : "6.0"}
              step="0.1"
              value={currentSensValue}
              onChange={handleSensitivityChange}
              className="w-full h-1.5 bg-[#27272a] rounded-none appearance-none cursor-pointer"
            />
          </div>

          {/* Quick Music Volume */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center font-mono text-xs">
              <span className="text-[#e4e4e7]/70 uppercase">Background Music</span>
              <div className="flex items-center gap-2">
                <span className="text-[#38bdf8] font-bold tabular-nums">
                  {Math.round(settings.musicVolume * 100)}%
                </span>
                <button
                  onClick={handleMuteToggle}
                  className="text-[#e4e4e7]/60 hover:text-white"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 text-[#ef4444]" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.musicVolume}
              onChange={handleMusicVolumeChange}
              className="w-full h-1.5 bg-[#27272a] rounded-none appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Control Scheme Selector */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#e4e4e7]/10">
          <button
            onClick={() => onToggleTouchMode(false)}
            className={`py-2.5 px-3 border font-mono text-xs uppercase flex items-center justify-center gap-2 transition-all ${
              !touchMode
                ? 'border-[#38bdf8] bg-[#38bdf8]/15 text-[#38bdf8] font-bold'
                : 'border-[#e4e4e7]/15 bg-[#111114] text-[#e4e4e7]/50'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            PC Mouse + Keys
          </button>
          <button
            onClick={() => onToggleTouchMode(true)}
            className={`py-2.5 px-3 border font-mono text-xs uppercase flex items-center justify-center gap-2 transition-all ${
              touchMode
                ? 'border-[#38bdf8] bg-[#38bdf8]/15 text-[#38bdf8] font-bold'
                : 'border-[#e4e4e7]/15 bg-[#111114] text-[#e4e4e7]/50'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Mobile Touch
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onOpenFullSettings}
            className="flex-1 py-3 border border-[#38bdf8]/40 hover:border-[#38bdf8] bg-[#38bdf8]/10 text-[#38bdf8] font-display font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5" />
            All Settings
          </button>
          <button
            onClick={onRestart}
            className="flex-1 py-3 border border-[#ef4444]/40 hover:border-[#ef4444] bg-[#ef4444]/10 text-[#ef4444] font-display font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart
          </button>
        </div>
      </div>
    </div>
  );
};
