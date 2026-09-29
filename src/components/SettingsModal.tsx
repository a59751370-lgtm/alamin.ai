import React from 'react';
import { GameEngine } from '../game/engine';
import { sound, MusicTrack } from '../game/audio';
import { GameSettings } from '../types/game';
import {
  Volume2,
  VolumeX,
  Music,
  Disc,
  Play,
  Pause,
  Sliders,
  Monitor,
  Smartphone,
  Eye,
  Crosshair,
  Sparkles,
  RotateCcw,
  X,
  Check,
} from 'lucide-react';

interface SettingsModalProps {
  engine: GameEngine | null;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onClose: () => void;
  onRestartGame: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  engine,
  settings,
  onUpdateSettings,
  onClose,
  onRestartGame,
}) => {
  const [activeTab, setActiveTab] = React.useState<'audio' | 'controls' | 'graphics'>('audio');
  const [isMuted, setIsMuted] = React.useState(sound.getIsMuted());
  const [isMusicPlaying, setIsMusicPlaying] = React.useState(true);

  const handleSfxVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onUpdateSettings({ soundVolume: val });
    sound.setSfxVolume(val);
    if (engine) engine.settings.soundVolume = val;
  };

  const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onUpdateSettings({ musicVolume: val });
    sound.setMusicVolume(val);
    if (engine) engine.settings.musicVolume = val;
  };

  const handleTrackChange = (track: MusicTrack) => {
    onUpdateSettings({ musicTrack: track });
    sound.setMusicTrack(track);
    if (engine) engine.settings.musicTrack = track;
  };

  const handleToggleMusic = () => {
    const playing = sound.toggleMusic();
    setIsMusicPlaying(playing);
    onUpdateSettings({ musicEnabled: playing });
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleMouseSensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onUpdateSettings({ mouseSensitivity: val / 1000 });
    if (engine) engine.settings.mouseSensitivity = val / 1000;
  };

  const handleTouchSensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onUpdateSettings({ touchSensitivity: val / 1000 });
    if (engine) engine.settings.touchSensitivity = val / 1000;
  };

  const crosshairColors = [
    { label: 'Cyan', color: '#38bdf8' },
    { label: 'Emerald', color: '#10b981' },
    { label: 'Crimson', color: '#ef4444' },
    { label: 'White', color: '#ffffff' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="modal-frame relative w-full max-w-xl bg-[#18181b] border-2 border-[#e4e4e7] p-6 sm:p-8 text-[#e4e4e7] shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e4e4e7]/10 pb-4">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] tracking-widest text-[#38bdf8] uppercase font-bold">
              Configuration // Console
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#e4e4e7] tracking-tight">
              Settings & Sensitivity
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 border border-[#e4e4e7]/20 hover:border-[#e4e4e7] text-[#e4e4e7]/70 hover:text-white transition-colors"
            title="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-2 border-b border-[#e4e4e7]/10 pb-3">
          <button
            onClick={() => setActiveTab('audio')}
            className={`py-2 px-3 font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all ${
              activeTab === 'audio'
                ? 'border-[#38bdf8] bg-[#38bdf8]/10 text-[#38bdf8] font-bold'
                : 'border-transparent text-[#e4e4e7]/50 hover:text-[#e4e4e7]'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            Music & Audio
          </button>
          <button
            onClick={() => setActiveTab('controls')}
            className={`py-2 px-3 font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all ${
              activeTab === 'controls'
                ? 'border-[#38bdf8] bg-[#38bdf8]/10 text-[#38bdf8] font-bold'
                : 'border-transparent text-[#e4e4e7]/50 hover:text-[#e4e4e7]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Sensitivity & Aim
          </button>
          <button
            onClick={() => setActiveTab('graphics')}
            className={`py-2 px-3 font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all ${
              activeTab === 'graphics'
                ? 'border-[#38bdf8] bg-[#38bdf8]/10 text-[#38bdf8] font-bold'
                : 'border-transparent text-[#e4e4e7]/50 hover:text-[#e4e4e7]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Display & Mode
          </button>
        </div>

        {/* TAB 1: MUSIC & AUDIO CONTROL */}
        {activeTab === 'audio' && (
          <div className="flex flex-col gap-5 animate-in fade-in duration-150">
            {/* Master Mute & Play/Pause row */}
            <div className="flex items-center justify-between bg-[#111114] p-3 border border-[#e4e4e7]/10">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleMute}
                  className={`px-3 py-1.5 font-mono text-xs uppercase border flex items-center gap-1.5 transition-colors ${
                    isMuted
                      ? 'border-[#ef4444] bg-[#ef4444]/20 text-[#ef4444]'
                      : 'border-[#38bdf8] bg-[#38bdf8]/20 text-[#38bdf8]'
                  }`}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  {isMuted ? 'Muted' : 'Audio On'}
                </button>
                <span className="font-mono text-xs text-[#e4e4e7]/70">Master Sound Output</span>
              </div>

              {/* Music Play/Pause toggle */}
              <button
                onClick={handleToggleMusic}
                className="px-3 py-1.5 font-mono text-xs uppercase border border-[#e4e4e7]/20 hover:border-[#38bdf8] text-[#e4e4e7] flex items-center gap-1.5 transition-colors"
              >
                {isMusicPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                {isMusicPlaying ? 'Pause BGM' : 'Play BGM'}
              </button>
            </div>

            {/* Sound FX Volume Slider */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="text-[#e4e4e7]/70 uppercase">Combat SFX Volume</span>
                <span className="text-[#38bdf8] font-bold tabular-nums">
                  {Math.round(settings.soundVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.soundVolume}
                onChange={handleSfxVolumeChange}
                className="w-full h-1.5 bg-[#27272a] rounded-none appearance-none cursor-pointer"
              />
            </div>

            {/* Music Volume Slider */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="text-[#e4e4e7]/70 uppercase">Synth Music (BGM) Volume</span>
                <span className="text-[#38bdf8] font-bold tabular-nums">
                  {Math.round(settings.musicVolume * 100)}%
                </span>
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

            {/* Music Track Selector */}
            <div className="flex flex-col gap-2">
              <span className="font-mono text-xs uppercase text-[#e4e4e7]/70 flex items-center gap-1.5">
                <Disc className="w-3.5 h-3.5 text-[#38bdf8]" />
                Procedural Synth Soundtrack
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => handleTrackChange('cyber_assault')}
                  className={`p-3 text-left border flex flex-col gap-1 transition-all ${
                    settings.musicTrack === 'cyber_assault'
                      ? 'border-[#38bdf8] bg-[#38bdf8]/15 text-[#e4e4e7]'
                      : 'border-[#e4e4e7]/10 bg-[#111114] text-[#e4e4e7]/60 hover:text-[#e4e4e7]'
                  }`}
                >
                  <span className="font-mono text-[10px] text-[#38bdf8] font-bold uppercase">Track 01</span>
                  <span className="font-display font-bold text-sm">Cyber Assault</span>
                  <span className="font-mono text-[9px] opacity-60">128 BPM Arp</span>
                </button>

                <button
                  onClick={() => handleTrackChange('dark_drone')}
                  className={`p-3 text-left border flex flex-col gap-1 transition-all ${
                    settings.musicTrack === 'dark_drone'
                      ? 'border-[#38bdf8] bg-[#38bdf8]/15 text-[#e4e4e7]'
                      : 'border-[#e4e4e7]/10 bg-[#111114] text-[#e4e4e7]/60 hover:text-[#e4e4e7]'
                  }`}
                >
                  <span className="font-mono text-[10px] text-[#38bdf8] font-bold uppercase">Track 02</span>
                  <span className="font-display font-bold text-sm">Dark Drone</span>
                  <span className="font-mono text-[9px] opacity-60">Sub Atmosphere</span>
                </button>

                <button
                  onClick={() => handleTrackChange('synth_wave')}
                  className={`p-3 text-left border flex flex-col gap-1 transition-all ${
                    settings.musicTrack === 'synth_wave'
                      ? 'border-[#38bdf8] bg-[#38bdf8]/15 text-[#e4e4e7]'
                      : 'border-[#e4e4e7]/10 bg-[#111114] text-[#e4e4e7]/60 hover:text-[#e4e4e7]'
                  }`}
                >
                  <span className="font-mono text-[10px] text-[#38bdf8] font-bold uppercase">Track 03</span>
                  <span className="font-display font-bold text-sm">Synthwave</span>
                  <span className="font-mono text-[9px] opacity-60">112 BPM Chiptune</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SENSITIVITY & AIM */}
        {activeTab === 'controls' && (
          <div className="flex flex-col gap-5 animate-in fade-in duration-150">
            {/* Mouse Sensitivity */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="text-[#e4e4e7]/70 uppercase">Mouse Look Sensitivity</span>
                <span className="text-[#38bdf8] font-bold tabular-nums">
                  {(settings.mouseSensitivity * 1000).toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="6.0"
                step="0.1"
                value={settings.mouseSensitivity * 1000}
                onChange={handleMouseSensChange}
                className="w-full h-1.5 bg-[#27272a] rounded-none appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#e4e4e7]/40">
                <span>0.5x (Precision)</span>
                <span>3.0x (Standard)</span>
                <span>6.0x (Hyper)</span>
              </div>
            </div>

            {/* Touch Aim Sensitivity */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="text-[#e4e4e7]/70 uppercase">Touch Drag Sensitivity</span>
                <span className="text-[#38bdf8] font-bold tabular-nums">
                  {(settings.touchSensitivity * 1000).toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.2"
                value={settings.touchSensitivity * 1000}
                onChange={handleTouchSensChange}
                className="w-full h-1.5 bg-[#27272a] rounded-none appearance-none cursor-pointer"
              />
            </div>

            {/* Invert Y & Aim Assist Toggles */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  const next = !settings.invertY;
                  onUpdateSettings({ invertY: next });
                  if (engine) engine.settings.invertY = next;
                }}
                className={`p-3 border flex items-center justify-between transition-all ${
                  settings.invertY
                    ? 'border-[#38bdf8] bg-[#38bdf8]/15 text-[#e4e4e7]'
                    : 'border-[#e4e4e7]/15 bg-[#111114] text-[#e4e4e7]/60'
                }`}
              >
                <span className="font-mono text-xs uppercase">Invert Y Axis</span>
                <span className={`font-mono text-xs font-bold ${settings.invertY ? 'text-[#38bdf8]' : 'text-[#e4e4e7]/40'}`}>
                  {settings.invertY ? 'ON' : 'OFF'}
                </span>
              </button>

              <button
                onClick={() => {
                  const next = !settings.aimAssist;
                  onUpdateSettings({ aimAssist: next });
                  if (engine) engine.settings.aimAssist = next;
                }}
                className={`p-3 border flex items-center justify-between transition-all ${
                  settings.aimAssist
                    ? 'border-[#38bdf8] bg-[#38bdf8]/15 text-[#e4e4e7]'
                    : 'border-[#e4e4e7]/15 bg-[#111114] text-[#e4e4e7]/60'
                }`}
              >
                <span className="font-mono text-xs uppercase">Aim Assist</span>
                <span className={`font-mono text-xs font-bold ${settings.aimAssist ? 'text-[#38bdf8]' : 'text-[#e4e4e7]/40'}`}>
                  {settings.aimAssist ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>

            {/* Reticle Color Picker */}
            <div className="flex flex-col gap-2 pt-2">
              <span className="font-mono text-xs uppercase text-[#e4e4e7]/70 flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-[#38bdf8]" />
                HUD Reticle Color
              </span>
              <div className="grid grid-cols-4 gap-2">
                {crosshairColors.map((item) => (
                  <button
                    key={item.color}
                    onClick={() => {
                      onUpdateSettings({ crosshairColor: item.color });
                      if (engine) engine.settings.crosshairColor = item.color;
                    }}
                    className={`p-2.5 border flex items-center justify-center gap-2 font-mono text-xs transition-all ${
                      settings.crosshairColor === item.color
                        ? 'border-[#e4e4e7] bg-[#27272a] text-white font-bold'
                        : 'border-[#e4e4e7]/10 bg-[#111114] text-[#e4e4e7]/60 hover:text-white'
                    }`}
                  >
                    <span className="w-3 h-3 border border-black/40 inline-block" style={{ backgroundColor: item.color }} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DISPLAY & CONTROL SCHEME */}
        {activeTab === 'graphics' && (
          <div className="flex flex-col gap-5 animate-in fade-in duration-150">
            {/* Input Scheme Selector */}
            <div className="flex flex-col gap-2">
              <span className="font-mono text-xs uppercase text-[#e4e4e7]/70">Primary Input Scheme</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    onUpdateSettings({ touchControlsEnabled: false });
                    if (engine) engine.setTouchControlsEnabled(false);
                  }}
                  className={`p-4 border flex flex-col gap-1 text-left transition-all ${
                    !settings.touchControlsEnabled
                      ? 'border-[#38bdf8] bg-[#38bdf8]/15 text-[#e4e4e7]'
                      : 'border-[#e4e4e7]/10 bg-[#111114] text-[#e4e4e7]/60 hover:text-[#e4e4e7]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-[#38bdf8]" />
                    <span className="font-display font-bold text-sm">PC Mouse + Keys</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#e4e4e7]/50">WASD Movement, Pointer Lock</span>
                </button>

                <button
                  onClick={() => {
                    onUpdateSettings({ touchControlsEnabled: true });
                    if (engine) engine.setTouchControlsEnabled(true);
                  }}
                  className={`p-4 border flex flex-col gap-1 text-left transition-all ${
                    settings.touchControlsEnabled
                      ? 'border-[#38bdf8] bg-[#38bdf8]/15 text-[#e4e4e7]'
                      : 'border-[#e4e4e7]/10 bg-[#111114] text-[#e4e4e7]/60 hover:text-[#e4e4e7]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#38bdf8]" />
                    <span className="font-display font-bold text-sm">Mobile Touch</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#e4e4e7]/50">Dual Virtual Analog Sticks</span>
                </button>
              </div>
            </div>

            {/* Quality Preset */}
            <div className="flex flex-col gap-2">
              <span className="font-mono text-xs uppercase text-[#e4e4e7]/70">Rendering Fidelity</span>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      onUpdateSettings({ quality: q });
                      if (engine) engine.settings.quality = q;
                    }}
                    className={`py-2.5 px-3 border font-mono text-xs uppercase tracking-wider transition-all ${
                      settings.quality === q
                        ? 'border-[#38bdf8] bg-[#38bdf8]/20 text-[#38bdf8] font-bold'
                        : 'border-[#e4e4e7]/10 bg-[#111114] text-[#e4e4e7]/50 hover:text-[#e4e4e7]'
                    }`}
                  >
                    {q} Quality
                  </button>
                ))}
              </div>
            </div>

            {/* Mission Actions */}
            <div className="pt-4 border-t border-[#e4e4e7]/10 flex gap-3">
              <button
                onClick={onRestartGame}
                className="flex-1 py-3 bg-[#27272a] hover:bg-[#ef4444]/20 border border-[#ef4444]/40 text-[#ef4444] font-display font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Restart Mission
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#e4e4e7]/10 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-3 bg-[#e4e4e7] hover:bg-white text-[#0a0a0c] font-display font-extrabold text-sm uppercase tracking-wider transition-colors"
          >
            Apply & Return
          </button>
        </div>
      </div>
    </div>
  );
};
