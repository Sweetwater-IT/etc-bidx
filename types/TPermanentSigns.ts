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
    permSignPriceSqFt: number;
    permSignCostSqFt: number;
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
    permSignPriceSqFt: number;
    permSignCostSqFt: number;
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
    // Función helper para verificar si un valor existe y es truthy/no nulo
    const hasValue = (value: any): boolean => value !== null && value !== undefined;
    
    // Type guard para InstallFlexibleDelineators
    const isFlexibleDelineator = (item: PMSItemNumbers): item is InstallFlexibleDelineators => {
        return 'flexibleDelineatorCost' in item && hasValue(item.flexibleDelineatorCost);
    };
    
    // Type guard para PostMountedInstallTypeC
    const isTypeC = (item: PMSItemNumbers): item is PostMountedInstallTypeC => {
        return 'hiReflectiveStrips' in item && hasValue(item.hiReflectiveStrips) && 
               !('streetNameCrossBrackets' in item);
    };
    
    // Type guard para PostMountedInstall (B/F con reflective strips)
    const isPostMountedInstall = (item: PMSItemNumbers): item is PostMountedInstall => {
        return 'hiReflectiveStrips' in item && hasValue(item.hiReflectiveStrips);
    };
    
    // Type guard para PostMountedResetOrRemove
    const isResetOrRemove = (item: PMSItemNumbers): item is PostMountedResetOrRemove => {
        return 'isRemove' in item;
    };

    // 1. Delineador flexible - prioridad máxima
    if (isFlexibleDelineator(item) && Number(item.flexibleDelineatorCost) > 0) {
        return 'flexibleDelineator';
    }
    
    // 2. Tipo C - tiene tiras reflectivas altas pero NO soportes de nombre de calle
    if (isTypeC(item)) {
        return 'pmsTypeC';
    }
    
    // 3. Tipo B/F con tiras reflectivas - instalación normal
    if (isPostMountedInstall(item)) {
        return item.type === 'B' ? 'pmsTypeB' : 'pmsTypeF';
    }
    
    // 4. Remociones - tiene isRemove = true
    if (isResetOrRemove(item) && item.isRemove === true) {
        return item.type === 'B' ? 'removeTypeB' : 'removeTypeF';
    }
    
    // 5. Verificación por código de ítem como respaldo
    if (item.itemNumber) {
        const itemCode = item.itemNumber.substring(0, 4);
        const itemTypeMap: Record<string, PMSItemKeys> = {
            '0931': 'pmsTypeB',
            '0941': 'resetTypeB',
            '0971': 'removeTypeB',
            '0935': 'pmsTypeF',
            '0945': 'resetTypeF',
            '0975': 'removeTypeF',
            '0932': 'pmsTypeC'
        };
        
        if (itemTypeMap[itemCode]) {
            return itemTypeMap[itemCode];
        }
    }
    
    // 6. Por defecto: Resets (cuando no es remoción ni tiene tiras reflectivas)
    // Necesitamos verificar que el item tenga la propiedad 'type'
    if ('type' in item) {
        return item.type === 'B' ? 'resetTypeB' : 'resetTypeF';
    }
    
    // 7. Fallback extremo - debería ser muy raro
    return 'resetTypeB';
};

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
