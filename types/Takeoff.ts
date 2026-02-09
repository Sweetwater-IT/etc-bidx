export interface TakeoffItem {
  id: string;
  itemNumber: string;
  description: string;
  quantity: number;
  uom: string;
  notes: string;
}

export interface TakeoffHeader {
  etcJobNumber: string;
  workType: string;
  customer: any; // Customer type
  customerJobNumber: string;
  customerPOC: string;
  customerPOCEmail: string;
  customerPOCPhone: string;
  contractNumber: string;
}

export const WORK_TYPES = [
  'MPT',
  'permanent signs',
  'lane closure/flagging',
  'rental',
  'delivery',
  'service'
] as const;

export type WorkType = typeof WORK_TYPES[number];