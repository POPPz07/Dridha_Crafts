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

    // ── Upright Spine: Subtle Hand-Shaped Asymmetries & Artisan Contours ──
    // Hand-planed edges, rasped shoulders, and manual fret-sawed bottom arch.

    // Start at bottom-left outer foot (slight natural workshop width variance)
    shape.moveTo(-1.31, -1.05);

    // Left outer edge up to shoulder (subtle grain-aligned edge)
    shape.lineTo(-1.305, 3.48);
    // Left shoulder hand-rounded curve
    shape.quadraticCurveTo(-1.31, 4.16, -0.72, 4.165);

    // Top edge across with gentle hand-sanded crown/camber
    shape.lineTo(0.68, 4.142);
    // Right shoulder hand-rounded curve (subtle organic difference from rasping)
    shape.quadraticCurveTo(1.295, 4.135, 1.295, 3.52);

    // Right edge down to top of interlocking slot
    shape.lineTo(1.295, 0.225);
    // Inward slot cut (right half, hand-chiseled slot tolerance)
    shape.lineTo(0.008, 0.225);
    shape.lineTo(0.008, -0.165);
    shape.lineTo(1.295, -0.165);

    // Right edge down to bottom-right outer foot
    shape.lineTo(1.29, -1.05);

    // Right foot flat base (hand-cut foot width ≈ 0.93)
    shape.lineTo(0.93, -1.05);

    // Arched cutout between the two feet (handcrafted arch apex slightly off-center at X = 0.022)
    shape.quadraticCurveTo(0.022, -0.238, -0.97, -1.05);

    // Left foot flat base (hand-cut foot width ≈ 0.97) back to start
    shape.lineTo(-1.31, -1.05);

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
        roughness={0.54}
        metalness={0.01}
      />
    </mesh>
  );
}

/**
 * Piece 2: Horizontal Cradle / Perch
 * Features:
 * - Extended rear support (L_rear = 2.55) calibrated so rear edge touches ground level with the feet
 * - Hand-rasped chamfers with organic workshop variances
 * - Mating slot on the LEFT half (x from -1.31 to 0.008)
 * - 5 radially angled triangular cutouts carved with artisanal saw tolerances:
 *   1. Extreme-left pointed triangle (points outward to the left)
 *   2. Left-slanting triangle (tilts diagonally between left & center)
 *   3. Middle triangle (cable notch, hand-centered)
 *   4. Right-slanting triangle (tilts diagonally between center & right)
 *   5. Extreme-right pointed triangle (points outward to the right)
 */
function CradlePiece() {
  const geometry = useMemo(() => {
    const shape = new Shape();

    // Start at rear-left chamfer (hand-rasped bevel)
    shape.moveTo(-0.92, -2.55);

    // Rear straight edge across to right chamfer
    shape.lineTo(0.88, -2.552);
    // Rear-right chamfer (subtly softer curve)
    shape.lineTo(1.29, -2.14);

    // Right outer edge forward
    shape.lineTo(1.295, 1.14);
    // Front-right hook outer chamfer
    shape.lineTo(1.155, 1.675);

    // Front-right hook flat tip
    shape.lineTo(0.86, 1.675);

    // Inner edge of right hook
    shape.lineTo(0.86, 1.24);

    // ── 5. Extreme Right Pointed Triangle Cutout (points outward to the right) ──
    shape.lineTo(1.06, 1.09);
    shape.lineTo(0.81, 0.94);

    // Transition wall
    shape.lineTo(0.71, 0.84);

    // ── 4. Right Slanting Triangle Cutout (tilts diagonally +45°) ──
    shape.lineTo(0.87, 0.67);
    shape.lineTo(0.51, 0.645);

    // Transition wall (resting shelf in front of backrest)
    shape.lineTo(0.19, 0.645);

    // ── 3. Middle Triangle Cutout (hand-notched cable pass-through, slightly offset) ──
    shape.lineTo(-0.015, 0.365);
    shape.lineTo(-0.21, 0.655);

    // Transition wall
    shape.lineTo(-0.53, 0.655);

    // ── 2. Left Slanting Triangle Cutout (tilts diagonally -45°) ──
    shape.lineTo(-0.87, 0.685);
    shape.lineTo(-0.73, 0.855);

    // Transition wall
    shape.lineTo(-0.83, 0.955);

    // ── 1. Extreme Left Pointed Triangle Cutout (points outward to the left) ──
    shape.lineTo(-1.06, 1.11);
    shape.lineTo(-0.84, 1.26);

    // Inner edge of left hook forward to tip
    shape.lineTo(-0.84, 1.685);
    // Front-left hook flat tip (subtle hand-cut discrepancy in tip width)
    shape.lineTo(-1.14, 1.685);
    // Front-left hook outer chamfer
    shape.lineTo(-1.31, 1.16);

    // Left outer edge back towards slot
    shape.lineTo(-1.31, 0.81);

    // Mating slot on left half (hand-chiseled joint)
    shape.lineTo(-1.31, 0.175);
    shape.lineTo(-0.008, 0.175);
    shape.lineTo(-0.008, -0.165);
    shape.lineTo(-1.31, -0.165);

    // Left outer edge back to rear chamfer
    shape.lineTo(-1.31, -2.16);
    shape.lineTo(-0.92, -2.55);

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
        roughness={0.54}
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
        {/* Piece 1: Upright Backrest (Spine) — tilted backwards ~22° with subtle organic roll */}
        <group position={[0, 0, 0]} rotation={[-0.38, 0.006, -0.005]}>
          <SpinePiece />
        </group>

        {/* Piece 2: Horizontal Cradle (Perch) — interlocks through the slot with authentic hand-cut joint tolerance */}
        <group position={[0, 0, 0]} rotation={[Math.PI / 2 - 0.40, 0.007, 0.009]}>
          <group position={[0.006, 0.05, 0]}>
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
