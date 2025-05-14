import { Database } from "./database.types";

//types for estimate views
export interface EstimateCompleteView {
    id: number;
    status: Database['public']['Enums']['bid_estimate_status'];
    total_revenue: number;
    total_cost: number;
    total_gross_profit: number;
    created_at: string;
    archived: boolean;
    
    admin_data: {
      contractNumber: string;
      estimator: string;
      division: Database['public']['Enums']['division_type'] | null;
      lettingDate: string | null;
      owner: Database['public']['Enums']['owner_type'] | null;
      county: {
        name: string;
        branch: string;
      };
      srRoute: string;
      location: string;
      dbe: string;
      startDate: string | null;
      endDate: string | null;
      winterStart: string | null;
      winterEnd: string | null;
      owTravelTimeMins: number | null;
      owMileage: number | null;
      fuelCostPerGallon: number | null;
      emergencyJob: boolean;
      rated: Database['public']['Enums']['rated_type'];
      emergencyFields: any;
    };
    
    mpt_rental: {
      targetMOIC: number | null;
      paybackPeriod: number | null;
      annualUtilization: number | null;
      dispatchFee: number | null;
      mpgPerTruck: number | null;
      staticEquipmentInfo: Record<string, {
        price: number;
        discountRate: number;
        usefulLife: number;
        paybackPeriod: number;
      }>;
      phases: Array<{
        id: number;
        name: string;
        startDate: string | null;
        endDate: string | null;
        personnel: number | null;
        days: number | null;
        numberTrucks: number | null;
        additionalRatedHours: number | null;
        additionalNonRatedHours: number | null;
        maintenanceTrips: number | null;
        standardEquipment: Record<string, { quantity: number }>;
        customLightAndDrumItems: any;
        signs: Array<any>;
      }>;
      _summary: {
        revenue: number;
        cost: number;
        grossProfit: number;
        hours: number;
      };
    } | null;
    
    equipment_rental: Array<{
      name: string;
      quantity: number;
      months: number;
      rentPrice: number;
      reRentPrice: number;
      reRentForCurrentJob: boolean;
      totalCost: number;
      usefulLifeYrs: number;
      revenue: number | null;
      grossProfit: number | null;
      grossProfitMargin: number | null;
      cost: number | null;
    }>;
    
    flagging: {
      standardPricing: boolean;
      standardLumpSum: number;
      numberTrucks: number;
      fuelEconomyMPG: number;
      personnel: number;
      onSiteJobHours: number;
      additionalEquipmentCost: number;
      fuelCostPerGallon: number;
      truckDispatchFee: number;
      workerComp: number;
      generalLiability: number;
      markupRate: number;
      arrowBoards: {
        quantity: number;
        cost: number;
        includeInLumpSum: boolean;
      };
      messageBoards: {
        quantity: number;
        cost: number;
        includeInLumpSum: boolean;
      };
      TMA: {
        quantity: number;
        cost: number;
        includeInLumpSum: boolean;
      };
      revenue: number | null;
      cost: number | null;
      grossProfit: number | null;
      hours: number | null;
    } | null;
    
    service_work: {
      [key: string]: any;
    } | null;
    
    sale_items: Array<{
      itemNumber: string;
      name: string;
      vendor: string;
      quantity: number;
      quotePrice: number;
      markupPercentage: number;
    }>;
    
    project_manager: string | null;
    pm_email: string | null;
    pm_phone: string | null;
    customer_contract_number: string | null;
    contractor_name: string | null;
    subcontractor_name: string | null;
    total_phases: number;
    total_days: number;
    total_hours: number;
  }
  //types for the actual view itself with the flattened types
  export interface EstimateGridView {
    id: number;
    status: Database['public']['Enums']['bid_estimate_status'];
    total_revenue: number;
    total_cost: number;
    total_gross_profit: number;
    created_at: string;
    archived: boolean;
    contract_number: string;
    estimator: string;
    division: string | null;
    owner: string | null;
    county: string;
    branch: string;
    letting_date: string | null;
    project_manager: string | null;
    contractor: string | null;
    subcontractor: string | null;
    phases: number;
    project_days: number;
    total_hours: number;
    mpt_value: number;
    mpt_gross_profit: number;
    mpt_gm_percent: number | string;
  }