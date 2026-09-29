import React, { useRef, useState } from 'react';
import { GameEngine } from '../game/engine';
import { Crosshair, ArrowUp, RefreshCw, Gauge } from 'lucide-react';
import { WeaponType } from '../types/game';

interface TouchControlsProps {
  engine: GameEngine | null;
  currentWeapon: WeaponType;
  onSelectWeapon: (weapon: WeaponType) => void;
  isSprinting: boolean;
  onToggleSprint: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  engine,
  currentWeapon,
  onSelectWeapon,
  isSprinting,
  onToggleSprint,
}) => {
  // Joystick State
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickBase, setJoystickBase] = useState<{ x: number; y: number } | null>(null);
  const [joystickThumb, setJoystickThumb] = useState<{ x: number; y: number } | null>(null);
  const leftTouchId = useRef<number | null>(null);

  // Look drag State
  const rightTouchId = useRef<number | null>(null);
  const lastTouchLook = useRef<{ x: number; y: number } | null>(null);

  // Left Touch Zone (Movement Joystick)
  const handleLeftTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (leftTouchId.current !== null) return;
    const touch = e.changedTouches[0];
    leftTouchId.current = touch.identifier;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    setJoystickBase({ x, y });
    setJoystickThumb({ x, y });
    setJoystickActive(true);
  };

  const handleLeftTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (leftTouchId.current === null || !joystickBase || !engine) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === leftTouchId.current) {
        const rect = e.currentTarget.getBoundingClientRect();
        const currentX = touch.clientX - rect.left;
        const currentY = touch.clientY - rect.top;

        const maxDist = 48;
        const dx = currentX - joystickBase.x;
        const dy = currentY - joystickBase.y;
        const dist = Math.hypot(dx, dy);

        let clampedX = dx;
        let clampedY = dy;
        if (dist > maxDist) {
          clampedX = (dx / dist) * maxDist;
          clampedY = (dy / dist) * maxDist;
        }

        setJoystickThumb({
          x: joystickBase.x + clampedX,
          y: joystickBase.y + clampedY,
        });

        engine.touchMove.x = clampedX / maxDist;
        engine.touchMove.y = clampedY / maxDist;
        break;
      }
    }
  };

  const handleLeftTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === leftTouchId.current) {
        leftTouchId.current = null;
        setJoystickActive(false);
        setJoystickBase(null);
        setJoystickThumb(null);
        if (engine) {
          engine.touchMove.x = 0;
          engine.touchMove.y = 0;
        }
        break;
      }
    }
  };

  // Right Touch Zone (Aiming / Look Around)
  const handleRightTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (rightTouchId.current !== null) return;
    const touch = e.changedTouches[0];
    rightTouchId.current = touch.identifier;
    lastTouchLook.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleRightTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (rightTouchId.current === null || !lastTouchLook.current || !engine) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === rightTouchId.current) {
        const dx = touch.clientX - lastTouchLook.current.x;
        const dy = touch.clientY - lastTouchLook.current.y;

        const sensitivity = engine.settings.touchSensitivity;
        engine.handleLook(dx * sensitivity, dy * sensitivity);

        lastTouchLook.current = { x: touch.clientX, y: touch.clientY };
        break;
      }
    }
  };

  const handleRightTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === rightTouchId.current) {
        rightTouchId.current = null;
        lastTouchLook.current = null;
        break;
      }
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20">
      {/* LEFT HALF: Joystick Touch Zone */}
      <div
        className="absolute top-0 bottom-0 left-0 w-1/2 pointer-events-auto touch-none"
        onTouchStart={handleLeftTouchStart}
        onTouchMove={handleLeftTouchMove}
        onTouchEnd={handleLeftTouchEnd}
        onTouchCancel={handleLeftTouchEnd}
      >
        {joystickActive && joystickBase && joystickThumb && (
          <div
            className="absolute rounded-none border border-[#38bdf8]/40 bg-[#18181b]/70 backdrop-blur-sm -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              left: `${joystickBase.x}px`,
              top: `${joystickBase.y}px`,
              width: '100px',
              height: '100px',
            }}
          >
            {/* Center crosshair */}
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <div className="w-full h-px bg-[#38bdf8]" />
              <div className="h-full w-px bg-[#38bdf8] absolute" />
            </div>

            {/* Inner Thumbstick */}
            <div
              className="absolute w-10 h-10 bg-[#38bdf8] border border-white -translate-x-1/2 -translate-y-1/2 shadow-lg shadow-cyan-500/50"
              style={{
                left: `${joystickThumb.x - joystickBase.x + 50}px`,
                top: `${joystickThumb.y - joystickBase.y + 50}px`,
              }}
            />
          </div>
        )}

        {!joystickActive && (
          <div className="absolute bottom-20 left-6 flex items-center gap-2 px-3 py-1.5 bg-[#18181b]/80 border border-[#e4e4e7]/15 text-[#e4e4e7]/60 text-[10px] font-mono pointer-events-none">
            <span className="w-1.5 h-1.5 bg-[#38bdf8] animate-pulse" />
            DRAG LEFT // MOVE
          </div>
        )}
      </div>

      {/* RIGHT HALF: Aim Look Zone */}
      <div
        className="absolute top-0 bottom-0 right-0 w-1/2 pointer-events-auto touch-none"
        onTouchStart={handleRightTouchStart}
        onTouchMove={handleRightTouchMove}
        onTouchEnd={handleRightTouchEnd}
        onTouchCancel={handleRightTouchEnd}
      />

      {/* ACTION BUTTONS (Right Side Overlay) */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 pointer-events-auto">
        {/* Weapon Switch Pills */}
        <div className="flex items-center gap-1.5 mb-1">
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              onSelectWeapon('rifle');
            }}
            className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase border transition-all ${
              currentWeapon === 'rifle'
                ? 'bg-[#38bdf8] text-[#0a0a0c] border-[#38bdf8]'
                : 'bg-[#18181b]/90 text-[#e4e4e7] border-[#e4e4e7]/15'
            }`}
          >
            1 // Rifle
          </button>
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              onSelectWeapon('shotgun');
            }}
            className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase border transition-all ${
              currentWeapon === 'shotgun'
                ? 'bg-[#38bdf8] text-[#0a0a0c] border-[#38bdf8]'
                : 'bg-[#18181b]/90 text-[#e4e4e7] border-[#e4e4e7]/15'
            }`}
          >
            2 // Scatter
          </button>
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              onSelectWeapon('sniper');
            }}
            className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase border transition-all ${
              currentWeapon === 'sniper'
                ? 'bg-[#38bdf8] text-[#0a0a0c] border-[#38bdf8]'
                : 'bg-[#18181b]/90 text-[#e4e4e7] border-[#e4e4e7]/15'
            }`}
          >
            3 // Hyperion
          </button>
        </div>

        {/* Secondary Action Row: Sprint, Reload, Jump */}
        <div className="flex items-center gap-2.5">
          {/* Sprint Toggle */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              onToggleSprint();
            }}
            className={`w-12 h-12 flex items-center justify-center border transition-transform active:scale-95 ${
              isSprinting
                ? 'bg-[#38bdf8] text-[#0a0a0c] border-[#38bdf8]'
                : 'bg-[#18181b]/90 text-[#38bdf8] border-[#e4e4e7]/15'
            }`}
            title="Sprint"
          >
            <Gauge className="w-5 h-5" />
          </button>

          {/* Reload Button */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              engine?.reload();
            }}
            className="w-12 h-12 bg-[#18181b]/90 border border-[#e4e4e7]/15 flex items-center justify-center text-[#fbbf24] transition-transform active:scale-95"
            title="Reload"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {/* Jump Button */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              engine?.jump();
            }}
            className="w-12 h-12 bg-[#18181b]/90 border border-[#e4e4e7]/20 flex items-center justify-center text-white transition-transform active:scale-95"
            title="Jump"
          >
            <ArrowUp className="w-6 h-6" />
          </button>
        </div>

        {/* Primary Shoot / Fire Button */}
        <button
          onTouchStart={(e) => {
            e.stopPropagation();
            if (engine) {
              engine.isTouchFiring = true;
              engine.shoot();
            }
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            if (engine) {
              engine.isTouchFiring = false;
            }
          }}
          onTouchCancel={(e) => {
            e.stopPropagation();
            if (engine) {
              engine.isTouchFiring = false;
            }
          }}
          className="w-20 h-20 bg-[#ef4444] border-2 border-white flex items-center justify-center text-white shadow-xl shadow-red-950/60 active:scale-90 transition-transform mt-1 cursor-pointer"
          title="Fire Weapon"
        >
          <Crosshair className="w-9 h-9" />
        </button>
      </div>
    </div>
  );
};
