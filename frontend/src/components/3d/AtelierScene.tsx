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

function rectangularPath(path: Path, x: number, y: number, width: number, height: number) {
  path.moveTo(x, y);
  path.lineTo(x + width, y);
  path.lineTo(x + width, y + height);
  path.lineTo(x, y + height);
  path.closePath();
}

/** A flat timber board with genuine through-apertures, not painted dark marks. */
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
    rectangularPath(board, -width / 2, -length / 2, width, length);

    // Shape coordinates map to x/z after the mesh's -90° x-axis rotation.
    for (const aperture of apertures) {
      const hole = new Path();
      rectangularPath(
        hole,
        aperture.x - aperture.width / 2,
        -aperture.z - aperture.length / 2,
        aperture.width,
        aperture.length,
      );
      board.holes.push(hole);
    }

    return new ExtrudeGeometry(board, { depth: thickness, bevelEnabled: false });
  }, [apertures, length, thickness, width]);

  return (
    <mesh castShadow receiveShadow geometry={geometry} position={position} rotation={rotation}>
      <meshStandardMaterial color={color} roughness={0.55} metalness={0.01} />
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
    { x: 0, z: -1.72, width: 0.9, length: 0.24 },
    { x: 0, z: -1.22, width: 0.9, length: 0.24 },
    { x: 0, z: -0.72, width: 0.9, length: 0.24 },
    { x: 0, z: 0.56, width: 2.05, length: 1.18 },
    { x: -1.05, z: 2.06, width: 0.58, length: 0.58 },
    { x: 1.05, z: 2.06, width: 0.58, length: 0.58 },
  ];

  const baseApertures: Aperture[] = [
    { x: 0, z: -1.27, width: 1.05, length: 0.23 },
    { x: 0, z: -0.82, width: 1.05, length: 0.23 },
    { x: 0, z: -0.37, width: 1.05, length: 0.23 },
    { x: 0, z: 0.08, width: 1.05, length: 0.23 },
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
            holes. Their exposed ends become the photographed laptop stoppers. */}
        <Timber args={[0.54, 0.64, 0.42]} position={[-1.05, 0.31, 2.1]} color={oak} radius={0.04} />
        <Timber args={[0.54, 0.64, 0.42]} position={[1.05, 0.31, 2.1]} color={oak} radius={0.04} />
        <Timber args={[0.54, 0.2, 0.76]} position={[-1.05, 0.04, 2.36]} color={oak} radius={0.03} />
        <Timber args={[0.54, 0.2, 0.76]} position={[1.05, 0.04, 2.36]} color={oak} radius={0.03} />

        {/* Piece 2: the plain, solid support handle. It runs from the chosen
            base slot to the chosen upper-deck slot and sets the tilt. */}
        <group position={[0, 1.16, -0.73]} rotation={[0.085, 0, 0]}>
          <Timber args={[1.04, 2.28, 0.22]} position={[0, 0, 0]} color={oak} radius={0.055} />
          <Timber args={[1.12, 0.16, 0.28]} position={[0, -1.05, 0.02]} color={oakEdge} radius={0.025} />
          <Timber args={[1.12, 0.16, 0.28]} position={[0, 1.05, 0.02]} color={oakEdge} radius={0.025} />
        </group>

        {/* Piece 1: the deck rises from the two front prongs. The exact hole
            layout follows the isolated top component: slots, window, squares. */}
        <group position={[0, 1.5, 0.4]} rotation={[deckAngle, 0, 0]}>
          <PerforatedBoard
            width={3.95}
            length={5.45}
            thickness={0.22}
            apertures={deckApertures}
            position={[0, 0, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          />

          {/* The handle is shown engaged in the second upper deck slot. */}
          <Timber args={[1.16, 0.14, 0.29]} position={[0, -0.13, -1.22]} color={oakEdge} radius={0.02} />
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
