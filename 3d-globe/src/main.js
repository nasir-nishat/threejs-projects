import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './style.css';

// 1. Scene Setup
const scene = new THREE.Scene();

// 2. Camera Setup
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 15;

// 3. Renderer Setup
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Optimize performance
document.body.appendChild(renderer.domElement);

// 4. Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // smooth camera movement
controls.dampingFactor = 0.05;
controls.autoRotate = true; // Auto-rotate the globe
controls.autoRotateSpeed = 1.0;
controls.enablePan = false;
controls.minDistance = 5;
controls.maxDistance = 30;

// 5. Starry Background
// Generates random points for a star cluster background
const starsGeometry = new THREE.BufferGeometry();
const starsCount = 2000;
const posArray = new Float32Array(starsCount * 3);

for(let i = 0; i < starsCount * 3; i++) {
  posArray[i] = (Math.random() - 0.5) * 100;
}

starsGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const starsMaterial = new THREE.PointsMaterial({
  size: 0.05,
  color: 0xffffff,
  transparent: true,
  opacity: 0.8
});
const starMesh = new THREE.Points(starsGeometry, starsMaterial);
scene.add(starMesh);

// 6. Base Sphere Globe
// Represents the actual surface of the earth in a blue tint
const globeRadius = 5;
const globeGeometry = new THREE.SphereGeometry(globeRadius, 64, 64);

// Using a basic blueish shader/material for the base globe
const globeMaterial = new THREE.MeshBasicMaterial({
  color: 0x001133,
  transparent: true,
  opacity: 0.9,
  wireframe: false
});
const globeMesh = new THREE.Mesh(globeGeometry, globeMaterial);
scene.add(globeMesh);

// Optional: Add a subtle atmospheric glow (larger sphere)
const atmosphereGeometry = new THREE.SphereGeometry(globeRadius * 1.05, 64, 64);
const atmosphereMaterial = new THREE.MeshBasicMaterial({
  color: 0x0044ff,
  transparent: true,
  opacity: 0.1,
  side: THREE.BackSide,
  blending: THREE.AdditiveBlending // Added blending for glowing effect
});
const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
scene.add(atmosphereMesh);

// 7. GeoJSON Parsing and Line Extrusion
// Group to hold all country border lines
const linesGroup = new THREE.Group();
scene.add(linesGroup);

const GEOJSON_URL = 'https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson';

// Helper function to convert lat/lon to 3D spherical coordinates
function polarToCartesian(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  
  // Use THREE.Spherical to map accurately to the sphere
  const spherical = new THREE.Spherical(radius, phi, theta);
  return new THREE.Vector3().setFromSpherical(spherical);
}

// Fetch GeoJSON and trace country borders
fetch(GEOJSON_URL)
  .then(response => response.json())
  .then(data => {
    // Shared material for all line segments to improve performance
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x00bfff, // Cyan/blue outlines
      transparent: true,
      opacity: 0.6
    });

    data.features.forEach(feature => {
      const geometry = feature.geometry;
      if (geometry.type === 'Polygon') {
        geometry.coordinates.forEach(ring => drawCoordinates(ring, lineMaterial));
      } else if (geometry.type === 'MultiPolygon') {
        geometry.coordinates.forEach(polygon => {
          polygon.forEach(ring => drawCoordinates(ring, lineMaterial));
        });
      }
    });
  })
  .catch(err => {
    console.error('Error fetching/parsing GeoJSON:', err);
  });

function drawCoordinates(coordinates, material) {
  const points = [];
  // GeoJSON coordinate format is [longitude, latitude]
  for (let i = 0; i < coordinates.length; i++) {
    const lon = coordinates[i][0];
    const lat = coordinates[i][1];
    
    // Extrude slightly above the globe base (radius + epsilon) to prevent z-fighting
    const vertex = polarToCartesian(lat, lon, globeRadius + 0.02);
    points.push(vertex);
  }

  // Use BufferGeometry for optimal performance
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geometry, material);
  linesGroup.add(line);
}

// 8. Responsive Design
window.addEventListener('resize', () => {
  // Update camera
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// 9. Animation Loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();

  // Slowly rotate the starry background
  starMesh.rotation.y = elapsedTime * 0.05;

  // Update OrbitControls (required for damping and autoRotate)
  controls.update();

  renderer.render(scene, camera);
}

// Start loop
animate();
