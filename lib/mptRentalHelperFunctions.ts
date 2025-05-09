import { Phase } from "@/types/MPTEquipment";
import { MPTRentalEstimating } from "@/types/MPTEquipment";
import { EquipmentType } from "@/types/MPTEquipment";
import { SheetingType } from "@/types/MPTEquipment";
import { MPTEquipmentCost } from "@/types/MPTEquipmentCost";
import { AdminData } from "@/types/TAdminData";
import { LaborCostSummary } from "@/types/ILaborCostSummary";
import { EquipmentRentalItem } from "@/types/IEquipmentRentalItem";
import { RentalItemSummary, RentalSummary } from "@/types/IRentalSummary";
import { Flagging } from "@/types/TFlagging";
import { FlaggingSummary } from "@/types/TFlaggingSummary";
import { SaleItem } from "@/types/TSaleItem";
import { safeNumber } from "./safe-number";
// import { PermanentSigns, PMSEquipment } from "@/types/PermanentSigns";

// Function to get equipment totals per phase
export function getEquipmentTotalsPerPhase(mptRental: MPTRentalEstimating): Record<EquipmentType, { totalDaysRequired: number; totalQuantity: number }> {
  const equipmentTotals: Record<EquipmentType, { totalDaysRequired: number; totalQuantity: number }> = {
    fourFootTypeIII: { totalDaysRequired: 0, totalQuantity: 0 },
    sixFootWings: { totalDaysRequired: 0, totalQuantity: 0 },
    // sixFootTypeIII: { totalDaysRequired: 0, totalQuantity: 0 },
    hStand: { totalDaysRequired: 0, totalQuantity: 0 },
    post: { totalDaysRequired: 0, totalQuantity: 0 },
    sandbag: { totalDaysRequired: 0, totalQuantity: 0 },
    covers: { totalDaysRequired: 0, totalQuantity: 0 },
    metalStands: { totalDaysRequired: 0, totalQuantity: 0 },
    HIVP: { totalDaysRequired: 0, totalQuantity: 0 },
    TypeXIVP: { totalDaysRequired: 0, totalQuantity: 0 },
    BLights: { totalDaysRequired: 0, totalQuantity: 0 },
    ACLights: { totalDaysRequired: 0, totalQuantity: 0 },
    sharps: { totalDaysRequired: 0, totalQuantity: 0 }
  };

  mptRental.phases.forEach((phase) => {
    // Get all entries for a given phase's standard equipment
    Object.entries(phase.standardEquipment).forEach(([key, value]) => {
      const equipmentType = key as EquipmentType;

      if (equipmentTotals.hasOwnProperty(equipmentType)) {
        // Add the quantity and days from the phase to the totals
        equipmentTotals[equipmentType].totalQuantity += value.quantity;
        equipmentTotals[equipmentType].totalDaysRequired += phase.days;
      }
    });
  });

  return equipmentTotals;
}

// Interface for phase totals
interface PhaseTotals {
  totalPersonnel: number;
  totalDays: number;
  totalTrips: number;
  totalTrucks: number;
  totalAdditionalRatedHours: number;
  totalAdditionalNonRatedHours: number
}

export function getWeightedAverageDays(mptRental: MPTRentalEstimating): Record<EquipmentType | SheetingType, number> {
  // Initialize both totals and weighted days
  const equipmentWeightedDayTotals: Record<EquipmentType | SheetingType, number> = {
    fourFootTypeIII: 0,
    sixFootWings: 0,
    hStand: 0,
    post: 0,
    sandbag: 0,
    covers: 0,
    metalStands: 0,
    HIVP: 0,
    TypeXIVP: 0,
    BLights: 0,
    ACLights: 0,
    sharps: 0,
    HI: 0,
    DG: 0,
    Special: 0
  }

  const equipmentTotals = { ...equipmentWeightedDayTotals };

  // Calculate both numerators and denominators in one loop
  mptRental.phases.forEach(phase => {
    // Handle standard equipment
    Object.keys(phase.standardEquipment).forEach(key => {
      const equipKey = key as EquipmentType;
      const quantity = phase.standardEquipment[equipKey].quantity;
      equipmentWeightedDayTotals[equipKey] += quantity * phase.days;
      equipmentTotals[equipKey] += quantity;
    });

    // Handle signs differently - need to account for area
    phase.signs.forEach(sign => {
      const area = (sign.width * sign.height) / 144;
      const totalArea = area * sign.quantity;
      equipmentWeightedDayTotals[sign.sheeting] += totalArea * phase.days;
      equipmentTotals[sign.sheeting] += totalArea;
    });
  });

  // Calculate final weighted averages
  Object.keys(equipmentWeightedDayTotals).forEach(key => {
    const combinedKey = key as (EquipmentType | SheetingType);
    equipmentWeightedDayTotals[combinedKey] =
      equipmentTotals[combinedKey] !== 0
        ? equipmentWeightedDayTotals[combinedKey] / equipmentTotals[combinedKey]
        : 0;
  });

  return equipmentWeightedDayTotals;
}
export function returnPhaseTotals(mptRental: MPTRentalEstimating): PhaseTotals {
  const allEquipmentTotals = getEquipmentTotalsPerPhase(mptRental);

  let totalPersonnel = 0;
  let totalDays = 0;
  let totalTrips = Math.ceil((allEquipmentTotals.fourFootTypeIII.totalQuantity +
    // allEquipmentTotals.sixFootTypeIII.totalQuantity
    + allEquipmentTotals.post.totalQuantity + allEquipmentTotals.hStand.totalQuantity) / 30);
  let totalTrucks = 0;
  let totalAdditionalRatedHours = 0;
  let totalAdditionalNonRatedHours = 0

  mptRental.phases.forEach((phase) => {
    totalPersonnel += phase.personnel;
    totalDays += phase.days;
    totalTrucks += phase.numberTrucks;
    totalAdditionalRatedHours += phase.additionalRatedHours;
    totalTrips += phase.maintenanceTrips;
    totalAdditionalNonRatedHours += phase.additionalNonRatedHours
  });

  const phaseTotals = {
    totalPersonnel,
    totalDays,
    totalTrips,
    totalTrucks,
    totalAdditionalRatedHours,
    totalAdditionalNonRatedHours
  };

  return phaseTotals;
}

// Interface for sign totals
interface SignTotals {
  totalSquareFootage: number;
  daysRequired: number;
}

export function returnSignTotalsSquareFootage(mptRental: MPTRentalEstimating): Record<SheetingType, SignTotals> {
  const signTotals: Record<SheetingType, SignTotals> = {
    HI: { totalSquareFootage: 0, daysRequired: 0 },
    DG: { totalSquareFootage: 0, daysRequired: 0 },
    Special: { totalSquareFootage: 0, daysRequired: 0 },
  };

  mptRental.phases.forEach((phase) => {
    phase.signs.filter(sign => sign.width > 0 && sign.height > 0 && sign.quantity > 0).forEach((sign) => {
      const signType = sign.sheeting;
      const squareFootage = (sign.width * sign.height / 144) * sign.quantity;

      signTotals[signType].totalSquareFootage += squareFootage;
      signTotals[signType].daysRequired += phase.days;
    });
  });

  return signTotals;
}

export function returnSignTotalsByPhase(phase: Phase): Record<SheetingType, SignTotals> {
  const signTotals: Record<SheetingType, SignTotals> = {
    HI: { totalSquareFootage: 0, daysRequired: 0 },
    DG: { totalSquareFootage: 0, daysRequired: 0 },
    Special: { totalSquareFootage: 0, daysRequired: 0 },
  };
  phase.signs.filter(sign => sign.width > 0 && sign.height > 0 && sign.quantity > 0).forEach((sign) => {
    const signType = sign.sheeting;
    const squareFootage = (sign.width * sign.height / 144) * sign.quantity;

    signTotals[signType].totalSquareFootage += squareFootage;
    signTotals[signType].daysRequired += phase.days;
  });
  return signTotals
}

interface AssociatedSignTotals {
  type3: number,
  hStand: number,
  post: number,
  cover: number,
  bLights: number,
  acLights: number
}

export function getAssociatedSignEquipment(phase: Phase): AssociatedSignTotals {
  //loop through array an find Primary Signs by looking for associatedStructure property, then adding a number of that structure equal to the quantity
  //then add the amount of acLights, bLights, and covers, each one multiplying the quantity of the lights * quantity of sign
  const structureCounts = phase.signs.filter(sign => sign.width > 0 && sign.height > 0 && sign.quantity > 0).reduce((acc, sign) => {
    if ('associatedStructure' in sign) {
      acc.cover += (sign.covers * sign.quantity);
      // acc.acLights += (sign.aLights * sign.quantity);
      acc.bLights += (sign.bLights * sign.quantity);
      switch (sign.associatedStructure) {
        case 'fourFootTypeIII':
          acc.type3 += sign.quantity;
          break;
        case 'hStand':
          acc.hStand += sign.quantity;
          break;
        case 'post':
          acc.post += sign.quantity;
          break;
      }
    }
    return acc;
  }, { type3: 0, hStand: 0, post: 0, cover: 0, bLights: 0, acLights: 0 });

  //destructure totals from reduce function's returned object
  const { type3, hStand, post, cover, bLights, acLights } = structureCounts;
  return {
    type3,
    hStand,
    post,
    cover,
    bLights,
    acLights
  }
}

// Function to calculate total sign cost summary
export function calculateTotalSignCostSummary(equipmentRental: MPTRentalEstimating): Record<SheetingType, MPTEquipmentCost> {
  const allSignTotals = returnSignTotalsSquareFootage(equipmentRental);
  const weightedSignTotals = getWeightedAverageDays(equipmentRental)

  const HITotals = calculateCostMetrics(equipmentRental, { HI: { totalDaysRequired: weightedSignTotals.HI, totalQuantity: allSignTotals.HI.totalSquareFootage } });
  const DGTotals = calculateCostMetrics(equipmentRental, { DG: { totalDaysRequired: weightedSignTotals.DG, totalQuantity: allSignTotals.DG.totalSquareFootage } });
  const SpecialTotals = calculateCostMetrics(equipmentRental, { Special: { totalDaysRequired: weightedSignTotals.Special, totalQuantity: allSignTotals.Special.totalSquareFootage } });

  const totalSignCostSummary = {
    HI: HITotals,
    DG: DGTotals,
    Special: SpecialTotals,
  };

  return totalSignCostSummary;
}

export function calculateEquipmentCostSummary(equipmentRental: MPTRentalEstimating): MPTEquipmentCost {
  const weightedEquipmentTotals = getWeightedAverageDays(equipmentRental);
  const allEquipmentTotals = getEquipmentTotalsPerPhase(equipmentRental);

  // Create a new object combining quantities from allEquipmentTotals with weighted days
  const combinedTotals = {} as Record<EquipmentType, { totalDaysRequired: number; totalQuantity: number }>;

  Object.entries(allEquipmentTotals)
    .filter(([key]) => !['BLights', 'ACLights', 'TypeXIVP', 'HIVP', 'sharps'].includes(key))
    .forEach(([key, value]) => {
      combinedTotals[key as EquipmentType] = {
        totalDaysRequired: weightedEquipmentTotals[key as EquipmentType], // Use weighted average days
        totalQuantity: value.totalQuantity // Keep original quantity
      };
    });

  const equipmentCostSummary = calculateCostMetrics(equipmentRental, combinedTotals);

  return equipmentCostSummary;
}

// Function to calculate cost metrics
function calculateCostMetrics<K extends EquipmentType | SheetingType>(
  equipmentRental: MPTRentalEstimating,
  equipmentToCalculate: Record<K, { totalDaysRequired: number; totalQuantity: number }>
): MPTEquipmentCost {
  let totalCost = 0;
  let totalRevenue = 0;
  let totalDepreciationCost = 0;

  // Using Object.entries to get [key, value] pairs.
  for (const [key, item] of Object.entries(equipmentToCalculate) as [K, { totalDaysRequired: number; totalQuantity: number }][]) {
    const equipmentType = key;
    const staticInfo = equipmentRental.staticEquipmentInfo[equipmentType];

    if (!staticInfo) {
      continue;
    }

    const itemCost = item.totalQuantity * staticInfo.price;
    totalCost += itemCost;

    const itemRevenue = itemCost - (itemCost * (staticInfo.discountRate / 100));
    totalRevenue += itemRevenue;

    const dailyDepreciation = staticInfo.price / (staticInfo.usefulLife * 365);
    const itemDepreciationCost = dailyDepreciation * item.totalDaysRequired * item.totalQuantity;
    totalDepreciationCost += itemDepreciationCost;
  }

  const totalGrossProfit = totalRevenue - totalDepreciationCost;
  const totalGrossMargin = totalRevenue !== 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

  const costMetrics: MPTEquipmentCost = {
    cost: totalCost,
    revenue: totalRevenue,
    depreciationCost: totalDepreciationCost,
    grossProfit: totalGrossProfit,
    grossMargin: totalGrossMargin,
  };

  return costMetrics;
}

// Function to calculate labor cost summary
export function calculateLaborCostSummary(adminData: AdminData, mptRental: MPTRentalEstimating): LaborCostSummary {

  const totalRatedHours = mptRental.phases.reduce((sum, phase) => sum + getRatedHoursPerPhase(phase) + phase.additionalRatedHours, 0);
  const totalNonRatedHours = mptRental.phases.reduce((sum, phase) => sum + getNonRatedHoursPerPhase(adminData, phase) + phase.additionalNonRatedHours, 0)

  const rateLaborCostPerHour = adminData.rated === 'RATED' ? safeNumber(Number(adminData.county.laborRate) + Number(adminData.county.fringeRate)) : safeNumber(adminData.county.shopRate);
  const totalRatedHourCost = totalRatedHours * rateLaborCostPerHour!

  const nonRatedLaborCostPerHour = adminData.county.shopRate ?? 0;
  const totalNonRatedHourCost = totalNonRatedHours * nonRatedLaborCostPerHour;

  // Assuming labor rate markup percentage is 100%
  const rateLaborRevenue = totalRatedHourCost * 2;
  const nonRateLaborRevenue = totalNonRatedHourCost * 2;
  const totalLaborRevenue = rateLaborRevenue + nonRateLaborRevenue;

  const grossProfit = totalLaborRevenue - (totalRatedHourCost + totalNonRatedHourCost);
  const grossMargin = totalLaborRevenue !== 0 ? (grossProfit / totalLaborRevenue) * 100 : 0;

  const laborCostSummary: LaborCostSummary = {
    totalNonRateLaborCost: totalNonRatedHourCost,
    totalRatedLaborCost: totalRatedHourCost,
    totalRatedLaborRevenue: totalRatedHourCost * 2,
    revenue: totalLaborRevenue,
    grossProfit: grossProfit,
    grossMargin: grossMargin,
    nonRateLaborRevenue: nonRateLaborRevenue,
    nonRateGrossProfit: nonRateLaborRevenue - totalNonRatedHourCost,
    nonRateGrossMargin: nonRateLaborRevenue !== 0 ? ((nonRateLaborRevenue - totalNonRatedHourCost) / nonRateLaborRevenue) * 100 : 0,
    ratedLaborHours: totalRatedHours,
    nonRatedLaborHours: totalNonRatedHours
  };

  return laborCostSummary;
}

interface TruckAndFuelCostSummary {
  cost: number;
  revenue: number;
  grossProfit: number;
  grossMargin: number;
}

// Function to calculate truck and fuel cost summary
export function calculateTruckAndFuelCostSummary(adminData: AdminData, mptRental: MPTRentalEstimating): TruckAndFuelCostSummary {

  let totalDispatchFee = 0;
  let totalFuelCost = 0;

  mptRental.phases.forEach(phase => {
    const phaseTrips = getTotalTripsPerPhase(phase);
    const phaseTrucks = Number(phase.numberTrucks) || 0;
    totalDispatchFee += Number(mptRental.dispatchFee || 0) * Number(phaseTrips || 0) * Number(phaseTrucks || 0);
    totalFuelCost += (
      (Number(phaseTrips || 0) *
        Number(phaseTrucks || 0) *
        2 *
        Number(adminData.owMileage || 0)) /
      Number(mptRental.mpgPerTruck || 1)
    ) * Number(adminData.fuelCostPerGallon || 0);
  });



  const grossMargin = totalFuelCost > 0 ? (totalDispatchFee / (totalFuelCost + totalDispatchFee)) * 100 : 0;

  return {
    cost: totalFuelCost,
    revenue: totalDispatchFee + totalFuelCost,
    grossProfit: totalDispatchFee,
    grossMargin
  };
}

export interface AllTotals {
  mptTotalCost: number,
  mptTotalRevenue: number,
  mptGrossProfit: number,
  mptGrossMargin: number,
  totalRevenue: number,
  totalCost: number,
  totalGrossProfit: number,
  totalGrossMargin: number,
  revenuePercentages: {
    mpt: number,
    rental: number,
    flagging: number,
    sale: number
  }
}

export function getAllTotals(adminData: AdminData, mptRental: MPTRentalEstimating, rentalEquipment: EquipmentRentalItem[], flagging: Flagging, serviceWork: Flagging, saleItems: SaleItem[]): AllTotals {
  //this gets all mpt rental stuff
  const mptRentalStats = calculateEquipmentCostSummary(mptRental);
  //this gets all light and drum channelizer stuff
  const lightAndDrumRentalStats = calculateLightAndDrumCostSummary(adminData, mptRental);
  //this gets all sign stuff
  const totalSignCostStats = calculateTotalSignCostSummary(mptRental);
  //this gets all labor stats
  const totalRatedLaborStats = calculateLaborCostSummary(adminData, mptRental);
  //this gets all truck and fuel stats
  const totalTruckAndFuelStats = calculateTruckAndFuelCostSummary(adminData, mptRental);

  const mptTotalCost = mptRentalStats.depreciationCost +
    lightAndDrumRentalStats.total.depreciationCost +
    totalSignCostStats.HI.depreciationCost +
    totalSignCostStats.DG.depreciationCost +
    totalSignCostStats.Special.depreciationCost +
    totalRatedLaborStats.totalRatedLaborCost +
    totalRatedLaborStats.totalNonRateLaborCost +
    (totalTruckAndFuelStats?.cost || 0);

  const mptTotalRevenue = mptRentalStats.revenue +
    lightAndDrumRentalStats.total.revenue +
    totalSignCostStats.HI.revenue +
    totalSignCostStats.DG.revenue +
    totalSignCostStats.Special.revenue +
    totalRatedLaborStats.revenue +
    (totalTruckAndFuelStats?.revenue || 0);

  const mptGrossProfit = mptRentalStats.grossProfit +
    lightAndDrumRentalStats.total.grossProfit +
    totalSignCostStats.HI.grossProfit +
    totalSignCostStats.DG.grossProfit +
    totalSignCostStats.Special.grossProfit +
    totalRatedLaborStats.grossProfit +
    (totalTruckAndFuelStats?.grossProfit || 0);


  const rentalTotalRevenue = rentalEquipment ? calculateRentalSummary(rentalEquipment).totalRevenue : 0;
  const rentalTotalCost = rentalEquipment ? calculateRentalSummary(rentalEquipment).totalCost : 0;
  const rentalTotalGrossProfit = rentalEquipment ? calculateRentalSummary(rentalEquipment).totalGrossProfit : 0;

  const serviceWorkTotalRevenue = serviceWork ? calculateFlaggingCostSummary(adminData, serviceWork, true).totalRevenue : 0;
  const serviceWorkTotalCost = serviceWork ? calculateFlaggingCostSummary(adminData, serviceWork, true).totalFlaggingCost : 0;

  const flaggingRevenue = flagging ? calculateFlaggingCostSummary(adminData, flagging, false).totalRevenue : 0;
  const flaggingCost = flagging ? calculateFlaggingCostSummary(adminData, flagging, false).totalFlaggingCost : 0;
  const flaggingTotalRevenue = flaggingRevenue + serviceWorkTotalRevenue;
  const flaggingTotalCost = flaggingCost + serviceWorkTotalCost;
  const flaggingTotalGrossProfit = flagging.standardPricing ? 0 : flaggingTotalRevenue - flaggingTotalCost;

  const saleTotalRevenue = saleItems ? saleItems.reduce((sum, item) => sum + (item.quotePrice * (1 + (item.markupPercentage / 100)) * item.quantity), 0) : 0;
  const saleTotalCost = saleItems ? saleItems.reduce((sum, item) => sum + (item.quotePrice * item.quantity), 0) : 0;
  const saleTotalGrossProfit = saleTotalRevenue - saleTotalCost

  const totalRevenue = mptTotalRevenue + rentalTotalRevenue + saleTotalRevenue + flaggingTotalRevenue;
  const totalGrossProfit = mptGrossProfit + rentalTotalGrossProfit + flaggingTotalGrossProfit + saleTotalGrossProfit;

  return {
    mptTotalCost,
    mptTotalRevenue,
    mptGrossProfit,
    mptGrossMargin: mptTotalRevenue !== 0 ? (mptGrossProfit / mptTotalRevenue) * 100 : 0,
    totalRevenue,
    totalCost: mptTotalCost + rentalTotalCost + flaggingTotalCost + saleTotalCost,
    totalGrossProfit,
    totalGrossMargin: totalRevenue !== 0 ? (totalGrossProfit / totalRevenue) * 100 : 0,
    revenuePercentages: {
      mpt: totalRevenue !== 0 ? mptTotalRevenue / totalRevenue * 100 : 0,
      rental: totalRevenue !== 0 ? rentalTotalRevenue / totalRevenue * 100 : 0,
      flagging: totalRevenue !== 0 ? flaggingTotalRevenue / totalRevenue * 100 : 0,
      sale: totalRevenue !== 0 ? saleTotalRevenue / totalRevenue * 100 : 0
    }
  };
}

export function calculateRentalSummary(rentalEquipment: EquipmentRentalItem[]): RentalSummary {
  // Group items by name
  const groupedItems = rentalEquipment
    .filter((item) => item.name !== '')
    .reduce((acc, item) => {
      if (!acc[item.name]) {
        acc[item.name] = [];
      }
      acc[item.name].push(item);
      return acc;
    }, {} as Record<string, EquipmentRentalItem[]>);

  // Calculate summary for each unique item
  const itemSummaries: RentalItemSummary[] = Object.entries(groupedItems).map(
    ([name, items]) => {
      // Calculate total quantity and months
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalMonths = items.reduce((sum, item) => sum + item.months, 0);

      // Check if any item in the group is set for re-rent
      const reRentItem = items.find((item) => item.reRentForCurrentJob);

      if (reRentItem) {
        // Handle re-rent calculations
        const totalRevenue = totalQuantity * reRentItem.rentPrice * totalMonths;
        const monthlyReRentCost = reRentItem.reRentPrice * 1.06 * totalMonths * totalQuantity;
        const grossMargin = totalRevenue - monthlyReRentCost;

        return {
          name,
          totalQuantity,
          totalMonths,
          totalRevenue,
          cost: monthlyReRentCost,
          depreciation: monthlyReRentCost, // Depreciation is disregarded in re-rent scenarios
          grossProfit: grossMargin, // Using grossMargin as grossProfit for re-rent
          grossProfitMargin: totalRevenue > 0 ? grossMargin / totalRevenue : 0,
          reRentDetails: {
            monthlyReRentCost: monthlyReRentCost,
            grossReRentProfit: grossMargin,
            grossReRentProfitMargin: grossMargin / totalRevenue
          },
        };
      }

      // Use the first item's rent price (assuming consistent pricing)
      const rentPrice = items[0].rentPrice || 0;
      const totalRevenue = totalQuantity * rentPrice * totalMonths;

      // Depreciation calculation (using first item's total cost and useful life)
      const totalCost = items[0].totalCost || 0;
      const usefulLifeYrs = items[0].usefulLifeYrs || 0;

      let depreciation = 0;
      if (usefulLifeYrs > 0) {
        depreciation =
          (totalCost / (usefulLifeYrs * 12)) * totalMonths * totalQuantity;
      }

      // Gross Profit calculations
      const grossProfit = totalRevenue - depreciation;
      const grossProfitMargin =
        totalRevenue > 0 ? grossProfit / totalRevenue : 0;

      return {
        name,
        totalQuantity,
        totalMonths,
        // cost: totalQuantity === 0 ? 0 : totalCost,  // Set to 0 if quantity is 0
        totalRevenue,
        depreciation,
        grossProfit,
        grossProfitMargin,
        reRentDetails: undefined,
      };
    }
  );

  // Calculate overall summary
  const totalRevenue = itemSummaries.reduce(
    (sum, item) => sum + item.totalRevenue,
    0
  );
  const totalGrossProfit = itemSummaries.reduce(
    (sum, item) => sum + item.grossProfit,
    0
  );

  const totalCost = itemSummaries.reduce(
    (sum, item) => sum + item.depreciation,
    0
  )
  const totalGrossProfitMargin =
    totalRevenue > 0 ? totalGrossProfit / totalRevenue : 0;

  return {
    items: itemSummaries,
    totalCost,
    totalRevenue,
    totalGrossProfit,
    totalGrossProfitMargin,
  };
}
const LIGHT_EQUIPMENT_TYPES = ['BLights', 'ACLights', 'TypeXIVP', 'HIVP', 'sharps'] as const;
type LightEquipmentType = typeof LIGHT_EQUIPMENT_TYPES[number];

export interface LightAndDrumCostSummary {
  standardEquipment: MPTEquipmentCost;
  customEquipment: MPTEquipmentCost;
  total: MPTEquipmentCost;
}

export function calculateLightAndDrumCostSummary(adminData: AdminData, equipmentRental: MPTRentalEstimating): LightAndDrumCostSummary {
  const totals = getEquipmentTotalsPerPhase(equipmentRental);
  const weightedTotals = getWeightedAverageDays(equipmentRental);

  // Create combined totals with quantities from totals and weighted days
  const lightEquipmentTotals = Object.fromEntries(
    Object.entries(totals)
      .filter(([key]) => LIGHT_EQUIPMENT_TYPES.includes(key as LightEquipmentType))
      .map(([key, value]) => [
        key,
        {
          totalDaysRequired: weightedTotals[key as LightEquipmentType],
          totalQuantity: value.totalQuantity
        }
      ])
  ) as Record<LightEquipmentType, { totalDaysRequired: number; totalQuantity: number }>;

  // Calculate standard equipment costs
  const standardEquipmentCosts = calculateStandardLightEquipmentCosts(
    adminData,
    equipmentRental,
    lightEquipmentTotals
  );

  // Calculate custom equipment costs
  const customEquipmentCosts = calculateCustomLightEquipmentCosts(
    equipmentRental
  );

  // Calculate totals
  const totalCosts: MPTEquipmentCost = {
    cost: standardEquipmentCosts.cost + customEquipmentCosts.cost,
    revenue: standardEquipmentCosts.revenue + customEquipmentCosts.revenue,
    depreciationCost: standardEquipmentCosts.depreciationCost + customEquipmentCosts.depreciationCost,
    grossProfit: standardEquipmentCosts.grossProfit + customEquipmentCosts.grossProfit,
    grossMargin: 0
  };

  totalCosts.grossMargin =
    totalCosts.revenue !== 0 ? (totalCosts.grossProfit / totalCosts.revenue) * 100 : 0;

  return {
    standardEquipment: standardEquipmentCosts,
    customEquipment: customEquipmentCosts,
    total: totalCosts
  };
}

export function calculateLightDailyRateCosts(mptEquipment: MPTRentalEstimating, price: number) {
  const daysToRecover = mptEquipment.paybackPeriod * mptEquipment.annualUtilization * 365;
  return (price * mptEquipment.targetMOIC) / daysToRecover
}

function calculateStandardLightEquipmentCosts(
  adminData: AdminData,
  equipmentRental: MPTRentalEstimating,
  lightEquipmentTotals: Record<LightEquipmentType, { totalDaysRequired: number; totalQuantity: number }>
): MPTEquipmentCost {
  let totalCost = 0;
  let totalRevenue = 0;
  let totalDepreciationCost = 0;

  //destructure the type (first record) and totals (days and quantity) of each entry in the passed lightEquipment Record
  for (const [equipmentType, totals] of Object.entries(lightEquipmentTotals)) {

    //grab the price from the equipmentRental object static equipment info
    const staticInfo = equipmentRental.staticEquipmentInfo[equipmentType as LightEquipmentType];
    if (!staticInfo) continue;

    //get the item's cost
    const itemCost = totals.totalQuantity * staticInfo.price;
    totalCost += itemCost;

    // Calculate daily rate based on whether it's an emergency job or not
    let dailyRate: number;
    if (adminData.emergencyJob) {
      // Use emergency rates for standard items
      switch (equipmentType) {
        case 'BLights':
          dailyRate = adminData.emergencyFields.emergencyBLites ?? 0;
          break;
        case 'ACLights':
          dailyRate = adminData.emergencyFields.emergencyACLites ?? 0;
          break;
        case 'HIVP':
          dailyRate = adminData.emergencyFields.emergencyHIVerticalPanels ?? 0;
          break;
        case 'TypeXIVP':
          dailyRate = adminData.emergencyFields.emergencyTypeXIVerticalPanels ?? 0;
          break;
        case 'sharps':
          dailyRate = adminData.emergencyFields.emergencySharps ?? 0;
          break;
        default:
          dailyRate = 0;
      }
    } else {
      // Calculate daily rate using the formula:
      // daily rate = (unit cost * target MOIC) / days to recover
      // where days to recover = payback period * annual utilization * 365
      dailyRate = calculateLightDailyRateCosts(equipmentRental, staticInfo.price)
    }

    // Calculate revenue using daily rate
    const itemRevenue = totals.totalQuantity * totals.totalDaysRequired * dailyRate;
    totalRevenue += itemRevenue;

    // Calculate depreciation
    const dailyDepreciation = staticInfo.price / (staticInfo.usefulLife * 365);
    const itemDepreciationCost = dailyDepreciation * totals.totalDaysRequired * totals.totalQuantity;
    totalDepreciationCost += itemDepreciationCost;
  }

  const grossProfit = totalRevenue - totalDepreciationCost;
  const grossMargin = totalRevenue !== 0 ? (grossProfit / totalRevenue) * 100 : 0;

  return {
    cost: totalCost,
    revenue: totalRevenue,
    depreciationCost: totalDepreciationCost,
    grossProfit: grossProfit,
    grossMargin: grossMargin
  };
}

function calculateCustomLightEquipmentCosts(
  equipmentRental: MPTRentalEstimating
): MPTEquipmentCost {
  let totalCost = 0;
  let totalRevenue = 0;
  let totalDepreciationCost = 0;

  // First, calculate weighted average days for each custom item
  const customItemWeightedDays: Record<string, number> = {};
  const customItemTotalQuantities: Record<string, number> = {};
  const customItemDayProducts: Record<string, number> = {};

  // Calculate numerators and denominators for weighted average
  equipmentRental.phases.forEach((phase) => {
    phase.customLightAndDrumItems.forEach((item) => {
      const itemKey = `${item.id}-${item.cost}-${item.usefulLife}`; // Create unique key for each distinct item

      if (!customItemDayProducts[itemKey]) {
        customItemDayProducts[itemKey] = 0;
        customItemTotalQuantities[itemKey] = 0;
      }

      customItemDayProducts[itemKey] += item.quantity * phase.days;
      customItemTotalQuantities[itemKey] += item.quantity;
    });
  });

  // Calculate weighted average days for each item
  Object.keys(customItemDayProducts).forEach(itemKey => {
    customItemWeightedDays[itemKey] =
      customItemTotalQuantities[itemKey] !== 0
        ? customItemDayProducts[itemKey] / customItemTotalQuantities[itemKey]
        : 0;
  });

  // Now calculate costs using weighted average days
  equipmentRental.phases.forEach((phase) => {
    phase.customLightAndDrumItems.forEach((item) => {
      const itemKey = `${item.id}-${item.cost}-${item.usefulLife}`;
      const itemCost = item.quantity * item.cost;
      totalCost += itemCost;

      // Calculate daily rate using the same formula as standard items
      const daysToRecover = equipmentRental.paybackPeriod * equipmentRental.annualUtilization * 365;
      const dailyRate = (item.cost * equipmentRental.targetMOIC) / daysToRecover;

      // Use weighted average days instead of phase.days
      const weightedDays = customItemWeightedDays[itemKey];
      const itemRevenue = item.quantity * weightedDays * dailyRate;
      totalRevenue += itemRevenue;

      // Calculate depreciation using weighted average days
      const dailyDepreciation = item.cost / (item.usefulLife * 365);
      const itemDepreciationCost = dailyDepreciation * weightedDays * item.quantity;
      totalDepreciationCost += itemDepreciationCost;
    });
  });

  const grossProfit = totalRevenue - totalDepreciationCost;
  const grossMargin = totalRevenue !== 0 ? (grossProfit / totalRevenue) * 100 : 0;

  return {
    cost: totalCost,
    revenue: totalRevenue,
    depreciationCost: totalDepreciationCost,
    grossProfit: grossProfit,
    grossMargin: grossMargin
  };
}

export function getRatedHoursPerPhase(phase: Phase): number {
  if (!phase.personnel || phase.personnel === 0) {
    return 0;
  }
  const relevantEquipmentTotals = phase.standardEquipment.fourFootTypeIII.quantity + phase.standardEquipment.hStand.quantity + phase.standardEquipment.post.quantity
  return Math.ceil((relevantEquipmentTotals / 10) * phase.personnel * 2)
}

export function getNonRatedHoursPerPhase(adminData: AdminData, phase: Phase): number {
  if (!phase.personnel || phase.personnel === 0) {
    return 0;
  }
  const totalTrips = getTotalTripsPerPhase(phase)
  const nonRatedHours = (((adminData.owTravelTimeMins ?? 0) * 2) / 60) * totalTrips * phase.personnel
  return nonRatedHours
}
export function getTotalTripsPerPhase(phase: Phase): number {
  const relevantEquipmentTotals = phase.standardEquipment.fourFootTypeIII.quantity + phase.standardEquipment.hStand.quantity + phase.standardEquipment.post.quantity
  return (safeNumber(phase.maintenanceTrips) + Math.ceil(relevantEquipmentTotals / 30)) * 2
}

export function calculateFlaggingCostSummary(adminData: AdminData, flagging: Flagging, isServiceWork: boolean): FlaggingSummary {
  // Helper function to ensure values are valid numbers
  const toNumber = (value: any): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  // Sanitize inputs
  const personnel = toNumber(flagging?.personnel);
  const onSiteJobHours = toNumber(flagging?.onSiteJobHours);
  const rtTravelTimeHours = Math.ceil((toNumber(adminData.owTravelTimeMins) * 2) / 60);
  const laborRate = isServiceWork ? toNumber(adminData?.county.laborRate) : toNumber(adminData?.county.flaggingBaseRate);
  const fringeRate = isServiceWork ? toNumber(adminData?.county.fringeRate) : toNumber(adminData?.county.flaggingFringeRate);
  const flaggingRate = isServiceWork ? toNumber(adminData.county.shopRate) : toNumber(adminData.county.flaggingRate);
  const generalLiability = toNumber(flagging?.generalLiability);
  const workerComp = toNumber(flagging?.workerComp);
  const numberTrucks = toNumber(flagging?.numberTrucks);
  const owMiles = toNumber(adminData.owMileage);
  const fuelCostPerGallon = toNumber(flagging?.fuelCostPerGallon);
  const fuelEconomyMPG = toNumber(flagging?.fuelEconomyMPG);
  const truckDispatchFee = toNumber(flagging?.truckDispatchFee);
  const additionalEquipmentCost = toNumber(flagging?.additionalEquipmentCost);
  const arrowBoardsCost = flagging.arrowBoards.includeInLumpSum ? toNumber(safeNumber(flagging.arrowBoards.quantity) * flagging.arrowBoards.cost) : 0;
  const messageBoardsCost = flagging.messageBoards.includeInLumpSum ? toNumber(safeNumber(flagging.messageBoards.quantity) * flagging.messageBoards.cost) : 0;
  const tmaCost = flagging.TMA.includeInLumpSum ? toNumber(safeNumber(flagging.TMA.quantity) * flagging.TMA.cost) : 0;

  // Calculate costs
  const payRateToUse = adminData.rated === 'RATED' ? laborRate + fringeRate : flaggingRate;

  //this is correct up to v7 of flagging
  const onSiteJobHoursNoOvertime = onSiteJobHours > 8 ? 8 : onSiteJobHours
  const onSiteJobHoursNoOvertimeCost = onSiteJobHoursNoOvertime * personnel * payRateToUse;

  //new calcs
  const timeAndAHalfRate = payRateToUse * 1.5;
  const onSiteJobHoursOvertime = onSiteJobHours > 8 ? onSiteJobHours - onSiteJobHoursNoOvertime : 0
  const onSiteJobHoursOvertimeCost = timeAndAHalfRate * onSiteJobHoursOvertime * personnel

  //new travel time calcs
  const travelPayRate = ((onSiteJobHours > 8) || (onSiteJobHours + rtTravelTimeHours > 8)) ? flaggingRate * 1.5 : flaggingRate;
  const travelTimeCost = travelPayRate * rtTravelTimeHours * personnel

  // get the total labor cost
  const onSiteJobHoursCost = onSiteJobHoursNoOvertimeCost + onSiteJobHoursOvertimeCost
  // get the total travel time cost
  const rtTravelTimeHoursCost = onSiteJobHours + rtTravelTimeHours <= 8 ? (rtTravelTimeHours * flaggingRate * personnel) : travelTimeCost

  const totalHoursCost = onSiteJobHoursCost + rtTravelTimeHoursCost;
  const totalLaborCost = totalHoursCost + ((totalHoursCost / 1000) * (generalLiability === 0 ? 113.55 : generalLiability)) + ((totalHoursCost / 100) * (workerComp === 0 ? 4.96 : workerComp));

  // Fix fuel cost calculation
  const totalFuelCost = numberTrucks > 0 ? ((numberTrucks * owMiles * fuelCostPerGallon) / (fuelEconomyMPG === 0 ? 20 : fuelEconomyMPG)) + (truckDispatchFee === 0 ? 50 : truckDispatchFee) : 0

  const totalFlaggingCost = flagging.standardPricing ? 0 : totalLaborCost + totalFuelCost + additionalEquipmentCost;

  // Prevent division by zero for cost per hour
  const totalHours = onSiteJobHours + rtTravelTimeHours;
  const totalCostPerHour = totalHours > 0 ? totalFlaggingCost / totalHours : 0;

  const totalEquipCost = arrowBoardsCost + messageBoardsCost + tmaCost
  const totalRevenueNoEquip = flagging.standardPricing ? flagging.standardLumpSum : totalFlaggingCost / (1 - (flagging.markupRate / 100))
  const totalRevenue = totalRevenueNoEquip + totalEquipCost

  return {
    onSiteJobHoursCost,
    rtTravelTimeHoursCost,
    overTimeHoursCost: onSiteJobHoursOvertimeCost,
    totalHoursCost,
    totalFuelCost,
    totalLaborCost,
    totalFlaggingCost,
    totalCostPerHour,
    totalRevenue,
    totalHours,
    totalEquipCost
  };
}

export const calculateSaleItemMargin = (item: SaleItem) => {
  const salePrice = item.quotePrice * (1 + item.markupPercentage / 100);
  const totalSale = salePrice * item.quantity;
  const totalCost = item.quotePrice * item.quantity;
  const grossProfit = totalSale - totalCost;
  return {
    salePrice: totalSale,
    grossProfit: grossProfit,
    margin: grossProfit / totalSale
  }
};

// export const calculatePMSTypeBSummary = (permanentSigns: PermanentSigns, adminData: AdminData, mptRental: MPTRentalEstimating) => {
//   let totalCost = 0;
//   let totalRevenue = 0;

//   // First get all totals of all pms type b equipment
//   Object.entries(permanentSigns.pmsTypeB).filter(entry => {
//     const value = entry[1];
//     return typeof value !== 'number' && typeof value !== 'string' && Object.hasOwn(value, 'quantity');
//   }).forEach(([key, value]) => {
//     const typedValue = value as PMSEquipment;

//     // Calculate item cost
//     const itemCost = typedValue.quantity * typedValue.unitCost;
//     // Calculate item revenue with markup
//     const itemRevenue = itemCost * (1 + (typedValue.markup / 100));

//     // Add to running totals
//     totalCost += itemCost;
//     totalRevenue += itemRevenue;
//   });

//   // Apply the same fix to custom items
//   permanentSigns.pmsTypeB.customItems.forEach(customItem => {
//     const itemCost = customItem.quantity * customItem.unitCost;
//     const itemRevenue = itemCost * (1 + (customItem.markup / 100));

//     totalCost += itemCost;
//     totalRevenue += itemRevenue;
//   });

//   let laborCost;
//   if (permanentSigns.separateMobilization) {
//     // If separate mobilization is true, include travel time in calculation
//     laborCost = (((((safeNumber(adminData.owTravelTimeMins) * 2) / 60) * adminData.county.shopRateFromBranch * permanentSigns.personnel * permanentSigns.OWtrips)) /
//       ((permanentSigns.pmsTypeB.twelveFtSquarePost.quantity / permanentSigns.installedPostManHours) * (adminData.county.fringeRate + adminData.county.laborRate) * permanentSigns.personnel));
//   } else {
//     laborCost = (((adminData.county.shopRateFromBranch * permanentSigns.personnel * permanentSigns.OWtrips)) /
//       ((permanentSigns.pmsTypeB.twelveFtSquarePost.quantity / permanentSigns.installedPostManHours) * (adminData.county.fringeRate + adminData.county.laborRate) * permanentSigns.personnel));
//   }
//   //markup is 100% for pms type b
//   const laborRevenue = laborCost * 2;
//   let fuelCost
//   // fuel cost calculation
//   if (permanentSigns.separateMobilization) {
//     fuelCost = ((((safeNumber(adminData.owMileage) * 2) * permanentSigns.OWtrips) / mptRental.mpgPerTruck) + (permanentSigns.OWtrips * mptRental.dispatchFee))
//   }
//   else {
//     fuelCost = ((permanentSigns.OWtrips / mptRental.mpgPerTruck) + (permanentSigns.OWtrips * mptRental.dispatchFee))
//   }

//   //markup for pmsTypeB fuel is 0 
//   const fuelRevenue = fuelCost;

//   totalCost += laborCost + fuelCost;
//   totalRevenue += laborRevenue + fuelRevenue;

//   const grossProfit = totalRevenue - totalCost;
//   return {
//     totalCost,
//     totalRevenue,
//     grossProfit,
//     grossMargin: grossProfit / totalRevenue
//   };
// };