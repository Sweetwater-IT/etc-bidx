export type PermanentSigns = {
    maxDailyHours: number;
    itemMarkup: number;
    // separateMobilization: boolean;
    equipmentData: PMSEquipmentPiece[]
    productivityRates: Record<PMSItemKeys, number>;
    signItems: PMSItemNumbers[]
}

export type PMSItemKeys = 'pmsTypeB' | 'pmsTypeF' | 'resetTypeB' | 'resetTypeF' | 'removeTypeB' | 'removeTypeF' | 'pmsTypeC' | 'flexibleDelineator' | string
export type PMSItemNumbers = PostMountedInstall | PostMountedResetOrRemove | PostMountedInstallTypeC | InstallFlexibleDelineators
export type PMSEquipmentItems = 'permSignBolts' | 'antiTheftBolts' | 'chevronBrackets' | 'streetNameCrossBrackets' |
    'stiffenerInches' | 'tmzBrackets' | 'jennyBrackets' | 'hiReflectiveStrips' | 'fygReflectiveStrips' | 'post' | 'woodPostMetalSleeves' | 'permSignCostSqFt'
    | 'permSignPriceSqFt'

export type AllPMSItemKeys =
    // Base PermanentSignItem keys
    | 'id'
    | 'itemNumber'
    | 'personnel'
    | 'numberTrucks'
    | 'numberTrips'
    | 'installHoursRequired'
    | 'quantity'
    | 'permSignBolts'
    | 'productivityRate'
    | 'days' // Added new field
    // PostMountedInstall specific keys
    | 'type'
    | 'signSqFootage'
    | 'permSignPriceSqFt'
    | 'standardPricing'
    | 'customMargin'
    | 'separateMobilization'
    | 'permSignCostSqFt'
    | 'hiReflectiveStrips'
    | 'fygReflectiveStrips'
    | 'jennyBrackets'
    | 'stiffenerInches'
    | 'tmzBrackets'
    | 'antiTheftBolts'
    | 'chevronBrackets'
    | 'streetNameCrossBrackets'
    // PostMountedResetOrRemove specific keys
    | 'isRemove'
    | 'additionalItems'
    // InstallFlexibleDelineators specific key
    | 'flexibleDelineatorCost'
    | 'customItemTypeName'

export interface PMSEquipmentPiece {
    name: PMSEquipmentItems
    cost: number;
}

interface PermanentSignItem {
    id: string;
    itemNumber: string;
    personnel: number;
    numberTrucks: number;
    customMargin: number;
    standardPricing: boolean;
    separateMobilization: boolean;
    numberTrips: number;
    installHoursRequired: number;
    quantity: number;
    //pms reset type f is the only one without perm sign bolts
    permSignBolts?: number
    customItemTypeName?: string;
    days: number; // Added new field
}

export interface PostMountedInstall extends PermanentSignItem {
    type: 'B' | 'F'
    signSqFootage: number;
    hiReflectiveStrips: number;
    fygReflectiveStrips: number;
    jennyBrackets: number;
    stiffenerInches: number;
    tmzBrackets: number;
    //perm signs are autopopulated: installs x 2
    antiTheftBolts: number;
    chevronBrackets: number;
    streetNameCrossBrackets: number;
}

export interface PostMountedResetOrRemove extends PermanentSignItem {
    type: 'B' | 'F'
    isRemove: boolean
    additionalItems: AdditionalPMSEquipment[]
}

export interface PostMountedInstallTypeC extends PermanentSignItem {
    signSqFootage: number;
    signPriceSqFt: number;
    hiReflectiveStrips: number;
    fygReflectiveStrips: number;
    stiffenerInches: number;
    tmzBrackets: number;
    antiTheftBolts: number;
}

export interface AdditionalPMSEquipment {
    equipmentType: PMSEquipmentItems
    quantity: number
}

export interface InstallFlexibleDelineators extends PermanentSignItem {
    flexibleDelineatorCost: number;
    additionalItems: AdditionalPMSEquipment[]
}

export const permSignsDbMap: Record<string, PMSEquipmentItems> = {
    'Anti-Theft Bolts': 'antiTheftBolts',
    'Perm. Sign Bolts': 'permSignBolts',
    'Chevron Bracket': 'chevronBrackets',
    'Street Name Cross Bracket': 'streetNameCrossBrackets',
    'STIFFENER_INCHES': 'stiffenerInches',
    'TMZ_BRACKET': 'tmzBrackets',
    'JENNY_BRACKET': 'jennyBrackets',
    'HI_REFLECTIVE_STRIPS': 'hiReflectiveStrips',
    'FYG_REFLECTIVE_STRIPS': 'fygReflectiveStrips',
    'Posts 12ft': 'post', // or '12ft Posts' - both exist with same price
    'WOOD_POST_METAL_SLEEVE': 'woodPostMetalSleeves',
    'PERM_SIGN_COST_SQ_FT': 'permSignCostSqFt',
    'PERM_SIGN_PRICE_SQ_FT': 'permSignPriceSqFt'
};

export const determineItemType = (item: PMSItemNumbers): PMSItemKeys => {
    //delineators
    if (Object.hasOwn(item, 'flexibleDelineatorCost')) {
        return 'flexibleDelineator'
    }
    //post mounted installs
    else if (Object.hasOwn(item, 'hiReflectiveStrips')) {
        if (!Object.hasOwn(item, 'streetNameCrossBrackets')) {
            return 'pmsTypeC'
        } else if ((item as PostMountedInstall).type === 'B') {
            return 'pmsTypeB'
        } else return 'pmsTypeF'
    }
    //removals
    else if (Object.hasOwn(item, 'isRemove') && (item as PostMountedResetOrRemove).isRemove) {
        return (item as PostMountedResetOrRemove).type === 'B' ? "removeTypeB" : 'removeTypeF'
    } else {
        return (item as PostMountedResetOrRemove).type === 'B' ? 'resetTypeB' : 'resetTypeF'
    }
}

export const PERMANENT_SIGN_ITEMS: Record<string, PMSItemKeys> = {
    'Type B Post Mount': 'pmsTypeB',
    'Reset Type B': 'resetTypeB',
    'Remove Type B': 'removeTypeB',
    'Type F Post Mount': 'pmsTypeF',
    'Reset Type F': 'resetTypeF',
    'Remove Type F': 'removeTypeF',
    'Type C Post Mount': 'pmsTypeC',
    'Flexible Delineator': 'flexibleDelineator'
}

export const getDisplayName = (key: PMSItemKeys): string => {
    return Object.entries(PERMANENT_SIGN_ITEMS).find(([_, value]) => value === key)?.[0] || key;
};

export const ADDITIONAL_EQUIPMENT_OPTIONS: Record<string, PMSEquipmentItems> = {
    'Anti-Theft Bolts': 'antiTheftBolts',
    'Chevron Brackets': 'chevronBrackets',
    'Street Name Cross Brackets': 'streetNameCrossBrackets',
    'Stiffener Inches': 'stiffenerInches',
    'TMZ Brackets': 'tmzBrackets',
    'Jenny Brackets': 'jennyBrackets',
    'Hi-Reflective Strips': 'hiReflectiveStrips',
    'FYG Reflective Strips': 'fygReflectiveStrips',
    'Wood Post Metal Sleeves': 'woodPostMetalSleeves'
  };
