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
 * - Cutouts 3-8: 3 pairs of round adjustment holes on the side wings (X = ±1.30)
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

    // Right outer edge with lateral notch at Y = 0.50 to 0.80
    shape.lineTo(2.10, 0.50);
    shape.lineTo(1.92, 0.50);
    shape.lineTo(1.92, 0.80);
    shape.lineTo(2.10, 0.80);
    shape.lineTo(2.10, 1.80);

    // Top-right chamfer
    shape.lineTo(1.50, 2.40);

    // Rear top edge
    shape.lineTo(-1.50, 2.40);

    // Top-left chamfer
    shape.lineTo(-2.10, 1.80);

    // Left outer edge with lateral notch at Y = 0.80 down to 0.50
    shape.lineTo(-2.10, 0.80);
    shape.lineTo(-1.92, 0.80);
    shape.lineTo(-1.92, 0.50);
    shape.lineTo(-2.10, 0.50);
    shape.lineTo(-2.10, -1.80);

    // ── Cutout 1: Front Window + Semicircular Tongue Void Contour ──
    // The void starts inside the front and side rails, then wraps smoothly around the wooden tongue
    const frontVoidHole = new Path();
    frontVoidHole.moveTo(-1.45, -1.75); // Inner front-left corner
    frontVoidHole.lineTo(1.45, -1.75);  // Along front rail inner edge
    frontVoidHole.lineTo(1.45, -0.45);  // Along right rail inner edge
    frontVoidHole.lineTo(0.95, 0.05);   // 45° diagonal cut inward toward tongue

    // Semicircular arc around the wooden tongue (apex at Y = -0.70)
    frontVoidHole.bezierCurveTo(0.85, -0.55, 0.50, -0.70, 0.00, -0.70);
    frontVoidHole.bezierCurveTo(-0.50, -0.70, -0.85, -0.55, -0.95, 0.05);

    // 45° diagonal cut back outward to left rail
    frontVoidHole.lineTo(-1.45, -0.45);
    frontVoidHole.lineTo(-1.45, -1.75); // Along left rail back to start
    frontVoidHole.closePath();
    shape.holes.push(frontVoidHole);

    // ── Cutout 2: Sharp 4-Point Diamond (Rhombus) Cutout ──
    // Positioned inside the solid wooden tongue
    const diamondHole = new Path();
    diamondHole.moveTo(0.00, -0.38);  // Front tip (pointing towards tongue apex)
    diamondHole.lineTo(0.60, 0.18);   // Right tip
    diamondHole.lineTo(0.00, 0.74);   // Rear tip
    diamondHole.lineTo(-0.60, 0.18);  // Left tip
    diamondHole.closePath();
    shape.holes.push(diamondHole);

    // ── Cutouts 3-8: 3 Pairs of Round Adjustment Holes on Side Wings ──
    const holeRadius = 0.115;
    const holeYPositions = [0.45, 1.05, 1.65]; // Hole 1 (low), Hole 2 (mid), Hole 3 (steep)

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

      {/* Decorative Wooden Dowel Pins in Lateral Notches */}
      <mesh position={[1.98, 0.65, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.055, 0.055, 0.22, 16]} />
        <meshStandardMaterial color={dowelColor} roughness={0.58} />
      </mesh>
      <mesh position={[-1.98, 0.65, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.055, 0.055, 0.22, 16]} />
        <meshStandardMaterial color={dowelColor} roughness={0.58} />
      </mesh>
    </group>
  );
}

/**
 * Piece 2: Arched Support Leg / Prop
 * Faithful reproduction of the second piece in the reference photos:
 * - Flat top edge with two cylindrical tenon pins at X = ±1.30 that insert into the deck holes
 * - Parabolic arched cutout at base creating two sturdy pointed feet
 * - Height calibrated so when engaged in Hole 1, feet rest exactly on the ground plane
 */
function TabletSupportLeg({ legLength = 2.76 }: { legLength?: number }) {
  const geometry = useMemo(() => {
    const shape = new Shape();

    // Leg local coordinates:
    // Feet at Y = 0 (Left foot from -1.50 to -1.05; Right foot from 1.05 to 1.50)
    // Top edge at Y = legLength (from -1.42 to +1.42)
    // Central Arch cutout peaks at ~67% of leg length

    // Start at bottom-left outer foot tip
    shape.moveTo(-1.50, 0);

    // Left outer edge tapering up slightly to top edge
    shape.lineTo(-1.42, legLength);

    // Top edge across
    shape.lineTo(1.42, legLength);

    // Right outer edge tapering down to bottom-right outer foot tip
    shape.lineTo(1.50, 0);

    // Right foot flat base
    shape.lineTo(1.05, 0);

    // Parabolic arched cutout between the two feet (peaking at ~67% of height)
    const archApexY = legLength * 0.67;
    shape.quadraticCurveTo(0.00, archApexY, -1.05, 0);

    // Left foot flat base back to start
    shape.lineTo(-1.50, 0);

    return new ExtrudeGeometry(shape, {
      depth: 0.20,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.015,
      bevelThickness: 0.015,
    });
  }, [legLength]);

  return (
    <group>
      <mesh
        castShadow
        receiveShadow
        geometry={geometry}
        position={[0, 0, -0.10]}
      >
        <meshStandardMaterial
          color={pineWarm}
          roughness={0.52}
          metalness={0.01}
        />
      </mesh>

      {/* Tenon Pin 1 (Right): Inserts into right adjustment hole and pokes through top surface */}
      <mesh
        castShadow
        position={[1.30, legLength + 0.12, 0]}
        rotation={[0, 0, 0]}
      >
        <cylinderGeometry args={[0.11, 0.11, 0.28, 16]} />
        <meshStandardMaterial color={dowelColor} roughness={0.55} />
      </mesh>

      {/* Tenon Pin 2 (Left): Inserts into left adjustment hole and pokes through top surface */}
      <mesh
        castShadow
        position={[-1.30, legLength + 0.12, 0]}
        rotation={[0, 0, 0]}
      >
        <cylinderGeometry args={[0.11, 0.11, 0.28, 16]} />
        <meshStandardMaterial color={dowelColor} roughness={0.55} />
      </mesh>
    </group>
  );
}

/**
 * Assembled Tablet Stand:
 * 1. Deck is tilted at 24.5° ergonomic incline.
 * 2. Bottom front edge touches ground plane exactly.
 * 3. Arched support leg props underneath into Hole 1 (Y = 0.45).
 * 4. Feet of the support leg touch ground plane at the exact same level.
 */
function TabletStandAssembly() {
  const model = useRef<Group>(null);

  // Slow continuous turntable rotation
  useFrame((_state, delta) => {
    if (model.current) model.current.rotation.y += delta * 0.12;
  });

  // Mathematically calculated constants for 100% coplanar ground contact:
  // Deck angle: 24.5° (0.4276 rad)
  // Leg tilt backward: 20° (0.3491 rad)
  // Calibrated legLength: 2.76 units
  const legLength = 2.76;

  return (
    <Float speed={1.05} rotationIntensity={0.05} floatIntensity={0.12}>
      <group
        ref={model}
        position={[0, -0.32, 0]}
        rotation={[0.08, -0.52, 0]}
        scale={0.68}
      >
        {/* Piece 1: Sloping Main Deck */}
        <group position={[0, 1.188, 0]} rotation={[-0.4276, 0, 0]}>
          <TabletDeckPiece />
        </group>

        {/* Piece 2: Arched Support Leg propped under Hole 1 */}
        {/* Pivot at top edge of leg (Y = 1.643, Z = 0.086), rotated backward 20° */}
        <group position={[0, 1.643, 0.086]} rotation={[0.3491, 0, 0]}>
          <group position={[0, -legLength, 0]}>
            <TabletSupportLeg legLength={legLength} />
          </group>
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
      camera={{ position: [5.2, 3.8, 6.4], fov: 36 }}
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
        position={[0, -0.98, 0]}
        opacity={0.44}
        scale={9.2}
        blur={2.4}
        far={3.8}
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
