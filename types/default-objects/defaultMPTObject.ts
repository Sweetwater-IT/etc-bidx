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
    itemName: '',
    itemNumber: '',
    standardEquipment: {
        fourFootTypeIII: { quantity: 0, emergencyRate: 0 },
        sixFootWings: { quantity: 0, emergencyRate: 0 },
        // sixFootTypeIII: { quantity: 0 },
        hStand: { quantity: 0, emergencyRate: 0 },
        post: { quantity: 0, emergencyRate: 0 },
        sandbag: { quantity: 0, emergencyRate: 0 },
        covers: { quantity: 0, emergencyRate: 0 },
        metalStands: { quantity: 0, emergencyRate: 0 },
        HIVP: { quantity: 0, emergencyRate: 0 },
        TypeXIVP: { quantity: 0, emergencyRate: 0 },
        BLights: { quantity: 0, emergencyRate: 0 },
        ACLights: { quantity: 0, emergencyRate: 0 },
        sharps: { quantity: 0, emergencyRate: 0 }
    },
  
    customLightAndDrumItems: [],
    signs: [],
}


export const defaultMPTObject: MPTRentalEstimating = {
    mpgPerTruck: 8,
    dispatchFee: 50,
    paybackPeriod: 5,
    targetMOIC: 2,
    annualUtilization: .75,
    equipmentCosts: {
        fourFootTypeIII: { cost: 0, price: 150.98 }, // 4' Ft Type III
        sixFootWings: { cost: 0, price: 129.64 }, // 6 Ft Wings
        hStand: { cost: 0, price: 60.33 }, // H Stands
        post: { cost: 0, price: 44.20 }, // Posts 12ft
        sandbag: { cost: 0, price: 2.62 }, // Sand Bag
        covers: { cost: 0, price: 48.00 }, // Covers
        metalStands: { cost: 0, price: 134.95 }, // SL Metal Stands
        HIVP: { cost: 0, price: 66.18 }, // HI Vertical Panels
        TypeXIVP: { cost: 0, price: 86.48 }, // Type XI Vertical Panels
        BLights: { cost: 0, price: 113.00 }, // B-Lites
        ACLights: { cost: 0, price: 17.95 }, // A/C-Lites
        sharps: { cost: 0, price: 174.37 } // Sharps
    },
    staticEquipmentInfo: {
        fourFootTypeIII: { price: 150.98, discountRate: 0, usefulLife: 10, paybackPeriod: 4 }, // 4' Ft Type III
        sixFootWings: { price: 129.64, discountRate: 0, usefulLife: 10, paybackPeriod: 4 }, // 6 Ft Wings
        hStand: { price: 60.33, discountRate: 0, usefulLife: 10, paybackPeriod: 4 }, // H Stands
        post: { price: 44.20, discountRate: 0, usefulLife: 7, paybackPeriod: 4 }, // Posts 12ft
        sandbag: { price: 2.62, discountRate: 0, usefulLife: 2, paybackPeriod: 1 }, // Sand Bag
        covers: { price: 48.00, discountRate: 0, usefulLife: 3, paybackPeriod: 2 }, // Covers
        metalStands: { price: 134.95, discountRate: 0, usefulLife: 3, paybackPeriod: 2 }, // SL Metal Stands
        HIVP: { price: 66.18, discountRate: 0, usefulLife: 5, paybackPeriod: 0 }, // HI Vertical Panels
        TypeXIVP: { price: 86.48, discountRate: 0, usefulLife: 5, paybackPeriod: 0 }, // Type XI Vertical Panels
        BLights: { price: 113.00, discountRate: 0, usefulLife: 3, paybackPeriod: 0 }, // B-Lites
        ACLights: { price: 17.95, discountRate: 0, usefulLife: 3, paybackPeriod: 0 }, // A/C-Lites
        sharps: { price: 174.37, discountRate: 0, usefulLife: 5, paybackPeriod: 0 }, // Sharps
        HI: { price: 6.00, discountRate: 0, usefulLife: 3, paybackPeriod: 2 }, // HI Signs
        DG: { price: 6.81, discountRate: 0, usefulLife: 3, paybackPeriod: 2 }, // DG Signs
        FYG: { price: 7.81, discountRate: 0, usefulLife: 0, paybackPeriod: 0 }, // No FYG signs in DB, using 0
        TYPEXI: { price: 86.48, discountRate: 0, usefulLife: 5, paybackPeriod: 0 }, // Using Type XI Vertical Panels price
        Special: { price: 6.81, discountRate: 0, usefulLife: 3, paybackPeriod: 2 } // Special Signs
    },
    phases: [],
};
