"use client";

import { ContactShadows, Float, OrbitControls, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { ExtrudeGeometry, Path, Shape } from "three";
import type { Group } from "three";

import {
  type FinishOption,
  WOOD_FINISH_THEMES,
  STUDIO_3D_ENV,
} from "./woodMaterials";

export type { FinishOption };

/**
 * Piece 1: Main Sloping Deck (Tablet / Laptop Board)
 */
function TabletDeckPiece({ finish = "transparent" }: { finish?: FinishOption }) {
  const cfg = WOOD_FINISH_THEMES[finish] || WOOD_FINISH_THEMES.transparent;
  const geometry = useMemo(() => {
    const shape = new Shape();

    // ── Outer Boundary: Subtle Artisan Asymmetries & Hand-Planed Edges ──
    // In authentic handcrafted woodworking, edge lines, chamfers, and corners have
    // subtle organic variations from manual sawing, rasping, and hand-sanding.
    
    // Bottom-left chamfer (slightly steeper hand-rasp cut)
    shape.moveTo(-2.11, -1.78);
    shape.lineTo(-1.48, -2.41);

    // Front lip edge (gentle hand-sanded micro-camber)
    shape.lineTo(0.02, -2.415);
    shape.lineTo(1.52, -2.39);

    // Bottom-right chamfer (softer curve from sanding block)
    shape.lineTo(2.09, -1.82);

    // Right outer edge (subtle hand-planed taper along the grain)
    shape.lineTo(2.115, 0.15);
    shape.lineTo(2.085, 1.81);

    // Top-right chamfer
    shape.lineTo(1.48, 2.405);

    // Rear top edge (gentle natural crown)
    shape.lineTo(-0.04, 2.418);
    shape.lineTo(-1.52, 2.395);

    // Top-left chamfer
    shape.lineTo(-2.095, 1.79);

    // Left outer edge (organic line along pine wood grain back to bottom chamfer)
    shape.lineTo(-2.12, 0.05);
    shape.lineTo(-2.11, -1.78);

    // ── Cutout 1: Front Window + Hand-Swept Asymmetric Curve ──
    // Hand-routed void with subtle organic asymmetry (apex slightly offset from centerline)
    const frontVoidHole = new Path();
    frontVoidHole.moveTo(-1.46, -1.81); // Bottom-left inner corner
    frontVoidHole.lineTo(1.44, -1.79);  // Front rail inner edge (slight manual saw drift)
    frontVoidHole.lineTo(1.43, 0.29);   // Along right rail inner edge

    // Smooth concave curve cupping under diamond tongue (handcrafted apex at X = -0.015, Y = -0.465)
    frontVoidHole.bezierCurveTo(1.03, -0.21, 0.49, -0.47, -0.015, -0.465);
    frontVoidHole.bezierCurveTo(-0.52, -0.46, -1.06, -0.23, -1.46, 0.27);

    // Straight down along left rail inner edge back to start
    frontVoidHole.lineTo(-1.46, -1.81);
    frontVoidHole.closePath();
    shape.holes.push(frontVoidHole);

    // ── Cutout 2: Artisan 4-Point Diamond (Rhombus) Cutout ──
    // Scroll-sawn and hand-chiseled: tips have authentic human workshop tolerances
    const diamondHole = new Path();
    diamondHole.moveTo(-0.012, -0.136); // Front tip (subtle artisan drift)
    diamondHole.lineTo(0.942, 0.762);   // Right tip
    diamondHole.lineTo(0.016, 1.638);   // Rear tip
    diamondHole.lineTo(-0.928, 0.742);  // Left tip
    diamondHole.closePath();
    shape.holes.push(diamondHole);

    // ── Cutouts 3-8: Hand-Drilled Adjustment Hole Pairs ──
    // Drilled with a manual drill press; slight organic variance in awl-marked centers and diameters
    // Left wing holes (X ≈ -1.305, radius ≈ 0.116)
    const leftHoleY = [1.215, 1.605, 1.975];
    for (const hy of leftHoleY) {
      const hole = new Path();
      hole.absarc(-1.305, hy, 0.116, 0, Math.PI * 2, true);
      shape.holes.push(hole);
    }

    // Right wing holes (X ≈ 1.292, radius ≈ 0.114)
    const rightHoleY = [1.225, 1.595, 1.985];
    for (const hy of rightHoleY) {
      const hole = new Path();
      hole.absarc(1.292, hy, 0.114, 0, Math.PI * 2, true);
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
          color={cfg.primary}
          roughness={cfg.roughness}
          metalness={cfg.metalness}
        />
      </mesh>

      {/* Front Tablet / Laptop Stopper Block — Hand-aligned with human workshop placement */}
      <RoundedBox
        castShadow
        receiveShadow
        args={[0.885, 0.28, 0.18]}
        position={[0.018, -2.245, 0.18]}
        rotation={[0, 0, 0.009]}
        radius={0.022}
        smoothness={2}
      >
        <meshStandardMaterial
          color={cfg.accent}
          roughness={cfg.roughness}
          metalness={cfg.metalness}
        />
      </RoundedBox>
    </group>
  );
}

/**
 * Piece 2: Arched Support Leg / Prop
 */
function TabletSupportLeg({
  legLength = 1.61,
  finish = "transparent",
}: {
  legLength?: number;
  finish?: FinishOption;
}) {
  const cfg = WOOD_FINISH_THEMES[finish] || WOOD_FINISH_THEMES.transparent;
  const geometry = useMemo(() => {
    const shape = new Shape();

    // Local coordinates with authentic hand-carved subtle discrepancies:
    // Top-left corner (slight manual rasp variance)
    shape.moveTo(-1.43, 0);

    // Top flat edge across with gentle hand-planed micro-tilt
    shape.lineTo(1.415, 0.004);

    // Right outer edge tapering down to right foot
    shape.lineTo(1.49, -legLength);

    // Right foot flat base (hand-cut foot width ≈ 1.06)
    shape.lineTo(1.06, -legLength);

    // Parabolic arch cutout between feet: artisan-cut apex slightly off-center (X = 0.018)
    const archApexY = -legLength * 0.525;
    shape.quadraticCurveTo(0.018, archApexY, -1.09, -legLength);

    // Left foot flat base (hand-cut foot width ≈ 1.10)
    shape.lineTo(-1.51, -legLength);

    // Left outer edge tapering up to top-left corner
    shape.lineTo(-1.43, 0);

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
        color={cfg.primary}
        roughness={cfg.roughness}
        metalness={cfg.metalness}
      />
    </mesh>
  );
}

/**
 * Assembled Tablet Stand:
 */
function TabletStandAssembly({ finish = "transparent" }: { finish?: FinishOption }) {
  const model = useRef<Group>(null);
  const cfg = WOOD_FINISH_THEMES[finish] || WOOD_FINISH_THEMES.transparent;

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
        {/* Piece 1: Sloping Main Deck — inclined at 25.5° */}
        <group position={[0, 0.2825, 0]} rotation={[-1.1257, 0.005, 0.007]}>
          <TabletDeckPiece finish={finish} />

          {/* Tenon Pin 1 (Right): Hand-turned wooden dowel peg */}
          <mesh position={[1.292, 1.225, 0.016]} rotation={[Math.PI / 2 + 0.007, 0.004, 0]}>
            <cylinderGeometry args={[0.111, 0.113, 0.245, 16]} />
            <meshStandardMaterial color={cfg.detail} roughness={cfg.roughness} />
          </mesh>

          {/* Tenon Pin 2 (Left): Hand-turned wooden dowel peg */}
          <mesh position={[-1.305, 1.215, 0.019]} rotation={[Math.PI / 2 - 0.005, -0.003, 0]}>
            <cylinderGeometry args={[0.114, 0.112, 0.238, 16]} />
            <meshStandardMaterial color={cfg.detail} roughness={cfg.roughness} />
          </mesh>
        </group>

        {/* Piece 2: Arched Support Leg */}
        <group position={[0, 0.7085, -1.1485]} rotation={[0.2461, -0.004, 0.006]}>
          <TabletSupportLeg legLength={1.61} finish={finish} />
        </group>
      </group>
    </Float>
  );
}

export function TabletStandScene({ finish = "transparent" }: { finish?: FinishOption }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [5.0, 3.4, 6.2], fov: 36 }}
      aria-label="Interactive 3D model of the Dridha multi-angle wooden tablet stand and easel"
      className="w-full h-full cursor-grab active:cursor-grabbing"
    >
      <color attach="background" args={[STUDIO_3D_ENV.backgroundColor]} />
      <hemisphereLight
        args={[
          STUDIO_3D_ENV.hemisphereSky,
          STUDIO_3D_ENV.hemisphereGround,
          STUDIO_3D_ENV.hemisphereIntensity,
        ]}
      />
      <directionalLight
        castShadow
        position={STUDIO_3D_ENV.keyLightPos}
        intensity={STUDIO_3D_ENV.keyLightIntensity}
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight
        position={STUDIO_3D_ENV.fillLightPos}
        intensity={STUDIO_3D_ENV.fillLightIntensity}
        color={STUDIO_3D_ENV.fillLightColor}
      />
      <TabletStandAssembly finish={finish} />
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
