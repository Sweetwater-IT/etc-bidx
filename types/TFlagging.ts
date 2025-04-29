export type Flagging = {
    standardPricing : boolean;
    standardLumpSum : number;
    numberTrucks : number; //input from user
    fuelEconomyMPG : number; //needs its own backend input for f-150s which get better gas mileage
    personnel : number;//input from user
    onSiteJobHours : number;//input from user
    additionalEquipmentCost : number; //input from user
    fuelCostPerGallon : number;
    truckDispatchFee : number; //retrieved from database master inputs, different from mpt equipment fee?
    workerComp : number; //retrieved from database master inputs
    generalLiability : number // from db
    markupRate : number
    arrowBoards : FlaggingEquipment
    messageBoards : FlaggingEquipment
    TMA : FlaggingEquipment
    revenue?: number;
    cost? : number;
    grossProfit? : number;
    hours? : number
}

export interface FlaggingEquipment {
    quantity : number,
    cost : number,
    includeInLumpSum : boolean
}