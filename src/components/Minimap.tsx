import React, { useEffect, useRef } from 'react';

interface MinimapProps {
  playerPos: { x: number; z: number; yaw: number };
  enemyPositions: { x: number; z: number; type: string }[];
}

export const Minimap: React.FC<MinimapProps> = ({ playerPos, enemyPositions }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const center = w / 2;
    const scale = w / 95;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Dark grid background
    ctx.fillStyle = '#111114';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(228, 228, 231, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 22) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 22) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Circular radar range rings
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    [center * 0.45, center * 0.85].forEach((r) => {
      ctx.beginPath();
      ctx.arc(center, center, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Arena boundary square
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.strokeRect(center - 42 * scale, center - 42 * scale, 84 * scale, 84 * scale);

    // Central core monument
    ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.fillRect(center - 3.5 * scale, center - 3.5 * scale, 7 * scale, 7 * scale);

    // Enemies
    enemyPositions.forEach((enemy) => {
      const ex = center + enemy.x * scale;
      const ey = center + enemy.z * scale;

      ctx.fillStyle = enemy.type === 'enforcer' ? '#ef4444' : enemy.type === 'stalker' ? '#f59e0b' : '#f43f5e';
      ctx.beginPath();
      ctx.arc(ex, ey, enemy.type === 'enforcer' ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();

      // Enemy radar ring
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.beginPath();
      ctx.arc(ex, ey, 5.5, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Player position & field of view cone
    const px = center + playerPos.x * scale;
    const py = center + playerPos.z * scale;

    ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.beginPath();
    ctx.moveTo(px, py);
    const viewAngle = 0.55;
    const coneDist = 20;
    ctx.arc(px, py, coneDist, -playerPos.yaw - Math.PI / 2 - viewAngle, -playerPos.yaw - Math.PI / 2 + viewAngle);
    ctx.closePath();
    ctx.fill();

    // Player blip
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [playerPos, enemyPositions]);

  return (
    <div className="w-[140px] h-[140px] bg-[#18181b] border border-[#e4e4e7]/15 p-2 flex flex-col justify-between select-none">
      <div className="flex items-center justify-between text-[9px] font-mono tracking-widest text-[#e4e4e7]/70 uppercase">
        <span>Radar // Ops</span>
        <span className="w-1.5 h-1.5 bg-[#38bdf8] animate-ping inline-block" />
      </div>
      <div className="w-full flex-1 mt-1 border border-[#e4e4e7]/10 overflow-hidden">
        <canvas ref={canvasRef} width={122} height={102} className="block w-full h-full" />
      </div>
    </div>
  );
};
