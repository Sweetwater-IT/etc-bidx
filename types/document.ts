export type DocumentCategory =
  | "contract"
  | "addendum"
  | "permit"
  | "insurance"
  | "bond"
  | "plan"
  | "specification"
  | "correspondence"
  | "photo"
  | "other";

export interface ContractDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  category: DocumentCategory;
  associatedItemId?: string;
  associatedItemLabel?: string;
  uploadedAt: string | Date;
  filePath?: string;
}