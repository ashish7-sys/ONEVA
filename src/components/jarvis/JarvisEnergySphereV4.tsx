/**
 * ONEVA JARVIS Energy Sphere V4 (Hand Control Visual Engine)
 *
 * Fully integrated Three.js / WebGL implementation featuring:
 * - 24,000 volumetric energy particles with custom GLSL shaders
 * - Flowing turbulence, radial pulse, vortex twist, and harmonic breathing
 * - Touch push displacement and concentric ripple wave propagation
 * - Inner luminous energy core with custom Fresnel falloff shader
 * - Multiple gimbal-mounted orbital energy rings with additive luminescence
 * - Outer ethereal atmosphere halo
 * - Smooth inertial rotation, dynamic zoom & pinch zoom
 * - Double-tap / gesture energy burst with chromatic hue shift
 * - Complete external Hand Control API for air gestures (swipe, pinch, point, burst)
 * - Optimized for mobile: stops render loop when inactive/hidden to conserve battery & GPU
 */

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';

export interface JarvisEnergySphereRef {
  rotate: (dx: number, dy: number) => void;
  zoom: (delta: number) => void;
  touchEnergy: (x: number, y: number, strength?: number) => void;
  energyBurst: () => void;
  colorChange: (delta?: number) => void;
}

export interface JarvisEnergySphereV4Props {
  className?: string;
  isActive?: boolean;
  onTapBurst?: () => void;
}

export const JarvisEnergySphereV4 = forwardRef<JarvisEnergySphereRef, JarvisEnergySphereV4Props>(
  ({ className = '', isActive = true, onTapBurst }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Interaction controls ref
    const interactionRef = useRef({
      targetRX: 0,
      targetRY: 0,
      currentRX: 0,
      currentRY: 0,
      targetZoom: 1.0,
      currentZoom: 1.0,
      targetColorShift: 0.0,
      currentColorShift: 0.0,
      touchPos: new THREE.Vector3(0, 0, 0),
      touchStrength: 0.0,
      targetTouchStrength: 0.0,
      lastTapTime: 0,
      isDragging: false,
      lastPointerX: 0,
      lastPointerY: 0,
      pinchStartDist: 0,
    });

    // Expose Hand Control API to parent components and gesture pipelines
    useImperativeHandle(ref, () => ({
      rotate: (dx: number, dy: number) => {
        interactionRef.current.targetRY += dx * 0.008;
        interactionRef.current.targetRX += dy * 0.008;
      },
      zoom: (delta: number) => {
        const next = Math.max(0.65, Math.min(2.2, interactionRef.current.targetZoom + delta * 0.0015));
        interactionRef.current.targetZoom = next;
      },
      touchEnergy: (x: number, y: number, strength: number = 1.0) => {
        // Map normalized coordinates [-1, 1] to 3D sphere space
        interactionRef.current.touchPos.set(x * 1.2, y * 1.2, 0.4);
        interactionRef.current.targetTouchStrength = Math.min(2.5, strength);
      },
      energyBurst: () => {
        interactionRef.current.targetTouchStrength = 2.5;
        interactionRef.current.targetColorShift += 0.25;
        if (onTapBurst) onTapBurst();
      },
      colorChange: (delta: number = 0.2) => {
        interactionRef.current.targetColorShift += delta;
      },
    }));

    useEffect(() => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      let isRunning = true;
      let animFrameId: number;

      // Dimensions & DPR
      let width = container.clientWidth || window.innerWidth || 412;
      let height = container.clientHeight || window.innerHeight || 892;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      // 1. Scene & Camera Setup
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
      camera.position.z = 3.6;

      // 2. WebGL Renderer
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);

      // Root Transform Group for Inertial Rotation
      const sphereGroup = new THREE.Group();
      scene.add(sphereGroup);

      // 3. 24,000 Volumetric Energy Particles
      const PARTICLE_COUNT = 24000;
      const positions = new Float32Array(PARTICLE_COUNT * 3);
      const basePositions = new Float32Array(PARTICLE_COUNT * 3);
      const colors = new Float32Array(PARTICLE_COUNT * 3);
      const sizes = new Float32Array(PARTICLE_COUNT);
      const speeds = new Float32Array(PARTICLE_COUNT);
      const phases = new Float32Array(PARTICLE_COUNT);
      const angles = new Float32Array(PARTICLE_COUNT);

      // Multi-spectral Arc Reactor Palette
      const palette = [
        new THREE.Color(0x00f0ff), // Electric Cyan
        new THREE.Color(0x00b4d8), // Deep Cyan
        new THREE.Color(0x0077ff), // Vivid Blue
        new THREE.Color(0x9d4edd), // Stark Purple
        new THREE.Color(0x06d6a0), // Emerald Core
        new THREE.Color(0x48cae4), // Pale Azure
      ];

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;

        // Spherical distribution with volumetric density biased toward surface & core
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        // Radius distribution: blend of surface shell (1.05 - 1.25) and volumetric interior (0.3 - 1.05)
        const isShell = Math.random() > 0.35;
        const r = isShell
          ? 1.05 + Math.random() * 0.22
          : 0.35 + Math.pow(Math.random(), 1.5) * 0.7;

        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);

        positions[i3] = x;
        positions[i3 + 1] = y;
        positions[i3 + 2] = z;

        basePositions[i3] = x;
        basePositions[i3 + 1] = y;
        basePositions[i3 + 2] = z;

        // Color selection based on depth
        const chosenCol = palette[Math.floor(Math.random() * palette.length)];
        colors[i3] = chosenCol.r;
        colors[i3 + 1] = chosenCol.g;
        colors[i3 + 2] = chosenCol.b;

        sizes[i] = 1.0 + Math.random() * 2.4;
        speeds[i] = 0.4 + Math.random() * 1.2;
        phases[i] = Math.random() * Math.PI * 2.0;
        angles[i] = Math.atan2(z, x);
      }

      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particleGeometry.setAttribute('aBasePos', new THREE.BufferAttribute(basePositions, 3));
      particleGeometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
      particleGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
      particleGeometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
      particleGeometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
      particleGeometry.setAttribute('aAngle', new THREE.BufferAttribute(angles, 1));

      // Particle Shader Material with HSV Conversion & Dynamic Energy Simulation
      const particleMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0.0 },
          uTouchPos: { value: new THREE.Vector3(0, 0, 0) },
          uTouchStrength: { value: 0.0 },
          uTouchRadius: { value: 1.1 },
          uColorShift: { value: 0.0 },
          uVortex: { value: 1.0 },
          uBreathing: { value: 1.0 },
          uPixelRatio: { value: dpr },
        },
        vertexShader: `
          uniform float uTime;
          uniform vec3 uTouchPos;
          uniform float uTouchStrength;
          uniform float uTouchRadius;
          uniform float uColorShift;
          uniform float uVortex;
          uniform float uBreathing;
          uniform float uPixelRatio;

          attribute vec3 aBasePos;
          attribute vec3 aColor;
          attribute float aSize;
          attribute float aSpeed;
          attribute float aPhase;
          attribute float aAngle;

          varying vec3 vColor;
          varying float vAlpha;

          void main() {
            vColor = aColor;
            
            // Harmonic breathing pulsation
            float breathing = sin(uTime * 1.8 + aPhase) * 0.065 * uBreathing;
            vec3 pos = aBasePos * (1.0 + breathing);

            // Volumetric turbulence & radial displacement
            float r = length(pos);
            pos.x += sin(pos.y * 3.2 + uTime * 2.1 + aPhase) * 0.038 * r;
            pos.z += cos(pos.x * 3.2 + uTime * 2.1 + aPhase) * 0.038 * r;

            // Vortex movement around Y-axis
            float vortexAngle = (1.5 - min(r, 1.4)) * uVortex * sin(uTime * 0.85) * 0.45;
            float cosV = cos(vortexAngle);
            float sinV = sin(vortexAngle);
            mat2 rotY = mat2(cosV, -sinV, sinV, cosV);
            pos.xz = rotY * pos.xz;

            // Touch push displacement & concentric wave ripple
            vec3 toTouch = pos - uTouchPos;
            float distToTouch = length(toTouch);
            if (distToTouch < uTouchRadius && uTouchStrength > 0.01) {
              float pushFactor = (1.0 - distToTouch / uTouchRadius) * uTouchStrength;
              float wave = sin(distToTouch * 14.0 - uTime * 9.0) * 0.12;
              pos += normalize(toTouch) * (pushFactor * 0.55 + wave * pushFactor);
            }

            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;

            // Size attenuation with perspective
            gl_PointSize = aSize * (360.0 / -mvPosition.z) * uPixelRatio;

            // Core vs outer alpha modulation
            vAlpha = clamp(0.35 + sin(uTime * aSpeed + aPhase) * 0.45, 0.2, 0.95);
          }
        `,
        fragmentShader: `
          uniform float uColorShift;
          varying vec3 vColor;
          varying float vAlpha;

          vec3 rgb2hsv(vec3 c) {
            vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
            vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
            vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
            float d = q.x - min(q.w, q.y);
            float e = 1.0e-10;
            return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
          }

          vec3 hsv2rgb(vec3 c) {
            vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
            vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
            return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
          }

          void main() {
            vec2 coord = gl_PointCoord - vec2(0.5);
            float dist = length(coord);
            if (dist > 0.5) discard;

            // Soft glowing particle profile
            float soft = smoothstep(0.5, 0.0, dist);
            float core = pow(smoothstep(0.22, 0.0, dist), 2.5);
            float alpha = (pow(soft, 1.6) * 0.85 + core * 0.7) * vAlpha;

            // Chromatic hue shift
            vec3 hsv = rgb2hsv(vColor);
            hsv.x = fract(hsv.x + uColorShift);
            vec3 finalCol = hsv2rgb(hsv);

            gl_FragColor = vec4(finalCol, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const particlePoints = new THREE.Points(particleGeometry, particleMaterial);
      sphereGroup.add(particlePoints);

      // 4. Inner Luminous Core with Custom Fresnel Falloff
      const coreGeometry = new THREE.SphereGeometry(0.42, 32, 32);
      const coreMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0.0 },
          uColorShift: { value: 0.0 },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            vViewDir = normalize(-mvPos.xyz);
            gl_Position = projectionMatrix * mvPos;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform float uColorShift;
          varying vec3 vNormal;
          varying vec3 vViewDir;

          void main() {
            float fresnel = pow(1.0 - max(0.0, dot(vNormal, vViewDir)), 2.6);
            float pulse = 0.65 + 0.35 * sin(uTime * 3.2);

            vec3 baseCyan = vec3(0.0, 0.94, 1.0);
            vec3 deepViolet = vec3(0.61, 0.31, 0.87);
            vec3 color = mix(baseCyan, deepViolet, 0.5 + 0.5 * sin(uTime * 1.5 + uColorShift * 6.28));

            gl_FragColor = vec4(color * (fresnel * 1.4 + 0.3), (fresnel * 0.85 + 0.2) * pulse);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
      sphereGroup.add(coreMesh);

      // 5. Gimbal-Mounted Orbital Energy Rings
      const ringGroup = new THREE.Group();
      sphereGroup.add(ringGroup);

      const createOrbitalRing = (radius: number, tubeRadius: number, color: THREE.Color, rotX: number, rotY: number) => {
        const ringGeo = new THREE.TorusGeometry(radius, tubeRadius, 16, 120);
        const ringMat = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.45,
          blending: THREE.AdditiveBlending,
        });
        const mesh = new THREE.Mesh(ringGeo, ringMat);
        mesh.rotation.x = rotX;
        mesh.rotation.y = rotY;
        ringGroup.add(mesh);
        return mesh;
      };

      const ring1 = createOrbitalRing(1.18, 0.007, new THREE.Color(0x00f0ff), Math.PI / 4, 0);
      const ring2 = createOrbitalRing(1.28, 0.006, new THREE.Color(0x9d4edd), -Math.PI / 3, Math.PI / 6);
      const ring3 = createOrbitalRing(1.36, 0.005, new THREE.Color(0x06d6a0), Math.PI / 6, -Math.PI / 4);

      // 6. Ethereal Atmosphere Aura
      const atmosGeo = new THREE.SphereGeometry(1.52, 32, 32);
      const atmosMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0.0 },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            vViewDir = normalize(-mvPos.xyz);
            gl_Position = projectionMatrix * mvPos;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            float rim = pow(1.0 - max(0.0, dot(vNormal, vViewDir)), 3.8);
            vec3 glowCol = vec3(0.0, 0.65, 1.0);
            gl_FragColor = vec4(glowCol, rim * 0.35);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
      });
      const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
      sphereGroup.add(atmosMesh);

      // 7. Interactive Drag & Touch Handlers
      const onPointerDown = (e: MouseEvent | TouchEvent) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const now = Date.now();
        if (now - interactionRef.current.lastTapTime < 300) {
          // Double-tap burst reaction
          interactionRef.current.targetTouchStrength = 2.5;
          interactionRef.current.targetColorShift += 0.25;
          if (onTapBurst) onTapBurst();
        }
        interactionRef.current.lastTapTime = now;

        interactionRef.current.isDragging = true;
        interactionRef.current.lastPointerX = clientX;
        interactionRef.current.lastPointerY = clientY;

        // Map touch position to normalized 3D space
        const rect = container.getBoundingClientRect();
        const normX = ((clientX - rect.left) / rect.width) * 2 - 1;
        const normY = -(((clientY - rect.top) / rect.height) * 2 - 1);
        interactionRef.current.touchPos.set(normX * 1.1, normY * 1.1, 0.4);
        interactionRef.current.targetTouchStrength = 1.0;

        if ('touches' in e && e.touches.length === 2) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          interactionRef.current.pinchStartDist = Math.hypot(dx, dy);
        }
      };

      const onPointerMove = (e: MouseEvent | TouchEvent) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const rect = container.getBoundingClientRect();
        const normX = ((clientX - rect.left) / rect.width) * 2 - 1;
        const normY = -(((clientY - rect.top) / rect.height) * 2 - 1);
        interactionRef.current.touchPos.set(normX * 1.1, normY * 1.1, 0.4);

        if ('touches' in e && e.touches.length === 2 && interactionRef.current.pinchStartDist > 0) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const dist = Math.hypot(dx, dy);
          const ratio = dist / interactionRef.current.pinchStartDist;
          interactionRef.current.targetZoom = Math.max(0.65, Math.min(2.2, ratio));
          return;
        }

        if (interactionRef.current.isDragging) {
          const dx = clientX - interactionRef.current.lastPointerX;
          const dy = clientY - interactionRef.current.lastPointerY;

          interactionRef.current.targetRY += dx * 0.007;
          interactionRef.current.targetRX += dy * 0.007;

          interactionRef.current.lastPointerX = clientX;
          interactionRef.current.lastPointerY = clientY;
        }
      };

      const onPointerUp = () => {
        interactionRef.current.isDragging = false;
        interactionRef.current.pinchStartDist = 0;
        interactionRef.current.targetTouchStrength = 0.0;
      };

      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        const next = Math.max(0.65, Math.min(2.2, interactionRef.current.targetZoom - e.deltaY * 0.0015));
        interactionRef.current.targetZoom = next;
      };

      container.addEventListener('mousedown', onPointerDown);
      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('mouseup', onPointerUp);
      container.addEventListener('touchstart', onPointerDown, { passive: true });
      window.addEventListener('touchmove', onPointerMove, { passive: true });
      window.addEventListener('touchend', onPointerUp);
      container.addEventListener('wheel', onWheel, { passive: false });

      // Resize Observer
      const resizeObserver = new ResizeObserver(() => {
        if (!container) return;
        width = container.clientWidth || 412;
        height = container.clientHeight || 892;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      });
      resizeObserver.observe(container);

      // 8. Animation & Render Loop
      const clock = new THREE.Clock();

      const animate = () => {
        if (!isRunning) return;

        // Skip render cycle if document is hidden or state is not active (crucial for Galaxy M11 battery optimization)
        if (document.hidden || !isActive) {
          animFrameId = requestAnimationFrame(animate);
          return;
        }

        const elapsedTime = clock.getElapsedTime();

        // Smooth inertial interpolation for rotation & zoom
        const ctrl = interactionRef.current;
        ctrl.currentRX += (ctrl.targetRX - ctrl.currentRX) * 0.075;
        ctrl.currentRY += (ctrl.targetRY - ctrl.currentRY) * 0.075;
        ctrl.currentZoom += (ctrl.targetZoom - ctrl.currentZoom) * 0.075;
        ctrl.currentColorShift += (ctrl.targetColorShift - ctrl.currentColorShift) * 0.05;
        ctrl.touchStrength += (ctrl.targetTouchStrength - ctrl.touchStrength) * 0.1;

        sphereGroup.rotation.x = ctrl.currentRX;
        sphereGroup.rotation.y = ctrl.currentRY + elapsedTime * 0.12;

        camera.position.z = 3.6 / ctrl.currentZoom;

        // Update Shaders
        particleMaterial.uniforms.uTime.value = elapsedTime;
        particleMaterial.uniforms.uTouchPos.value.copy(ctrl.touchPos);
        particleMaterial.uniforms.uTouchStrength.value = ctrl.touchStrength;
        particleMaterial.uniforms.uColorShift.value = ctrl.currentColorShift;

        coreMaterial.uniforms.uTime.value = elapsedTime;
        coreMaterial.uniforms.uColorShift.value = ctrl.currentColorShift;

        atmosMat.uniforms.uTime.value = elapsedTime;

        // Orbit ring independent rotations
        ring1.rotation.z += 0.008;
        ring2.rotation.z -= 0.012;
        ring3.rotation.z += 0.006;

        renderer.render(scene, camera);
        animFrameId = requestAnimationFrame(animate);
      };

      animate();

      return () => {
        isRunning = false;
        cancelAnimationFrame(animFrameId);
        resizeObserver.disconnect();

        container.removeEventListener('mousedown', onPointerDown);
        window.removeEventListener('mousemove', onPointerMove);
        window.removeEventListener('mouseup', onPointerUp);
        container.removeEventListener('touchstart', onPointerDown);
        window.removeEventListener('touchmove', onPointerMove);
        window.removeEventListener('touchend', onPointerUp);
        container.removeEventListener('wheel', onWheel);

        // Clean GPU disposal
        particleGeometry.dispose();
        particleMaterial.dispose();
        coreGeometry.dispose();
        coreMaterial.dispose();
        atmosGeo.dispose();
        atmosMat.dispose();
        renderer.dispose();
      };
    }, [isActive, onTapBurst]);

    return (
      <div
        ref={containerRef}
        className={`relative w-full h-full overflow-hidden select-none touch-none ${className}`}
        style={{ cursor: 'grab' }}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    );
  }
);
