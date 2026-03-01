// utils/signMaterial.ts

/**
 * Supported sign material types.
 * Keep this list in sync with your database constraints (if any).
 */
export type SignMaterial = "PLASTIC" | "ALUMINUM" | "DIBOND" | "ACM";

/**
 * Full list of available sign materials with display labels and abbreviations.
 * Used for dropdowns, chips, tooltips, etc.
 */
export const SIGN_MATERIALS = [
  { value: "PLASTIC" as const, label: "Plastic", abbrev: "PL" },
  { value: "ALUMINUM" as const, label: "Aluminum", abbrev: "AL" },
  { value: "DIBOND" as const, label: "Dibond", abbrev: "DI" },
  { value: "ACM" as const, label: "ACM", abbrev: "ACM" },
] as const;

/**
 * Default material used when none is specified.
 */
export const DEFAULT_SIGN_MATERIAL: SignMaterial = "PLASTIC";

/**
 * Converts a material value to its short abbreviation (2-3 letters).
 * Falls back gracefully if the material is unknown.
 *
 * @example
 * abbreviateMaterial("PLASTIC")    // → "PL"
 * abbreviateMaterial("ALUMINUM")   // → "AL"
 * abbreviateMaterial("VINYL")      // → "VI" (fallback)
 * abbreviateMaterial(undefined)    // → "—"
 */
export function abbreviateMaterial(
  material: SignMaterial | string | undefined | null
): string {
  if (!material) return "—";

  const found = SIGN_MATERIALS.find(m => m.value === material);
  if (found) return found.abbrev;

  // Fallback for unknown values: take first two uppercase letters
  return String(material).trim().slice(0, 2).toUpperCase() || "??";
}

/**
 * Checks if a given string is a valid SignMaterial value.
 */
export function isValidSignMaterial(value: string | undefined): value is SignMaterial {
  return SIGN_MATERIALS.some(m => m.value === value);
}

/**
 * Gets the full display label for a material (or fallback).
 */
export function getMaterialLabel(material: SignMaterial | string | undefined): string {
  if (!material) return "Unknown";

  const found = SIGN_MATERIALS.find(m => m.value === material);
  return found?.label ?? String(material);
}
