// Define Equipment Types
export type EquipmentType =
  | 'fourFootTypeIII'
  // | 'sixFootTypeIII'
  | 'hStand'
  | 'sixFootWings'
  | 'post'
  | 'sandbag'
  | 'covers'
  | 'metalStands'
  | 'HIVP'
  | 'TypeXIVP'
  | 'BLights'
  | 'ACLights'
  | 'sharps';

export type AssociatedStructures = 'fourFootTypeIII' | 'hStand' | 'post' | 'none'

export type DisplayStructures = "4' T-III RIGHT" | "4' T-III LEFT" | "6' T-III RIGHT" | "6' T-III LEFT" | 'H-FOOT'
| "8' POST" | "10' POST" | "12' POST" | "14' POST" | 'LOOSE'

export interface StructureMapping {
  displayName: string;
  baseEquipmentType: AssociatedStructures;
}

export const structureMap: Record<DisplayStructures, AssociatedStructures> = {
  "4' T-III RIGHT" : 'fourFootTypeIII',
  "4' T-III LEFT" : 'fourFootTypeIII',
  "6' T-III RIGHT" : 'fourFootTypeIII',
  "6' T-III LEFT" : 'fourFootTypeIII',
  "10' POST": 'post',
  "12' POST" : 'post',
  "14' POST" : 'post',
  "8' POST": 'post',
  "H-FOOT": 'hStand',
  'LOOSE': 'none'
};

export type SheetingType = 'HI' | 'DG' | 'Special';

interface EquipmentMapping {
  key: EquipmentType;
  label: string;
  dbName: string;
}

interface AllEquipmentMapping {
  key: EquipmentType | SheetingType;
  label: string;
  dbName: string;
}

export interface SignDesignation {
  designation: string;
  description: string;
  sheeting: SheetingType;
  dimensions: SignDimension[];
}

export interface SignDimension {
  width: number;
  height: number;
}

export const labelMapping: Record<string, string> = {
  fourFootTypeIII: "Four Foot Type III",
  hStand: "H Stand",
  post: "Post",
  sandbag: "Sandbags",
  sixFootWings: "Six Foot Wings",
  metalStands: "Metal Stands",
  covers: "Covers",
  HIVP: "HI Vertical Panels",
  TypeXIVP: "Type XI Vertical Panels",
  BLights: "B-Lights",
  ACLights: "AC Lights",
  sharps: "Sharps"
};

// Standard equipment list
export const standardEquipmentList: EquipmentType[] = [
  "fourFootTypeIII",
  "hStand",
  "post",
  "sixFootWings",
  "metalStands",
  "covers",
  "sandbag"
];

// Light and drum list
export const lightAndDrumList: EquipmentType[] = [
  "HIVP",
  "TypeXIVP",
  "BLights",
  "ACLights",
  "sharps"
];

export interface SignMapping {
  key: SheetingType;
  label: string;
  dbName: string;
}

export const signList: SignMapping[] = [
  { key: 'HI', label: 'HI', dbName: 'HI Signs' },
  { key: 'DG', label: 'DG', dbName: 'DG Signs' },
  { key: 'Special', label: 'Special', dbName: 'Special Signs' }
];


export const equipmentList: EquipmentMapping[] = [
  { key: 'fourFootTypeIII', label: "4' Ft Type III", dbName: "4' Ft Type III" },
  { key: 'sixFootWings', label: '6 Ft Wings', dbName: '6 Ft Wings' },
  // { key: 'sixFootTypeIII', label: '6 Ft Type III', dbName: '6 Ft Type III' },
  { key: 'hStand', label: 'H Stand', dbName: 'H Stands' },
  { key: 'post', label: 'Post', dbName: 'Posts 12ft' },
  { key: 'covers', label: 'Covers', dbName: 'Covers' },
  { key: 'metalStands', label: 'Metal Stands', dbName: 'SL Metal Stands' },
  { key: 'sandbag', label: 'Sandbag', dbName: 'Sand Bag' },
];

export const allEquipmentList: AllEquipmentMapping[] = [
  ...equipmentList,
  { key: 'HIVP', label: 'HI Vertical Panels', dbName: 'HI Vertical Panels' },
  { key: 'TypeXIVP', label: 'Type XI Vertical Panels', dbName: 'Type XI Vertical Panels' },
  { key: 'BLights', label: 'B-Lites', dbName: 'B-Lites' },
  { key: 'ACLights', label: 'A/C-Lites', dbName: 'A/C-Lites' },
  { key: 'sharps', label: 'Sharps', dbName: 'Sharps' },
  { key: 'HI', label: 'HI', dbName: 'HI Signs' },
  { key: 'DG', label: 'DG', dbName: 'DG Signs' },
  { key: 'Special', label: 'Special', dbName: 'Special Signs' }
]

// Static Information for Each Equipment
export interface StaticEquipmentInfo {
  price: number;
  discountRate: number;
  usefulLife: number;
  paybackPeriod: number;
}

// Dynamic Information for Each Equipment in a Phase
export interface DynamicEquipmentInfo {
  quantity: number;
}

// Sign Interface
export interface DynamicSignInfo {
  id: string;
  width: number;
  height: number;
  quantity: number;
  sheeting: SheetingType;
  isCustom: boolean;
  designation: string;
  description: string;
  bLightsColor?: 'Yellow' | 'Red' | 'White'
  substrate?: 'Plastic' | 'Aluminum' | 'Aluminum-Composite'
  stiffener?: boolean;
}
export interface PrimarySign extends DynamicSignInfo {
  associatedStructure: AssociatedStructures
  displayStructure: DisplayStructures
  bLights: number;
  // aLights : number;
  cover: boolean;
}
export interface SecondarySign extends DynamicSignInfo {
  primarySignId: string
}

export interface CustomLightAndDrumItem {
  id: string;
  quantity: number;
  cost: number;
  usefulLife: number;
}

// Phase Interface
export interface Phase {
  name: string;
  startDate: Date | null;
  endDate: Date | null;
  personnel: number;
  days: number;
  numberTrucks: number;
  additionalRatedHours: number;
  additionalNonRatedHours: number;
  maintenanceTrips: number;
  standardEquipment: Record<EquipmentType, DynamicEquipmentInfo>;
  customLightAndDrumItems: CustomLightAndDrumItem[];
  signs: (PrimarySign | SecondarySign)[];
}

export type MPTRentalEstimating = {
  targetMOIC: number;
  paybackPeriod: number;
  annualUtilization: number;
  dispatchFee: number;
  mpgPerTruck: number;
  staticEquipmentInfo: Record<EquipmentType | SheetingType, StaticEquipmentInfo>;
  equipmentCosts: Record<EquipmentType, { cost: number; price: number }>;
  phases: Phase[];
};

export interface ShopTrackingInfo {
  make: number;
  order: number;
  inStock: number;
}

export interface ExtendedPrimarySign extends PrimarySign, ShopTrackingInfo {}

export interface ExtendedSecondarySign extends SecondarySign, ShopTrackingInfo {}

export const hasShopTracking = (sign: PrimarySign | SecondarySign | ExtendedPrimarySign | ExtendedSecondarySign): sign is ExtendedPrimarySign | ExtendedSecondarySign => {
  return 'make' in sign && 'order' in sign && 'inStock' in sign;
};

export const isPrimarySignWithShopTracking = (sign: PrimarySign | SecondarySign | ExtendedPrimarySign | ExtendedSecondarySign): sign is ExtendedPrimarySign => {
  return !('primarySignId' in sign) && hasShopTracking(sign);
};

export const isSecondarySignWithShopTracking = (sign: PrimarySign | SecondarySign | ExtendedPrimarySign | ExtendedSecondarySign): sign is ExtendedSecondarySign => {
  return 'primarySignId' in sign && hasShopTracking(sign);
};