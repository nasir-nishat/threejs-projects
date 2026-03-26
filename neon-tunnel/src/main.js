import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import './style.css';

// Remove loading text
setTimeout(() => {
  const loader = document.getElementById('loading');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => loader.remove(), 500);
  }
}, 500);

// --- 1. SETUP ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0518, 0.02); // Cyber-fog

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ReinhardToneMapping;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;

// Bloom setup
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.1;
bloomPass.strength = 1.5;
bloomPass.radius = 0.8;

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// Lights
const hemiLight = new THREE.HemisphereLight(0x4433ff, 0x110033, 0.5);
scene.add(hemiLight);

// --- 2. THE TUNNEL ---
class TunnelCurve extends THREE.Curve {
  getPoint(t, optionalTarget = new THREE.Vector3()) {
    const px = Math.cos(2 * Math.PI * t) * 50;
    const py = Math.sin(4 * Math.PI * t) * 15;
    const pz = Math.sin(2 * Math.PI * t) * 50;
    return optionalTarget.set(px, py, pz);
  }
}
const tunnelCurve = new TunnelCurve();
const tunnelGeo = new THREE.TubeGeometry(tunnelCurve, 300, 15, 16, true);
const tunnelMat = new THREE.MeshStandardMaterial({
  color: 0x111122,
  wireframe: true,
  emissive: 0x05051a,
  side: THREE.BackSide
});
const tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
scene.add(tunnel);

// --- 3. NEON CRYSTALS (Instanced Mesh) ---
const crystalCount = 150;
const crystalGeo = new THREE.IcosahedronGeometry(1.5, 0);
const crystalMat = new THREE.MeshStandardMaterial({
  color: 0xff00ff,
  emissive: 0xff00ff,
  emissiveIntensity: 0.8,
  wireframe: true
});
const crystals = new THREE.InstancedMesh(crystalGeo, crystalMat, crystalCount);
const dummy = new THREE.Object3D();

for (let i = 0; i < crystalCount; i++) {
  const t = i / crystalCount;
  const pos = tunnelCurve.getPointAt(t);

  const angle = Math.random() * Math.PI * 2;
  const radiusOffset = 13 + Math.random() * 2;

  const tangent = tunnelCurve.getTangentAt(t);
  const zAxis = tangent.clone().normalize();
  const xAxis = new THREE.Vector3(0, 1, 0).cross(zAxis).normalize();
  const yAxis = zAxis.clone().cross(xAxis).normalize();

  const offset = xAxis.multiplyScalar(Math.cos(angle)).add(yAxis.multiplyScalar(Math.sin(angle))).multiplyScalar(radiusOffset);

  dummy.position.copy(pos).add(offset);
  dummy.rotation.set(Math.random(), Math.random(), Math.random());

  const scale = 0.2 + Math.random() * 1.5;
  dummy.scale.set(scale, scale * 2, scale);

  dummy.updateMatrix();
  crystals.setMatrixAt(i, dummy.matrix);

  // Occasional point light for glowing crystals
  if (i % 20 === 0) {
    const pLight = new THREE.PointLight(0xff00ff, 1.5, 20);
    pLight.position.copy(dummy.position);
    scene.add(pLight);
  }
}
scene.add(crystals);

// --- 4. HERO DRONE ---
// --- 4. AIRPLANE REF ---
const Colors = {
	red: 0xf25346,
	white: 0xd8d0d1,
	brown: 0x59332e,
	brownDark: 0x23190f,
    cyan: 0x00ffff
};

class AirPlane {
  constructor() {
    this.mesh = new THREE.Object3D();

    // Create the cabin
    const geomCockpit = new THREE.BoxGeometry(80, 50, 50);
    const matCockpit = new THREE.MeshStandardMaterial({ color: Colors.cyan, flatShading: true, roughness: 0.5 });
    const cockpit = new THREE.Mesh(geomCockpit, matCockpit);
    this.mesh.add(cockpit);

    // Create the engine
    const geomEngine = new THREE.BoxGeometry(20, 50, 50);
    const matEngine = new THREE.MeshStandardMaterial({ color: Colors.white, flatShading: true });
    const engine = new THREE.Mesh(geomEngine, matEngine);
    engine.position.x = 40;
    this.mesh.add(engine);

    // Create the tail
    const geomTailPlane = new THREE.BoxGeometry(15, 20, 5);
    const matTailPlane = new THREE.MeshStandardMaterial({ color: Colors.cyan, flatShading: true });
    const tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
    tailPlane.position.set(-35, 25, 0);
    this.mesh.add(tailPlane);

    // Create the wing
    const geomSideWing = new THREE.BoxGeometry(40, 4, 150);
    const matSideWing = new THREE.MeshStandardMaterial({ color: Colors.cyan, flatShading: true });
    const sideWingTop = new THREE.Mesh(geomSideWing, matSideWing);
    const sideWingBottom = new THREE.Mesh(geomSideWing, matSideWing);
    sideWingTop.position.set(20, 12, 0);
    sideWingBottom.position.set(20, -3, 0);
    this.mesh.add(sideWingTop);
    this.mesh.add(sideWingBottom);

    // Windshield
    const geomWindshield = new THREE.BoxGeometry(3, 15, 20);
    const matWindshield = new THREE.MeshStandardMaterial({ color: Colors.white, transparent: true, opacity: 0.3, flatShading: true });
    const windshield = new THREE.Mesh(geomWindshield, matWindshield);
    windshield.position.set(5, 27, 0);
    this.mesh.add(windshield);

    // Propeller
    const geomPropeller = new THREE.BoxGeometry(20, 10, 10);
    const matPropeller = new THREE.MeshStandardMaterial({ color: Colors.brown, flatShading: true });
    this.propeller = new THREE.Mesh(geomPropeller, matPropeller);

    const geomBlade1 = new THREE.BoxGeometry(1, 100, 10);
    const geomBlade2 = new THREE.BoxGeometry(1, 10, 100);
    const matBlade = new THREE.MeshStandardMaterial({ color: Colors.brownDark, flatShading: true });

    const blade1 = new THREE.Mesh(geomBlade1, matBlade);
    blade1.position.set(8, 0, 0);

    const blade2 = new THREE.Mesh(geomBlade2, matBlade);
    blade2.position.set(8, 0, 0);

    this.propeller.add(blade1, blade2);
    this.propeller.position.set(50, 0, 0);
    this.mesh.add(this.propeller);
  }
}

const airplaneInstance = new AirPlane();
const heroDrone = new THREE.Group();

// Scale airplane down to fit the neon tunnel (tunnel radius ~15, airplane width 150)
airplaneInstance.mesh.scale.set(0.04, 0.04, 0.04);
// Point airplane forward (it was modeled facing +X)
airplaneInstance.mesh.rotation.y = -Math.PI / 2;

heroDrone.add(airplaneInstance.mesh);
scene.add(heroDrone);

// Store propeller reference for animation loop
heroDrone.userData.propeller = airplaneInstance.propeller;

// Lights so we can clearly see the airplane in our dark tunnel!
const ambientPlaneLight = new THREE.PointLight(0xffffff, 2.5, 50);
ambientPlaneLight.position.set(0, 5, 0);
heroDrone.add(ambientPlaneLight);

const droneLight = new THREE.PointLight(0x00ffff, 2, 40);
droneLight.position.set(0, 0, -2);
heroDrone.add(droneLight);

// --- 5. SWARM DRONES ---
const swarmCount = 30;
const swarmGeo = new THREE.ConeGeometry(0.3, 1.2, 4);
swarmGeo.rotateX(Math.PI / 2); // point forward
const swarmMat = new THREE.MeshStandardMaterial({ color: 0xff0055, emissive: 0xaa0033, emissiveIntensity: 1 });
const swarm = new THREE.InstancedMesh(swarmGeo, swarmMat, swarmCount);
const swarmData = [];

for (let i = 0; i < swarmCount; i++) {
  swarmData.push({
    t: Math.random(),
    speed: 0.0005 + Math.random() * 0.001,
    angle: Math.random() * Math.PI * 2,
    radius: 2 + Math.random() * 6
  });
}
scene.add(swarm);

// --- 6. HOLO-CREATURES ---
const creatureCount = 5;
const creatures = [];
const creatureMat = new THREE.LineBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.8 });

for (let i = 0; i < creatureCount; i++) {
  const points = [];
  for (let j = 0; j < 10; j++) points.push(new THREE.Vector3(0, 0, -j * 0.5));
  const cGeo = new THREE.BufferGeometry().setFromPoints(points);
  const creature = new THREE.Line(cGeo, creatureMat);
  scene.add(creature);
  creatures.push({
    mesh: creature,
    t: Math.random(),
    speed: 0.0008 + Math.random() * 0.0005,
    angle: Math.random() * Math.PI * 2
  });
}

// --- 7. PARTICLES (Energy Flow) ---
const particleCount = 1000;
const partGeo = new THREE.BufferGeometry();
const partGeoPos = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
  partGeoPos[i * 3] = (Math.random() - 0.5) * 30;
  partGeoPos[i * 3 + 1] = (Math.random() - 0.5) * 30;
  partGeoPos[i * 3 + 2] = (Math.random() - 0.5) * 30; // depth
}
partGeo.setAttribute('position', new THREE.BufferAttribute(partGeoPos, 3));
const partMat = new THREE.PointsMaterial({ color: 0x00ffff, size: 0.1, transparent: true, blending: THREE.AdditiveBlending, opacity: 0.6 });
const particles = new THREE.Points(partGeo, partMat);
camera.add(particles); // Attach to camera so they fly relative to it

// --- 8. INTERACTION & ANIMATION ---
const mouse = new THREE.Vector2();
const targetPosition = new THREE.Vector2();
const bursts = [];

window.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('click', () => {
  const burstGeo = new THREE.RingGeometry(0.1, 0.2, 16);
  const burstMat = new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  const burst = new THREE.Mesh(burstGeo, burstMat);
  burst.position.copy(heroDrone.position);
  burst.lookAt(camera.position); // Always face back toward camera
  scene.add(burst);

  const lookDir = new THREE.Vector3().subVectors(tunnelCurve.getPointAt((camT + 0.05) % 1), camera.position).normalize();
  bursts.push({ mesh: burst, life: 1.0, dir: lookDir });
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
let camT = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  const time = clock.getElapsedTime();

  // --- Move Camera along tunnel ---
  camT = (camT + dt * 0.02) % 1;
  const camPoint = tunnelCurve.getPointAt(camT);
  const lookAhead = tunnelCurve.getPointAt((camT + 0.01) % 1);
  camera.position.copy(camPoint);
  camera.lookAt(lookAhead);

  // Extract local vectors based on camera looking forward
  const lookDir = new THREE.Vector3().subVectors(lookAhead, camPoint).normalize();
  const worldUp = new THREE.Vector3(0, 1, 0);
  const rightDir = new THREE.Vector3().crossVectors(lookDir, worldUp).normalize();
  const upDir = new THREE.Vector3().crossVectors(rightDir, lookDir).normalize();

  // --- Hero Drone follow mouse ---
  targetPosition.x += (mouse.x * 6 - targetPosition.x) * 0.1;
  targetPosition.y += (mouse.y * 4 - targetPosition.y) * 0.1;

  const heroBaseT = (camT + 0.03) % 1;
  heroDrone.position.copy(tunnelCurve.getPointAt(heroBaseT));
  heroDrone.position.add(rightDir.clone().multiplyScalar(targetPosition.x));
  heroDrone.position.add(upDir.clone().multiplyScalar(targetPosition.y));

  // Look forward along the tunnel
  heroDrone.lookAt(tunnelCurve.getPointAt((heroBaseT + 0.01) % 1));

  // Apply banking (roll), pitching, and yawing directly similar to airplane ref mechanics
  heroDrone.rotateZ(-targetPosition.x * 0.15); // Roll
  heroDrone.rotateX(targetPosition.y * 0.15);  // Pitch
  heroDrone.rotateY(-targetPosition.x * 0.05); // Yaw

  // Spin the propeller
  if (heroDrone.userData.propeller) {
    heroDrone.userData.propeller.rotation.x += 0.4;
  }

  // --- Swarm drones orbit through tunnel ---
  for (let i = 0; i < swarmCount; i++) {
    const data = swarmData[i];
    data.t = (data.t + data.speed) % 1;
    const p = tunnelCurve.getPointAt(data.t);
    const tg = tunnelCurve.getTangentAt(data.t).normalize();
    const rDir = new THREE.Vector3(0, 1, 0).cross(tg).normalize();
    const uDir = tg.clone().cross(rDir).normalize();

    const osc = Math.sin(time * 3 + i) * 2;
    p.add(rDir.multiplyScalar(Math.cos(data.angle + time) * (data.radius + osc)));
    p.add(uDir.multiplyScalar(Math.sin(data.angle + time) * (data.radius + osc)));

    dummy.position.copy(p);
    dummy.lookAt(tunnelCurve.getPointAt((data.t + 0.01) % 1));
    dummy.updateMatrix();
    swarm.setMatrixAt(i, dummy.matrix);
  }
  swarm.instanceMatrix.needsUpdate = true;

  // --- Holo-creatures tentacle animation ---
  creatures.forEach((c, i) => {
    c.t = (c.t + c.speed) % 1;
    const baseP = tunnelCurve.getPointAt(c.t);
    const tg = tunnelCurve.getTangentAt(c.t).normalize();
    const rDir = new THREE.Vector3(0, 1, 0).cross(tg).normalize();
    const uDir = tg.clone().cross(rDir).normalize();

    baseP.add(rDir.multiplyScalar(Math.cos(c.angle) * 8));
    baseP.add(uDir.multiplyScalar(Math.sin(c.angle) * 8));

    const positions = c.mesh.geometry.attributes.position.array;
    for (let j = 0; j < 10; j++) {
      const wave = Math.sin(time * 5 - j * 0.8) * 0.5;
      positions[j * 3] = wave;
      positions[j * 3 + 1] = wave * 0.5;
    }
    c.mesh.geometry.attributes.position.needsUpdate = true;
    c.mesh.position.copy(baseP);
    c.mesh.lookAt(tunnelCurve.getPointAt((c.t + 0.01) % 1));
  });

  // --- Particles flying past camera ---
  const posArray = particles.geometry.attributes.position.array;
  for (let i = 0; i < particleCount; i++) {
    posArray[i * 3 + 2] += 0.8;
    if (posArray[i * 3 + 2] > 5) posArray[i * 3 + 2] = -30; // Loops particles back
  }
  particles.geometry.attributes.position.needsUpdate = true;

  // --- Bursts (Energy rings shot from drone) ---
  for (let i = bursts.length - 1; i >= 0; i--) {
    let b = bursts[i];
    b.life -= dt * 2.0;
    b.mesh.scale.addScalar(0.5 + b.life);
    b.mesh.position.add(b.dir.clone().multiplyScalar(40 * dt));
    b.mesh.material.opacity = b.life;
    if (b.life <= 0) {
      scene.remove(b.mesh);
      bursts.splice(i, 1);
    }
  }

  controls.update();
  composer.render();
}
animate();
