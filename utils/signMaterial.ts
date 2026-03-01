export type SignMaterial = "PLASTIC" | "ALUMINUM" | "DIBOND" | "ACM";

export const SIGN_MATERIALS = [
  { value: "PLASTIC" as const, label: "Plastic", abbrev: "PL" },
  { value: "ALUMINUM" as const, label: "Aluminum", abbrev: "AL" },
  { value: "DIBOND" as const, label: "Dibond", abbrev: "DI" },
  { value: "ACM" as const, label: "ACM", abbrev: "ACM" },
];

export const DEFAULT_SIGN_MATERIAL: SignMaterial = "PLASTIC";

export function abbreviateMaterial(material
