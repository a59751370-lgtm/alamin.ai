import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/engine';
import { GameSettings, GameStats, Weapon, WeaponType } from './types/game';
import { INITIAL_WEAPONS } from './game/weapons';
import { sound } from './game/audio';
import { HUD } from './components/HUD';
import { TouchControls } from './components/TouchControls';
import { PauseMenu } from './components/PauseMenu';
import { SettingsModal } from './components/SettingsModal';
import { GameOverModal } from './components/GameOverModal';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Game UI State
  const [hasStarted, setHasStarted] = useState(false);
  const [health, setHealth] = useState(100);
  const [maxHealth] = useState(100);
  const [armor, setArmor] = useState(50);
  const [maxArmor] = useState(50);
  const [weapon, setWeapon] = useState<Weapon>(INITIAL_WEAPONS.rifle);
  const [isReloading, setIsReloading] = useState(false);
  const [enemiesRemaining, setEnemiesRemaining] = useState(4);
  const [playerPos, setPlayerPos] = useState({ x: 0, z: 20, yaw: 0 });
  const [enemyPositions, setEnemyPositions] = useState<{ x: number; z: number; type: string }[]>([]);

  const [stats, setStats] = useState<GameStats>({
    score: 0,
    kills: 0,
    headshots: 0,
    wave: 1,
    shotsFired: 0,
    shotsHit: 0,
    timeSurvived: 0,
  });

  // Settings State
  const [settings, setSettings] = useState<GameSettings>({
    mouseSensitivity: 0.0022,
    touchSensitivity: 0.0045,
    soundVolume: 0.7,
    musicVolume: 0.45,
    musicEnabled: true,
    musicTrack: 'cyber_assault',
    touchControlsEnabled: false,
    invertY: false,
    quality: 'high',
    aimAssist: true,
    crosshairColor: '#38bdf8',
  });

  // Feedback states
  const [hitMarkerActive, setHitMarkerActive] = useState(false);
  const [damageVignette, setDamageVignette] = useState(false);
  const [waveAlert, setWaveAlert] = useState<string | null>(null);

  // Modals & Controls Mode
  const [isPaused, setIsPaused] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [finalStats, setFinalStats] = useState<GameStats | null>(null);
  const [isSprinting, setIsSprinting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Detect touch device by default or manual toggle
  const [touchMode, setTouchMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
      );
    }
    return false;
  });

  useEffect(() => {
    if (!containerRef.current) return;

    // Create 3D Engine
    const engine = new GameEngine(containerRef.current);
    engineRef.current = engine;
    engine.setTouchControlsEnabled(touchMode);
    engine.settings = { ...settings, touchControlsEnabled: touchMode };

    // Callbacks from Engine
    engine.onStateUpdate = (data) => {
      setHealth(data.health);
      setArmor(data.armor);
      setWeapon(data.weapon);
      setIsReloading(data.isReloading);
      setStats({ ...data.stats });
      setEnemiesRemaining(data.enemiesRemaining);
      setPlayerPos(data.playerPos);
      setEnemyPositions(data.enemyPositions);
    };

    engine.onHitMarker = () => {
      setHitMarkerActive(true);
      setTimeout(() => setHitMarkerActive(false), 80);
    };

    engine.onPlayerDamage = () => {
      setDamageVignette(true);
      setTimeout(() => setDamageVignette(false), 240);
    };

    engine.onWaveComplete = (wave) => {
      setWaveAlert(`ZONE SECURED // COMMENCING WAVE ${wave}`);
      setTimeout(() => setWaveAlert(null), 3200);
    };

    engine.onGameOverCallback = (gameOverStats) => {
      setIsGameOver(true);
      setFinalStats({ ...gameOverStats });
    };

    // ESC to Pause listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'Tab') {
        e.preventDefault();
        setIsPaused((prev) => {
          const next = !prev;
          if (engineRef.current) engineRef.current.isPaused = next;
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      engine.destroy();
    };
  }, []);

  const handleUpdateSettings = (partial: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...partial };
      if (engineRef.current) {
        engineRef.current.settings = { ...updated };
      }
      return updated;
    });
  };

  const handleToggleTouchMode = (enabled: boolean) => {
    setTouchMode(enabled);
    handleUpdateSettings({ touchControlsEnabled: enabled });
    if (engineRef.current) {
      engineRef.current.setTouchControlsEnabled(enabled);
    }
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleSelectWeapon = (type: WeaponType) => {
    if (engineRef.current) {
      engineRef.current.equipWeapon(type);
    }
  };

  const handleToggleSprint = () => {
    setIsSprinting((prev) => {
      const next = !prev;
      if (engineRef.current) {
        engineRef.current.isSprinting = next;
      }
      return next;
    });
  };

  const handleStartGame = () => {
    setHasStarted(true);
    sound.startAmbient();
    if (!touchMode && containerRef.current) {
      const canvas = containerRef.current.querySelector('canvas');
      canvas?.requestPointerLock?.();
    }
  };

  const handleResume = () => {
    setIsPaused(false);
    setIsSettingsOpen(false);
    if (engineRef.current) {
      engineRef.current.isPaused = false;
      if (!touchMode && containerRef.current) {
        const canvas = containerRef.current.querySelector('canvas');
        canvas?.requestPointerLock?.();
      }
    }
  };

  const handleRestart = () => {
    setIsGameOver(false);
    setIsPaused(false);
    setIsSettingsOpen(false);
    setFinalStats(null);
    if (engineRef.current) {
      engineRef.current.restartGame();
      if (!touchMode && containerRef.current) {
        const canvas = containerRef.current.querySelector('canvas');
        canvas?.requestPointerLock?.();
      }
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0a0c] font-sans text-[#e4e4e7] select-none touch-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

      {/* In-Game Heads-Up Display (HUD) */}
      <HUD
        health={health}
        maxHealth={maxHealth}
        armor={armor}
        maxArmor={maxArmor}
        weapon={weapon}
        isReloading={isReloading}
        stats={stats}
        enemiesRemaining={enemiesRemaining}
        playerPos={playerPos}
        enemyPositions={enemyPositions}
        hitMarkerActive={hitMarkerActive}
        damageVignette={damageVignette}
        touchMode={touchMode}
        settings={settings}
        onToggleTouchMode={handleToggleTouchMode}
        onOpenSettings={() => {
          setIsSettingsOpen(true);
          if (engineRef.current) engineRef.current.isPaused = true;
        }}
        onToggleMute={handleToggleMute}
        isMuted={isMuted}
        onSelectWeapon={handleSelectWeapon}
        waveAlert={waveAlert}
      />

      {/* Mobile Touch Controls Layer */}
      {touchMode && (
        <TouchControls
          engine={engineRef.current}
          currentWeapon={weapon.id}
          onSelectWeapon={handleSelectWeapon}
          isSprinting={isSprinting}
          onToggleSprint={handleToggleSprint}
        />
      )}

      {/* Intro Modal (Variation 2 Design) */}
      {!hasStarted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="modal-frame relative w-full max-w-[480px] bg-[#18181b] border-2 border-[#e4e4e7] p-8 sm:p-10 text-[#e4e4e7] shadow-2xl flex flex-col gap-4">
            <span className="font-mono text-xs text-[#38bdf8] uppercase tracking-widest font-bold">
              Protocol Init
            </span>
            <h1 className="font-display text-4xl sm:text-6xl font-black text-white tracking-tight leading-none mb-1">
              CyberStrike
            </h1>
            <p className="font-sans text-sm text-[#e4e4e7]/70 leading-relaxed">
              Neutralize hostile mechs, defend the core reactor, and survive escalating cyber waves.
            </p>

            {/* Controls Grid */}
            <div className="grid grid-cols-2 gap-3 my-4 text-left border-y border-[#e4e4e7]/10 py-4 font-mono text-xs">
              <div>
                <span className="text-[#e4e4e7]/40">Move: </span>
                <span className="text-[#e4e4e7]">WASD</span>
              </div>
              <div>
                <span className="text-[#e4e4e7]/40">Shoot: </span>
                <span className="text-[#e4e4e7]">Click</span>
              </div>
              <div>
                <span className="text-[#e4e4e7]/40">Jump: </span>
                <span className="text-[#e4e4e7]">Space</span>
              </div>
              <div>
                <span className="text-[#e4e4e7]/40">Sprint: </span>
                <span className="text-[#e4e4e7]">Shift</span>
              </div>
            </div>

            {/* Deploy Button */}
            <button
              onClick={handleStartGame}
              className="w-full py-4 bg-[#e4e4e7] hover:bg-white text-[#0a0a0c] font-display font-extrabold text-sm uppercase tracking-wider transition-colors cursor-pointer shadow-lg active:scale-98"
            >
              Deploy to Arena
            </button>
          </div>
        </div>
      )}

      {/* Pause Menu Modal */}
      {isPaused && !isSettingsOpen && (
        <PauseMenu
          engine={engineRef.current}
          settings={settings}
          onResume={handleResume}
          onRestart={handleRestart}
          onOpenFullSettings={() => setIsSettingsOpen(true)}
          touchMode={touchMode}
          onToggleTouchMode={handleToggleTouchMode}
          onUpdateSettings={handleUpdateSettings}
        />
      )}

      {/* Full Settings & Music Control Modal */}
      {isSettingsOpen && (
        <SettingsModal
          engine={engineRef.current}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={handleResume}
          onRestartGame={handleRestart}
        />
      )}

      {/* Game Over Modal */}
      {isGameOver && finalStats && (
        <GameOverModal stats={finalStats} onRestart={handleRestart} />
      )}
    </div>
  );
}
