import { MPTEquipmentCost } from "./MPTEquipmentCost";

export interface LightAndDrumCostSummary {
    standardEquipment: MPTEquipmentCost;
    customEquipment: MPTEquipmentCost;
    total: MPTEquipmentCost;
  }