export interface EquipmentRentalItem {
  id?: number;
  // phase: number;
  name: string;
  itemNumber: string;
  item_description: string;
  quantity: number;
  rentPrice: number;
  reRentPrice: number;
  reRentForCurrentJob: boolean;
  //this is what the item costs which is used with useful life to calculate depreciation for any given job
  totalCost: number;
  usefulLifeYrs: number;
  revenue?: number;
  grossProfit?: number;
  grossProfitMargin?: number;
  notes: string;
  //this is the calculated depreciation cost
  cost?: number
  uom?: number
  uom_type: string
};