"use client";

import { ContactShadows, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  BackSide,
  BufferGeometry,
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  Path,
  RingGeometry,
  Shape,
  ShapeGeometry,
} from "three";

// Authentic warm amber-golden pine finish matching the customer's reference photos
const goldenAmberWood = "#df9939";
const goldenWoodDeep = "#b76f22";
const goldenWoodInterior = "#cb882f";
const knotholeDark = "#4d2309";

/**
 * Piece 1: The Main Hollow Semi-Cylinder Body (Trough + Right Resting Deck)
 * Exactly matching the customer reference images:
 * - Image 1 & 2: A horizontal semi-cylinder with hollow interior cavity on the left/center,
 *   and a solid top surface area on the right where the small hollow cylinder rests.
 * - Image 3: The opposite left end-face is sculpted with a distinct inward-carved
 *   scoop/undercut along its lower contour.
 */
function MainSemiCylinderTrough() {
  // ── Segment 1: The Hollow Semi-Cylinder Trough (Length = 2.45) ──
  const troughGeometry = useMemo(() => {
    // Cross-section in the Y-Z plane
    const shape = new Shape();

    // Outer semi-cylinder profile (Z-Y plane)
    // Top-left outer rim
    shape.moveTo(-0.76, 0.28);

    // Left curved hull
    shape.bezierCurveTo(-0.77, 0.02, -0.68, -0.32, -0.42, -0.48);

    // Flat resting base so it sits steadily on a flat table
    shape.lineTo(-0.24, -0.52);
    shape.lineTo(0.24, -0.52);

    // Right curved hull
    shape.bezierCurveTo(0.68, -0.32, 0.77, 0.02, 0.76, 0.28);

    // Top-right outer rim across to inner hollow cavity
    shape.lineTo(0.56, 0.28);

    // Inner cavity (scooped hollow interior)
    shape.lineTo(0.50, -0.22);
    shape.bezierCurveTo(0.24, -0.34, -0.24, -0.34, -0.50, -0.22);
    shape.lineTo(-0.56, 0.28);
    shape.lineTo(-0.76, 0.28);

    // Extrude along X-axis (from X = -1.90 to X = 0.55, length = 2.45)
    return new ExtrudeGeometry(shape, {
      depth: 2.45,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    });
  }, []);

  // ── Segment 2: Small Right End Lip / Shelf (Length = 0.20) ──
  // The small cylinder rests ONLY on this narrow end shelf. The rest of the extended block is removed.
  const rightEndLipGeometry = useMemo(() => {
    const shape = new Shape();

    // Top flat resting surface across (Z = -0.76 to +0.76 at Y = 0.28)
    shape.moveTo(-0.76, 0.28);
    shape.lineTo(0.76, 0.28);

    // Right curved hull down to base
    shape.bezierCurveTo(0.77, 0.02, 0.68, -0.32, 0.42, -0.48);
    shape.lineTo(0.24, -0.52);
    shape.lineTo(-0.24, -0.52);
    shape.bezierCurveTo(-0.42, -0.48, -0.68, -0.32, -0.77, 0.02);
    shape.lineTo(-0.76, 0.28);

    // Extrude along X-axis (only 0.20 units long — narrow resting lip only)
    return new ExtrudeGeometry(shape, {
      depth: 0.20,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.015,
      bevelThickness: 0.015,
    });
  }, []);

  // ── Segment 3: Left End-Face with Inward-Carved Scoop (Image 3) ──
  // In Image 3, the end opposite to the small cylinder is carved inwards at the bottom
  const leftCarvedEndGeometry = useMemo(() => {
    // Solid end plate closing the left end with inward carved relief
    const shape = new Shape();
    shape.moveTo(-0.76, 0.30);
    shape.lineTo(0.76, 0.30);
    shape.bezierCurveTo(0.77, 0.02, 0.68, -0.32, 0.42, -0.48);
    shape.lineTo(0.24, -0.52);
    shape.lineTo(-0.24, -0.52);
    shape.bezierCurveTo(-0.42, -0.48, -0.68, -0.32, -0.77, 0.02);
    shape.lineTo(-0.76, 0.30);

    return new ExtrudeGeometry(shape, {
      depth: 0.22,
      bevelEnabled: true,
      bevelSegments: 4,
      bevelSize: 0.025,
      bevelThickness: 0.025,
    });
  }, []);

  // Inward carved scoop detail for Image 3
  const inwardScoopGeometry = useMemo(() => {
    // Concave cut profile carved into the lower face of the left end
    const shape = new Shape();
    shape.moveTo(-0.35, -0.28);
    shape.bezierCurveTo(-0.35, -0.46, -0.20, -0.52, 0.0, -0.52);
    shape.bezierCurveTo(0.20, -0.52, 0.35, -0.46, 0.35, -0.28);
    shape.quadraticCurveTo(0.0, -0.36, -0.35, -0.28);

    return new ExtrudeGeometry(shape, {
      depth: 0.16,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    });
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Hollow Trough Section: Extruded along X */}
      <group position={[-1.90, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh castShadow receiveShadow geometry={troughGeometry}>
          <meshStandardMaterial
            color={goldenAmberWood}
            roughness={0.46}
            metalness={0.02}
          />
        </mesh>
      </group>

      {/* 2. Narrow Right End Lip: Only a small resting ledge (the extended red block is removed) */}
      <group position={[0.55, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh castShadow receiveShadow geometry={rightEndLipGeometry}>
          <meshStandardMaterial
            color={goldenAmberWood}
            roughness={0.45}
            metalness={0.02}
          />
        </mesh>
      </group>

      {/* 3. Left End Plate (opposite to small cylinder) */}
      <group position={[-2.12, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh castShadow receiveShadow geometry={leftCarvedEndGeometry}>
          <meshStandardMaterial
            color={goldenWoodDeep}
            roughness={0.48}
            metalness={0.02}
          />
        </mesh>
      </group>

      {/* 4. Exact Image 3 Detail: Inward-Carved Scoop at Lower Left End */}
      <group position={[-2.14, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh receiveShadow geometry={inwardScoopGeometry}>
          <meshStandardMaterial
            color={goldenWoodDeep}
            roughness={0.62}
            metalness={0.01}
          />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Piece 2: Small Mounted Wooden Cylinder resting on the right deck
 * Requirements:
 * - Rests on the small end lip on the right side of the main semi-cylinder trough.
 * - Angle 1 (Exterior view): Untouched, golden amber cylinder with a clean, drilled circular hole.
 * - Angle 2 (Front mouth view): Pure, 100% circular hollow cylinder inside (r = 0.33) with ZERO rectangular slabs, chords, or shelves.
 * - Top-down view (Through-hole): The hole is drilled completely through the wooden wall so that the inside of the hollow cylinder is clearly visible through the hole.
 * - Right circular face: Completely closed with solid wood from both inside and outside.
 * - Left circular mouth: Open towards the trough with a smooth 360-degree circular ring rim.
 */
function SmallHollowCylinderOnDeck() {
  const outerRadius = 0.46;
  const innerRadius = 0.33;
  const cylinderLength = 0.96;
  const holeRadius = 0.14;
  const holeCenterX = cylinderLength * 0.50; // centered at 0.48 along X
  const Z_max = 0.16; // narrow sector enclosing the hole (0.16 > 0.14)
  const N = 32;

  // Split-roof generator: divides the top roof sector along the Z = 0 ridge
  // with multi-segment arc rims at X = 0 and X = L so that NO chord ever spans across the interior!
  const buildSplitRoof = (radius: number, isInner: boolean) => {
    const N_half = 16;
    const Narc = 8;

    // Left Half (Z <= 0)
    const shapeLeft = new Shape();
    shapeLeft.moveTo(0, -Z_max);
    shapeLeft.lineTo(cylinderLength, -Z_max);

    for (let i = 1; i <= Narc; i++) {
      const z = -Z_max * (1 - i / Narc);
      shapeLeft.lineTo(cylinderLength, z);
    }

    shapeLeft.lineTo(holeCenterX + holeRadius, 0);

    for (let i = 1; i <= N_half; i++) {
      const phi = (i / N_half) * Math.PI;
      const x = holeCenterX + holeRadius * Math.cos(phi);
      const z = -holeRadius * Math.sin(phi);
      shapeLeft.lineTo(x, z);
    }

    shapeLeft.lineTo(0, 0);

    for (let i = 1; i <= Narc; i++) {
      const z = -Z_max * (i / Narc);
      shapeLeft.lineTo(0, z);
    }
    shapeLeft.closePath();

    const geomLeft = new ShapeGeometry(shapeLeft);

    // Right Half (Z >= 0)
    const shapeRight = new Shape();
    shapeRight.moveTo(0, 0);
    shapeRight.lineTo(holeCenterX - holeRadius, 0);

    for (let i = 1; i <= N_half; i++) {
      const phi = (i / N_half) * Math.PI;
      const x = holeCenterX - holeRadius * Math.cos(phi);
      const z = holeRadius * Math.sin(phi);
      shapeRight.lineTo(x, z);
    }

    shapeRight.lineTo(cylinderLength, 0);

    for (let i = 1; i <= Narc; i++) {
      const z = Z_max * (i / Narc);
      shapeRight.lineTo(cylinderLength, z);
    }

    shapeRight.lineTo(0, Z_max);

    for (let i = 1; i <= Narc; i++) {
      const z = Z_max * (1 - i / Narc);
      shapeRight.lineTo(0, z);
    }
    shapeRight.closePath();

    const geomRight = new ShapeGeometry(shapeRight);

    for (const geom of [geomLeft, geomRight]) {
      const pos = geom.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getY(i);
        const y = Math.sqrt(Math.max(0, radius * radius - z * z));
        pos.setXYZ(i, x, y, z);
      }
      if (!isInner) {
        const idx = geom.index;
        if (idx) {
          for (let i = 0; i < idx.count; i += 3) {
            const tmp = idx.getX(i);
            idx.setX(i, idx.getX(i + 1));
            idx.setX(i + 1, tmp);
          }
        }
      }
      geom.computeVertexNormals();
    }
    return { geomLeft, geomRight };
  };

  // 1. Outer Split Roof (Untouched Angle 1 look with exact circular hole)
  const { geomLeft: outerRoofLeft, geomRight: outerRoofRight } = useMemo(
    () => buildSplitRoof(outerRadius, false),
    [outerRadius, cylinderLength, holeCenterX, holeRadius, Z_max]
  );

  // 2. Outer Lower Cylinder Arc: Continues the outer surface seamlessly around the bottom
  const outerArcGeometry = useMemo(() => {
    const alpha = Math.acos(Z_max / outerRadius);
    const beta = Math.PI - alpha;
    const totalAngle = Math.PI + 2 * alpha;
    const lengthSegments = 24;

    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];

    for (let ix = 0; ix <= lengthSegments; ix++) {
      const x = (ix / lengthSegments) * cylinderLength;
      for (let ia = 0; ia <= N; ia++) {
        const angle = beta + (ia / N) * totalAngle;
        const z = outerRadius * Math.cos(angle);
        const y = outerRadius * Math.sin(angle);
        positions.push(x, y, z);
        normals.push(0, y / outerRadius, z / outerRadius);
      }
    }

    const rowCount = N + 1;
    for (let ix = 0; ix < lengthSegments; ix++) {
      for (let ia = 0; ia < N; ia++) {
        const a = ix * rowCount + ia;
        const b = (ix + 1) * rowCount + ia;
        const c = (ix + 1) * rowCount + (ia + 1);
        const d = ix * rowCount + (ia + 1);
        indices.push(a, b, c);
        indices.push(a, c, d);
      }
    }

    const geom = new BufferGeometry();
    geom.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geom.setAttribute("normal", new Float32BufferAttribute(normals, 3));
    geom.setIndex(indices);
    return geom;
  }, [outerRadius, cylinderLength, Z_max]);

  // 3. Inner Split Roof (Pure circular cylinder with NO interior chords or flat slabs!)
  const { geomLeft: innerRoofLeft, geomRight: innerRoofRight } = useMemo(
    () => buildSplitRoof(innerRadius, true),
    [innerRadius, cylinderLength, holeCenterX, holeRadius, Z_max]
  );

  // 4. Inner Lower Cylinder Arc: 100% pure circular cylinder (r = 0.33) around the sides and bottom
  const innerArcGeometry = useMemo(() => {
    const alpha = Math.acos(Z_max / innerRadius);
    const beta = Math.PI - alpha;
    const totalAngle = Math.PI + 2 * alpha;
    const lengthSegments = 24;

    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];

    for (let ix = 0; ix <= lengthSegments; ix++) {
      const x = (ix / lengthSegments) * cylinderLength;
      for (let ia = 0; ia <= N; ia++) {
        const angle = beta + (ia / N) * totalAngle;
        const z = innerRadius * Math.cos(angle);
        const y = innerRadius * Math.sin(angle);
        positions.push(x, y, z);
        normals.push(0, -y / innerRadius, -z / innerRadius);
      }
    }

    const rowCount = N + 1;
    for (let ix = 0; ix < lengthSegments; ix++) {
      for (let ia = 0; ia < N; ia++) {
        const a = ix * rowCount + ia;
        const b = (ix + 1) * rowCount + ia;
        const c = (ix + 1) * rowCount + (ia + 1);
        const d = ix * rowCount + (ia + 1);
        indices.push(a, c, b);
        indices.push(a, d, c);
      }
    }

    const geom = new BufferGeometry();
    geom.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geom.setAttribute("normal", new Float32BufferAttribute(normals, 3));
    geom.setIndex(indices);
    return geom;
  }, [innerRadius, cylinderLength, Z_max]);

  // 5. Mouth Ring at X = 0: Closes the front rim between inner and outer cylinder into a seamless circular ring
  const mouthRingGeometry = useMemo(() => {
    const geom = new RingGeometry(innerRadius, outerRadius, N);
    geom.rotateY(-Math.PI / 2);
    return geom;
  }, [innerRadius, outerRadius]);

  // 6. Borehole Sleeve: Open vertical sleeve connecting the outer hole opening to the inner hole opening
  // Completely HOLLOW inside so looking down through the hole, the inside of the hollow cylinder is clearly visible!
  const boreholeWallGeometry = useMemo(() => {
    const geom = new CylinderGeometry(holeRadius, holeRadius, 1, N, 1, true);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      if (y > 0) {
        const yTop = Math.sqrt(Math.max(0, outerRadius * outerRadius - z * z));
        pos.setXYZ(i, holeCenterX + x, yTop, z);
      } else {
        const yBot = Math.sqrt(Math.max(0, innerRadius * innerRadius - z * z));
        pos.setXYZ(i, holeCenterX + x, yBot, z);
      }
    }
    geom.computeVertexNormals();
    return geom;
  }, [outerRadius, innerRadius, holeCenterX, holeRadius]);

  // 7. Solid Wood End Cap: Closes the right circular face completely (DoubleSide so it is closed inside & outside)
  const rightClosedCapGeometry = useMemo(() => {
    const geom = new CircleGeometry(outerRadius, N);
    geom.rotateY(Math.PI / 2);
    geom.translate(cylinderLength, 0, 0);
    return geom;
  }, [outerRadius, cylinderLength]);

  return (
    // Positioned directly on the narrow right end lip of the trough
    <group position={[0.56, 0.28 + outerRadius, 0]}>
      {/* 1. Outer curved roof (split along Z = 0 with circular hole cutout) */}
      <mesh castShadow receiveShadow geometry={outerRoofLeft}>
        <meshStandardMaterial
          color={goldenAmberWood}
          roughness={0.43}
          metalness={0.02}
          side={DoubleSide}
        />
      </mesh>
      <mesh castShadow receiveShadow geometry={outerRoofRight}>
        <meshStandardMaterial
          color={goldenAmberWood}
          roughness={0.43}
          metalness={0.02}
          side={DoubleSide}
        />
      </mesh>

      {/* 2. Outer lower cylinder body */}
      <mesh castShadow receiveShadow geometry={outerArcGeometry}>
        <meshStandardMaterial
          color={goldenAmberWood}
          roughness={0.43}
          metalness={0.02}
          side={DoubleSide}
        />
      </mesh>

      {/* 3. Inner curved roof (pure curved ceiling, ZERO interior slabs or chords!) */}
      <mesh receiveShadow geometry={innerRoofLeft}>
        <meshStandardMaterial
          color={goldenAmberWood}
          roughness={0.45}
          metalness={0.02}
          side={DoubleSide}
        />
      </mesh>
      <mesh receiveShadow geometry={innerRoofRight}>
        <meshStandardMaterial
          color={goldenAmberWood}
          roughness={0.45}
          metalness={0.02}
          side={DoubleSide}
        />
      </mesh>

      {/* 4. Inner lower cylinder body (pure circular r = 0.33) */}
      <mesh receiveShadow geometry={innerArcGeometry}>
        <meshStandardMaterial
          color={goldenAmberWood}
          roughness={0.45}
          metalness={0.02}
          side={DoubleSide}
        />
      </mesh>

      {/* 5. Front circular mouth ring at X = 0 */}
      <mesh castShadow receiveShadow geometry={mouthRingGeometry}>
        <meshStandardMaterial
          color={goldenAmberWood}
          roughness={0.43}
          metalness={0.02}
          side={DoubleSide}
        />
      </mesh>

      {/* 6. Borehole sleeve lining the drilled hole through the wall (hollow inside!) */}
      <mesh geometry={boreholeWallGeometry}>
        <meshStandardMaterial
          color="#804818"
          roughness={0.78}
          metalness={0.01}
          side={DoubleSide}
        />
      </mesh>

      {/* 7. Solid wood end cap closing the right face (closed from both outside and inside) */}
      <mesh castShadow receiveShadow geometry={rightClosedCapGeometry}>
        <meshStandardMaterial
          color={goldenAmberWood}
          roughness={0.45}
          metalness={0.02}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}

/**
 * Complete Assembled Custom Desk Caddy:
 * 1. Hollow Semi-Cylinder Trough with left inward-carved scoop (Image 3).
 * 2. Solid right surface area where the small hollow cylinder rests (Image 1 & 2).
 * 3. Small hollow cylinder with open horizontal bore and distinct top hole (Image 1).
 * 4. Stably resting flat on a plain surface — NO air bobbing or floating tilt.
 */
function CustomCaddyAssembly() {
  const model = useRef<Group>(null);

  // Smooth continuous turntable rotation resting steadily on the ground surface
  useFrame((_state, delta) => {
    if (model.current) model.current.rotation.y += delta * 0.12;
  });

  return (
    <group
      ref={model}
      position={[0, 0, 0]}
      rotation={[0, -0.65, 0]}
      scale={0.92}
    >
      {/* Shift up by +0.52 so the flat base of the trough rests exactly on the ground plane (Y = 0.00) */}
      <group position={[-0.15, 0.52, 0]}>
        <MainSemiCylinderTrough />
        <SmallHollowCylinderOnDeck />
      </group>
    </group>
  );
}

export function CustomCaddyScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [4.4, 3.0, 5.0], fov: 36 }}
      aria-label="Interactive 3D model of the Dridha custom bespoke rustic desk caddy with hollow semi-cylinder and top-holed side cylinder"
      className="w-full h-full cursor-grab active:cursor-grabbing"
    >
      <color attach="background" args={["#eedfc8"]} />
      <hemisphereLight args={["#fff5e1", "#23432c", 1.85]} />
      <directionalLight
        castShadow
        position={[5.5, 7.5, 4.5]}
        intensity={2.3}
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight
        position={[-4.5, 3.0, -3.5]}
        intensity={0.7}
        color="#d9924c"
      />
      <directionalLight
        position={[0, 1.5, 4]}
        intensity={0.4}
        color="#ffe2b8"
      />

      {/* The 3D model resting flat on the ground plane */}
      <CustomCaddyAssembly />

      {/* Ground plane contact shadow directly underneath the flat wooden base */}
      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.52}
        scale={8.5}
        blur={2.0}
        far={3.0}
      />

      <OrbitControls
        target={[0, 0.32, 0]}
        enablePan={false}
        enableZoom={false}
        minPolarAngle={0.45}
        maxPolarAngle={Math.PI / 2 - 0.04}
      />
    </Canvas>
  );
}
