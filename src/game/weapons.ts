import * as THREE from 'three';
import { Weapon, WeaponType } from '../types/game';

export const INITIAL_WEAPONS: Record<WeaponType, Weapon> = {
  rifle: {
    id: 'rifle',
    name: 'Pulse Rifle ARC-9',
    category: 'Assault Rifle',
    damage: 28,
    fireRate: 110, // ~540 RPM
    magSize: 30,
    currentMag: 30,
    reserveAmmo: 150,
    maxReserve: 240,
    reloadTime: 1400,
    spread: 0.02,
    range: 120,
    bulletSpeed: 140,
    color: '#38bdf8',
    recoil: 0.035,
  },
  shotgun: {
    id: 'shotgun',
    name: 'Scatter V-12',
    category: 'Plasma Shotgun',
    damage: 18, // per pellet (x7 pellets = 126 max)
    fireRate: 650,
    magSize: 8,
    currentMag: 8,
    reserveAmmo: 40,
    maxReserve: 64,
    reloadTime: 1800,
    spread: 0.085,
    range: 45,
    bulletSpeed: 110,
    color: '#f97316',
    recoil: 0.08,
  },
  sniper: {
    id: 'sniper',
    name: 'Hyperion Beam',
    category: 'Rail Sniper',
    damage: 120,
    fireRate: 1100,
    magSize: 5,
    currentMag: 5,
    reserveAmmo: 25,
    maxReserve: 35,
    reloadTime: 2200,
    spread: 0.002,
    range: 200,
    bulletSpeed: 250,
    color: '#a855f7',
    recoil: 0.12,
  },
};

/**
 * Creates a procedural 3D weapon viewmodel attached to the camera.
 */
export function createWeaponMesh(type: WeaponType): THREE.Group {
  const group = new THREE.Group();

  if (type === 'rifle') {
    // Main receiver
    const bodyGeo = new THREE.BoxGeometry(0.08, 0.12, 0.45);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Barrel
    const barrelGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.28, 12);
    barrelGeo.rotateX(Math.PI / 2);
    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.15,
    });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.position.set(0, 0.015, -0.32);
    group.add(barrel);

    // Glowing energy strip
    const stripGeo = new THREE.BoxGeometry(0.084, 0.015, 0.3);
    const stripMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.set(0, 0.05, -0.05);
    group.add(strip);

    // Magazine
    const magGeo = new THREE.BoxGeometry(0.06, 0.18, 0.09);
    const magMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.4 });
    const mag = new THREE.Mesh(magGeo, magMat);
    mag.position.set(0, -0.12, -0.02);
    mag.rotation.x = 0.2;
    group.add(mag);

    // Scope / Optic
    const scopeGeo = new THREE.BoxGeometry(0.04, 0.04, 0.12);
    const scopeMat = new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.9, roughness: 0.1 });
    const scope = new THREE.Mesh(scopeGeo, scopeMat);
    scope.position.set(0, 0.08, -0.04);
    group.add(scope);

    // Scope lens
    const lensGeo = new THREE.CircleGeometry(0.016, 12);
    const lensMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(0, 0.08, 0.021);
    group.add(lens);

  } else if (type === 'shotgun') {
    // Heavy stocky body
    const bodyGeo = new THREE.BoxGeometry(0.12, 0.14, 0.42);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      metalness: 0.8,
      roughness: 0.35,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Double heavy barrels
    const bGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.26, 12);
    bGeo.rotateX(Math.PI / 2);
    const bMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.95, roughness: 0.1 });

    const barrel1 = new THREE.Mesh(bGeo, bMat);
    barrel1.position.set(-0.03, 0.02, -0.3);
    group.add(barrel1);

    const barrel2 = new THREE.Mesh(bGeo, bMat);
    barrel2.position.set(0.03, 0.02, -0.3);
    group.add(barrel2);

    // Heat vents (orange glow)
    const ventGeo = new THREE.BoxGeometry(0.125, 0.02, 0.18);
    const ventMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const vent = new THREE.Mesh(ventGeo, ventMat);
    vent.position.set(0, 0.04, -0.08);
    group.add(vent);

    // Pump slide
    const pumpGeo = new THREE.BoxGeometry(0.13, 0.08, 0.14);
    const pumpMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5, roughness: 0.6 });
    const pump = new THREE.Mesh(pumpGeo, pumpMat);
    pump.position.set(0, -0.04, -0.22);
    group.add(pump);

  } else if (type === 'sniper') {
    // Long high-tech chassis
    const bodyGeo = new THREE.BoxGeometry(0.07, 0.11, 0.6);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.9,
      roughness: 0.2,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Extra long accelerator barrel
    const bGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.5, 12);
    bGeo.rotateX(Math.PI / 2);
    const bMat = new THREE.MeshStandardMaterial({ color: 0x030712, metalness: 0.95, roughness: 0.1 });
    const barrel = new THREE.Mesh(bGeo, bMat);
    barrel.position.set(0, 0.02, -0.48);
    group.add(barrel);

    // Glowing coil rings along barrel
    for (let i = 0; i < 4; i++) {
      const ringGeo = new THREE.TorusGeometry(0.026, 0.006, 8, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(0, 0.02, -0.32 - i * 0.09);
      group.add(ring);
    }

    // High magnification sniper scope
    const scopeTube = new THREE.CylinderGeometry(0.026, 0.028, 0.22, 12);
    scopeTube.rotateX(Math.PI / 2);
    const scopeMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8, roughness: 0.3 });
    const scope = new THREE.Mesh(scopeTube, scopeMat);
    scope.position.set(0, 0.1, -0.05);
    group.add(scope);

    // Purple illuminated lens
    const lensGeo = new THREE.CircleGeometry(0.023, 12);
    const lensMat = new THREE.MeshBasicMaterial({ color: 0xc084fc });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(0, 0.1, 0.061);
    group.add(lens);
  }

  // Common Muzzle Flash Sprite / geometry
  const flashGeo = new THREE.OctahedronGeometry(0.08, 0);
  const flashMat = new THREE.MeshBasicMaterial({
    color: type === 'rifle' ? 0x67e8f9 : type === 'shotgun' ? 0xfdba74 : 0xe879f9,
    transparent: true,
    opacity: 0,
  });
  const muzzleFlash = new THREE.Mesh(flashGeo, flashMat);
  muzzleFlash.name = 'muzzleFlash';
  muzzleFlash.position.set(0, 0.02, type === 'sniper' ? -0.74 : type === 'shotgun' ? -0.45 : -0.48);
  group.add(muzzleFlash);

  // Position relative to FPS camera
  group.position.set(0.24, -0.22, -0.45);
  group.scale.set(0.9, 0.9, 0.9);

  return group;
}
