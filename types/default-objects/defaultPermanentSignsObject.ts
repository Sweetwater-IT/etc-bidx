import { PermanentSigns, PostMountedInstall, PostMountedResetOrRemove, PostMountedInstallTypeC, InstallFlexibleDelineators } from "../TPermanentSigns";

// Default for Post Mounted Install Type B
export const defaultPMSTypeB: PostMountedInstall = {
    id: '',
    itemNumber: '0931-0001',
    type: 'B',
    personnel: 0,
    numberTrucks: 0,
    numberTrips: 0,
    installHoursRequired: 0,
    quantity: 0,
    permSignBolts: 0,
    signSqFootage: 0,
    signPriceSqFt: 0,
    hiReflectiveStrips: 0,
    fygReflectiveStrips: 0,
    jennyBrackets: 0,
    stiffenerSqInches: 0,
    tmzBrackets: 0,
    antiTheftBolts: 0,
    chevronBrackets: 0,
    streetNameCrossBrackets: 0
}

// Default for Post Mounted Install Type C
export const defaultPMSTypeC: PostMountedInstallTypeC = {
    id: '',
    itemNumber: '0932-0001',
    personnel: 0,
    numberTrucks: 0,
    numberTrips: 0,
    installHoursRequired: 0,
    quantity: 0,
    permSignBolts: 0,
    signSqFootage: 0, 
    signPriceSqFt: 0,
    hiReflectiveStrips: 0,
    fygReflectiveStrips: 0,
    stiffenerSqInches: 0,
    tmzBrackets: 0,
    antiTheftBolts: 0
}

// Default for Post Mounted Reset Type B
export const defaultPMSResetB: PostMountedResetOrRemove = {
    id: '',
    itemNumber: '0941-0001',
    type: 'B',
    personnel: 0,
    numberTrucks: 0,
    numberTrips: 0,
    installHoursRequired: 0,
    quantity: 0,
    permSignBolts: 0,
    isRemove: false,
    additionalItems: []
}

// Default for Flexible Delineators
export const defaultFlexibleDelineators: InstallFlexibleDelineators = {
    id: '',
    itemNumber: '', // Empty string to prompt user input
    personnel: 0,
    numberTrucks: 0,
    numberTrips: 0,
    installHoursRequired: 0,
    quantity: 0,
    permSignBolts: 0,
    cost: 0,
    additionalItems: []
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