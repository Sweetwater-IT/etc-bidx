import { MPTRentalEstimating } from "@/types/MPTEquipment";
import { Phase } from "@/types/MPTEquipment";

export const defaultPhaseObject : Phase = {
    name: '',
    startDate : null,
    endDate : null,
    personnel: 0,
    days: 0,
    numberTrucks: 0,
    additionalRatedHours: 0,
    additionalNonRatedHours: 0,
    maintenanceTrips: 0,
    standardEquipment: {
        fourFootTypeIII: { quantity: 0 },
        sixFootWings: { quantity: 0},
        // sixFootTypeIII: { quantity: 0 },
        hStand: { quantity: 0 },
        post: { quantity: 0 },
        sandbag: { quantity: 0 },
        covers: { quantity: 0 },
        metalStands: { quantity: 0 },
        HIVP: { quantity: 0 },
        TypeXIVP: { quantity: 0 },
        BLights: { quantity: 0 },
        ACLights: { quantity: 0 },
        sharps: { quantity: 0}
    },
    customLightAndDrumItems: [],
    signs: [],
}

export const defaultMPTObject: MPTRentalEstimating = {
    mpgPerTruck: 0,
    dispatchFee: 0,
    paybackPeriod: 0,
    targetMOIC: 0,
    annualUtilization: 0,
    equipmentCosts: {
        fourFootTypeIII: { cost: 0, price: 0 },
        sixFootWings: { cost: 0, price: 0 },
        hStand: { cost: 0, price: 0 },
        post: { cost: 0, price: 0 },
        sandbag: { cost: 0, price: 0 },
        covers: { cost: 0, price: 0 },
        metalStands: { cost: 0, price: 0 },
        HIVP: { cost: 0, price: 0 },
        TypeXIVP: { cost: 0, price: 0 },
        BLights: { cost: 0, price: 0 },
        ACLights: { cost: 0, price: 0 },
        sharps: { cost: 0, price: 0 }
    },
    staticEquipmentInfo: {
        fourFootTypeIII: { price: 0, discountRate: 0, usefulLife: 0, paybackPeriod: 0 },
        sixFootWings: {price: 0, discountRate: 0, usefulLife: 0, paybackPeriod: 0},
        // sixFootTypeIII: { price: 0, discountRate: 0, usefulLife: 0, paybackPeriod: 0},
        hStand: { price: 0, discountRate: 0, usefulLife: 0, paybackPeriod: 0},
        post: { price: 0, discountRate: 0, usefulLife: 0, paybackPeriod: 0},
        sandbag: { price: 0, discountRate: 0, usefulLife: 0, paybackPeriod: 0},
        covers: { price: 0, discountRate: 0, usefulLife: 0, paybackPeriod: 0},
        metalStands: { price: 0, discountRate: 0, usefulLife: 0, paybackPeriod: 0},
        HIVP: { price: 0, discountRate: 0, usefulLife: 0, paybackPeriod: 0},
        TypeXIVP: { price: 0, discountRate: 0, usefulLife: 0, paybackPeriod: 0},
        BLights: { price: 0, discountRate: 0, usefulLife: 0, paybackPeriod: 0},
        ACLights: { price: 0, discountRate: 0, usefulLife: 0, paybackPeriod: 0},
        sharps: { price: 0, discountRate: 0, usefulLife: 0, paybackPeriod: 0},
        HI: { price: 0, discountRate: 0, usefulLife: 0, paybackPeriod: 0},
        DG: { price: 0, discountRate: 0, usefulLife: 0, paybackPeriod: 0},
        Special: { price: 0, discountRate: 0, usefulLife: 0, paybackPeriod: 0},
    },
    phases: [
        defaultPhaseObject
    ],
};