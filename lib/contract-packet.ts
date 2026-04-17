export type BuiltInContractDocType =
  | "w9"
  | "eeo-sharp"
  | "safety-program"
  | "sexual-harassment"
  | "avenue-appeals";

export type GeneratedContractDocType =
  | "fringe-benefits"
  | "workers-protection"
  | "employment-verification";

export const BUILT_IN_CONTRACT_DOCS: Array<{
  type: BuiltInContractDocType;
  label: string;
  filename: string;
  sourcePath: string;
}> = [
  {
    type: "w9",
    label: "W-9",
    filename: "ETC W-9 2025.pdf",
    sourcePath: "/documents/ETC W-9 2025.pdf",
  },
  {
    type: "eeo-sharp",
    label: "EEO-SHARP Policy",
    filename: "EEO-SHARP Policy 2025.pdf",
    sourcePath: "/documents/EEO-SHARP Policy 2025.pdf",
  },
  {
    type: "safety-program",
    label: "Safety Program",
    filename: "Full ETC SAFETY PROGRAM.pdf",
    sourcePath: "/documents/Full ETC SAFETY PROGRAM.pdf",
  },
  {
    type: "sexual-harassment",
    label: "Sexual Harassment Policy",
    filename: "Full ETC Sexual Harrasment Policy 2025.pdf",
    sourcePath: "/documents/Full ETC Sexual Harrasment Policy 2025.pdf",
  },
  {
    type: "avenue-appeals",
    label: "Avenue of Appeals",
    filename: "Avenue of Appeals 2025.pdf",
    sourcePath: "/documents/Avenue of Appeals 2025.pdf",
  },
];

export const GENERATED_CONTRACT_DOCS: Array<{
  type: GeneratedContractDocType;
  label: string;
}> = [
  {
    type: "fringe-benefits",
    label: "Fringe Benefits Letter",
  },
  {
    type: "workers-protection",
    label: "Worker's Protection Form",
  },
  {
    type: "employment-verification",
    label: "Employment Verification Form",
  },
];
