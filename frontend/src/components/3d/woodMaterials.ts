"use client";

export type FinishOption = "unpolished" | "transparent" | "brown";

export interface WoodColorTheme {
  primary: string;   // Main body / deck / column
  accent: string;    // Stopper / raised lip / secondary rail
  detail: string;    // Dowel pins / joint accents / edges
  roughness: number; // Surface polish level
  metalness: number;
}

/**
 * Single source of truth for Dridha Crafts 3D materials.
 * Guaranteed 100% color, roughness, and lighting consistency across all products.
 */
export const WOOD_FINISH_THEMES: Record<FinishOption, WoodColorTheme> = {
  unpolished: {
    primary: "#dfa663", // Signature Kashmir blonde natural pine (raw matte)
    accent: "#c68644",
    detail: "#d69858",
    roughness: 0.62,
    metalness: 0.01,
  },
  transparent: {
    primary: "#dfa663", // Exact same wood color as unpolished, with clear protective polish sheen
    accent: "#c68644",
    detail: "#d69858",
    roughness: 0.36,
    metalness: 0.02,
  },
  brown: {
    primary: "#b86a2a", // Deep rich artisan warm brown pine polish
    accent: "#964f19",
    detail: "#a55c20",
    roughness: 0.42,
    metalness: 0.02,
  },
};

/**
 * Unified Studio Lighting Environment for all product 3D viewports.
 */
export const STUDIO_3D_ENV = {
  backgroundColor: "#eedfc8",
  hemisphereSky: "#fff4dd",
  hemisphereGround: "#23432c",
  hemisphereIntensity: 1.8,
  keyLightPos: [5, 7.5, 4.5] as [number, number, number],
  keyLightIntensity: 2.3,
  fillLightPos: [-4.5, 2.5, -3] as [number, number, number],
  fillLightColor: "#d9924c",
  fillLightIntensity: 0.75,
};
