"use client";

import { ContactShadows, Float, OrbitControls, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { ExtrudeGeometry, Path, Shape } from "three";
import type { Group } from "three";

type Vec3 = [number, number, number];
type Aperture = { x: number; z: number; width: number; length: number };

import {
  type FinishOption,
  WOOD_FINISH_THEMES,
  STUDIO_3D_ENV,
} from "./woodMaterials";

export type { FinishOption };

function artisanBoardPath(shape: Shape, width: number, length: number) {
  const hw = width / 2;
  const hl = length / 2;
  const cr = 0.07; // Gentle hand-sanded corner softening

  // Natural hand-planed edges with slight camber along the wood grain
  shape.moveTo(-hw - 0.012, -hl + cr);
  shape.quadraticCurveTo(-hw - 0.012, -hl - 0.004, -hw + cr, -hl - 0.004);
  shape.lineTo(0.012, -hl - 0.008);
  shape.lineTo(hw - cr + 0.006, -hl - 0.003);
  shape.quadraticCurveTo(hw + 0.012, -hl - 0.003, hw + 0.012, -hl + cr);
  shape.lineTo(hw + 0.015, 0.1);
  shape.lineTo(hw - 0.006, hl - cr);
  shape.quadraticCurveTo(hw - 0.006, hl + 0.005, hw - cr, hl + 0.005);
  shape.lineTo(-0.015, hl + 0.009);
  shape.lineTo(-hw + cr - 0.005, hl + 0.004);
  shape.quadraticCurveTo(-hw - 0.012, hl + 0.004, -hw - 0.012, hl - cr);
  shape.lineTo(-hw - 0.012, -hl + cr);
}

function artisanAperturePath(
  path: Path,
  x: number,
  y: number,
  width: number,
  height: number,
  index: number
) {
  const dx = ((index % 3) - 1) * 0.006;
  const dy = (((index + 1) % 3) - 1) * 0.005;
  const cr = Math.min(width, height) * 0.12; // Hand-routed rounded slot edges

  path.moveTo(x + dx, y + cr);
  path.quadraticCurveTo(x + dx, y, x + dx + cr, y);
  path.lineTo(x + width - cr, y + dy);
  path.quadraticCurveTo(x + width, y + dy, x + width, y + dy + cr);
  path.lineTo(x + width - dx * 0.5, y + height - cr);
  path.quadraticCurveTo(x + width - dx * 0.5, y + height, x + width - cr, y + height);
  path.lineTo(x + cr, y + height - dy * 0.5);
  path.quadraticCurveTo(x, y + height - dy * 0.5, x, y + height - cr);
  path.closePath();
}

/** A flat pine wood board with genuine hand-cut through-apertures and artisan edge softens. */
function PerforatedBoard({
  width,
  length,
  thickness,
  apertures,
  position,
  rotation,
  color = "#e0a25e",
  roughness = 0.56,
  metalness = 0.01,
}: {
  width: number;
  length: number;
  thickness: number;
  apertures: Aperture[];
  position: Vec3;
  rotation: Vec3;
  color?: string;
  roughness?: number;
  metalness?: number;
}) {
  const geometry = useMemo(() => {
    const board = new Shape();
    artisanBoardPath(board, width, length);

    // Shape coordinates map to x/z after the mesh's -90° x-axis rotation.
    apertures.forEach((aperture, index) => {
      const hole = new Path();
      artisanAperturePath(
        hole,
        aperture.x - aperture.width / 2,
        -aperture.z - aperture.length / 2,
        aperture.width,
        aperture.length,
        index
      );
      board.holes.push(hole);
    });

    return new ExtrudeGeometry(board, {
      depth: thickness,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.008,
      bevelThickness: 0.008,
    });
  }, [apertures, length, thickness, width]);

  return (
    <mesh castShadow receiveShadow geometry={geometry} position={position} rotation={rotation}>
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  );
}

function Timber({
  args,
  position,
  rotation = [0, 0, 0],
  color = "#c88747",
  radius = 0.035,
  roughness = 0.53,
  metalness = 0.01,
}: {
  args: Vec3;
  position: Vec3;
  rotation?: Vec3;
  color?: string;
  radius?: number;
  roughness?: number;
  metalness?: number;
}) {
  return (
    <RoundedBox castShadow receiveShadow args={args} position={position} rotation={rotation} radius={radius} smoothness={3}>
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </RoundedBox>
  );
}

/**
 * Faithful three-piece reconstruction from the isolated-component reference:
 *  1. sloping deck: 3 small upper slots, a large central opening, 2 square holes;
 *  2. plain rectangular support handle;
 *  3. flat base: 4 rear slots and two raised front prongs/stoppers.
 */
function ShiftDeskStand({ finish = "transparent" }: { finish?: FinishOption }) {
  const model = useRef<Group>(null);
  const deckAngle = 0.56;
  const cfg = WOOD_FINISH_THEMES[finish] || WOOD_FINISH_THEMES.transparent;

  useFrame((_state, delta) => {
    if (model.current) model.current.rotation.y += delta * 0.1;
  });

  const deckApertures: Aperture[] = [
    { x: -0.012, z: -1.725, width: 0.91, length: 0.245 },
    { x: 0.008, z: -1.218, width: 0.895, length: 0.238 },
    { x: -0.006, z: -0.722, width: 0.905, length: 0.242 },
    { x: 0.005, z: 0.565, width: 2.06, length: 1.175 },
    { x: -1.055, z: 2.055, width: 0.585, length: 0.575 },
    { x: 1.045, z: 2.065, width: 0.575, length: 0.585 },
  ];

  const baseApertures: Aperture[] = [
    { x: 0.008, z: -1.275, width: 1.055, length: 0.235 },
    { x: -0.006, z: -0.818, width: 1.045, length: 0.228 },
    { x: 0.004, z: -0.372, width: 1.052, length: 0.232 },
    { x: -0.008, z: 0.078, width: 1.048, length: 0.234 },
  ];

  return (
    <Float speed={1.05} rotationIntensity={0.055} floatIntensity={0.14}>
      <group ref={model} position={[0, -0.54, 0]} rotation={[-0.1, -0.5, 0]} scale={0.76}>
        {/* Piece 3: the horizontal base board, including four adjustment slots. */}
        <PerforatedBoard
          width={3.95}
          length={4.7}
          thickness={0.2}
          apertures={baseApertures}
          position={[0, 0, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          color={cfg.primary}
          roughness={cfg.roughness}
          metalness={cfg.metalness}
        />

        {/* The two bottom resters poke out directly from the two square holes */}
        <Timber
          args={[0.54, 0.22, 1.35]}
          position={[-1.055, 0.28, 1.98]}
          rotation={[0.06, -0.007, 0.006]}
          color={cfg.accent}
          radius={0.035}
          roughness={cfg.roughness}
          metalness={cfg.metalness}
        />
        <Timber
          args={[0.54, 0.38, 0.26]}
          position={[-1.055, 0.52, 2.46]}
          rotation={[0.06, -0.007, 0.006]}
          color={cfg.accent}
          radius={0.038}
          roughness={cfg.roughness}
          metalness={cfg.metalness}
        />

        <Timber
          args={[0.535, 0.22, 1.35]}
          position={[1.045, 0.28, 1.99]}
          rotation={[0.06, 0.006, -0.005]}
          color={cfg.accent}
          radius={0.035}
          roughness={cfg.roughness}
          metalness={cfg.metalness}
        />
        <Timber
          args={[0.535, 0.38, 0.26]}
          position={[1.045, 0.52, 2.47]}
          rotation={[0.06, 0.006, -0.005]}
          color={cfg.accent}
          radius={0.038}
          roughness={cfg.roughness}
          metalness={cfg.metalness}
        />

        {/* Piece 2: support handle */}
        <group position={[0.006, 1.16, -0.73]} rotation={[0.085, 0.007, -0.005]}>
          <Timber args={[1.045, 2.28, 0.22]} position={[0, 0, 0]} color={cfg.accent} radius={0.055} roughness={cfg.roughness} metalness={cfg.metalness} />
          <Timber args={[1.12, 0.16, 0.28]} position={[0.004, -1.05, 0.02]} color={cfg.detail} radius={0.025} roughness={cfg.roughness} metalness={cfg.metalness} />
          <Timber args={[1.12, 0.16, 0.28]} position={[-0.005, 1.05, 0.02]} color={cfg.detail} radius={0.025} roughness={cfg.roughness} metalness={cfg.metalness} />
        </group>

        {/* Piece 1: the deck rises from the two front prongs */}
        <group position={[0, 1.5, 0.4]} rotation={[deckAngle, 0.005, -0.004]}>
          <PerforatedBoard
            width={3.95}
            length={5.45}
            thickness={0.22}
            apertures={deckApertures}
            position={[0, 0, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            color={cfg.primary}
            roughness={cfg.roughness}
            metalness={cfg.metalness}
          />

          <Timber args={[1.16, 0.14, 0.29]} position={[0.005, -0.13, -1.22]} rotation={[0, 0, 0.006]} color={cfg.detail} radius={0.02} roughness={cfg.roughness} metalness={cfg.metalness} />
        </group>
      </group>
    </Float>
  );
}

export function AtelierScene({ finish = "transparent" }: { finish?: FinishOption }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [5.8, 3.65, 7.1], fov: 37 }}
      aria-label="Interactive 3D model of the Dridha adjustable three-piece laptop stand"
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
      <ShiftDeskStand finish={finish} />
      <ContactShadows position={[0, -1.13, 0]} opacity={0.38} scale={9.5} blur={2.45} far={4} />
      <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={0.78} maxPolarAngle={1.84} />
    </Canvas>
  );
}
