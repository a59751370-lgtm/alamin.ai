import * as THREE from 'three';

export type WeaponType = 'rifle' | 'shotgun' | 'sniper';

export interface Weapon {
  id: WeaponType;
  name: string;
  category: string;
  damage: number;
  fireRate: number; // ms between shots
  magSize: number;
  currentMag: number;
  reserveAmmo: number;
  maxReserve: number;
  reloadTime: number; // ms
  spread: number;
  range: number;
  bulletSpeed: number;
  color: string;
  recoil: number;
}

export type EnemyType = 'drone' | 'enforcer' | 'stalker';

export interface Enemy {
  id: string;
  type: EnemyType;
  name: string;
  mesh: THREE.Group;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  attackRange: number;
  attackCooldown: number;
  lastAttackTime: number;
  state: 'idle' | 'chase' | 'attack' | 'flinch' | 'dead';
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  targetPosition: THREE.Vector3;
  scoreValue: number;
  flinchTimer: number;
  patrolAngle: number;
}

export interface Pickup {
  id: string;
  type: 'health' | 'armor' | 'ammo';
  mesh: THREE.Group;
  position: THREE.Vector3;
  value: number;
  collected: boolean;
}

export interface Bullet {
  id: string;
  startPos: THREE.Vector3;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  damage: number;
  isPlayerBullet: boolean;
  distanceTraveled: number;
  maxDistance: number;
  color: string;
  mesh: THREE.Mesh;
}

export interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  color: string;
}

export interface DamageNumber {
  id: string;
  value: number;
  x: number;
  y: number;
  opacity: number;
  isCrit: boolean;
}

export interface GameSettings {
  mouseSensitivity: number;
  touchSensitivity: number;
  soundVolume: number;
  musicVolume: number;
  musicEnabled: boolean;
  musicTrack: 'cyber_assault' | 'dark_drone' | 'synth_wave';
  touchControlsEnabled: boolean;
  invertY: boolean;
  quality: 'low' | 'medium' | 'high';
  aimAssist: boolean;
  crosshairColor: string;
}

export interface GameStats {
  score: number;
  kills: number;
  headshots: number;
  wave: number;
  shotsFired: number;
  shotsHit: number;
  timeSurvived: number;
}
