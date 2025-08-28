import { PermanentSigns, PostMountedInstall, PostMountedResetOrRemove, PostMountedInstallTypeC, InstallFlexibleDelineators } from "../TPermanentSigns";

// Default for Post Mounted Install Type B
export const defaultPMSTypeB: PostMountedInstall = {
    id: '',
    itemNumber: '0931-0001',
    type: 'B',
    personnel: 2,
    numberTrucks: 1,
    numberTrips: 0,
    installHoursRequired: 0,
    quantity: 0,
    standardPricing: true,
    permSignCostSqFt: 0,
    permSignPriceSqFt: 0,
    separateMobilization: false,
    customMargin: 0,
    permSignBolts: 0,
    signSqFootage: 0,
    hiReflectiveStrips: 0,
    fygReflectiveStrips: 0,
    jennyBrackets: 0,
    stiffenerInches: 0,
    tmzBrackets: 0,
    antiTheftBolts: 0,
    chevronBrackets: 0,
    streetNameCrossBrackets: 0,
    days: 0,
}

// Default for Post Mounted Install Type C
export const defaultPMSTypeC: PostMountedInstallTypeC = {
    id: '',
    itemNumber: '0932-0001',
    personnel: 2,
    numberTrucks: 1,
    numberTrips: 0,
    installHoursRequired: 0,
    standardPricing: true,
    separateMobilization: false,
    customMargin: 0,
    quantity: 0,
    permSignBolts: 0,
    signSqFootage: 0, 
    permSignCostSqFt: 0,
    permSignPriceSqFt: 0,    
    hiReflectiveStrips: 0,
    fygReflectiveStrips: 0,
    stiffenerInches: 0,
    tmzBrackets: 0,
    antiTheftBolts: 0,
    days: 0,
}

// Default for Post Mounted Reset Type B
export const defaultPMSResetB: PostMountedResetOrRemove = {
    id: '',
    itemNumber: '0941-0001',
    type: 'B',
    personnel: 2,
    numberTrucks: 1,
    numberTrips: 0,
    installHoursRequired: 0,
    standardPricing: true,
    separateMobilization: false,
    customMargin: 0,
    quantity: 0,
    permSignBolts: 0,
    isRemove: false,
    additionalItems: [],
    days: 0,
}

// Default for Flexible Delineators
export const defaultFlexibleDelineators: InstallFlexibleDelineators = {
    id: '',
    itemNumber: '', // Empty string to prompt user input
    personnel: 2,
    numberTrucks: 1,
    numberTrips: 0,
    installHoursRequired: 0,
    standardPricing: true,
    separateMobilization: false,
    customMargin: 0,
    quantity: 0,
    flexibleDelineatorCost: 0,
    additionalItems: [],
    days: 0,
}

// Default main PermanentSigns object
export const defaultPermanentSignsObject: PermanentSigns = {
    maxDailyHours: 0,
    itemMarkup: 0,
    productivityRates: {
        'pmsTypeB': 0,
        'pmsTypeC': 0,
        'pmsTypeF': 0,
        'flexibleDelineator': 0,
        'resetTypeB': 0,
        'resetTypeF': 0,
        'removeTypeB': 0,
        'removeTypeF': 0
    },
    equipmentData: [],
    signItems: []
}
