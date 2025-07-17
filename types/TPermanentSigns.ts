//need to add material mark up 55% (would be applied to all items)
export type PermanentSigns = {
    maxDailyHours: number;
    itemMarkup: number;
    // separateMobilization: boolean;
    equipmentData: PMSEquipmentPiece[]
    productivityRates: Record<PMSItemKeys, number>;
    signItems: PMSItemNumbers[]
}
export type PMSItemKeys = 'pmsTypeB' | 'pmsTypeF' | 'resetTypeB' | 'resetTypeF' | 'removeTypeB' | 'removeTypeF' | 'pmsTypeC' | 'flexibleDelineator'
export type PMSItemNumbers = PostMountedInstall | PostMountedResetOrRemove | PostMountedInstallTypeC | InstallFlexibleDelineators
export type PMSEquipmentItems = 'permSignBolts' | 'antiTheftBolts' | 'chevronBrackets' | 'streetNameCrossBrackets' | 
'stiffenerSqInches' | 'tmzBrackets' | 'jennyBrackets' | 'hiReflectiveStrips' | 'fygReflectiveStrips' | 'post' | 'woodPostMetalSleeves' | 'permSignCostSqFt'
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
    // PostMountedInstall specific keys
    | 'type'
    | 'signSqFootage'
    | 'signPriceSqFt'
    | 'hiReflectiveStrips'
    | 'fygReflectiveStrips'
    | 'jennyBrackets'
    | 'stiffenerSqInches'
    | 'tmzBrackets'
    | 'antiTheftBolts'
    | 'chevronBrackets'
    | 'streetNameCrossBrackets'
    // PostMountedResetOrRemove specific keys
    | 'isRemove'
    | 'additionalItems'
    // InstallFlexibleDelineators specific key
    | 'cost';

export interface PMSEquipmentPiece {
    name: PMSEquipmentItems
    cost: number;
}

interface PermanentSignItem {
    id: string;
    itemNumber: string;
    personnel: number;
    numberTrucks: number;
    numberTrips: number;
    installHoursRequired: number;
    quantity: number;
    //pms reset type f is the only one without perm sign bolts
    permSignBolts?: number
}

export interface PostMountedInstall extends PermanentSignItem {
    type: 'B' | 'F'
    signSqFootage: number;
    signPriceSqFt: number;
    hiReflectiveStrips: number;
    fygReflectiveStrips: number;
    jennyBrackets: number;
    stiffenerSqInches: number;
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
    stiffenerSqInches: number;
    tmzBrackets: number;
    antiTheftBolts: number;
}

interface AdditionalPMSEquipment {
    equipmentType: PMSEquipmentItems
    quantity: number
}

export interface InstallFlexibleDelineators extends PermanentSignItem {
    cost: number;
    additionalItems: AdditionalPMSEquipment[]
}

export const permSignsDbMap: Record<string, PMSEquipmentItems> = {
    'Anti-Theft Bolts': 'antiTheftBolts',
    'Perm. Sign Bolts': 'permSignBolts',
    'Chevron Bracket': 'chevronBrackets',
    'Street Name Cross Bracket': 'streetNameCrossBrackets',
    'STIFFENER_PER_INCH': 'stiffenerSqInches',
    'TMZ_BRACKET': 'tmzBrackets',
    'JENNY_BRACKET': 'jennyBrackets',
    'HI_REFLECTIVE_STRIPS': 'hiReflectiveStrips',
    'FYG_REFLECTIVE_STRIPS': 'fygReflectiveStrips',
    'Posts 12ft': 'post', // or '12ft Posts' - both exist with same price
    'WOOD_POST_METAL_SLEEVE': 'woodPostMetalSleeves',
    'PERM_SIGN_COST_SQ_FT': 'permSignCostSqFt',
    'PERM_SIGN_PRICE_SQ_FT': 'permSignPriceSqFt'
};