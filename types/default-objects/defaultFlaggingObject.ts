import { Flagging } from "../TFlagging"

export const defaultFlaggingObject : Flagging  = {
    standardPricing: false,
    standardLumpSum: 0,
    numberTrucks : 0,
    fuelEconomyMPG : 0,
    personnel : 0,
    truckDispatchFee : 0,
    workerComp : 0,
    generalLiability : 0,
    fuelCostPerGallon : 0,
    markupRate : 50,
    onSiteJobHours : 0,
    additionalEquipmentCost : 0,
    messageBoards: {
        quantity: 0,
        cost: 100,
        includeInLumpSum : false
    },
    arrowBoards: {
        quantity: 0,
        cost: 50,
        includeInLumpSum : false
    },
    TMA: {
        quantity: 0,
        cost: 500,
        includeInLumpSum: false
    }
}