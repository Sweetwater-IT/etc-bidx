export interface EquipmentRentalItem {
    // phase: number;
    name: string;
    quantity: number;
    months: number;
    rentPrice: number;
    reRentPrice: number;
    reRentForCurrentJob: boolean;
    //this is what the item costs which is used with useful life to calculate depreciation for any given job
    totalCost : number;
    usefulLifeYrs : number;
    revenue?: number;
    grossProfit? : number;
    grossProfitMargin?: number;
    //this is the calculated depreciation cost
    cost?: number
  };