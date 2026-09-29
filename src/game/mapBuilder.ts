import * as THREE from 'three';

export interface MapObstacle {
  box: THREE.Box3;
  type: 'wall' | 'crate' | 'building' | 'barrel';
  isExplosive?: boolean;
  health?: number;
  mesh: THREE.Object3D;
  position: THREE.Vector3;
}

export interface BuiltMap {
  obstacles: MapObstacle[];
  lights: THREE.Light[];
  spawnPoints: THREE.Vector3[];
  enemySpawns: THREE.Vector3[];
  pickupSpawns: { position: THREE.Vector3; type: 'health' | 'armor' | 'ammo' }[];
  reactorCoreMesh?: THREE.Mesh;
}

export function buildArena(scene: THREE.Scene): BuiltMap {
  const obstacles: MapObstacle[] = [];
  const lights: THREE.Light[] = [];

  // Arena Dimensions
  const ARENA_SIZE = 90;
  const HALF_SIZE = ARENA_SIZE / 2;

  // 1. Sky & Atmospheric Fog
  scene.background = new THREE.Color(0x060913);
  scene.fog = new THREE.FogExp2(0x080d1a, 0.016);

  // 2. Ambient & Directional Lighting
  const ambientLight = new THREE.AmbientLight(0x1e293b, 1.2);
  scene.add(ambientLight);
  lights.push(ambientLight);

  const moonLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
  moonLight.position.set(30, 60, -35);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.width = 1024;
  moonLight.shadow.mapSize.height = 1024;
  moonLight.shadow.camera.near = 10;
  moonLight.shadow.camera.far = 160;
  const shadowRange = 50;
  moonLight.shadow.camera.left = -shadowRange;
  moonLight.shadow.camera.right = shadowRange;
  moonLight.shadow.camera.top = shadowRange;
  moonLight.shadow.camera.bottom = -shadowRange;
  scene.add(moonLight);
  lights.push(moonLight);

  // Secondary Warm Fill Light
  const fillLight = new THREE.DirectionalLight(0xf97316, 0.8);
  fillLight.position.set(-40, 25, 40);
  scene.add(fillLight);
  lights.push(fillLight);

  // 3. Ground Plane with procedural grid and neon runners
  const floorGeo = new THREE.PlaneGeometry(ARENA_SIZE, ARENA_SIZE, 32, 32);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    roughness: 0.8,
    metalness: 0.3,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Grid Lines Overlay
  const gridHelper = new THREE.GridHelper(ARENA_SIZE, 30, 0x0284c7, 0x1e293b);
  gridHelper.position.y = 0.02;
  scene.add(gridHelper);

  // 4. Perimeter Boundary Walls
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.6,
    metalness: 0.4,
  });
  const wallGlowMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });

  const WALL_HEIGHT = 8;
  const WALL_THICKNESS = 2;

  const wallDefs = [
    { pos: [0, WALL_HEIGHT / 2, -HALF_SIZE], size: [ARENA_SIZE, WALL_HEIGHT, WALL_THICKNESS] },
    { pos: [0, WALL_HEIGHT / 2, HALF_SIZE], size: [ARENA_SIZE, WALL_HEIGHT, WALL_THICKNESS] },
    { pos: [-HALF_SIZE, WALL_HEIGHT / 2, 0], size: [WALL_THICKNESS, WALL_HEIGHT, ARENA_SIZE] },
    { pos: [HALF_SIZE, WALL_HEIGHT / 2, 0], size: [WALL_THICKNESS, WALL_HEIGHT, ARENA_SIZE] },
  ];

  wallDefs.forEach((def) => {
    const geo = new THREE.BoxGeometry(def.size[0], def.size[1], def.size[2]);
    const wall = new THREE.Mesh(geo, wallMat);
    wall.position.set(def.pos[0], def.pos[1], def.pos[2]);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);

    // Glowing trim on top of perimeter
    const trimGeo = new THREE.BoxGeometry(
      def.size[0] === ARENA_SIZE ? ARENA_SIZE : 0.4,
      0.3,
      def.size[2] === ARENA_SIZE ? ARENA_SIZE : 0.4
    );
    const trim = new THREE.Mesh(trimGeo, wallGlowMat);
    trim.position.set(def.pos[0], WALL_HEIGHT + 0.15, def.pos[2]);
    scene.add(trim);

    const box = new THREE.Box3().setFromObject(wall);
    obstacles.push({
      box,
      type: 'wall',
      mesh: wall,
      position: wall.position.clone(),
    });
  });

  // 5. Central Energy Reactor Monument
  const coreGroup = new THREE.Group();
  coreGroup.position.set(0, 0, 0);

  // Octagonal Reactor Base
  const baseGeo = new THREE.CylinderGeometry(5.5, 6.5, 1.2, 8);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = 0.6;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  coreGroup.add(baseMesh);

  // Pillars around reactor
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const px = Math.cos(angle) * 4.2;
    const pz = Math.sin(angle) * 4.2;
    const pillarGeo = new THREE.BoxGeometry(0.8, 6.5, 0.8);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(px, 3.25, pz);
    pillar.castShadow = true;
    coreGroup.add(pillar);

    // Glowing conduits
    const condGeo = new THREE.BoxGeometry(0.2, 5.5, 0.2);
    const condMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const cond = new THREE.Mesh(condGeo, condMat);
    cond.position.set(px * 0.9, 3.25, pz * 0.9);
    coreGroup.add(cond);
  }

  // Floating Glowing Energy Sphere
  const coreSphereGeo = new THREE.IcosahedronGeometry(1.6, 2);
  const coreSphereMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x0284c7,
    emissiveIntensity: 0.9,
    roughness: 0.1,
    metalness: 0.9,
  });
  const coreSphere = new THREE.Mesh(coreSphereGeo, coreSphereMat);
  coreSphere.position.set(0, 3.8, 0);
  coreGroup.add(coreSphere);

  // Point light at reactor
  const reactorLight = new THREE.PointLight(0x06b6d4, 4.5, 24);
  reactorLight.position.set(0, 4, 0);
  coreGroup.add(reactorLight);
  lights.push(reactorLight);

  scene.add(coreGroup);

  // Central obstacle box
  const coreBox = new THREE.Box3(
    new THREE.Vector3(-4.5, 0, -4.5),
    new THREE.Vector3(4.5, 7, 4.5)
  );
  obstacles.push({
    box: coreBox,
    type: 'building',
    mesh: coreGroup,
    position: new THREE.Vector3(0, 0, 0),
  });

  // 6. Tactical Buildings / Bunkers in 4 Quadrants
  const buildings = [
    // North-West Outpost
    { x: -22, z: -22, w: 10, h: 5.5, d: 8, color: 0x1e293b, accent: 0x38bdf8 },
    // North-East High Ground
    { x: 22, z: -22, w: 8, h: 6.5, d: 10, color: 0x1e293b, accent: 0xf43f5e },
    // South-West Comm Center
    { x: -22, z: 22, w: 9, h: 5.0, d: 9, color: 0x1e293b, accent: 0xa855f7 },
    // South-East Armory
    { x: 22, z: 22, w: 10, h: 5.5, d: 8, color: 0x1e293b, accent: 0x10b981 },
  ];

  buildings.forEach((b) => {
    const bGeo = new THREE.BoxGeometry(b.w, b.h, b.d);
    const bMat = new THREE.MeshStandardMaterial({
      color: b.color,
      metalness: 0.7,
      roughness: 0.35,
    });
    const bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.set(b.x, b.h / 2, b.z);
    bMesh.castShadow = true;
    bMesh.receiveShadow = true;
    scene.add(bMesh);

    // Light accent strip
    const accentGeo = new THREE.BoxGeometry(b.w + 0.1, 0.25, b.d + 0.1);
    const accentMat = new THREE.MeshBasicMaterial({ color: b.accent });
    const accentMesh = new THREE.Mesh(accentGeo, accentMat);
    accentMesh.position.set(b.x, b.h * 0.75, b.z);
    scene.add(accentMesh);

    // Local point light
    const pLight = new THREE.PointLight(b.accent, 2.0, 16);
    pLight.position.set(b.x, b.h + 0.8, b.z);
    scene.add(pLight);
    lights.push(pLight);

    const box = new THREE.Box3().setFromObject(bMesh);
    obstacles.push({
      box,
      type: 'building',
      mesh: bMesh,
      position: bMesh.position.clone(),
    });
  });

  // 7. Tactical Shipping Containers & Cover Blocks
  const crates = [
    // Center ring cover
    { x: -10, z: 0, w: 2.2, h: 2.2, d: 5, rot: 0, color: 0x334155 },
    { x: 10, z: 0, w: 2.2, h: 2.2, d: 5, rot: 0, color: 0x475569 },
    { x: 0, z: -10, w: 5, h: 2.2, d: 2.2, rot: 0, color: 0x334155 },
    { x: 0, z: 10, w: 5, h: 2.2, d: 2.2, rot: 0, color: 0x475569 },

    // Intermediate lanes
    { x: -14, z: -12, w: 2.5, h: 2.8, d: 2.5, rot: 0.3, color: 0x0284c7 },
    { x: 14, z: 12, w: 2.5, h: 2.8, d: 2.5, rot: -0.4, color: 0x0284c7 },
    { x: 14, z: -12, w: 3.8, h: 2.2, d: 2.0, rot: 0.2, color: 0xd97706 },
    { x: -14, z: 12, w: 3.8, h: 2.2, d: 2.0, rot: -0.15, color: 0xd97706 },

    // Outer corridors
    { x: -32, z: 0, w: 3.0, h: 2.6, d: 8.0, rot: 0, color: 0x334155 },
    { x: 32, z: 0, w: 3.0, h: 2.6, d: 8.0, rot: 0, color: 0x334155 },
    { x: 0, z: -32, w: 8.0, h: 2.6, d: 3.0, rot: 0, color: 0x334155 },
    { x: 0, z: 32, w: 8.0, h: 2.6, d: 3.0, rot: 0, color: 0x334155 },

    // Barrier blocks
    { x: -8, z: -20, w: 4.0, h: 1.4, d: 1.2, rot: 0.5, color: 0x475569 },
    { x: 8, z: 20, w: 4.0, h: 1.4, d: 1.2, rot: 0.5, color: 0x475569 },
    { x: -20, z: 8, w: 1.2, h: 1.4, d: 4.0, rot: -0.3, color: 0x475569 },
    { x: 20, z: -8, w: 1.2, h: 1.4, d: 4.0, rot: -0.3, color: 0x475569 },
  ];

  crates.forEach((c) => {
    const cGeo = new THREE.BoxGeometry(c.w, c.h, c.d);
    const cMat = new THREE.MeshStandardMaterial({
      color: c.color,
      metalness: 0.65,
      roughness: 0.45,
    });
    const cMesh = new THREE.Mesh(cGeo, cMat);
    cMesh.position.set(c.x, c.h / 2, c.z);
    cMesh.rotation.y = c.rot;
    cMesh.castShadow = true;
    cMesh.receiveShadow = true;
    scene.add(cMesh);

    // Edge highlight
    const edgeGeo = new THREE.EdgesGeometry(cGeo);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x64748b });
    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
    cMesh.add(edges);

    const box = new THREE.Box3().setFromObject(cMesh);
    obstacles.push({
      box,
      type: 'crate',
      mesh: cMesh,
      position: cMesh.position.clone(),
    });
  });

  // 8. Explosive Hazard Barrels
  const barrelPositions = [
    new THREE.Vector3(-12, 0.9, -4),
    new THREE.Vector3(12, 0.9, 4),
    new THREE.Vector3(-4, 0.9, 14),
    new THREE.Vector3(4, 0.9, -14),
    new THREE.Vector3(-18, 0.9, -16),
    new THREE.Vector3(18, 0.9, 16),
  ];

  const barrelGeo = new THREE.CylinderGeometry(0.55, 0.55, 1.8, 16);
  const barrelMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    metalness: 0.8,
    roughness: 0.3,
  });

  barrelPositions.forEach((pos) => {
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.position.copy(pos);
    barrel.castShadow = true;
    barrel.receiveShadow = true;

    // Glowing hazard stripes
    const stripeGeo = new THREE.CylinderGeometry(0.56, 0.56, 0.3, 16);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.y = 0.2;
    barrel.add(stripe);

    scene.add(barrel);

    const box = new THREE.Box3().setFromObject(barrel);
    obstacles.push({
      box,
      type: 'barrel',
      isExplosive: true,
      health: 30,
      mesh: barrel,
      position: barrel.position.clone(),
    });
  });

  // 9. Ramps / Elevated Walkway Stubs
  const rampGeo = new THREE.BoxGeometry(4, 1.8, 6);
  const rampMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.5 });
  const ramp1 = new THREE.Mesh(rampGeo, rampMat);
  ramp1.position.set(-18, 0.4, 0);
  ramp1.rotation.z = 0.14;
  ramp1.receiveShadow = true;
  scene.add(ramp1);

  const ramp2 = new THREE.Mesh(rampGeo, rampMat);
  ramp2.position.set(18, 0.4, 0);
  ramp2.rotation.z = -0.14;
  ramp2.receiveShadow = true;
  scene.add(ramp2);

  // 10. Starfield / Cyberpunk Background Spheres
  const starGeo = new THREE.BufferGeometry();
  const starCount = 600;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i += 3) {
    const radius = 95 + Math.random() * 40;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.45; // upper hemisphere
    starPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
    starPositions[i + 1] = radius * Math.cos(phi) + 10;
    starPositions[i + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.9, transparent: true, opacity: 0.8 });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // Spawn points for player & enemies
  const spawnPoints = [
    new THREE.Vector3(0, 1.7, 24),
    new THREE.Vector3(-26, 1.7, 0),
    new THREE.Vector3(26, 1.7, 0),
    new THREE.Vector3(0, 1.7, -24),
  ];

  const enemySpawns = [
    new THREE.Vector3(-34, 1.5, -34),
    new THREE.Vector3(34, 1.5, -34),
    new THREE.Vector3(-34, 1.5, 34),
    new THREE.Vector3(34, 1.5, 34),
    new THREE.Vector3(0, 1.5, -36),
    new THREE.Vector3(0, 1.5, 36),
    new THREE.Vector3(-36, 1.5, 0),
    new THREE.Vector3(36, 1.5, 0),
  ];

  const pickupSpawns: { position: THREE.Vector3; type: 'health' | 'armor' | 'ammo' }[] = [
    { position: new THREE.Vector3(-14, 0.8, -14), type: 'health' },
    { position: new THREE.Vector3(14, 0.8, 14), type: 'health' },
    { position: new THREE.Vector3(-14, 0.8, 14), type: 'armor' },
    { position: new THREE.Vector3(14, 0.8, -14), type: 'armor' },
    { position: new THREE.Vector3(0, 0.8, 16), type: 'ammo' },
    { position: new THREE.Vector3(0, 0.8, -16), type: 'ammo' },
    { position: new THREE.Vector3(-16, 0.8, 0), type: 'ammo' },
    { position: new THREE.Vector3(16, 0.8, 0), type: 'ammo' },
  ];

  return {
    obstacles,
    lights,
    spawnPoints,
    enemySpawns,
    pickupSpawns,
    reactorCoreMesh: coreSphere,
  };
}
