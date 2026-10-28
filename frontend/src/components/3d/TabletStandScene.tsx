"use client";

import { ContactShadows, Float, OrbitControls, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { ExtrudeGeometry, Path, Shape } from "three";
import type { Group } from "three";

const pineWarm = "#dfa663";
const pineStopper = "#c68644";
const dowelColor = "#d69858";

/**
 * Piece 1: Main Sloping Deck (Tablet / Laptop Board)
 * Authentic details matching handcrafted reference photos:
 * - Outer boundary: Width = 4.2 (X: -2.1 to +2.1), Length = 4.8 (Y: -2.4 to +2.4)
 * - 4 corners chamfered at 45°
 * - Two lateral edge notches with horizontal wooden dowel pins across them
 * - Cutout 1: Front rectangular window smoothly curving around the central wooden tongue
 * - Cutout 2: Sharp 4-point Diamond (Rhombus) through-hole in the center of the wooden tongue
 * - Cutouts 3-8: 3 pairs of round adjustment holes on the side wings (X = ±1.30, Y = 1.22, 1.60, 1.98)
 * - Raised front stopper block mounted on the front rail to retain a tablet or laptop
 */
function TabletDeckPiece() {
  const geometry = useMemo(() => {
    const shape = new Shape();

    // ── Outer Boundary with 45° Chamfered Corners and Lateral Notches ──
    // Bottom-left chamfer
    shape.moveTo(-2.10, -1.80);
    shape.lineTo(-1.50, -2.40);

    // Front lip edge
    shape.lineTo(1.50, -2.40);

    // Bottom-right chamfer
    shape.lineTo(2.10, -1.80);

    // Right outer edge (plain, straight)
    shape.lineTo(2.10, 1.80);

    // Top-right chamfer
    shape.lineTo(1.50, 2.40);

    // Rear top edge
    shape.lineTo(-1.50, 2.40);

    // Top-left chamfer
    shape.lineTo(-2.10, 1.80);

    // Left outer edge (plain, straight)
    shape.lineTo(-2.10, -1.80);

    // ── Cutout 1: Front Window + Smooth Sweeping Curve (reduced curvature dimensions) ──
    // Continuous wide curve meeting the side rails at Y = 0.28 and sweeping gracefully around the central diamond tongue (apex at Y = -0.46)
    const frontVoidHole = new Path();
    frontVoidHole.moveTo(-1.45, -1.80); // Bottom-left inner corner
    frontVoidHole.lineTo(1.45, -1.80);  // Along front rail inner edge
    frontVoidHole.lineTo(1.45, 0.28);   // Along right rail inner edge

    // Smooth continuous concave curve sweeping down and cupping under the diamond (apex at Y = -0.46)
    frontVoidHole.bezierCurveTo(1.05, -0.22, 0.50, -0.46, 0.00, -0.46);
    frontVoidHole.bezierCurveTo(-0.50, -0.46, -1.05, -0.22, -1.45, 0.28);

    // Straight down along left rail inner edge back to start
    frontVoidHole.lineTo(-1.45, -1.80);
    frontVoidHole.closePath();
    shape.holes.push(frontVoidHole);

    // ── Cutout 2: Sharp 4-Point Diamond (Rhombus) Cutout (1.7x scaled) ──
    // Positioned inside the solid wooden tongue between Y = -0.134 and Y = 1.634 (center Y = 0.75)
    const diamondHole = new Path();
    diamondHole.moveTo(0.00, -0.134); // Front tip
    diamondHole.lineTo(0.935, 0.75);  // Right tip
    diamondHole.lineTo(0.00, 1.634);  // Rear tip
    diamondHole.lineTo(-0.935, 0.75); // Left tip
    diamondHole.closePath();
    shape.holes.push(diamondHole);

    // ── Cutouts 3-8: 3 Pairs of Round Adjustment Holes on Side Wings ──
    const holeRadius = 0.115;
    const holeYPositions = [1.22, 1.60, 1.98]; // Hole 1 (low angle), Hole 2 (mid), Hole 3 (steep)

    // Left wing holes (X = -1.30)
    for (const hy of holeYPositions) {
      const hole = new Path();
      hole.absarc(-1.30, hy, holeRadius, 0, Math.PI * 2, true);
      shape.holes.push(hole);
    }

    // Right wing holes (X = +1.30)
    for (const hy of holeYPositions) {
      const hole = new Path();
      hole.absarc(1.30, hy, holeRadius, 0, Math.PI * 2, true);
      shape.holes.push(hole);
    }

    return new ExtrudeGeometry(shape, {
      depth: 0.22,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.015,
      bevelThickness: 0.015,
    });
  }, []);

  return (
    <group>
      <mesh
        castShadow
        receiveShadow
        geometry={geometry}
        position={[0, 0, -0.11]}
      >
        <meshStandardMaterial
          color={pineWarm}
          roughness={0.52}
          metalness={0.01}
        />
      </mesh>

      {/* Front Tablet / Laptop Stopper Block */}
      <RoundedBox
        castShadow
        receiveShadow
        args={[0.88, 0.28, 0.18]}
        position={[0, -2.25, 0.18]}
        radius={0.02}
        smoothness={2}
      >
        <meshStandardMaterial
          color={pineStopper}
          roughness={0.50}
          metalness={0.01}
        />
      </RoundedBox>


    </group>
  );
}

/**
 * Piece 2: Arched Support Leg / Prop
 * Placed entirely on the underside of the deck:
 * - Flat top edge positioned beneath Hole 1
 * - Arched cutout between two pointed feet that touch the table surface
 * - Does not penetrate the deck slab; stays strictly behind/below it
 */
function TabletSupportLeg({ legLength = 1.61 }: { legLength?: number }) {
  const geometry = useMemo(() => {
    const shape = new Shape();

    // Local coordinates:
    // Top edge at Y = 0 (sits directly under the deck's Hole 1)
    // Feet at Y = -legLength
    // Width = 2.90 (from X = -1.45 to +1.45)
    // Parabolic arch peaks at ~52% of leg length

    // Top-left corner
    shape.moveTo(-1.42, 0);

    // Top flat edge across
    shape.lineTo(1.42, 0);

    // Right outer edge tapering down to right foot
    shape.lineTo(1.50, -legLength);

    // Right foot flat base
    shape.lineTo(1.08, -legLength);

    // Parabolic arch cutout between the two feet (peaking at ~52% of height)
    const archApexY = -legLength * 0.52;
    shape.quadraticCurveTo(0.00, archApexY, -1.08, -legLength);

    // Left foot flat base
    shape.lineTo(-1.50, -legLength);

    // Left outer edge tapering up to top-left corner
    shape.lineTo(-1.42, 0);

    return new ExtrudeGeometry(shape, {
      depth: 0.18,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.015,
      bevelThickness: 0.015,
    });
  }, [legLength]);

  return (
    <mesh
      castShadow
      receiveShadow
      geometry={geometry}
      position={[0, 0, -0.18]}
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
 * Assembled Tablet Stand:
 * 1. Deck is tilted at 25.5° comfortable laptop / tablet typing incline.
 * 2. Front lip rests directly on the ground plane (Y = -0.85).
 * 3. Support leg props underneath from Hole 1, tilting back 14.1° to ground (Y = -0.85).
 * 4. Wide split (3.66 units) provides natural, rock-solid ergonomic balance.
 * 5. ONLY the two cylindrical wooden peg extensions fill the holes — no board clipping.
 */
function TabletStandAssembly() {
  const model = useRef<Group>(null);

  // Slow continuous turntable rotation
  useFrame((_state, delta) => {
    if (model.current) model.current.rotation.y += delta * 0.12;
  });

  return (
    <Float speed={1.05} rotationIntensity={0.05} floatIntensity={0.10}>
      <group
        ref={model}
        position={[0, -0.15, 0]}
        rotation={[0.08, -0.52, 0]}
        scale={0.76}
      >
        {/* Piece 1: Sloping Main Deck — inclined at 25.5° (rotX = -1.1257 rad) */}
        <group position={[0, 0.2825, 0]} rotation={[-1.1257, 0, 0]}>
          <TabletDeckPiece />

          {/* Tenon Pin 1 (Right): Round wooden peg filling Hole 1 */}
          <mesh position={[1.30, 1.22, 0.015]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.11, 0.11, 0.24, 16]} />
            <meshStandardMaterial color={dowelColor} roughness={0.55} />
          </mesh>

          {/* Tenon Pin 2 (Left): Round wooden peg filling Hole 1 */}
          <mesh position={[-1.30, 1.22, 0.015]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.11, 0.11, 0.24, 16]} />
            <meshStandardMaterial color={dowelColor} roughness={0.55} />
          </mesh>
        </group>

        {/* Piece 2: Arched Support Leg — propped underneath Hole 1 to ground */}
        {/* World pivot at underside of Hole 1: Y = 0.7085, Z = -1.1485 */}
        {/* Tilts backward 14.1° from vertical (rotX = +0.2461 rad) */}
        <group position={[0, 0.7085, -1.1485]} rotation={[0.2461, 0, 0]}>
          <TabletSupportLeg legLength={1.61} />
        </group>
      </group>
    </Float>
  );
}

export function TabletStandScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [5.0, 3.4, 6.2], fov: 36 }}
      aria-label="Interactive 3D model of the Dridha multi-angle wooden tablet stand and easel"
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
      <TabletStandAssembly />
      <ContactShadows
        position={[0, -0.80, 0]}
        opacity={0.42}
        scale={8.8}
        blur={2.4}
        far={3.5}
      />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={0.65}
        maxPolarAngle={1.82}
      />
    </Canvas>
  );
}
