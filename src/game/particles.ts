import * as THREE from 'three';
import { Bullet, Particle } from '../types/game';

export class ParticleSystem {
  private particles: Particle[] = [];
  private bullets: Bullet[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public addBullet(
    startPos: THREE.Vector3,
    direction: THREE.Vector3,
    speed: number,
    damage: number,
    isPlayer: boolean,
    colorHex: string | number = 0x38bdf8
  ): Bullet {
    const geo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8);
    geo.rotateX(Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: typeof colorHex === 'string' ? new THREE.Color(colorHex) : colorHex,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(startPos);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);

    this.scene.add(mesh);

    const bullet: Bullet = {
      id: 'bullet_' + Math.random().toString(36).substring(2, 9),
      startPos: startPos.clone(),
      position: mesh.position,
      velocity: direction.clone().multiplyScalar(speed),
      damage,
      isPlayerBullet: isPlayer,
      distanceTraveled: 0,
      maxDistance: 160,
      color: typeof colorHex === 'string' ? colorHex : '#' + colorHex.toString(16),
      mesh,
    };

    this.bullets.push(bullet);
    return bullet;
  }

  public createImpactSparks(pos: THREE.Vector3, normal: THREE.Vector3, colorHex: number = 0xf59e0b, count: number = 10) {
    const pGeo = new THREE.BoxGeometry(0.04, 0.04, 0.04);
    const pMat = new THREE.MeshBasicMaterial({ color: colorHex });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(pGeo, pMat);
      mesh.position.copy(pos);

      // Bounce velocity away from surface
      const vel = normal.clone().multiplyScalar(2 + Math.random() * 4);
      vel.x += (Math.random() - 0.5) * 5;
      vel.y += (Math.random() - 0.5) * 5;
      vel.z += (Math.random() - 0.5) * 5;

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.25,
        color: '#' + colorHex.toString(16),
      });
    }
  }

  public createExplosion(pos: THREE.Vector3, count: number = 35) {
    const colors = [0xef4444, 0xf97316, 0xfbbf24, 0x38bdf8];

    for (let i = 0; i < count; i++) {
      const size = 0.08 + Math.random() * 0.12;
      const geo = new THREE.BoxGeometry(size, size, size);
      const color = colors[Math.floor(Math.random() * colors.length)];
      const mat = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 12,
        Math.random() * 10 + 2,
        (Math.random() - 0.5) * 12
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.5,
        color: '#' + color.toString(16),
      });
    }
  }

  public update(delta: number): { activeBullets: Bullet[] } {
    // 1. Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;
      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      // Gravity & velocity
      p.velocity.y -= 18 * delta;
      p.mesh.position.addScaledVector(p.velocity, delta);

      const scale = Math.max(0, 1 - p.life / p.maxLife);
      p.mesh.scale.set(scale, scale, scale);
    }

    // 2. Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      const step = b.velocity.clone().multiplyScalar(delta);
      b.mesh.position.add(step);
      b.distanceTraveled += step.length();

      if (b.distanceTraveled >= b.maxDistance) {
        this.scene.remove(b.mesh);
        b.mesh.geometry.dispose();
        this.bullets.splice(i, 1);
      }
    }

    return { activeBullets: this.bullets };
  }

  public removeBullet(bullet: Bullet) {
    const idx = this.bullets.indexOf(bullet);
    if (idx !== -1) {
      this.scene.remove(bullet.mesh);
      bullet.mesh.geometry.dispose();
      this.bullets.splice(idx, 1);
    }
  }

  public clear() {
    this.particles.forEach((p) => {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
    });
    this.particles = [];

    this.bullets.forEach((b) => {
      this.scene.remove(b.mesh);
      b.mesh.geometry.dispose();
    });
    this.bullets = [];
  }
}
