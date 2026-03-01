export type SignMaterial = "PLASTIC" | "ALUMINUM" | "DIBOND" | "ACM";

export const SIGN_MATERIALS = [
  { value: "PLASTIC" as const, label: "Plastic", abbrev: "PL" },
  { value: "ALUMINUM" as const, label: "Aluminum", abbrev: "AL" },
  { value: "DIBOND