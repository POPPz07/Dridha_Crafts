"use client";

import { ContactShadows, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { ExtrudeGeometry, Shape } from "three";
import type { Group } from "three";
import {
  type FinishOption,
  WOOD_FINISH_THEMES,
  STUDIO_3D_ENV,
} from "./woodMaterials";

// ── Dropzone Stand Dimensions (Calibrated to 5 Reference Photos) ─────────────
const BASE_W = 3.2;          // X width (-1.6 to +1.6)
const BASE_Z_REAR = -1.8;    // Rear edge
const BASE_Z_FRONT = 1.9;    // Front edge
const CHAMFER = 0.36;        // 45° corner chamfer size
const GROOVE_Z_START = 0.90; // Groove rear wall
const GROOVE_Z_END = 1.45;   // Groove front lip wall
const BASE_LOWER_H = 0.30;   // Floor of groove thickness
const BASE_UPPER_H = 0.22;   // Raised lip & deck thickness (total = 0.52)

const POST_W = 0.92;         // Post width across X (-0.46 to +0.46)
const POST_Z_REAR = -0.92;   // Post rear face
const POST_Z_FRONT = 0.58;   // Post front face (depth = 1.50)
const POST_TOP_HORN = 6.10;  // Height to front & rear horns
const POST_TOP_SADDLE = 4.85;// Cradle saddle valley apex (depth = 1.25)

/**
 * 1. Base Lower Foundation (Slab with 4 chamfered corners)
 */
function BaseFoundation({
  theme,
}: {
  theme: typeof WOOD_FINISH_THEMES["brown"];
}) {
  const geometry = useMemo(() => {
    const shape = new Shape();
    const halfW = BASE_W / 2;
    const c = CHAMFER;

    shape.moveTo(-halfW + c, BASE_Z_REAR);
    shape.lineTo(halfW - c, BASE_Z_REAR);
    shape.lineTo(halfW, BASE_Z_REAR + c);
    shape.lineTo(halfW, BASE_Z_FRONT - c);
    shape.lineTo(halfW - c, BASE_Z_FRONT);
    shape.lineTo(-halfW + c, BASE_Z_FRONT);
    shape.lineTo(-halfW, BASE_Z_FRONT - c);
    shape.lineTo(-halfW, BASE_Z_REAR + c);
    shape.closePath();

    return new ExtrudeGeometry(shape, {
      depth: BASE_LOWER_H,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.025,
      bevelThickness: 0.025,
    });
  }, []);

  return (
    <mesh
      castShadow
      receiveShadow
      geometry={geometry}
      position={[0, 0, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <meshStandardMaterial
        color={theme.primary}
        roughness={theme.roughness}
        metalness={theme.metalness}
      />
    </mesh>
  );
}

/**
 * 2. Base Upper Rear Deck (Main platform behind phone groove)
 */
function BaseUpperDeck({
  theme,
}: {
  theme: typeof WOOD_FINISH_THEMES["brown"];
}) {
  const geometry = useMemo(() => {
    const shape = new Shape();
    const halfW = BASE_W / 2;
    const c = CHAMFER;

    shape.moveTo(-halfW + c, BASE_Z_REAR);
    shape.lineTo(halfW - c, BASE_Z_REAR);
    shape.lineTo(halfW, BASE_Z_REAR + c);
    shape.lineTo(halfW, GROOVE_Z_START);
    shape.lineTo(-halfW, GROOVE_Z_START);
    shape.lineTo(-halfW, BASE_Z_REAR + c);
    shape.closePath();

    return new ExtrudeGeometry(shape, {
      depth: BASE_UPPER_H,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    });
  }, []);

  return (
    <mesh
      castShadow
      receiveShadow
      geometry={geometry}
      position={[0, BASE_LOWER_H, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <meshStandardMaterial
        color={theme.primary}
        roughness={theme.roughness}
        metalness={theme.metalness}
      />
    </mesh>
  );
}

/**
 * 3. Base Front Retaining Lip (Wooden ridge in front of phone groove)
 */
function BaseFrontLip({
  theme,
}: {
  theme: typeof WOOD_FINISH_THEMES["brown"];
}) {
  const geometry = useMemo(() => {
    const shape = new Shape();
    const halfW = BASE_W / 2;
    const c = CHAMFER;

    shape.moveTo(-halfW, GROOVE_Z_END);
    shape.lineTo(halfW, GROOVE_Z_END);
    shape.lineTo(halfW, BASE_Z_FRONT - c);
    shape.lineTo(halfW - c, BASE_Z_FRONT);
    shape.lineTo(-halfW + c, BASE_Z_FRONT);
    shape.lineTo(-halfW, BASE_Z_FRONT - c);
    shape.closePath();

    return new ExtrudeGeometry(shape, {
      depth: BASE_UPPER_H,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    });
  }, []);

  return (
    <mesh
      castShadow
      receiveShadow
      geometry={geometry}
      position={[0, BASE_LOWER_H, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <meshStandardMaterial
        color={theme.primary}
        roughness={theme.roughness}
        metalness={theme.metalness}
      />
    </mesh>
  );
}

/**
 * 4. The Upright Column (Pillar with V-Cradle and ergonomic inner curve)
 */
function UprightPost({
  theme,
}: {
  theme: typeof WOOD_FINISH_THEMES["brown"];
}) {
  const geometry = useMemo(() => {
    const shape = new Shape();

    const zRear = POST_Z_REAR;
    const zFront = POST_Z_FRONT;
    const baseY = BASE_LOWER_H + BASE_UPPER_H - 0.04;
    const topHorn = POST_TOP_HORN;
    const saddle = POST_TOP_SADDLE;
    const zCenter = (zRear + zFront) / 2;

    // Bottom edge (rests on base)
    shape.moveTo(zRear, baseY);
    shape.lineTo(zFront, baseY);

    // Front vertical face going up
    shape.lineTo(zFront, topHorn - 0.06);

    // Front horn rounded tip
    shape.quadraticCurveTo(zFront, topHorn, zFront - 0.05, topHorn);

    // ── V-Cradle with Ergonomic Headband Curve at the Bottom ──
    shape.lineTo(zCenter + 0.22, saddle + 0.18);
    shape.bezierCurveTo(
      zCenter + 0.10,
      saddle,
      zCenter - 0.10,
      saddle,
      zCenter - 0.22,
      saddle + 0.18
    );
    shape.lineTo(zRear + 0.05, topHorn);

    // Rear horn rounded tip
    shape.quadraticCurveTo(zRear, topHorn, zRear, topHorn - 0.06);

    // Rear vertical face going down
    shape.lineTo(zRear, baseY);
    shape.closePath();

    return new ExtrudeGeometry(shape, {
      depth: POST_W,
      bevelEnabled: true,
      bevelSegments: 4,
      bevelSize: 0.024,
      bevelThickness: 0.024,
    });
  }, []);

  return (
    <mesh
      castShadow
      receiveShadow
      geometry={geometry}
      position={[-POST_W / 2, 0, 0]}
      rotation={[0, Math.PI / 2, 0]}
    >
      <meshStandardMaterial
        color={theme.primary}
        roughness={theme.roughness}
        metalness={theme.metalness}
      />
    </mesh>
  );
}

/**
 * Full Dropzone Assembly with Turntable Rotation
 */
function DropzoneAssembly({
  theme,
}: {
  theme: typeof WOOD_FINISH_THEMES["brown"];
}) {
  const model = useRef<Group>(null);

  // Smooth studio turntable spin
  useFrame((_state, delta) => {
    if (model.current) {
      model.current.rotation.y += delta * 0.18;
    }
  });

  return (
    <group ref={model} position={[0, -1.25, 0]} scale={0.60}>
      <BaseFoundation theme={theme} />
      <BaseUpperDeck theme={theme} />
      <BaseFrontLip theme={theme} />
      <UprightPost theme={theme} />
    </group>
  );
}

/**
 * DropzoneScene Main Export Component
 * Uses unified studio lighting and materials consistent across all Dridha products.
 */
export default function DropzoneScene({
  finish = "unpolished",
}: {
  finish?: FinishOption;
}) {
  const theme = WOOD_FINISH_THEMES[finish] || WOOD_FINISH_THEMES.unpolished;

  return (
    <div className="relative w-full h-full select-none">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [5.2, 3.0, 6.4], fov: 36 }}
        aria-label="Interactive 3D model of the handcrafted Dropzone headphone stand"
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

        {/* Studio Key Light */}
        <directionalLight
          castShadow
          position={STUDIO_3D_ENV.keyLightPos}
          intensity={STUDIO_3D_ENV.keyLightIntensity}
          shadow-mapSize={[1024, 1024]}
        />

        {/* Warm Fill Light */}
        <directionalLight
          position={STUDIO_3D_ENV.fillLightPos}
          intensity={STUDIO_3D_ENV.fillLightIntensity}
          color={STUDIO_3D_ENV.fillLightColor}
        />

        {/* Assembled Model */}
        <DropzoneAssembly theme={theme} />

        {/* Soft Ground Contact Shadow */}
        <ContactShadows
          position={[0, -1.27, 0]}
          opacity={0.42}
          scale={7.5}
          blur={2.4}
          far={3.8}
        />

        {/* Interactive Orbit Controls */}
        <OrbitControls
          target={[0, 0.60, 0]}
          enablePan={false}
          enableZoom={false}
          minPolarAngle={0.2}
          maxPolarAngle={1.75}
        />
      </Canvas>
    </div>
  );
}
export { DropzoneScene };
