import * as THREE from 'three';
import { Pickup } from '../types/game';

export function createPickupMesh(type: 'health' | 'armor' | 'ammo'): THREE.Group {
  const group = new THREE.Group();

  if (type === 'health') {
    // Green floating medkit with cross
    const boxGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      metalness: 0.4,
      roughness: 0.2,
      emissive: 0x059669,
      emissiveIntensity: 0.4,
    });
    const box = new THREE.Mesh(boxGeo, boxMat);
    group.add(box);

    // Cross shape
    const cross1Geo = new THREE.BoxGeometry(0.72, 0.45, 0.16);
    const crossMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const cross1 = new THREE.Mesh(cross1Geo, crossMat);
    group.add(cross1);

    const cross2Geo = new THREE.BoxGeometry(0.72, 0.16, 0.45);
    const cross2 = new THREE.Mesh(cross2Geo, crossMat);
    group.add(cross2);
  } else if (type === 'armor') {
    // Blue glowing cyber core
    const coreGeo = new THREE.OctahedronGeometry(0.5, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    const ringGeo = new THREE.TorusGeometry(0.65, 0.05, 8, 20);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 3;
    group.add(ring);
  } else if (type === 'ammo') {
    // Golden ammo crate
    const crateGeo = new THREE.BoxGeometry(0.8, 0.5, 0.5);
    const crateMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.7,
      roughness: 0.3,
      emissive: 0xd97706,
      emissiveIntensity: 0.3,
    });
    const crate = new THREE.Mesh(crateGeo, crateMat);
    group.add(crate);

    // Ammo cartridge icons
    const bulletGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.35, 8);
    bulletGeo.rotateZ(Math.PI / 2);
    const bulletMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const b1 = new THREE.Mesh(bulletGeo, bulletMat);
    b1.position.set(0, 0.28, -0.12);
    group.add(b1);

    const b2 = new THREE.Mesh(bulletGeo, bulletMat);
    b2.position.set(0, 0.28, 0.12);
    group.add(b2);
  }

  // Soft glow light
  const light = new THREE.PointLight(
    type === 'health' ? 0x10b981 : type === 'armor' ? 0x38bdf8 : 0xf59e0b,
    1.2,
    5
  );
  light.position.set(0, 0.2, 0);
  group.add(light);

  return group;
}

export function spawnPickup(type: 'health' | 'armor' | 'ammo', pos: THREE.Vector3): Pickup {
  const mesh = createPickupMesh(type);
  mesh.position.copy(pos);

  let value = 35;
  if (type === 'health') value = 40;
  if (type === 'armor') value = 30;
  if (type === 'ammo') value = 1; // triggers full clip or high ammo refill

  return {
    id: 'pickup_' + Math.random().toString(36).substring(2, 9),
    type,
    mesh,
    position: mesh.position,
    value,
    collected: false,
  };
}

export function updatePickups(pickups: Pickup[], delta: number, now: number) {
  pickups.forEach((p) => {
    if (p.collected) return;
    p.mesh.rotation.y += delta * 1.5;
    p.mesh.position.y = p.position.y + Math.sin(now * 0.003 + p.position.x) * 0.15;
  });
}
