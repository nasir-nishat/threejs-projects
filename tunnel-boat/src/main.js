import * as THREE from 'three';

// --- State Variables ---
let score = 0;
let distanceTraveled = 0;
let speed = 50;
const INITIAL_SPEED = 50;
const MAX_SPEED = 150;
const ACCELERATION = 2; // units per second
let isPlaying = false;
let isPaused = false;
let highScore = localStorage.getItem('tunnelHighScore') || 0;

let currentLane = 1; // 0: Left, 1: Center, 2: Right
const laneWidth = 15;

let time = 0;

// Update UI initially
document.getElementById('high-score').innerText = Math.floor(highScore);

// --- Scene Setup ---
const canvas = document.getElementById('gameCanvas');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000514, 0.005);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// --- Lighting ---
const hemiLight = new THREE.HemisphereLight(0x2244ff, 0xffcc66, 1.5);
scene.add(hemiLight);

const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const boatLight = new THREE.PointLight(0x00ffff, 4, 150);
scene.add(boatLight);

// --- Procedural Tunnel ---
const tunnelRadius = 40;
const tunnelSegments = [];
const tunnelGeo = new THREE.CylinderGeometry(tunnelRadius, tunnelRadius, 400, 32, 16, true);
tunnelGeo.rotateX(Math.PI / 2);

// Distort tunnel vertices slightly for an organic look
const pos = tunnelGeo.attributes.position;
for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const angle = Math.atan2(y, x);
    const noise = Math.sin(z * 0.05 + angle * 4) * 2 + Math.cos(z * 0.1) * 3;
    pos.setX(i, x + Math.cos(angle) * noise);
    pos.setY(i, y + Math.sin(angle) * noise);
}
tunnelGeo.computeVertexNormals();

const tunnelMat = new THREE.MeshStandardMaterial({
    color: 0x222244,
    emissive: 0x1a1a4a,
    emissiveIntensity: 1.5,
    wireframe: true,
    side: THREE.BackSide
});

for (let i = 0; i < 3; i++) {
    const tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
    tunnel.position.z = -i * 400;
    scene.add(tunnel);
    tunnelSegments.push(tunnel);
}

// --- Procedural Water ---
const waterGeo = new THREE.PlaneGeometry(80, 400, 16, 64);
waterGeo.rotateX(-Math.PI / 2);
const waterMat = new THREE.MeshStandardMaterial({
    color: 0x0066cc,
    transparent: true,
    opacity: 0.8,
    roughness: 0.1,
    metalness: 0.8,
    emissive: 0x001133
});
const water = new THREE.Mesh(waterGeo, waterMat);
water.position.y = -10;
scene.add(water);

// --- Submarine Model ---
const boat = new THREE.Group();
const subMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.6, roughness: 0.2 });

const hullGeo = new THREE.CylinderGeometry(2, 2, 12, 16);
hullGeo.rotateX(Math.PI / 2);
const hull = new THREE.Mesh(hullGeo, subMat);

const frontGeo = new THREE.SphereGeometry(2, 16, 16);
const front = new THREE.Mesh(frontGeo, subMat);
front.position.z = -6;

const backGeo = new THREE.SphereGeometry(2, 16, 16);
const back = new THREE.Mesh(backGeo, subMat);
back.position.z = 6;

const towerGeo = new THREE.BoxGeometry(1.5, 3, 4);
const tower = new THREE.Mesh(towerGeo, subMat);
tower.position.set(0, 2, -1);

const periGeo = new THREE.CylinderGeometry(0.2, 0.2, 2);
const periMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
const peri = new THREE.Mesh(periGeo, periMat);
peri.position.set(0, 4, -1.5);

boat.add(hull, front, back, tower, peri);

const engineMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
const engineMesh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.5, 8), engineMat);
engineMesh.rotateX(Math.PI / 2);
engineMesh.position.z = 8;
boat.add(engineMesh);

boat.position.y = -10; // Half float
scene.add(boat);

// --- Obstacle Pool ---
const obstacles = [];
const OBSTACLE_COUNT = 20;

const mineBodyMat = new THREE.MeshStandardMaterial({ color: 0xff4444, metalness: 0.5, roughness: 0.5 });
const mineSpikeMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.8 });
const mineCoreGeo = new THREE.SphereGeometry(2.5, 16, 16);
const mineSpikeGeo = new THREE.CylinderGeometry(0.2, 0.4, 1.5);
mineSpikeGeo.translate(0, 3, 0);

function createMine() {
    const mine = new THREE.Group();
    const core = new THREE.Mesh(mineCoreGeo, mineBodyMat);
    mine.add(core);

    for(let i=0; i<6; i++) {
        const spike1 = new THREE.Mesh(mineSpikeGeo, mineSpikeMat);
        spike1.rotation.x = (i / 6) * Math.PI * 2;
        const spike2 = new THREE.Mesh(mineSpikeGeo, mineSpikeMat);
        spike2.rotation.y = (i / 6) * Math.PI * 2;
        spike2.rotation.z = Math.PI / 2;
        mine.add(spike1, spike2);
    }
    
    const mineLight = new THREE.PointLight(0xff4444, 2, 20);
    mine.add(mineLight);
    
    return mine;
}

for (let i = 0; i < OBSTACLE_COUNT; i++) {
    const obs = createMine();
    obs.position.y = -9000;
    obs.scale.setScalar(0.8 + Math.random() * 0.4);
    obs.userData = { active: false, box: new THREE.Box3() };
    scene.add(obs);
    obstacles.push(obs);
}

// --- Splash Particles ---
const MAX_PARTICLES = 30;
const splashMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
const splashGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const particles = [];

for (let i = 0; i < MAX_PARTICLES; i++) {
    const p = new THREE.Mesh(splashGeo, splashMat);
    p.position.y = -9000;
    scene.add(p);
    particles.push({ mesh: p, life: 0, vx: 0, vy: 0, vz: 0 });
}

// --- Hitboxes ---
const boatBox = new THREE.Box3();

// --- Game Logic ---
let nextSpawnZ = -200;

function resetGame() {
    score = 0;
    distanceTraveled = 0;
    speed = INITIAL_SPEED;
    currentLane = 1;
    time = 0;
    nextSpawnZ = -200;

    boat.position.set(0, -10, 0);
    boat.rotation.set(0, 0, 0);
    camera.position.set(0, 5, 30);
    
    // reset visual items
    for (let obs of obstacles) {
        obs.userData.active = false;
        obs.position.y = -9000;
    }
    
    for (let i = 0; i < tunnelSegments.length; i++) {
        tunnelSegments[i].position.z = -i * 400;
    }
    
    water.position.z = -200; // center it manually

    document.querySelectorAll('.overlay').forEach(el => el.classList.remove('active'));
    
    isPlaying = true;
    isPaused = false;
}

function spawnObstacle() {
    // Find inactive obstacle
    let obs = obstacles.find(o => !o.userData.active);
    if (!obs) return;

    obs.userData.active = true;
    obs.position.z = nextSpawnZ;
    const lane = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
    obs.position.x = lane * laneWidth;
    obs.position.y = -10 + (obs.scale.y * 1.5);
    
    // Rotate somewhat randomly
    obs.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);

    // Update next spawn timer based on speed
    const gap = Math.max(50, 150 - (speed * 0.5));
    nextSpawnZ -= gap + Math.random() * 50;
}

function spawnSplash() {
    let p = particles.find(pt => pt.life <= 0);
    if (!p) return;
    
    p.mesh.position.copy(boat.position);
    p.mesh.position.y = -10;
    p.mesh.position.x += (Math.random() - 0.5) * 4;
    p.mesh.position.z += 5; // behind boat
    p.life = 1;
    p.vx = (Math.random() - 0.5) * 8;
    p.vy = Math.random() * 6 + 2;
    p.vz = Math.random() * 5;
}

function gameOver() {
    isPlaying = false;
    
    let hs = Math.max(highScore, score);
    if (hs > highScore) {
        highScore = hs;
        localStorage.setItem('tunnelHighScore', highScore);
    }
    
    document.getElementById('final-score').innerText = Math.floor(score);
    document.getElementById('high-score').innerText = Math.floor(highScore);
    document.getElementById('game-over-screen').classList.add('active');
}

function updatePhysics(delta) {
    if (!isPlaying || isPaused) return;

    time += delta;

    // Movement
    speed = Math.min(MAX_SPEED, speed + ACCELERATION * delta);
    const moveZ = speed * delta;
    boat.position.z -= moveZ;
    distanceTraveled += moveZ;
    score = distanceTraveled * 0.1; // scale distance nicely

    // UI updating
    document.getElementById('score').innerText = Math.floor(score);
    document.getElementById('speed').innerText = Math.floor(speed);

    // Lane mechanics
    const targetX = (currentLane - 1) * laneWidth;
    boat.position.x = THREE.MathUtils.lerp(boat.position.x, targetX, 10 * delta);
    
    // Tilt boat when turning
    const tilt = (targetX - boat.position.x) * -0.05;
    boat.rotation.z = THREE.MathUtils.lerp(boat.rotation.z, tilt, 10 * delta);

    // Water animation
    water.position.z = boat.position.z - 50;
    const waterPos = waterGeo.attributes.position;
    for(let i = 0; i < waterPos.count; i++) {
        const x = waterPos.getX(i);
        const z = waterPos.getZ(i);
        const worldZ = z + water.position.z;
        const y = Math.sin(x * 0.2 + time * 2) * 1.5 + Math.cos(worldZ * 0.1 + time * 3) * 1.5;
        waterPos.setY(i, y);
    }
    waterGeo.computeVertexNormals();
    waterPos.needsUpdate = true;

    // Tunnels infinitely mapping
    for (let tunnel of tunnelSegments) {
        if (tunnel.position.z > boat.position.z + 200) {
            tunnel.position.z -= 1200; // 3 segments * 400 length
        }
    }

    // Spawn and update obstacles
    if (boat.position.z - 400 < nextSpawnZ) {
        spawnObstacle();
    }

    // Collision detection update
    boatBox.setFromObject(boat);
    boatBox.expandByScalar(-0.5);

    for (let obs of obstacles) {
        if (obs.userData.active) {
            // Check bounding distance simply, or AABB
            obs.userData.box.setFromObject(obs);
            obs.userData.box.expandByScalar(-0.5);

            if (boatBox.intersectsBox(obs.userData.box)) {
                gameOver();
                return;
            }

            // Cleanup passed obstacles
            if (obs.position.z > boat.position.z + 50) {
                obs.userData.active = false;
                obs.position.y = -9000;
            }
        }
    }

    // Splashes
    if (Math.random() < 0.5) spawnSplash();
    
    for (let p of particles) {
        if (p.life > 0) {
            p.mesh.position.x += p.vx * delta;
            p.mesh.position.y += p.vy * delta;
            p.mesh.position.z += p.vz * delta;
            p.vy -= 15 * delta; // gravity
            p.life -= delta * 1.5;
            p.mesh.scale.setScalar(Math.max(0, p.life));
            if (p.life <= 0) p.mesh.position.y = -9000;
        }
    }

    // Camera follow
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, boat.position.x * 0.5, 5 * delta);
    camera.position.z = boat.position.z + 30;
    camera.lookAt(boat.position.x, -5, boat.position.z - 50);

    // Light follow
    boatLight.position.copy(boat.position);
    boatLight.position.y += 5;

    // Day/Night Cycle (60 second loop)
    const t = (Math.sin(time * Math.PI / 30) + 1) / 2;
    hemiLight.color.lerpColors(new THREE.Color(0x2244ff), new THREE.Color(0xffcc66), t);
    scene.fog.color.lerpColors(new THREE.Color(0x001133), new THREE.Color(0xff7722), t);
    waterMat.color.lerpColors(new THREE.Color(0x0066cc), new THREE.Color(0xffaa22), t);
}

// --- Render Loop ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    updatePhysics(delta);
    renderer.render(scene, camera);
}
animate();

// --- Controls ---
window.addEventListener('keydown', (e) => {
    // Prevent default scrolling
    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }

    if (!isPlaying) {
        if (e.code === 'Space') {
            resetGame();
        }
        return;
    }

    if (e.code === 'Space') {
        togglePause();
        return;
    }

    if (!isPaused) {
        if ((e.code === 'ArrowLeft' || e.code === 'KeyA') && currentLane > 0) {
            currentLane--;
        }
        if ((e.code === 'ArrowRight' || e.code === 'KeyD') && currentLane < 2) {
            currentLane++;
        }
    }
});

document.addEventListener('touchstart', (e) => {
    // Ignore UI button touches
    if (e.target.tagName === 'BUTTON') return;

    if (!isPlaying) {
        resetGame();
        return;
    }

    if (isPaused) {
        togglePause();
        return;
    }

    const touchX = e.touches[0].clientX;
    if (touchX < window.innerWidth / 2 && currentLane > 0) {
        currentLane--;
    } else if (touchX >= window.innerWidth / 2 && currentLane < 2) {
        currentLane++;
    }
}, {passive: false});

// Pause Logic
function togglePause() {
    if (!isPlaying) return;
    isPaused = !isPaused;
    if (isPaused) {
        document.getElementById('pause-screen').classList.add('active');
        document.getElementById('pause-btn').innerText = 'Resume';
        clock.stop(); // Stops delta accumulation
    } else {
        document.getElementById('pause-screen').classList.remove('active');
        document.getElementById('pause-btn').innerText = 'Pause';
        clock.start();
    }
}
document.getElementById('pause-btn').addEventListener('click', togglePause);

// Fullscreen Logic
document.getElementById('fullscreen-btn').addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.body.requestFullscreen().catch(err => {
            console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
});

// Resize window handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
