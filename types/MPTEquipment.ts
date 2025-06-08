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
  { key: 'sixFootWings', label: '6 Ft Wings', dbName: '6 Ft Wings'},
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
  { key: 'TypeXIVP', label: 'Type XI Vertical Panels', dbName: 'Type XI Vertical Panels'},
  { key: 'BLights', label: 'B-Lites', dbName: 'B-Lites'},
  { key: 'ACLights', label: 'A/C-Lites', dbName: 'A/C-Lites'},
  { key: 'sharps', label: 'Sharps', dbName: 'Sharps'},
  { key: 'HI', label: 'HI', dbName: 'HI Signs'},
  { key: 'DG', label: 'DG', dbName: 'DG Signs'},
  { key: 'Special', label: 'Special', dbName: 'Special Signs'}
]

// Static Information for Each Equipment
export interface StaticEquipmentInfo {
  price: number;
  discountRate: number;
  usefulLife : number;
  paybackPeriod : number;
}

// Dynamic Information for Each Equipment in a Phase
export interface DynamicEquipmentInfo {
  quantity: number;
}

export type AssociatedSignStructures = 'fourFootTypeIII' | 'hStand' | 'post' | 'none';

// Sign Interface
export interface DynamicSignInfo {
  id: string;
  width: number;
  height: number;
  quantity: number;
  sheeting: SheetingType;
  isCustom : boolean;
  designation: string;
  description: string;
  substrate?: 'plastic' | 'aluminum' | 'aluminum-composite'
  stiffener?: boolean;
}
export interface PrimarySign extends DynamicSignInfo {
	associatedStructure: AssociatedSignStructures;
	bLights: number;
	// aLights : number;
	covers: number;
}
export interface SecondarySign extends DynamicSignInfo{
  primarySignId : string
}

export interface CustomLightAndDrumItem {
  id: string;
  quantity: number;
  cost : number;
  usefulLife : number;
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
  targetMOIC : number;
  paybackPeriod : number;
  annualUtilization : number;
  dispatchFee : number;
  mpgPerTruck : number;
  staticEquipmentInfo: Record<EquipmentType | SheetingType, StaticEquipmentInfo>;
  equipmentCosts: Record<EquipmentType, { cost: number; price: number }>;
  phases: Phase[];
};