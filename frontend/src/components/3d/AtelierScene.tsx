"use client";

import { ContactShadows, Float, OrbitControls, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { ExtrudeGeometry, Path, Shape } from "three";
import type { Group } from "three";

type Vec3 = [number, number, number];
type Aperture = { x: number; z: number; width: number; length: number };

const oak = "#c88747";
const oakLight = "#e0a25e";
const oakEdge = "#77401f";

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

/** A flat timber board with genuine hand-cut through-apertures and artisan edge softens. */
function PerforatedBoard({
  width,
  length,
  thickness,
  apertures,
  position,
  rotation,
  color = oakLight,
}: {
  width: number;
  length: number;
  thickness: number;
  apertures: Aperture[];
  position: Vec3;
  rotation: Vec3;
  color?: string;
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
      <meshStandardMaterial color={color} roughness={0.56} metalness={0.01} />
    </mesh>
  );
}

function Timber({
  args,
  position,
  rotation = [0, 0, 0],
  color = oak,
  radius = 0.035,
}: {
  args: Vec3;
  position: Vec3;
  rotation?: Vec3;
  color?: string;
  radius?: number;
}) {
  return (
    <RoundedBox castShadow receiveShadow args={args} position={position} rotation={rotation} radius={radius} smoothness={3}>
      <meshStandardMaterial color={color} roughness={0.53} metalness={0.01} />
    </RoundedBox>
  );
}

/**
 * Faithful three-piece reconstruction from the isolated-component reference:
 *  1. sloping deck: 3 small upper slots, a large central opening, 2 square holes;
 *  2. plain rectangular support handle;
 *  3. flat base: 4 rear slots and two raised front prongs/stoppers.
 */
function ShiftDeskStand() {
  const model = useRef<Group>(null);
  const deckAngle = 0.56;

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
        />

        {/* Its two integral front prongs pass through the deck's two square
            holes. Their exposed ends become the photographed laptop stoppers.
            Hand-aligned with natural artisan workshop tolerances. */}
        <Timber args={[0.545, 0.64, 0.42]} position={[-1.055, 0.31, 2.095]} rotation={[0.005, -0.007, 0.006]} color={oak} radius={0.042} />
        <Timber args={[0.538, 0.638, 0.425]} position={[1.045, 0.308, 2.105]} rotation={[-0.004, 0.006, -0.005]} color={oak} radius={0.038} />
        <Timber args={[0.54, 0.2, 0.76]} position={[-1.055, 0.04, 2.355]} color={oak} radius={0.03} />
        <Timber args={[0.54, 0.2, 0.76]} position={[1.045, 0.04, 2.365]} color={oak} radius={0.03} />

        {/* Piece 2: the plain, solid support handle. It runs from the chosen
            base slot to the chosen upper-deck slot with slight hand-joint resting tilt. */}
        <group position={[0.006, 1.16, -0.73]} rotation={[0.085, 0.007, -0.005]}>
          <Timber args={[1.045, 2.28, 0.22]} position={[0, 0, 0]} color={oak} radius={0.055} />
          <Timber args={[1.12, 0.16, 0.28]} position={[0.004, -1.05, 0.02]} color={oakEdge} radius={0.025} />
          <Timber args={[1.12, 0.16, 0.28]} position={[-0.005, 1.05, 0.02]} color={oakEdge} radius={0.025} />
        </group>

        {/* Piece 1: the deck rises from the two front prongs with subtle artisan settling. */}
        <group position={[0, 1.5, 0.4]} rotation={[deckAngle, 0.005, -0.004]}>
          <PerforatedBoard
            width={3.95}
            length={5.45}
            thickness={0.22}
            apertures={deckApertures}
            position={[0, 0, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          />

          {/* The handle is shown engaged in the second upper deck slot. */}
          <Timber args={[1.16, 0.14, 0.29]} position={[0.005, -0.13, -1.22]} rotation={[0, 0, 0.006]} color={oakEdge} radius={0.02} />
        </group>
      </group>
    </Float>
  );
}

export function AtelierScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [5.8, 3.65, 7.1], fov: 37 }}
      aria-label="Interactive 3D model of the Dridha adjustable three-piece laptop stand"
      className="w-full h-full cursor-grab active:cursor-grabbing"
    >
      <color attach="background" args={["#e7cfae"]} />
      <hemisphereLight args={["#fff4dd", "#23432c", 1.7]} />
      <directionalLight castShadow position={[4.6, 7, 4]} intensity={2.4} shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-4, 2, -3]} intensity={0.7} color="#d9924c" />
      <ShiftDeskStand />
      <ContactShadows position={[0, -1.13, 0]} opacity={0.38} scale={9.5} blur={2.45} far={4} />
      <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={0.78} maxPolarAngle={1.84} />
    </Canvas>
  );
}
