import React from 'react';
import { GameStats, Weapon, WeaponType, GameSettings } from '../types/game';
import { Minimap } from './Minimap';
import {
  Sliders,
  Volume2,
  VolumeX,
  Smartphone,
  Monitor,
  Flame,
  Pause,
} from 'lucide-react';

interface HUDProps {
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  weapon: Weapon;
  isReloading: boolean;
  stats: GameStats;
  enemiesRemaining: number;
  playerPos: { x: number; z: number; yaw: number };
  enemyPositions: { x: number; z: number; type: string }[];
  hitMarkerActive: boolean;
  damageVignette: boolean;
  touchMode: boolean;
  settings: GameSettings;
  onToggleTouchMode: (val: boolean) => void;
  onOpenSettings: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
  onSelectWeapon: (type: WeaponType) => void;
  waveAlert: string | null;
}

export const HUD: React.FC<HUDProps> = ({
  health,
  maxHealth,
  armor,
  maxArmor,
  weapon,
  isReloading,
  stats,
  enemiesRemaining,
  playerPos,
  enemyPositions,
  hitMarkerActive,
  damageVignette,
  touchMode,
  settings,
  onToggleTouchMode,
  onOpenSettings,
  onToggleMute,
  isMuted,
  onSelectWeapon,
  waveAlert,
}) => {
  const healthPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const armorPercent = Math.max(0, Math.min(100, (armor / maxArmor) * 100));

  const reticleColor = settings.crosshairColor || '#38bdf8';

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-4 sm:p-6">
      {/* Damage Vignette Screen Flash */}
      <div
        className={`fixed inset-0 pointer-events-none transition-opacity duration-150 z-50 ${
          damageVignette ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          boxShadow: 'inset 0 0 120px 40px rgba(239, 68, 68, 0.45)',
        }}
      />

      {/* Critical Health Pulsing Screen Edge */}
      {health <= 25 && (
        <div
          className="fixed inset-0 pointer-events-none animate-pulse z-40"
          style={{
            boxShadow: 'inset 0 0 80px 20px rgba(239, 68, 68, 0.35)',
          }}
        />
      )}

      {/* 1. HEADER ZONE */}
      <header className="grid grid-cols-2 md:grid-cols-3 items-start md:items-center w-full pointer-events-auto">
        {/* Brand Block */}
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[10px] tracking-widest text-[#38bdf8] uppercase font-bold">
            System Active
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-[#e4e4e7] tracking-tight">
            CyberStrike 3D
          </h2>
        </div>

        {/* Center: Current Wave Block */}
        <div className="hidden md:flex flex-col items-center">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#e4e4e7]/60">
            Current Wave
          </span>
          <span className="font-display text-3xl sm:text-4xl font-extrabold text-[#fbbf24] leading-none">
            {stats.wave < 10 ? `0${stats.wave}` : stats.wave}
          </span>
        </div>

        {/* Right Zone: Quick Control Buttons & Radar Box */}
        <div className="flex items-start justify-end gap-3">
          {/* Quick Action Buttons */}
          <div className="flex flex-col gap-1.5">
            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="p-2.5 bg-[#18181b] hover:bg-[#27272a] border border-[#e4e4e7]/15 hover:border-[#38bdf8] text-[#e4e4e7] transition-colors flex items-center justify-center shadow-md"
              title="Open Settings (Sensitivity, Music, Audio)"
            >
              <Sliders className="w-4 h-4 text-[#38bdf8]" />
            </button>

            {/* Mute Toggle Button */}
            <button
              onClick={onToggleMute}
              className="p-2.5 bg-[#18181b] hover:bg-[#27272a] border border-[#e4e4e7]/15 text-[#e4e4e7] transition-colors flex items-center justify-center shadow-md"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-[#ef4444]" /> : <Volume2 className="w-4 h-4 text-[#e4e4e7]" />}
            </button>

            {/* Desktop / Touch Switch Button */}
            <button
              onClick={() => onToggleTouchMode(!touchMode)}
              className="p-2.5 bg-[#18181b] hover:bg-[#27272a] border border-[#e4e4e7]/15 text-[#e4e4e7] transition-colors flex items-center justify-center shadow-md"
              title={touchMode ? 'Switch to Desktop Controls' : 'Switch to Touch Controls'}
            >
              {touchMode ? <Smartphone className="w-4 h-4 text-[#38bdf8]" /> : <Monitor className="w-4 h-4 text-[#e4e4e7]" />}
            </button>
          </div>

          {/* Minimap Radar Box */}
          <Minimap playerPos={playerPos} enemyPositions={enemyPositions} />
        </div>
      </header>

      {/* 2. MAIN CENTER: CROSSHAIR & ANNOUNCEMENTS */}
      <main className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Wave Announcement Banner */}
        {waveAlert && (
          <div className="absolute top-24 bg-[#18181b] border-2 border-[#38bdf8] px-6 py-3 text-center shadow-2xl animate-bounce">
            <span className="font-mono text-xs text-[#38bdf8] tracking-widest uppercase font-bold">
              {waveAlert}
            </span>
          </div>
        )}

        {/* Minimalist Brutalist Reticle */}
        <div className="relative w-2 h-2" style={{ borderColor: reticleColor }}>
          {/* Center Box */}
          <div
            className="w-2 h-2 border"
            style={{ borderColor: reticleColor }}
          />

          {/* Horizontal Reticle Crossbar */}
          <div
            className="absolute top-[3px] -left-3.5 w-9 h-[1px]"
            style={{ backgroundColor: reticleColor }}
          />

          {/* Vertical Reticle Crossbar */}
          <div
            className="absolute -top-3.5 left-[3px] w-[1px] h-9"
            style={{ backgroundColor: reticleColor }}
          />

          {/* Dynamic Hit Marker (Red / White X tick) */}
          {hitMarkerActive && (
            <div className="absolute -inset-2 flex items-center justify-center animate-ping pointer-events-none">
              <div className="w-6 h-6 border border-[#ef4444] rotate-45" />
            </div>
          )}
        </div>
      </main>

      {/* 3. FOOTER ZONE */}
      <footer className="grid grid-cols-1 md:grid-cols-[280px_1fr_280px] items-end gap-4 sm:gap-8 w-full pointer-events-auto">
        {/* Left HUD Panel: Health & Shield */}
        <div className="bg-[#18181b] border border-[#e4e4e7]/15 p-4 flex flex-col justify-between shadow-xl">
          {/* Health */}
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#e4e4e7]/70">
                Health // 00
              </span>
              <span className="font-mono text-xs font-bold text-[#ef4444] tabular-nums">
                {health} / {maxHealth}
              </span>
            </div>
            <div className="h-1 bg-white/5 w-full overflow-hidden">
              <div
                className="h-full bg-[#ef4444] transition-all duration-200"
                style={{
                  width: `${healthPercent}%`,
                  boxShadow: '0 0 8px #ef4444',
                }}
              />
            </div>
          </div>

          {/* Shield */}
          <div className="mt-4">
            <div className="flex justify-between items-baseline mb-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#e4e4e7]/70">
                Shield // 01
              </span>
              <span className="font-mono text-xs font-bold text-[#38bdf8] tabular-nums">
                {armor} / {maxArmor}
              </span>
            </div>
            <div className="h-1 bg-white/5 w-full overflow-hidden">
              <div
                className="h-full bg-[#38bdf8] transition-all duration-200"
                style={{
                  width: `${armorPercent}%`,
                  boxShadow: '0 0 8px #38bdf8',
                }}
              />
            </div>
          </div>
        </div>

        {/* Center: Weapon Dock & Hostile Count */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => onSelectWeapon('rifle')}
              className={`border py-2 px-3 sm:px-4 font-mono text-[11px] uppercase tracking-wider transition-all ${
                weapon.id === 'rifle'
                  ? 'border-[#38bdf8] text-[#38bdf8] bg-[#38bdf8]/10 font-bold'
                  : 'border-[#e4e4e7]/15 text-[#e4e4e7]/60 hover:text-[#e4e4e7] bg-[#18181b]'
              }`}
            >
              1 // Pulse Rifle
            </button>
            <button
              onClick={() => onSelectWeapon('shotgun')}
              className={`border py-2 px-3 sm:px-4 font-mono text-[11px] uppercase tracking-wider transition-all ${
                weapon.id === 'shotgun'
                  ? 'border-[#38bdf8] text-[#38bdf8] bg-[#38bdf8]/10 font-bold'
                  : 'border-[#e4e4e7]/15 text-[#e4e4e7]/60 hover:text-[#e4e4e7] bg-[#18181b]'
              }`}
            >
              2 // Scatter V-12
            </button>
            <button
              onClick={() => onSelectWeapon('sniper')}
              className={`border py-2 px-3 sm:px-4 font-mono text-[11px] uppercase tracking-wider transition-all ${
                weapon.id === 'sniper'
                  ? 'border-[#38bdf8] text-[#38bdf8] bg-[#38bdf8]/10 font-bold'
                  : 'border-[#e4e4e7]/15 text-[#e4e4e7]/60 hover:text-[#e4e4e7] bg-[#18181b]'
              }`}
            >
              3 // Hyperion
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#e4e4e7]/50">
              Hostiles Remaining:
            </span>
            <span className="font-mono text-[11px] font-bold text-[#ef4444] tabular-nums">
              {enemiesRemaining < 10 ? `0${enemiesRemaining}` : enemiesRemaining}
            </span>
          </div>
        </div>

        {/* Right HUD Panel: Ammo Loadout */}
        <div className="bg-[#18181b] border border-[#e4e4e7]/15 p-4 flex flex-col items-end justify-between shadow-xl">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#e4e4e7]/60">
            Ammo Loadout
          </span>

          <div className="flex items-baseline justify-end gap-2 mt-1">
            <span
              className={`font-display text-4xl sm:text-5xl font-black tabular-nums ${
                weapon.currentMag === 0
                  ? 'text-[#ef4444] animate-pulse'
                  : weapon.currentMag <= 5
                  ? 'text-[#fbbf24]'
                  : 'text-[#e4e4e7]'
              }`}
            >
              {weapon.currentMag}
            </span>
            <span className="font-display text-xl sm:text-2xl text-[#e4e4e7]/30 tabular-nums">
              / {weapon.reserveAmmo}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            {isReloading && (
              <span className="font-mono text-[10px] text-[#fbbf24] uppercase flex items-center gap-1 animate-pulse">
                <Flame className="w-3 h-3 fill-[#fbbf24]" />
                Reloading
              </span>
            )}
            <span className="font-mono text-[10px] text-[#e4e4e7]/50 uppercase">
              {weapon.name}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
