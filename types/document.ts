export type DocumentCategory =
  | "contract"
  | "addendum"
  | "permit"
  | "insurance"
  | "change_order"
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
