export type PermanentSigns = {
    installedPostManHours: number; //comes from database
    typeBRemovalRatePerManHour: number;
    separateMobilization: boolean;
    trucks: number;
    personnel: number;
    OWtrips: number;
    signItems: (PMSTypeB | PMSTypeF | PMSResetB | PMSResetF | PMSRemoveB | PMSRemoveF)[]
}

export type PMSTypeB = {
    id: string;
    name: string;
    numberInstalls: number;
    signSqFt: number;
    permSignBolts: number;
    antiTheftBolts: number;
    chevronBracket: number;
    streetNameCrossBracket: number;

    // COMMENTED OUT OLD PROPERTIES
    // name: string;
    // flatSheetAlumSigns : PMSEquipment,
    // twelveFtSquarePost : PMSEquipment,
    // permSignBolts : PMSEquipment,
    // antiTheftBolts : PMSEquipment,
    // chevronBracket : PMSEquipment,
    // streetNameCrossBracket : PMSEquipment,
    // laborCost : number;
    // fuelCost : number;
    // customItems : CustomPMSItem[]
}

export type PMSTypeF = {
    id: string;
    name: string;
    numberInstalls: number;
    permSignBolts: number;

    // COMMENTED OUT OLD PROPERTIES
    // name: string;
    // flatSheetAlumSigns : PMSEquipment,
    // permSignBolts : PMSEquipment,
    // antiTheftBolts : PMSEquipment,
    // chevronBracket : PMSEquipment,
    // streetNameCrossBracket : PMSEquipment,
    // banding: PMSEquipment,
    // bullseyeBuckles : PMSEquipment,
    // laborCost : number;
    // fuelCost : number;
    // customItems : CustomPMSItem[]
}

export type PMSResetB = {
    id: string;
    name: string;
    numberInstalls: number;
    permSignBolts: number;
    antiTheftBolts: number;

    // COMMENTED OUT OLD PROPERTIES
    // name: string;
    // twelveFtSquarePost : PMSEquipment,
    // permSignBolts: PMSEquipment;
    // laborCost : number;
    // fuelCost : number;
    // customItems: CustomPMSItem[]
}

export type PMSResetF = {
    id: string;
    name: string;
    numberInstalls: number;
    permSignBolts: number;

    // COMMENTED OUT OLD PROPERTIES
    // name: string;
    // customItems : CustomPMSItem[],
    // permSignBolts: PMSEquipment,
    // laborCost: number;
    // fuelCost: number;
}

export type PMSRemoveB = {
    id: string;
    name: string;
    numberInstalls: number;
    permSignBolts: number;

    // Note: No permSignBolts for Remove operations
    // COMMENTED OUT OLD PROPERTIES - was Omit<PMSResetB, 'permSignBolts'>
}

export type PMSRemoveF = {
    id: string;
    name: string;
    numberInstalls: number;
    permSignBolts: number;

    // Note: No permSignBolts for Remove operations  
    // COMMENTED OUT OLD PROPERTIES - was Omit<PMSResetF, 'permSignBolts'>
}

// COMMENTED OUT OLD TYPES - keeping for reference
export interface PMSEquipment {
    quantity: number;
    unitCost: number;
    markup: number;
}

export interface CustomPMSItem {
    name: string;
    quantity: number;
    unitCost: number;
    markup: number;
}

export interface PermSignMapping {
    key: keyof PMSTypeB;
    label: string;
    dbName: string;
}

export const permSignsMap: PermSignMapping[] = [
    { key: 'antiTheftBolts', dbName: 'Anti-Theft Bolts', label: 'Anti-Theft Bolts' },
    { key: 'chevronBracket', dbName: 'Chevron Bracket', label: 'Chevron Brackets' },
    { key: 'streetNameCrossBracket', dbName: 'Street Name Cross Bracket', label: 'Street Name Cross Brackets' },
    //   {key: 'bullseyeBuckles', dbName: 'Bullseye Buckles', label: 'Bullseye Buckles'},
    { key: 'permSignBolts', dbName: 'Perm. Sign Bolts', label: 'Perm. Sign Bolts' },
    //   {key: 'flatSheetAlumSigns', dbName: 'Flat Sheet Alum. Signs', label: 'Flat Sheet Aluminum Signs'},
    //   {key: 'twelveFtSquarePost', dbName: 'Posts 12ft', label: '12 Ft Square Post'}
    // 'banding' : 'Banding', banding should be input by users
]