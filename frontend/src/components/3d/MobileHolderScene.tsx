"use client";

import { ContactShadows, Float, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { ExtrudeGeometry, Shape } from "three";
import type { Group } from "three";

const pineWarm = "#dfa663";

/**
 * Piece 1: Upright Spine / Backrest
 * Features:
 * - Width = 2.6 (from x = -1.3 to +1.3)
 * - Rounded top shoulders
 * - Mating slot on the RIGHT half (x from 0 to 1.3)
 *   Subtly visible by 0.05 units above the cradle surface (y = 0.22)
 * - Solid on the LEFT half (x from -1.3 to 0)
 * - Arched foot cutout at the bottom resting at ground level
 */
function SpinePiece() {
  const geometry = useMemo(() => {
    const shape = new Shape();

    // Start at bottom-left outer foot
    shape.moveTo(-1.3, -1.05);

    // Left outer edge up to shoulder
    shape.lineTo(-1.3, 3.5);
    shape.quadraticCurveTo(-1.3, 4.15, -0.7, 4.15);

    // Top edge across
    shape.lineTo(0.7, 4.15);
    shape.quadraticCurveTo(1.3, 4.15, 1.3, 3.5);

    // Right edge down to top of interlocking slot (subtly revealed by ~0.05 units above cradle)
    shape.lineTo(1.3, 0.22);
    // Inward slot cut (right half, from x = 1.3 to x = 0)
    shape.lineTo(0.0, 0.22);
    shape.lineTo(0.0, -0.17);
    shape.lineTo(1.3, -0.17);

    // Right edge down to bottom-right outer foot
    shape.lineTo(1.3, -1.05);

    // Right foot flat base
    shape.lineTo(0.95, -1.05);

    // Arched cutout between the two feet
    shape.quadraticCurveTo(0.0, -0.25, -0.95, -1.05);

    // Left foot flat base back to start
    shape.lineTo(-1.3, -1.05);

    return new ExtrudeGeometry(shape, {
      depth: 0.32,
      bevelEnabled: true,
      bevelSegments: 4,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    });
  }, []);

  return (
    <mesh
      castShadow
      receiveShadow
      geometry={geometry}
      position={[0, 0, -0.16]}
      rotation={[0, 0, 0]}
    >
      <meshStandardMaterial
        color={pineWarm}
        roughness={0.52}
        metalness={0.01}
      />
    </mesh>
  );
}

/**
 * Piece 2: Horizontal Cradle / Perch
 * Features:
 * - Extended rear support (L_rear = 2.55) calibrated so rear edge touches ground level with the feet
 * - Chamfered rear corners
 * - Mating slot on the LEFT half (x from -1.3 to 0), subtly visible by 0.05 units in front of the spine
 * - Solid on the RIGHT half (x from 0 to 1.3)
 * - Slightly increased front resting width in front of the backrest
 * - 5 radially angled triangular cutouts:
 *   1. Extreme-left pointed triangle (points outward to the left)
 *   2. Left-slanting triangle (tilts diagonally between left & center)
 *   3. Middle triangle (points straight back for the phone charging cable)
 *   4. Right-slanting triangle (tilts diagonally between center & right)
 *   5. Extreme-right pointed triangle (points outward to the right)
 */
function CradlePiece() {
  const geometry = useMemo(() => {
    const shape = new Shape();

    // Start at rear-left chamfer (extended rear length L_rear = 2.55)
    shape.moveTo(-0.9, -2.55);

    // Rear straight edge across to right chamfer
    shape.lineTo(0.9, -2.55);
    // Rear-right chamfer
    shape.lineTo(1.3, -2.15);

    // Right outer edge forward
    shape.lineTo(1.3, 1.15);
    // Front-right hook outer chamfer
    shape.lineTo(1.15, 1.68);

    // Front-right hook flat tip
    shape.lineTo(0.85, 1.68);

    // Inner edge of right hook
    shape.lineTo(0.85, 1.25);

    // ── 5. Extreme Right Pointed Triangle Cutout (points outward to the right) ──
    shape.lineTo(1.05, 1.10);
    shape.lineTo(0.82, 0.95);

    // Transition wall
    shape.lineTo(0.72, 0.85);

    // ── 4. Right Slanting Triangle Cutout (tilts diagonally +45°) ──
    shape.lineTo(0.86, 0.68);
    shape.lineTo(0.52, 0.65);

    // Transition wall (widened resting shelf in front of backrest)
    shape.lineTo(0.20, 0.65);

    // ── 3. Middle Triangle Cutout (points straight backward for phone charging cable) ──
    shape.lineTo(0.00, 0.38);
    shape.lineTo(-0.20, 0.65);

    // Transition wall
    shape.lineTo(-0.52, 0.65);

    // ── 2. Left Slanting Triangle Cutout (tilts diagonally -45°) ──
    shape.lineTo(-0.86, 0.68);
    shape.lineTo(-0.72, 0.85);

    // Transition wall
    shape.lineTo(-0.82, 0.95);

    // ── 1. Extreme Left Pointed Triangle Cutout (points outward to the left) ──
    shape.lineTo(-1.05, 1.10);
    shape.lineTo(-0.85, 1.25);

    // Inner edge of left hook forward to tip
    shape.lineTo(-0.85, 1.68);
    // Front-left hook flat tip
    shape.lineTo(-1.15, 1.68);
    // Front-left hook outer chamfer
    shape.lineTo(-1.3, 1.15);

    // Left outer edge back towards slot
    shape.lineTo(-1.3, 0.82);

    // Mating slot on left half (centered at y = 0, subtle 0.05 reveal)
    shape.lineTo(-1.3, 0.17);
    shape.lineTo(0.0, 0.17);
    shape.lineTo(0.0, -0.17);
    shape.lineTo(-1.3, -0.17);

    // Left outer edge back to rear chamfer
    shape.lineTo(-1.3, -2.15);
    shape.lineTo(-0.9, -2.55);

    return new ExtrudeGeometry(shape, {
      depth: 0.32,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.015,
      bevelThickness: 0.015,
    });
  }, []);

  return (
    <mesh
      castShadow
      receiveShadow
      geometry={geometry}
      position={[0, 0, -0.16]}
      rotation={[0, 0, 0]}
    >
      <meshStandardMaterial
        color={pineWarm}
        roughness={0.52}
        metalness={0.01}
      />
    </mesh>
  );
}

/**
 * Assembled Mobile Stand:
 * 1. Slightly widened flat phone resting ledge in front of the vertical backrest.
 * 2. 5 progressively angled triangular cutouts (extreme left, slanting left, straight center cable notch, slanting right, extreme right).
 * 3. Left half (x: -1.3 to 0): Horizontal cradle's notch is subtly visible in front (~0.05 units).
 * 4. Right half (x: 0 to 1.3): Vertical backrest's notch is subtly visible above the cradle (~0.05 units).
 * 5. The rear edge and the front feet rest on the exact same ground level.
 */
function MobileStandAssembly() {
  const model = useRef<Group>(null);

  // Slow continuous turntable rotation
  useFrame((_state, delta) => {
    if (model.current) model.current.rotation.y += delta * 0.12;
  });

  return (
    <Float speed={1.1} rotationIntensity={0.06} floatIntensity={0.12}>
      <group
        ref={model}
        position={[0, -0.45, 0]}
        rotation={[0.08, -0.6, 0]}
        scale={0.64}
      >
        {/* Piece 1: Upright Backrest (Spine) — tilted backwards ~22° */}
        <group position={[0, 0, 0]} rotation={[-0.38, 0, 0]}>
          <SpinePiece />
        </group>

        {/* Piece 2: Horizontal Cradle (Perch) — tilted ~23°, with a subtle 0.05 offset */}
        <group position={[0, 0, 0]} rotation={[Math.PI / 2 - 0.40, 0, 0]}>
          <group position={[0, 0.05, 0]}>
            <CradlePiece />
          </group>
        </group>
      </group>
    </Float>
  );
}

export function MobileHolderScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [4.6, 2.6, 6.6], fov: 36 }}
      aria-label="Interactive 3D model of the Dridha two-piece interlocking wooden mobile stand"
      className="w-full h-full cursor-grab active:cursor-grabbing"
    >
      <color attach="background" args={["#eedfc8"]} />
      <hemisphereLight args={["#fff4dd", "#23432c", 1.8]} />
      <directionalLight
        castShadow
        position={[5, 7.5, 4.5]}
        intensity={2.3}
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight
        position={[-4.5, 2.5, -3]}
        intensity={0.75}
        color="#d9924c"
      />
      <MobileStandAssembly />
      <ContactShadows
        position={[0, -1.05, 0]}
        opacity={0.42}
        scale={8.5}
        blur={2.4}
        far={3.8}
      />
      <OrbitControls
        target={[0, 0.42, 0]}
        enablePan={false}
        enableZoom={false}
        minPolarAngle={0.65}
        maxPolarAngle={1.82}
      />
    </Canvas>
  );
}
