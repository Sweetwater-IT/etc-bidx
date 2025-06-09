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

export type StructureKey =
  | 'fourFootTypeIII_right'
  | 'fourFootTypeIII_left'
  | 'sixFootTypeIII_right'
  | 'sixFootTypeIII_left'
  | 'hStand'
  | 'post_8ft'
  | 'post_10ft'
  | 'post_12ft'
  | 'post_14ft'
  | 'none';

export interface StructureMapping {
  displayName: string;
  baseEquipmentType: EquipmentType | 'none';
}

export const structureMap: Record<StructureKey, StructureMapping> = {
  'fourFootTypeIII_right': {
    displayName: "4' T-III RIGHT",
    baseEquipmentType: 'fourFootTypeIII'
  },
  'fourFootTypeIII_left': {
    displayName: "4' T-III LEFT",
    baseEquipmentType: 'fourFootTypeIII'
  },
  'sixFootTypeIII_right': {
    displayName: "6' T-III RIGHT",
    baseEquipmentType: 'fourFootTypeIII' // Same base equipment
  },
  'sixFootTypeIII_left': {
    displayName: "6' T-III LEFT",
    baseEquipmentType: 'fourFootTypeIII'
  },
  'hStand': {
    displayName: 'H-FOOT',
    baseEquipmentType: 'hStand'
  },
  'post_8ft': {
    displayName: "8' POST",
    baseEquipmentType: 'post'
  },
  'post_10ft': {
    displayName: "10' POST",
    baseEquipmentType: 'post'
  },
  'post_12ft': {
    displayName: "12' POST",
    baseEquipmentType: 'post'
  },
  'post_14ft': {
    displayName: "14' POST",
    baseEquipmentType: 'post'
  },
  'none': {
    displayName: 'LOOSE',
    baseEquipmentType: 'none'
  }
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
  substrate?: 'Plastic' | 'Aluminum' | 'Aluminum-Composite'
  stiffener?: boolean;
}
export interface PrimarySign extends DynamicSignInfo {
  associatedStructure: StructureKey;
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