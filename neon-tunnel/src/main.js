import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import './style.css';

/**
 * Neon Tunnel - High-End Minimalist Edition
 * A hypnotic, performance-optimized 3D descent.
 */

class NeonTunnel {
  constructor() {
    try {
      this.canvas = document.getElementById('canvas');
      this.init();
      this.createObjects();
      this.setupPostProcessing();
      this.addListeners();
      this.animate();
      this.hideLoader();
    } catch (error) {
      console.error('Initialization failed:', error);
      const loaderText = document.querySelector('.loader-text');
      if (loaderText) {
        loaderText.textContent = 'Energy Flow Failed - Check Console';
        loaderText.style.color = '#ef4444';
      }
    }
  }

  init() {
    // Basic Scene Setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x020205, 0.15);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: "high-performance",
      alpha: false
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x020205);
    // If not using pre-existing canvas, append it:
    if (!this.canvas) {
      document.body.appendChild(this.renderer.domElement);
    }

    this.clock = new THREE.Clock();
  }

  createObjects() {
    // 1. The Main Tunnel (Lattice Structure)
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -50),
      new THREE.Vector3(5, 5, -100),
      new THREE.Vector3(0, 0, -150),
      new THREE.Vector3(-5, -5, -200),
      new THREE.Vector3(0, 0, -250),
    ]);
    curve.curveType = 'centripetal';
    curve.closed = false;

    const tubeGeo = new THREE.TubeGeometry(curve, 100, 2, 32, false);
    
    // Create a "wireframe" effect with a custom lattice
    const wireframeGeo = new THREE.EdgesGeometry(tubeGeo);
    const wireframeMat = new THREE.LineBasicMaterial({ 
      color: 0x6366f1,
      transparent: true,
      opacity: 0.4
    });
    this.tunnelLattice = new THREE.LineSegments(wireframeGeo, wireframeMat);
    this.scene.add(this.tunnelLattice);

    // 2. Glowing Rings
    this.rings = [];
    const ringGeo = new THREE.TorusGeometry(2, 0.02, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x6366f1 });

    for (let i = 0; i < 20; i++) {
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.z = -i * 15;
      this.scene.add(ring);
      this.rings.push(ring);
    }

    // 3. Floating Energy Particles
    const particleCount = 2000;
    const partGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        posArray[i * 3] = (Math.random() - 0.5) * 40;
        posArray[i * 3 + 1] = (Math.random() - 0.5) * 40;
        posArray[i * 3 + 2] = Math.random() * -400;
    }
    
    partGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const partMat = new THREE.PointsMaterial({
        color: 0x6366f1,
        size: 0.05,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    
    this.particles = new THREE.Points(partGeo, partMat);
    this.scene.add(this.particles);

    // 4. Center Light Ray
    const lightGeo = new THREE.CylinderGeometry(0.01, 0.01, 1000, 8);
    const lightMat = new THREE.MeshBasicMaterial({ 
        color: 0x818cf8, 
        transparent: true, 
        opacity: 0.1 
    });
    const lightRay = new THREE.Mesh(lightGeo, lightMat);
    lightRay.rotation.x = Math.PI / 2;
    lightRay.position.z = -500;
    this.scene.add(lightRay);
  }

  setupPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5, // strength
      0.4, // radius
      0.85 // threshold
    );
    bloomPass.threshold = 0.2;
    bloomPass.strength = 1.2;
    bloomPass.radius = 0.5;
    this.composer.addPass(bloomPass);

    this.composer.addPass(new OutputPass());
  }

  addListeners() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.composer.setSize(window.innerWidth, window.innerHeight);
    });

    this.mouse = { x: 0, y: 0 };
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) - 0.5;
      this.mouse.y = (e.clientY / window.innerHeight) - 0.5;
    });
  }

  hideLoader() {
    const loader = document.getElementById('loading');
    setTimeout(() => {
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 1000);
      }
    }, 1500);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    const time = this.clock.getElapsedTime();
    const dt = this.clock.getDelta();

    // Subtle tunnel rotation
    this.tunnelLattice.rotation.z = time * 0.05;

    // Move particles and rings for infinite loop feel
    this.rings.forEach((ring, i) => {
        ring.position.z += 0.2;
        if (ring.position.z > 5) {
            ring.position.z = -295;
        }
        // Pulse ring scale
        const s = 1 + Math.sin(time * 2 + i) * 0.1;
        ring.scale.set(s, s, s);
    });

    const posAttr = this.particles.geometry.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
        let z = posAttr.getZ(i);
        z += 0.5;
        if (z > 5) z = -395;
        posAttr.setZ(i, z);
    }
    posAttr.needsUpdate = true;

    // Camera swaying based on mouse
    this.camera.position.x += (this.mouse.x * 2 - this.camera.position.x) * 0.05;
    this.camera.position.y += (-this.mouse.y * 2 - this.camera.position.y) * 0.05;
    this.camera.lookAt(0, 0, -20);

    this.composer.render();
  }
}

new NeonTunnel();

