export interface EquipmentRentalItem {
    // phase: number;
    name: string;
    quantity: number;
    months: number;
    rentPrice: number;
    reRentPrice: number;
    reRentForCurrentJob: boolean;
    totalCost : number;
    usefulLifeYrs : number;
    revenue?: number;
    grossProfit? : number;
    grossProfitMargin?: number;
    cost?: number
  };