import * as THREE from 'three';

const minTileIndex = -8;
const maxTileIndex = 8;
const tilesPerRow = 17;
const tileSize = 42;

// --- Setup ---
const scene = new THREE.Scene();

const distance = 500;
const camera = new THREE.OrthographicCamera(
  window.innerWidth / -2,
  window.innerWidth / 2,
  window.innerHeight / 2,
  window.innerHeight / -2,
  0.1,
  10000
);
camera.up.set(0, 0, 1);
camera.position.set(-distance, -distance, distance);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(100, -300, 300);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.left = -400;
dirLight.shadow.camera.right = 400;
dirLight.shadow.camera.top = 400;
dirLight.shadow.camera.bottom = -400;
scene.add(dirLight);

// --- Textures ---
function Texture(width, height, rects) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.fillStyle = 'rgba(0,0,0,0.6)';
  rects.forEach(rect => {
    context.fillRect(rect.x, rect.y, rect.w, rect.h);
  });
  return new THREE.CanvasTexture(canvas);
}

const carFrontTexture = Texture(64, 64, [{ x: 0, y: 0, w: 64, h: 20 }]);
const carBackTexture = Texture(64, 64, [{ x: 0, y: 44, w: 64, h: 20 }]);
const carRightSideTexture = Texture(128, 64, [{ x: 0, y: 0, w: 20, h: 64 }, { x: 108, y: 0, w: 20, h: 64 }]);
const carLeftSideTexture = Texture(128, 64, [{ x: 0, y: 0, w: 20, h: 64 }, { x: 108, y: 0, w: 20, h: 64 }]);

const truckFrontTexture = Texture(64, 96, [{ x: 0, y: 0, w: 64, h: 32 }]);
const truckRightSideTexture = Texture(192, 96, [{ x: 0, y: 0, w: 48, h: 96 }]);
const truckLeftSideTexture = Texture(192, 96, [{ x: 0, y: 0, w: 48, h: 96 }]);

// --- Models ---
const wheelGeometry = new THREE.CylinderGeometry(12, 12, 33, 32);
const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

function Wheel(x) {
  const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  wheel.position.z = 6;
  wheel.position.x = x;
  wheel.rotation.x = Math.PI / 2;
  return wheel;
}

function Car(initialTileIndex, direction, color) {
  const car = new THREE.Group();

  const carMaterial = new THREE.MeshLambertMaterial({ color });

  const main = new THREE.Mesh(
    new THREE.BoxGeometry(60, 30, 15),
    [
      new THREE.MeshLambertMaterial({ color: 0x333333 }),
      new THREE.MeshLambertMaterial({ color: 0x333333 }),
      new THREE.MeshLambertMaterial({ color: 0x333333 }),
      new THREE.MeshLambertMaterial({ color: 0x333333 }),
      carMaterial,
      new THREE.MeshLambertMaterial({ color: 0x333333 }),
    ]
  );
  main.position.z = 12;
  main.castShadow = true;
  main.receiveShadow = true;
  car.add(main);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(33, 24, 12),
    [
      new THREE.MeshLambertMaterial({ map: carFrontTexture }),
      new THREE.MeshLambertMaterial({ map: carBackTexture }),
      new THREE.MeshLambertMaterial({ map: carLeftSideTexture }),
      new THREE.MeshLambertMaterial({ map: carRightSideTexture }),
      new THREE.MeshLambertMaterial({ color: 0xffffff }),
      new THREE.MeshLambertMaterial({ color: 0xffffff })
    ]
  );
  cabin.position.x = -6;
  cabin.position.z = 25.5;
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  car.add(cabin);

  const frontWheel = Wheel(18);
  const backWheel = Wheel(-18);
  car.add(frontWheel);
  car.add(backWheel);

  car.position.y = initialTileIndex * tileSize;
  if (direction) {
    car.rotation.z = Math.PI / 2;
  } else {
    car.rotation.z = -Math.PI / 2;
  }

  return car;
}

function Truck(initialTileIndex, direction, color) {
  const truck = new THREE.Group();

  const cargo = new THREE.Mesh(
    new THREE.BoxGeometry(105, 35, 35),
    new THREE.MeshLambertMaterial({ color: 0xb4c6fc })
  );
  cargo.position.x = -15;
  cargo.position.z = 25;
  cargo.castShadow = true;
  cargo.receiveShadow = true;
  truck.add(cargo);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(30, 30, 30),
    [
      new THREE.MeshLambertMaterial({ map: truckFrontTexture }),
      new THREE.MeshLambertMaterial({ color: color }),
      new THREE.MeshLambertMaterial({ map: truckLeftSideTexture }),
      new THREE.MeshLambertMaterial({ map: truckRightSideTexture }),
      new THREE.MeshLambertMaterial({ color: color }),
      new THREE.MeshLambertMaterial({ color: color })
    ]
  );
  cabin.position.x = 55;
  cabin.position.z = 20;
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  truck.add(cabin);

  const frontWheel = Wheel(60);
  const middleWheel = Wheel(10);
  const backWheel = Wheel(-40);
  truck.add(frontWheel);
  truck.add(middleWheel);
  truck.add(backWheel);

  truck.position.y = initialTileIndex * tileSize;
  if (direction) {
    truck.rotation.z = Math.PI / 2;
  } else {
    truck.rotation.z = -Math.PI / 2;
  }

  return truck;
}

const treeGeometry = new THREE.BoxGeometry(30, 30, 42);
const trunkGeometry = new THREE.BoxGeometry(15, 15, 15);
const treeMaterial = new THREE.MeshLambertMaterial({ color: 0x4dada0 });
const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x9d5b40 });

function Tree(tileIndex, height) {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.z = 7.5;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  const crown = new THREE.Mesh(treeGeometry, treeMaterial);
  crown.position.z = 15 + height / 2;
  crown.castShadow = true;
  crown.receiveShadow = true;
  tree.add(crown);

  tree.position.y = tileIndex * tileSize;

  return tree;
}

function Grass(rowIndex) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(tileSize, tileSize * tilesPerRow, 3),
    new THREE.MeshLambertMaterial({ color: 0xbaf455 })
  );
  mesh.position.x = rowIndex * tileSize;
  mesh.position.z = 1.5;
  mesh.receiveShadow = true;
  return mesh;
}

function Road(rowIndex) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(tileSize, tileSize * tilesPerRow, 3),
    new THREE.MeshLambertMaterial({ color: 0x454a59 })
  );
  mesh.position.x = rowIndex * tileSize;
  mesh.position.z = 1.5;
  mesh.receiveShadow = true;
  return mesh;
}

// --- Player ---
const playerGeometry = new THREE.BoxGeometry(15, 15, 15);
const playerMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
const capMaterial = new THREE.MeshLambertMaterial({ color: 0xffc107 });

class Player extends THREE.Group {
  constructor() {
    super();

    const body = new THREE.Mesh(playerGeometry, playerMaterial);
    body.position.z = 12;
    body.castShadow = true;
    body.receiveShadow = true;
    this.add(body);

    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(18, 18, 4),
      capMaterial
    );
    cap.position.z = 21;
    cap.castShadow = true;
    cap.receiveShadow = true;
    this.add(cap);

    this.stepTime = 0.2;
    this.clock = new THREE.Clock();
    this.moveQueue = [];
    this.isMoving = false;
    this.moveProgress = 0;

    this.startPosition = new THREE.Vector3();
    this.targetPosition = new THREE.Vector3();

    this.tilesX = 0;
    this.tilesY = 0;

    this.initializePlayer();
  }

  initializePlayer() {
    this.tilesX = 0;
    this.tilesY = 0;
    this.position.set(0, 0, 0);
    this.rotation.z = 0;
    this.moveQueue = [];
    this.isMoving = false;
    this.moveProgress = 0;
  }

  queueMove(direction) {
    if (this.moveQueue.length < 3) {
      this.moveQueue.push(direction);
    }
  }

  stepCompleted() {
    this.isMoving = false;
    const dir = this.moveQueue.shift();

    if (dir === 'forward') this.tilesX += 1;
    if (dir === 'backward') this.tilesX -= 1;
    if (dir === 'left') this.tilesY += 1;
    if (dir === 'right') this.tilesY -= 1;

    score = Math.max(score, this.tilesX);
    updateScore();
  }

  animatePlayer() {
    const delta = this.clock.getDelta();

    if (!this.isMoving && this.moveQueue.length > 0) {
      const nextMove = this.moveQueue[0];

      let nextTilesX = this.tilesX;
      let nextTilesY = this.tilesY;

      if (nextMove === 'forward') nextTilesX += 1;
      if (nextMove === 'backward') nextTilesX -= 1;
      if (nextMove === 'left') nextTilesY += 1;
      if (nextMove === 'right') nextTilesY -= 1;

      if (endsUpInValidPosition(nextTilesX, nextTilesY)) {
        this.startPosition.copy(this.position);
        calculateFinalPosition(nextMove, this.targetPosition, this.position);
        this.isMoving = true;
        this.moveProgress = 0;

        // Rotation
        if (nextMove === 'forward') this.rotation.z = 0;
        if (nextMove === 'backward') this.rotation.z = Math.PI;
        if (nextMove === 'left') this.rotation.z = Math.PI / 2;
        if (nextMove === 'right') this.rotation.z = -Math.PI / 2;

      } else {
        // Drop invalid move
        this.moveQueue.shift();
      }
    }

    if (this.isMoving) {
      this.moveProgress += delta / this.stepTime;

      if (this.moveProgress >= 1) {
        this.position.copy(this.targetPosition);
        this.position.z = 0; // Reset height after jump
        this.stepCompleted();
      } else {
        this.position.lerpVectors(this.startPosition, this.targetPosition, this.moveProgress);
        // Jump height bob
        this.position.z = Math.sin(this.moveProgress * Math.PI) * 15;
      }
    }
  }
}

function calculateFinalPosition(direction, target, current) {
  target.copy(current);
  if (direction === 'forward') {
    target.x += tileSize;
  } else if (direction === 'backward') {
    target.x -= tileSize;
  } else if (direction === 'left') {
    target.y += tileSize;
  } else if (direction === 'right') {
    target.y -= tileSize;
  }
}

function endsUpInValidPosition(tilesX, tilesY) {
  if (tilesY > maxTileIndex || tilesY < minTileIndex) return false;
  if (tilesX < 0) return false;

  const row = mapMetadata.find(m => m.row === tilesX);
  if (row && row.type === 'forest') {
    if (row.trees.includes(tilesY)) {
      return false;
    }
  }

  return true;
}

// --- Map Generation ---
let mapGroup = new THREE.Group();
scene.add(mapGroup);
let mapMetadata = [];

function generateRow(rowIndex) {
  let type = "forest";
  if (rowIndex === 0) type = "forest";
  else if (Math.random() < 0.4) type = "car";
  else if (Math.random() < 0.3) type = "truck";

  let rowMetadata = { row: rowIndex, type };
  let rowGroup = new THREE.Group();

  if (type === 'car' || type === 'truck') {
    rowGroup.add(Road(rowIndex));

    const direction = Math.random() >= 0.5;
    const speed = 50 + Math.random() * 50;
    const color = [0xa52523, 0xbdb638, 0x78b14b][Math.floor(Math.random() * 3)];

    let vehicles = [];
    const count = 1 + Math.floor(Math.random() * 2);
    const startIdx = Math.floor(Math.random() * 3) + minTileIndex;

    for (let i = 0; i < count; i++) {
      let vehicle;
      if (type === 'car') {
        vehicle = Car(startIdx + i * 5, direction, color);
      } else {
        vehicle = Truck(startIdx + i * 8, direction, color);
      }
      vehicle.position.x = rowIndex * tileSize;
      rowGroup.add(vehicle);
      vehicles.push(vehicle);
    }

    rowMetadata.vehicles = vehicles;
    rowMetadata.direction = direction;
    rowMetadata.speed = speed;

  } else {
    rowGroup.add(Grass(rowIndex));

    let trees = [];
    for (let i = minTileIndex; i <= maxTileIndex; i++) {
      if (rowIndex === 0 && (i >= -1 && i <= 1)) continue; // Safe zone
      if (Math.random() < 0.3) {
        trees.push(i);
        const tree = Tree(i, 20 + Math.random() * 20);
        tree.position.x = rowIndex * tileSize;
        rowGroup.add(tree);
      }
    }
    rowMetadata.trees = trees;
  }

  mapMetadata.push(rowMetadata);
  mapGroup.add(rowGroup);
}

function addRows(count) {
  const currentRowMax = mapMetadata.length;
  for (let i = 0; i < count; i++) {
    generateRow(currentRowMax + i);
  }
}

// --- Game Logic ---
function hitTest() {
  const playerBox = new THREE.Box3();
  const vehicleBox = new THREE.Box3();

  playerBox.setFromObject(player);
  playerBox.expandByScalar(-1); // Make hitbox slightly forgiving

  for (let i = 0; i < mapMetadata.length; i++) {
    const row = mapMetadata[i];
    if (row.row === player.tilesX && (row.type === 'car' || row.type === 'truck')) {
      for (let j = 0; j < row.vehicles.length; j++) {
        const vehicle = row.vehicles[j];

        vehicleBox.setFromObject(vehicle);

        if (playerBox.intersectsBox(vehicleBox)) {
          return true; // Game over
        }
      }
    }
  }

  return false;
}

function animateVehicles(delta) {
  mapMetadata.forEach(row => {
    if (row.type === 'car' || row.type === 'truck') {
      const distance = delta * row.speed;
      row.vehicles.forEach(vehicle => {
        if (row.direction) {
          vehicle.position.y += distance;
          if (vehicle.position.y > (maxTileIndex + 1) * tileSize) {
            vehicle.position.y = (minTileIndex - 1) * tileSize;
          }
        } else {
          vehicle.position.y -= distance;
          if (vehicle.position.y < (minTileIndex - 1) * tileSize) {
            vehicle.position.y = (maxTileIndex + 1) * tileSize;
          }
        }
      });
    }
  });
}

// --- Initialize Game ---
const player = new Player();
scene.add(player);

let score = 0;
let gameOver = false;
let previousTimestamp = 0;

function initializeGame() {
  score = 0;
  updateScore();
  gameOver = false;
  document.getElementById('results').style.display = 'none';

  scene.remove(mapGroup);
  mapGroup = new THREE.Group();
  scene.add(mapGroup);
  mapMetadata = [];

  player.initializePlayer();

  addRows(25);
  updateCamera();

  dirLight.target = player;

  renderer.setAnimationLoop(animate);
}

function updateCamera() {
  camera.position.x = player.position.x - distance;
  camera.position.y = player.position.y - distance;
  camera.lookAt(player.position.x, player.position.y, 0);

  dirLight.position.x = player.position.x + 100;
  dirLight.position.y = player.position.y - 300;
}

function gameOverSequence() {
  gameOver = true;
  renderer.setAnimationLoop(null); // Stop loop
  document.getElementById('score-result').innerText = score;
  document.getElementById('results').style.display = 'flex';
}

function animate(timestamp) {
  if (previousTimestamp === 0) previousTimestamp = timestamp;
  const delta = (timestamp - previousTimestamp) / 1000;
  previousTimestamp = timestamp;

  // Generate more rows as player advances
  if (mapMetadata.length - player.tilesX < 15) {
    addRows(10);
  }

  animateVehicles(delta);
  player.animatePlayer();
  updateCamera();

  if (hitTest()) {
    gameOverSequence();
  }

  renderer.render(scene, camera);
}

// --- Controls ---
window.addEventListener('keydown', (e) => {
  if (gameOver) return;
  if (e.key === 'ArrowUp') player.queueMove('forward');
  if (e.key === 'ArrowDown') player.queueMove('backward');
  if (e.key === 'ArrowLeft') player.queueMove('left');
  if (e.key === 'ArrowRight') player.queueMove('right');
});

document.getElementById('forward').addEventListener('mousedown', () => player.queueMove('forward'));
document.getElementById('backward').addEventListener('mousedown', () => player.queueMove('backward'));
document.getElementById('left').addEventListener('mousedown', () => player.queueMove('left'));
document.getElementById('right').addEventListener('mousedown', () => player.queueMove('right'));

// Prevent default zoom/pan on touch
document.getElementById('controls').addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
document.getElementById('forward').addEventListener('touchstart', (e) => { e.preventDefault(); player.queueMove('forward'); }, { passive: false });
document.getElementById('backward').addEventListener('touchstart', (e) => { e.preventDefault(); player.queueMove('backward'); }, { passive: false });
document.getElementById('left').addEventListener('touchstart', (e) => { e.preventDefault(); player.queueMove('left'); }, { passive: false });
document.getElementById('right').addEventListener('touchstart', (e) => { e.preventDefault(); player.queueMove('right'); }, { passive: false });

document.getElementById('retry').addEventListener('click', () => {
  previousTimestamp = 0;
  initializeGame();
});

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.left = window.innerWidth / -2;
  camera.right = window.innerWidth / 2;
  camera.top = window.innerHeight / 2;
  camera.bottom = window.innerHeight / -2;
  camera.updateProjectionMatrix();
});

window.addEventListener('wheel', (e) => {
  const zoomFactor = 0.1;
  if (e.deltaY > 0) {
    camera.zoom = Math.max(0.2, camera.zoom - zoomFactor);
  } else {
    camera.zoom = Math.min(5, camera.zoom + zoomFactor);
  }
  camera.updateProjectionMatrix();
});

function updateScore() {
  document.getElementById('score').innerText = score;
}

// Start
document.getElementById('results').style.display = 'flex';
document.getElementById('results').querySelector('h1').innerText = 'Crossy Road';
document.getElementById('results').querySelector('p').style.display = 'none';
document.getElementById('retry').innerText = 'Start';
