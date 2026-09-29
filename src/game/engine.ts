import * as THREE from 'three';
import {
  Enemy,
  EnemyType,
  GameSettings,
  GameStats,
  Pickup,
  Weapon,
  WeaponType,
} from '../types/game';
import { sound } from './audio';
import { spawnEnemy, updateEnemyAI } from './enemies';
import { buildArena, BuiltMap, MapObstacle } from './mapBuilder';
import { ParticleSystem } from './particles';
import { spawnPickup, updatePickups } from './pickups';
import { createWeaponMesh, INITIAL_WEAPONS } from './weapons';

export class GameEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private particleSystem: ParticleSystem;
  private clock: THREE.Clock;

  // Map & World
  private mapData!: BuiltMap;
  private enemies: Enemy[] = [];
  private pickups: Pickup[] = [];

  // Player State
  public playerPos: THREE.Vector3 = new THREE.Vector3(0, 1.7, 20);
  public playerVelocity: THREE.Vector3 = new THREE.Vector3();
  public pitch: number = 0; // vertical look
  public yaw: number = 0;   // horizontal look
  public isGrounded: boolean = true;
  public isSprinting: boolean = false;
  public isADS: boolean = false;
  public health: number = 100;
  public maxHealth: number = 100;
  public armor: number = 50;
  public maxArmor: number = 50;

  // Weapons & Inventory
  public weapons: Record<WeaponType, Weapon>;
  public currentWeaponType: WeaponType = 'rifle';
  public weaponMeshGroup: THREE.Group = new THREE.Group();
  public isReloading: boolean = false;
  public reloadEndTime: number = 0;
  public lastShotTime: number = 0;
  private isMouseDown: boolean = false;

  // Viewmodel dynamics
  private bobTimer: number = 0;
  private recoilPitch: number = 0;
  private recoilOffset: number = 0;

  // Game Progress
  public stats: GameStats = {
    score: 0,
    kills: 0,
    headshots: 0,
    wave: 1,
    shotsFired: 0,
    shotsHit: 0,
    timeSurvived: 0,
  };
  public isGameOver: boolean = false;
  public isPaused: boolean = false;

  // Wave Manager
  private waveEnemiesToSpawn: number = 4;
  private waveEnemiesSpawned: number = 0;
  private lastEnemySpawnTime: number = 0;

  // Settings & Inputs
  public settings: GameSettings = {
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
  };

  private keys: Record<string, boolean> = {};
  public touchMove: { x: number; y: number } = { x: 0, y: 0 };
  public isTouchFiring: boolean = false;

  // Callbacks to UI
  public onStateUpdate?: (data: {
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
  }) => void;
  public onHitMarker?: () => void;
  public onPlayerDamage?: () => void;
  public onGameOverCallback?: (stats: GameStats) => void;
  public onWaveComplete?: (wave: number) => void;

  private animationFrameId: number = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();

    // Clone initial weapons
    this.weapons = JSON.parse(JSON.stringify(INITIAL_WEAPONS));

    // Three.js Scene Setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      300
    );
    this.camera.position.copy(this.playerPos);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    container.appendChild(this.renderer.domElement);

    this.particleSystem = new ParticleSystem(this.scene);

    // Camera Weapon holder
    this.camera.add(this.weaponMeshGroup);
    this.scene.add(this.camera);

    this.initMap();
    this.equipWeapon(this.currentWeaponType);
    this.setupListeners();
    this.startWave(1);

    // Start background sci-fi ambiance
    sound.startAmbient();

    // Start Animation Loop
    this.animate = this.animate.bind(this);
    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  private initMap() {
    this.mapData = buildArena(this.scene);

    // Spawn initial pickups
    this.mapData.pickupSpawns.forEach((p) => {
      const pickup = spawnPickup(p.type, p.position);
      this.pickups.push(pickup);
      this.scene.add(pickup.mesh);
    });
  }

  public equipWeapon(type: WeaponType) {
    this.currentWeaponType = type;

    // Clear old weapon viewmodel
    while (this.weaponMeshGroup.children.length > 0) {
      const child = this.weaponMeshGroup.children[0];
      this.weaponMeshGroup.remove(child);
    }

    const mesh = createWeaponMesh(type);
    this.weaponMeshGroup.add(mesh);
    this.isReloading = false;
  }

  public setTouchControlsEnabled(enabled: boolean) {
    this.settings.touchControlsEnabled = enabled;
  }

  private setupListeners() {
    // Keyboard listeners
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (e.code === 'KeyR') {
        this.reload();
      } else if (e.code === 'Digit1') {
        this.equipWeapon('rifle');
      } else if (e.code === 'Digit2') {
        this.equipWeapon('shotgun');
      } else if (e.code === 'Digit3') {
        this.equipWeapon('sniper');
      } else if (e.code === 'Space') {
        this.jump();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Pointer lock & Mouse Look
    const canvas = this.renderer.domElement;

    canvas.addEventListener('click', () => {
      if (!this.settings.touchControlsEnabled && !document.pointerLockElement) {
        canvas.requestPointerLock();
      }
    });

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isMouseDown = true;
        this.shoot();
      } else if (e.button === 2) {
        this.isADS = true;
      }
    });

    canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isMouseDown = false;
      } else if (e.button === 2) {
        this.isADS = false;
      }
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === canvas) {
        this.handleLook(e.movementX * this.settings.mouseSensitivity, e.movementY * this.settings.mouseSensitivity);
      }
    });

    // Window Resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  public handleLook(deltaX: number, deltaY: number) {
    this.yaw -= deltaX;
    const effectiveDeltaY = this.settings.invertY ? -deltaY : deltaY;
    this.pitch -= effectiveDeltaY;

    // Clamp pitch between -85 deg and +85 deg
    const maxPitch = Math.PI / 2 - 0.08;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
  }

  public jump() {
    if (this.isGrounded) {
      this.playerVelocity.y = 7.8;
      this.isGrounded = false;
      sound.playJump();
    }
  }

  public reload() {
    const weapon = this.weapons[this.currentWeaponType];
    if (this.isReloading || weapon.currentMag >= weapon.magSize || weapon.reserveAmmo <= 0) {
      return;
    }

    this.isReloading = true;
    this.reloadEndTime = performance.now() + weapon.reloadTime;
    sound.playReload();
  }

  public shoot() {
    if (this.isGameOver || this.isPaused) return;

    const weapon = this.weapons[this.currentWeaponType];
    const now = performance.now();

    if (this.isReloading) return;

    if (weapon.currentMag <= 0) {
      this.reload();
      return;
    }

    if (now - this.lastShotTime < weapon.fireRate) {
      return;
    }

    this.lastShotTime = now;
    weapon.currentMag--;
    this.stats.shotsFired++;

    // Audio
    sound.playShoot(weapon.id);

    // Recoil Kick
    this.recoilPitch = weapon.recoil;
    this.recoilOffset = weapon.recoil * 0.4;

    // Muzzle Flash
    const muzzle = this.weaponMeshGroup.getObjectByName('muzzleFlash') as THREE.Mesh;
    if (muzzle) {
      (muzzle.material as THREE.MeshBasicMaterial).opacity = 0.9;
      setTimeout(() => {
        if (muzzle && muzzle.material) {
          (muzzle.material as THREE.MeshBasicMaterial).opacity = 0;
        }
      }, 55);
    }

    // Direction vector from camera
    const spreadAmount = this.isADS ? weapon.spread * 0.35 : weapon.spread;

    const pellets = weapon.id === 'shotgun' ? 7 : 1;
    for (let i = 0; i < pellets; i++) {
      const dir = new THREE.Vector3(0, 0, -1);
      dir.applyEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));

      // Apply random spread
      dir.x += (Math.random() - 0.5) * spreadAmount;
      dir.y += (Math.random() - 0.5) * spreadAmount;
      dir.z += (Math.random() - 0.5) * spreadAmount;
      dir.normalize();

      // Gun muzzle world position
      const shootOrigin = this.camera.position.clone().add(new THREE.Vector3(0.18, -0.15, -0.3).applyEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ')));

      this.particleSystem.addBullet(
        shootOrigin,
        dir,
        weapon.bulletSpeed,
        weapon.damage,
        true,
        weapon.color
      );
    }

    // Auto reload when empty
    if (weapon.currentMag <= 0) {
      this.reload();
    }
  }

  public startWave(waveNum: number) {
    this.stats.wave = waveNum;
    this.waveEnemiesToSpawn = 3 + waveNum * 2;
    this.waveEnemiesSpawned = 0;
    this.lastEnemySpawnTime = 0;
  }

  private spawnWaveEnemy() {
    if (this.waveEnemiesSpawned >= this.waveEnemiesToSpawn) return;

    const spawns = this.mapData.enemySpawns;
    const spawnPos = spawns[Math.floor(Math.random() * spawns.length)].clone();

    // Variety based on wave
    let type: EnemyType = 'drone';
    const rand = Math.random();
    if (this.stats.wave >= 2 && rand > 0.6) {
      type = 'stalker';
    }
    if (this.stats.wave >= 3 && rand > 0.75) {
      type = 'enforcer';
    }

    const enemy = spawnEnemy(type, spawnPos, this.stats.wave);
    this.enemies.push(enemy);
    this.scene.add(enemy.mesh);
    this.waveEnemiesSpawned++;
  }

  private handleEnemyAttack(enemy: Enemy) {
    sound.playEnemyShoot();

    // Shoot plasma projectile towards player
    const startPos = enemy.mesh.position.clone();
    startPos.y += enemy.type === 'drone' ? 0 : 1.3;

    const dir = new THREE.Vector3().subVectors(this.camera.position, startPos).normalize();
    // Some spread
    dir.x += (Math.random() - 0.5) * 0.08;
    dir.y += (Math.random() - 0.5) * 0.08;
    dir.z += (Math.random() - 0.5) * 0.08;
    dir.normalize();

    this.particleSystem.addBullet(
      startPos,
      dir,
      45,
      enemy.damage,
      false,
      0xf43f5e
    );
  }

  public takePlayerDamage(amount: number) {
    if (this.isGameOver) return;

    // Armor absorbs 65% of damage
    if (this.armor > 0) {
      const armorAbsorb = Math.min(this.armor, amount * 0.65);
      this.armor -= armorAbsorb;
      const leftover = amount - armorAbsorb;
      this.health = Math.max(0, this.health - leftover);
    } else {
      this.health = Math.max(0, this.health - amount);
    }

    sound.playPlayerHurt();
    this.onPlayerDamage?.();

    if (this.health <= 0) {
      this.gameOver();
    }
  }

  private gameOver() {
    this.isGameOver = true;
    document.exitPointerLock?.();
    this.onGameOverCallback?.(this.stats);
  }

  public restartGame() {
    // Reset player
    this.playerPos.set(0, 1.7, 20);
    this.playerVelocity.set(0, 0, 0);
    this.health = 100;
    this.armor = 50;
    this.pitch = 0;
    this.yaw = 0;
    this.isGameOver = false;

    // Reset weapons
    this.weapons = JSON.parse(JSON.stringify(INITIAL_WEAPONS));
    this.equipWeapon('rifle');

    // Clear enemies
    this.enemies.forEach((e) => {
      this.scene.remove(e.mesh);
    });
    this.enemies = [];

    // Clear particles
    this.particleSystem.clear();

    // Reset stats
    this.stats = {
      score: 0,
      kills: 0,
      headshots: 0,
      wave: 1,
      shotsFired: 0,
      shotsHit: 0,
      timeSurvived: 0,
    };

    this.startWave(1);
  }

  private animate() {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const now = performance.now();

    if (this.isPaused) return;

    if (!this.isGameOver) {
      this.stats.timeSurvived += delta;
      this.updatePlayerMovement(delta);
      this.updateWeaponAnimation(delta, now);
      this.updateContinuousFiring();
    }

    // Reactor Core rotation
    if (this.mapData.reactorCoreMesh) {
      this.mapData.reactorCoreMesh.rotation.y += delta * 0.6;
      this.mapData.reactorCoreMesh.rotation.x += delta * 0.3;
    }

    // Wave Spawning
    if (!this.isGameOver && this.waveEnemiesSpawned < this.waveEnemiesToSpawn) {
      if (now - this.lastEnemySpawnTime > 1600) {
        this.spawnWaveEnemy();
        this.lastEnemySpawnTime = now;
      }
    }

    // Check Wave Completion
    if (
      !this.isGameOver &&
      this.waveEnemiesSpawned >= this.waveEnemiesToSpawn &&
      this.enemies.length === 0
    ) {
      // Wave Cleared!
      const nextWave = this.stats.wave + 1;
      this.stats.score += 500 * this.stats.wave;
      this.health = Math.min(this.maxHealth, this.health + 30);
      this.armor = Math.min(this.maxArmor, this.armor + 25);
      this.onWaveComplete?.(nextWave);
      this.startWave(nextWave);
    }

    // Update Enemies AI
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      updateEnemyAI(
        enemy,
        this.playerPos,
        delta,
        now,
        this.mapData.obstacles,
        this.handleEnemyAttack.bind(this)
      );

      // Remove dead
      if (enemy.health <= 0) {
        this.particleSystem.createExplosion(enemy.mesh.position.clone(), 30);
        sound.playExplosion();
        this.stats.kills++;
        this.stats.score += enemy.scoreValue;

        // Drop pickup chance
        if (Math.random() < 0.4) {
          const dropType = Math.random() < 0.5 ? 'health' : 'ammo';
          const drop = spawnPickup(dropType, enemy.mesh.position.clone().add(new THREE.Vector3(0, 0.5, 0)));
          this.pickups.push(drop);
          this.scene.add(drop.mesh);
        }

        this.scene.remove(enemy.mesh);
        this.enemies.splice(i, 1);
      }
    }

    // Update Pickups
    updatePickups(this.pickups, delta, now);
    this.checkPickupCollisions();

    // Update Bullets & Collisions
    this.updateCombatProjectiles(delta);

    // Send State to UI
    this.notifyUI();

    // Render Scene
    this.renderer.render(this.scene, this.camera);
  }

  private updatePlayerMovement(delta: number) {
    this.isSprinting = !!(this.keys['ShiftLeft'] || this.keys['ShiftRight']);
    const speed = this.isSprinting ? 9.5 : 5.8;

    // Movement direction from WASD + Touch
    const inputDir = new THREE.Vector2();

    if (this.keys['KeyW'] || this.keys['ArrowUp']) inputDir.y -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) inputDir.y += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) inputDir.x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) inputDir.x += 1;

    // Incorporate touch joystick
    if (this.settings.touchControlsEnabled) {
      inputDir.x += this.touchMove.x;
      inputDir.y += this.touchMove.y;
    }

    if (inputDir.length() > 1) {
      inputDir.normalize();
    }

    // Translate to 3D movement vector based on camera Yaw
    const moveX = inputDir.x * Math.cos(this.yaw) + inputDir.y * Math.sin(this.yaw);
    const moveZ = -inputDir.x * Math.sin(this.yaw) + inputDir.y * Math.cos(this.yaw);

    // Smooth horizontal velocity
    this.playerVelocity.x = THREE.MathUtils.lerp(this.playerVelocity.x, moveX * speed, 12 * delta);
    this.playerVelocity.z = THREE.MathUtils.lerp(this.playerVelocity.z, moveZ * speed, 12 * delta);

    // Gravity
    this.playerVelocity.y -= 22 * delta;

    // Proposed new position
    const nextPos = this.playerPos.clone();
    nextPos.x += this.playerVelocity.x * delta;
    nextPos.z += this.playerVelocity.z * delta;
    nextPos.y += this.playerVelocity.y * delta;

    // Floor collision
    const FLOOR_Y = 1.7;
    if (nextPos.y <= FLOOR_Y) {
      nextPos.y = FLOOR_Y;
      this.playerVelocity.y = 0;
      this.isGrounded = true;
    }

    // Obstacle Collisions (AABB sliding)
    const playerRadius = 0.55;
    for (const obs of this.mapData.obstacles) {
      const box = obs.box;
      // Horizontal collision check
      const clampedX = Math.max(box.min.x, Math.min(nextPos.x, box.max.x));
      const clampedZ = Math.max(box.min.z, Math.min(nextPos.z, box.max.z));

      const dx = nextPos.x - clampedX;
      const dz = nextPos.z - clampedZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < playerRadius * playerRadius && nextPos.y < box.max.y + 0.3) {
        // Resolve push-back along axis of penetration
        if (Math.abs(dx) > Math.abs(dz)) {
          nextPos.x = clampedX + (dx > 0 ? playerRadius : -playerRadius);
        } else {
          nextPos.z = clampedZ + (dz > 0 ? playerRadius : -playerRadius);
        }
      }
    }

    // Boundary Wall Clamp (-41 to 41)
    nextPos.x = Math.max(-41, Math.min(41, nextPos.x));
    nextPos.z = Math.max(-41, Math.min(41, nextPos.z));

    this.playerPos.copy(nextPos);
    this.camera.position.copy(this.playerPos);

    // Dynamic FOV for Sprint & ADS
    const targetFOV = this.isADS ? 52 : this.isSprinting ? 82 : 75;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFOV, 10 * delta);
    this.camera.updateProjectionMatrix();

    // Camera Orientation
    const currentPitch = this.pitch + this.recoilPitch;
    this.camera.rotation.set(currentPitch, this.yaw, 0, 'YXZ');
  }

  private updateWeaponAnimation(delta: number, now: number) {
    // Reload state check
    if (this.isReloading && now >= this.reloadEndTime) {
      const weapon = this.weapons[this.currentWeaponType];
      const needed = weapon.magSize - weapon.currentMag;
      const available = Math.min(needed, weapon.reserveAmmo);
      weapon.currentMag += available;
      weapon.reserveAmmo -= available;
      this.isReloading = false;
    }

    // Recoil recovery
    this.recoilPitch = THREE.MathUtils.lerp(this.recoilPitch, 0, 16 * delta);
    this.recoilOffset = THREE.MathUtils.lerp(this.recoilOffset, 0, 14 * delta);

    // Walking Bobbing
    const horizontalSpeed = Math.hypot(this.playerVelocity.x, this.playerVelocity.z);
    if (horizontalSpeed > 0.4 && this.isGrounded) {
      this.bobTimer += delta * (this.isSprinting ? 14 : 9);
    }

    const bobX = Math.cos(this.bobTimer) * 0.015;
    const bobY = Math.abs(Math.sin(this.bobTimer)) * 0.02;

    // ADS Viewmodel Center vs Hipfire Position
    const targetX = this.isADS ? 0 : 0.24 + bobX;
    const targetY = this.isADS ? -0.16 : -0.22 - bobY;
    const targetZ = (this.isADS ? -0.38 : -0.45) + this.recoilOffset;

    this.weaponMeshGroup.position.x = THREE.MathUtils.lerp(this.weaponMeshGroup.position.x, targetX, 15 * delta);
    this.weaponMeshGroup.position.y = THREE.MathUtils.lerp(this.weaponMeshGroup.position.y, targetY, 15 * delta);
    this.weaponMeshGroup.position.z = THREE.MathUtils.lerp(this.weaponMeshGroup.position.z, targetZ, 20 * delta);
  }

  private updateContinuousFiring() {
    if (this.isMouseDown || this.isTouchFiring) {
      if (this.currentWeaponType === 'rifle') {
        this.shoot();
      }
    }
  }

  private updateCombatProjectiles(delta: number) {
    const { activeBullets } = this.particleSystem.update(delta);

    for (let i = activeBullets.length - 1; i >= 0; i--) {
      const b = activeBullets[i];

      if (b.isPlayerBullet) {
        // Check collision against Enemies
        let hitEnemy = false;
        for (const enemy of this.enemies) {
          const dist = b.mesh.position.distanceTo(enemy.mesh.position);
          const hitRadius = enemy.type === 'enforcer' ? 1.4 : 0.9;

          if (dist < hitRadius) {
            hitEnemy = true;
            this.stats.shotsHit++;

            // Headshot bonus if hit upper part
            const isHeadshot = b.mesh.position.y > enemy.mesh.position.y + 0.8;
            const finalDamage = isHeadshot ? b.damage * 1.8 : b.damage;
            if (isHeadshot) this.stats.headshots++;

            enemy.health -= finalDamage;
            enemy.flinchTimer = 0.12;

            // Audio & HUD feedback
            sound.playHitMarker();
            this.onHitMarker?.();

            // Hit sparks
            this.particleSystem.createImpactSparks(b.mesh.position, new THREE.Vector3(0, 1, 0), 0xef4444, 8);
            this.particleSystem.removeBullet(b);
            break;
          }
        }

        if (hitEnemy) continue;

        // Check collision against Explosive Barrels
        for (const obs of this.mapData.obstacles) {
          if (obs.isExplosive && obs.mesh.visible) {
            const dist = b.mesh.position.distanceTo(obs.position);
            if (dist < 1.1) {
              // Detonate barrel!
              obs.mesh.visible = false;
              this.particleSystem.createExplosion(obs.position.clone(), 45);
              sound.playExplosion();

              // Damage nearby enemies
              this.enemies.forEach((en) => {
                const enDist = en.mesh.position.distanceTo(obs.position);
                if (enDist < 8) {
                  const barrelDmg = Math.max(20, (1 - enDist / 8) * 160);
                  en.health -= barrelDmg;
                }
              });

              // Damage player if close
              const pDist = this.playerPos.distanceTo(obs.position);
              if (pDist < 8) {
                this.takePlayerDamage(Math.floor((1 - pDist / 8) * 70));
              }

              this.particleSystem.removeBullet(b);
              break;
            }
          }
        }

        // Check collision with Obstacle boxes
        for (const obs of this.mapData.obstacles) {
          if (obs.box.containsPoint(b.mesh.position)) {
            this.particleSystem.createImpactSparks(b.mesh.position, new THREE.Vector3(0, 1, 0), 0x38bdf8, 6);
            this.particleSystem.removeBullet(b);
            break;
          }
        }
      } else {
        // Enemy Bullet vs Player
        const distToPlayer = b.mesh.position.distanceTo(this.camera.position);
        if (distToPlayer < 1.2) {
          this.takePlayerDamage(b.damage);
          this.particleSystem.createImpactSparks(b.mesh.position, new THREE.Vector3(0, 1, 0), 0xf43f5e, 8);
          this.particleSystem.removeBullet(b);
        }
      }
    }
  }

  private checkPickupCollisions() {
    this.pickups.forEach((p) => {
      if (p.collected) return;
      const dist = p.position.distanceTo(this.playerPos);
      if (dist < 1.8) {
        // Collect!
        p.collected = true;
        p.mesh.visible = false;
        sound.playPickup();

        if (p.type === 'health') {
          this.health = Math.min(this.maxHealth, this.health + p.value);
        } else if (p.type === 'armor') {
          this.armor = Math.min(this.maxArmor, this.armor + p.value);
        } else if (p.type === 'ammo') {
          // Refill current weapon and reserve
          const w = this.weapons[this.currentWeaponType];
          w.reserveAmmo = Math.min(w.maxReserve, w.reserveAmmo + w.magSize * 2);
          w.currentMag = w.magSize;
        }

        // Respawn pickup after 25 seconds
        setTimeout(() => {
          p.collected = false;
          p.mesh.visible = true;
        }, 25000);
      }
    });
  }

  private notifyUI() {
    if (!this.onStateUpdate) return;

    const weapon = this.weapons[this.currentWeaponType];
    const enemyPositions = this.enemies.map((e) => ({
      x: e.mesh.position.x,
      z: e.mesh.position.z,
      type: e.type,
    }));

    this.onStateUpdate({
      health: Math.round(this.health),
      maxHealth: this.maxHealth,
      armor: Math.round(this.armor),
      maxArmor: this.maxArmor,
      weapon,
      isReloading: this.isReloading,
      stats: this.stats,
      enemiesRemaining: this.enemies.length + Math.max(0, this.waveEnemiesToSpawn - this.waveEnemiesSpawned),
      playerPos: {
        x: this.playerPos.x,
        z: this.playerPos.z,
        yaw: this.yaw,
      },
      enemyPositions,
    });
  }

  private onWindowResize() {
    if (!this.container) return;
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  public destroy() {
    cancelAnimationFrame(this.animationFrameId);
    sound.stopAmbient();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
