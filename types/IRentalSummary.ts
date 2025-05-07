export interface RentalItemSummary {
    name: string;
    totalQuantity: number;
    totalMonths: number;
    totalRevenue: number;
    depreciation: number;
    grossProfit: number;
    // cost: number;
    grossProfitMargin: number;
    reRentDetails?: {
      monthlyReRentCost: number;
      grossReRentProfit: number;
      grossReRentProfitMargin: number;
    };
  }
  
  export interface RentalSummary {
    items: RentalItemSummary[];
    totalCost: number;
    totalRevenue: number;
    totalGrossProfit: number;
    totalGrossProfitMargin: number;
  }
  