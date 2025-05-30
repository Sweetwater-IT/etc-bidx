import { PermanentSigns, PMSTypeB, PMSTypeF, PMSResetB, PMSResetF, PMSRemoveB, PMSRemoveF } from "../TPermanentSigns";

export const defaultPMSTypeB = {
    name: '0931-0001',
    numberInstalls: 0,
    signSqFt: 0,
    permSignBolts: 0,
    antiTheftBolts: 0,
    chevronBracket: 0,
    streetNameCrossBracket: 0
}

export const defaultPMSTypeF = {
    name: '0935-001',
    numberInstalls: 0,
    permSignBolts: 0,
}

export const defaultPMSResetB = {
    name: '0941-0001',
    numberInstalls: 0,
    permSignBolts: 0,
    antiTheftBolts: 0,
}

export const defaultPMSResetF = {
    name: '0945-0001',
    numberInstalls: 0,
    permSignBolts: 0,
}

export const defaultPMSRemoveB = {
    name: '0971-0001',
    numberInstalls: 0,
    permSignBolts: 0,
}

export const defaultPMSRemoveF = {
    name: '0975-0001',
    numberInstalls: 0,
    permSignBolts: 0,
    // chevronBracket: 0,
    // streetNameCrossBracket: 0
}

export const defaultPermanentSignsObject: PermanentSigns = {
    installedPostManHours: 0,
    typeBRemovalRatePerManHour: 0,
    separateMobilization: false,
    trucks: 0,
    personnel: 0,
    OWtrips: 0,
    signItems: []
}