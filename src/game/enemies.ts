import * as THREE from 'three';
import { Enemy, EnemyType } from '../types/game';
import { MapObstacle } from './mapBuilder';

export function createEnemyMesh(type: EnemyType): THREE.Group {
  const group = new THREE.Group();

  if (type === 'drone') {
    // Center spherical chassis
    const bodyGeo = new THREE.SphereGeometry(0.55, 16, 16);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.2,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    group.add(body);

    // Glowing red ocular sensor
    const eyeGeo = new THREE.SphereGeometry(0.2, 12, 12);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(0, 0, 0.45);
    group.add(eye);

    // 4 Quad-rotor outriggers
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const armGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.65, 8);
      armGeo.rotateZ(Math.PI / 2);
      const armMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });
      const arm = new THREE.Mesh(armGeo, armMat);
      arm.position.set(Math.cos(angle) * 0.5, 0, Math.sin(angle) * 0.5);
      arm.rotation.y = -angle;
      group.add(arm);

      // Thruster ring
      const ringGeo = new THREE.TorusGeometry(0.16, 0.03, 8, 16);
      ringGeo.rotateX(Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(Math.cos(angle) * 0.85, 0, Math.sin(angle) * 0.85);
      group.add(ring);
    }
  } else if (type === 'enforcer') {
    // Heavy Robot Torso
    const torsoGeo = new THREE.BoxGeometry(1.1, 1.2, 0.8);
    const armorMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.85,
      roughness: 0.3,
    });
    const torso = new THREE.Mesh(torsoGeo, armorMat);
    torso.position.y = 1.3;
    torso.castShadow = true;
    group.add(torso);

    // Head Unit
    const headGeo = new THREE.BoxGeometry(0.6, 0.45, 0.55);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 2.1, 0.05);
    group.add(head);

    // Visor slit
    const visorGeo = new THREE.BoxGeometry(0.5, 0.08, 0.1);
    const visorMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 2.1, 0.3);
    group.add(visor);

    // Heavy Shoulder Cannons
    const cannonGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.9, 12);
    cannonGeo.rotateX(Math.PI / 2);
    const cannonMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.9, roughness: 0.2 });

    const leftCannon = new THREE.Mesh(cannonGeo, cannonMat);
    leftCannon.position.set(-0.75, 1.8, 0.2);
    group.add(leftCannon);

    const rightCannon = new THREE.Mesh(cannonGeo, cannonMat);
    rightCannon.position.set(0.75, 1.8, 0.2);
    group.add(rightCannon);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.32, 0.9, 0.38);
    const leftLeg = new THREE.Mesh(legGeo, armorMat);
    leftLeg.position.set(-0.35, 0.45, 0);
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, armorMat);
    rightLeg.position.set(0.35, 0.45, 0);
    group.add(rightLeg);
  } else if (type === 'stalker') {
    // Fast predatory quad mech
    const coreGeo = new THREE.ConeGeometry(0.5, 1.1, 6);
    coreGeo.rotateX(Math.PI / 2);
    const stalkerMat = new THREE.MeshStandardMaterial({
      color: 0x881337,
      metalness: 0.85,
      roughness: 0.25,
    });
    const core = new THREE.Mesh(coreGeo, stalkerMat);
    core.position.y = 0.8;
    group.add(core);

    // Glowing spines
    const spineGeo = new THREE.ConeGeometry(0.12, 0.4, 4);
    const spineMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    for (let i = 0; i < 3; i++) {
      const spine = new THREE.Mesh(spineGeo, spineMat);
      spine.position.set(0, 1.05 + i * 0.05, -0.2 + i * 0.25);
      spine.rotation.x = -0.4;
      group.add(spine);
    }

    // 4 bladed legs
    for (let i = 0; i < 4; i++) {
      const isFront = i < 2;
      const isLeft = i % 2 === 0;
      const legGeo = new THREE.CylinderGeometry(0.04, 0.02, 1.1, 6);
      const leg = new THREE.Mesh(legGeo, stalkerMat);
      leg.position.set(isLeft ? -0.55 : 0.55, 0.45, isFront ? 0.35 : -0.35);
      leg.rotation.z = isLeft ? 0.5 : -0.5;
      leg.rotation.x = isFront ? 0.3 : -0.3;
      group.add(leg);
    }
  }

  // Health bar billboard above enemy
  const barCanvas = document.createElement('canvas');
  barCanvas.width = 128;
  barCanvas.height = 18;
  const barCtx = barCanvas.getContext('2d')!;
  barCtx.fillStyle = '#ef4444';
  barCtx.fillRect(0, 0, 128, 18);

  const barTexture = new THREE.CanvasTexture(barCanvas);
  const barGeo = new THREE.PlaneGeometry(1.2, 0.16);
  const barMat = new THREE.MeshBasicMaterial({ map: barTexture, transparent: true });
  const healthBar = new THREE.Mesh(barGeo, barMat);
  healthBar.name = 'healthBar';
  healthBar.position.y = type === 'enforcer' ? 2.6 : type === 'drone' ? 1.1 : 1.4;
  group.add(healthBar);

  return group;
}

export function spawnEnemy(type: EnemyType, spawnPos: THREE.Vector3, wave: number): Enemy {
  const mesh = createEnemyMesh(type);
  mesh.position.copy(spawnPos);

  const waveMultiplier = 1 + (wave - 1) * 0.15;

  let maxHealth = 70;
  let speed = 4.2;
  let damage = 12;
  let attackRange = 22;
  let attackCooldown = 1800;
  let scoreValue = 100;

  if (type === 'drone') {
    maxHealth = Math.floor(60 * waveMultiplier);
    speed = 4.8;
    damage = 8;
    attackRange = 25;
    attackCooldown = 1400;
    scoreValue = 120;
    mesh.position.y = 2.8; // drone hovers
  } else if (type === 'enforcer') {
    maxHealth = Math.floor(180 * waveMultiplier);
    speed = 2.6;
    damage = 22;
    attackRange = 18;
    attackCooldown = 2200;
    scoreValue = 250;
  } else if (type === 'stalker') {
    maxHealth = Math.floor(90 * waveMultiplier);
    speed = 6.2;
    damage = 18;
    attackRange = 3.5; // close melee
    attackCooldown = 900;
    scoreValue = 180;
  }

  return {
    id: 'enemy_' + Math.random().toString(36).substring(2, 9),
    type,
    name: type.toUpperCase(),
    mesh,
    health: maxHealth,
    maxHealth,
    speed,
    damage,
    attackRange,
    attackCooldown,
    lastAttackTime: 0,
    state: 'chase',
    position: mesh.position,
    velocity: new THREE.Vector3(),
    targetPosition: new THREE.Vector3(),
    scoreValue,
    flinchTimer: 0,
    patrolAngle: Math.random() * Math.PI * 2,
  };
}

export function updateEnemyAI(
  enemy: Enemy,
  playerPos: THREE.Vector3,
  delta: number,
  now: number,
  obstacles: MapObstacle[],
  onEnemyAttack: (enemy: Enemy) => void
) {
  if (enemy.health <= 0) return;

  const mesh = enemy.mesh;
  const distToPlayer = mesh.position.distanceTo(playerPos);

  // Look toward player (yaw only)
  mesh.lookAt(playerPos.x, mesh.position.y, playerPos.z);

  // Health bar billboard faces camera (approx player)
  const healthBar = mesh.getObjectByName('healthBar') as THREE.Mesh;
  if (healthBar) {
    healthBar.lookAt(playerPos.x, healthBar.position.y + mesh.position.y, playerPos.z);

    // Update texture health bar color/width
    const healthPercent = Math.max(0, enemy.health / enemy.maxHealth);
    healthBar.scale.x = healthPercent;
  }

  // Flinch recovery
  if (enemy.flinchTimer > 0) {
    enemy.flinchTimer -= delta;
    return;
  }

  // Navigation Direction
  const moveDir = new THREE.Vector3();

  if (enemy.type === 'drone') {
    // Hover animation
    mesh.position.y = 2.6 + Math.sin(now * 0.003 + enemy.patrolAngle) * 0.4;

    if (distToPlayer > enemy.attackRange * 0.6) {
      // Approach
      moveDir.subVectors(playerPos, mesh.position).normalize();
    } else {
      // Circle player / strafe
      enemy.patrolAngle += delta * 0.8;
      const targetX = playerPos.x + Math.cos(enemy.patrolAngle) * 14;
      const targetZ = playerPos.z + Math.sin(enemy.patrolAngle) * 14;
      moveDir.set(targetX - mesh.position.x, 0, targetZ - mesh.position.z).normalize();
    }

    // Drone Ranged Attack
    if (distToPlayer <= enemy.attackRange && now - enemy.lastAttackTime > enemy.attackCooldown) {
      enemy.lastAttackTime = now;
      onEnemyAttack(enemy);
    }
  } else if (enemy.type === 'enforcer') {
    // Heavy walking
    if (distToPlayer > enemy.attackRange * 0.7) {
      moveDir.subVectors(playerPos, mesh.position).normalize();
    } else {
      // Hold position and suppress
      moveDir.set(0, 0, 0);
    }

    if (distToPlayer <= enemy.attackRange && now - enemy.lastAttackTime > enemy.attackCooldown) {
      enemy.lastAttackTime = now;
      onEnemyAttack(enemy);
    }
  } else if (enemy.type === 'stalker') {
    // Fast sprint toward player
    moveDir.subVectors(playerPos, mesh.position).normalize();

    // Stalker melee attack when very close
    if (distToPlayer <= enemy.attackRange && now - enemy.lastAttackTime > enemy.attackCooldown) {
      enemy.lastAttackTime = now;
      onEnemyAttack(enemy);
    }
  }

  // Obstacle avoidance and boundary clamping
  const nextPos = mesh.position.clone().addScaledVector(moveDir, enemy.speed * delta);
  let canMove = true;

  // Simple obstacle box collision
  for (const obs of obstacles) {
    if (obs.box.containsPoint(nextPos)) {
      canMove = false;
      break;
    }
  }

  // Arena bounds check (-42 to 42)
  if (Math.abs(nextPos.x) > 42 || Math.abs(nextPos.z) > 42) {
    canMove = false;
  }

  if (canMove) {
    mesh.position.x = nextPos.x;
    mesh.position.z = nextPos.z;
  }
}
