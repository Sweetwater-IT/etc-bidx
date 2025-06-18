import { AdminData } from "./TAdminData";
import { Flagging } from "./TFlagging";
import { MPTRentalEstimating } from "./MPTEquipment";
import { PermanentSigns } from "./TPermanentSigns";
import { EquipmentRentalItem } from "./IEquipmentRentalItem";
import { SaleItem } from "./TSaleItem";

export type Estimate = {
    adminData : AdminData,
    mptRental : MPTRentalEstimating
    flagging? : Flagging
    equipmentRental : EquipmentRentalItem[]
    permanentSigns? : PermanentSigns
    serviceWork? : Flagging
    saleItems : SaleItem[],
    totalRevenue? : number;
    totalCost? : number;
    totalGrossProfit? : number;
    ratesAcknowledged: boolean;
    notes: string
    firstSaveTimestamp: Date | null
    id: number | null
}