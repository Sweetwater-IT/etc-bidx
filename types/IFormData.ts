import { EquipmentRentalItem } from "./IEquipmentRentalItem";
import { MPTRentalEstimating } from "./MPTEquipment";
import { AdminData } from "./TAdminData";
import { Flagging } from "./TFlagging";
import { SaleItem } from "./TSaleItem";

export interface FormData {
    adminData : AdminData
    mptRental : MPTRentalEstimating
    saleItems: SaleItem[]
    equipmentItems : EquipmentRentalItem[]
    // permanentSigns?: PermanentSignsData;
    flagging?: Flagging
    patterns?: Flagging
  }