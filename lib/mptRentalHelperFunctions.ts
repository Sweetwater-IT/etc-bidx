import { DisplayStructures, Phase, structureMap } from "@/types/MPTEquipment";
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
import { determineItemType, InstallFlexibleDelineators, PermanentSigns, PMSItemKeys, PMSItemNumbers, PostMountedInstall, PostMountedInstallTypeC, PostMountedResetOrRemove } from "@/types/TPermanentSigns";
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

  if (!mptRental.phases) return equipmentTotals;

  mptRental.phases.forEach((phase) => {
    if (!phase?.standardEquipment) return;

    // Get all entries for a given phase's standard equipment
    Object.entries(phase.standardEquipment).forEach(([key, value]) => {
      const equipmentType = key as EquipmentType;
      if (value.quantity >= 0 && phase?.days >= 0) {
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
    FYG: 0,
    TYPEXI: 0,
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
  let totalTrips = Math.ceil((allEquipmentTotals.fourFootTypeIII.totalQuantity
    + allEquipmentTotals.sixFootWings.totalQuantity

    // allEquipmentTotals.post.totalQuantity +
    // allEquipmentTotals.hStand.totalQuantity
  ) / 30);
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
    FYG: { totalSquareFootage: 0, daysRequired: 0 },
    TYPEXI: { totalSquareFootage: 0, daysRequired: 0 },
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
    FYG: { totalSquareFootage: 0, daysRequired: 0 },
    TYPEXI: { totalSquareFootage: 0, daysRequired: 0 },
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

// Update the interface to match EquipmentType names
interface AssociatedSignTotals {
  fourFootTypeIII: number,
  hStand: number,
  post: number,
  covers: number,
  BLights: number,
  ACLights: number
}



export function getAssociatedSignEquipment(phase: Phase): AssociatedSignTotals {
  return phase.signs.reduce((acc, sign) => {
    if ('associatedStructure' in sign) {
      acc.BLights += (sign.bLights * sign.quantity);


      acc.covers += (sign.cover ? sign.quantity : 0);


      switch (sign.associatedStructure) {
        case 'fourFootTypeIII':
          acc.fourFootTypeIII += sign.quantity;
          break;
        case 'hStand':
          acc.hStand += sign.quantity;
          break;
        case 'post':
          acc.post += sign.quantity;
          break;
        case 'none':
          break;
        default:
          console.warn(`Tipo de equipo base desconocido: ${sign.associatedStructure}`);
          break;
      }
    }


    return acc;
  }, { fourFootTypeIII: 0, hStand: 0, post: 0, covers: 0, BLights: 0, ACLights: 0 });
}



// Function to calculate total sign cost summary
export function calculateTotalSignCostSummary(equipmentRental: MPTRentalEstimating): Record<SheetingType, MPTEquipmentCost> {
  const allSignTotals = returnSignTotalsSquareFootage(equipmentRental);
  const weightedSignTotals = getWeightedAverageDays(equipmentRental)

  const HITotals = calculateCostMetrics(equipmentRental, { HI: { totalDaysRequired: weightedSignTotals.HI, totalQuantity: allSignTotals.HI.totalSquareFootage } });
  const DGTotals = calculateCostMetrics(equipmentRental, { DG: { totalDaysRequired: weightedSignTotals.DG, totalQuantity: allSignTotals.DG.totalSquareFootage } });
  const FYGTotals = calculateCostMetrics(equipmentRental, { FYG: { totalDaysRequired: weightedSignTotals.FYG, totalQuantity: allSignTotals.FYG.totalSquareFootage } });
  const TYPEXITotals = calculateCostMetrics(equipmentRental, { TYPEXI: { totalDaysRequired: weightedSignTotals.TYPEXI, totalQuantity: allSignTotals.TYPEXI.totalSquareFootage } });
  const SpecialTotals = calculateCostMetrics(equipmentRental, { Special: { totalDaysRequired: weightedSignTotals.Special, totalQuantity: allSignTotals.Special.totalSquareFootage } });

  const totalSignCostSummary = {
    HI: HITotals,
    DG: DGTotals,
    FYG: FYGTotals,
    TYPEXI: TYPEXITotals,
    Special: SpecialTotals,
  };

  return totalSignCostSummary;
}

interface MPTEquipmentCostWithDetails extends MPTEquipmentCost {
  details: {
    equipmentBreakdown: Array<{
      type: string;
      quantity: number;
      days: number;
      cost: number;
      revenue: number;
    }>;
    formula: string;
  };
}

export function calculateEquipmentCostSummary(equipmentRental: MPTRentalEstimating): MPTEquipmentCostWithDetails {
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
  const details = {
    equipmentBreakdown: Object.entries(combinedTotals)
      .filter(([type]) => equipmentRental.equipmentCosts?.[type as EquipmentType])
      .map(([type, data]) => {
        const equipmentCost = equipmentRental.equipmentCosts[type as EquipmentType];
        const quantity = data.totalQuantity || 0;
        const days = data.totalDaysRequired || 0;
        return {
          type,
          quantity,
          days,
          cost: quantity * days * (equipmentCost?.cost || 0),
          revenue: quantity * days * (equipmentCost?.price || 0)
        };
      }),
    formula: 'For each equipment type: Revenue = Quantity × Days × Daily Rate\nCost = Quantity × Days × Cost Rate\nGross Profit = Revenue - Cost\nGross Margin = (Gross Profit ÷ Revenue) × 100%'
  };

  return { ...equipmentCostSummary, details };
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
    sale: number,
    permanentSigns: number
  }
}

export function getAllTotals(adminData: AdminData, mptRental: MPTRentalEstimating, rentalEquipment: EquipmentRentalItem[], flagging: Flagging, serviceWork: Flagging, saleItems: SaleItem[], permanentSigns: PermanentSigns): AllTotals {
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
  const totalPermanentSignStats = getPermanentSignsCostSummary(permanentSigns, adminData, mptRental)

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

  const totalRevenue = mptTotalRevenue + rentalTotalRevenue + saleTotalRevenue + flaggingTotalRevenue + totalPermanentSignStats.totalRevenue;
  const totalGrossProfit = mptGrossProfit + rentalTotalGrossProfit + flaggingTotalGrossProfit + saleTotalGrossProfit + (totalPermanentSignStats.totalRevenue - totalPermanentSignStats.totalCost);

  return {
    mptTotalCost,
    mptTotalRevenue,
    mptGrossProfit,
    mptGrossMargin: mptTotalRevenue !== 0 ? (mptGrossProfit / mptTotalRevenue) * 100 : 0,
    totalRevenue,
    totalCost: mptTotalCost + rentalTotalCost + flaggingTotalCost + saleTotalCost + totalPermanentSignStats.totalCost,
    totalGrossProfit,
    totalGrossMargin: totalRevenue !== 0 ? (totalGrossProfit / totalRevenue) * 100 : 0,
    revenuePercentages: {
      mpt: totalRevenue !== 0 ? mptTotalRevenue / totalRevenue * 100 : 0,
      rental: totalRevenue !== 0 ? rentalTotalRevenue / totalRevenue * 100 : 0,
      flagging: totalRevenue !== 0 ? flaggingTotalRevenue / totalRevenue * 100 : 0,
      sale: totalRevenue !== 0 ? saleTotalRevenue / totalRevenue * 100 : 0,
      permanentSigns: totalRevenue !== 0 ? totalPermanentSignStats.totalRevenue / totalRevenue * 100 : 0
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

  equipmentRental.phases.forEach(phase => {
    LIGHT_EQUIPMENT_TYPES.forEach(equipmentType => {
      const quantity = phase.standardEquipment[equipmentType]?.quantity || 0;
      const days = phase.days || 0;
      const staticInfo = equipmentRental.staticEquipmentInfo[equipmentType];
      if (!staticInfo || quantity === 0 || days === 0) return;

      const itemCost = quantity * staticInfo.price;
      totalCost += itemCost;

      let dailyRate: number;
      if (phase.emergency) {
        switch (equipmentType) {
          case 'BLights':
            dailyRate = safeNumber(adminData.emergencyFields?.emergencyBLites) || calculateLightDailyRateCosts(equipmentRental, staticInfo.price);
            break;
          case 'ACLights':
            dailyRate = safeNumber(adminData.emergencyFields?.emergencyACLites) || calculateLightDailyRateCosts(equipmentRental, staticInfo.price);
            break;
          case 'HIVP':
            dailyRate = safeNumber(adminData.emergencyFields?.emergencyHIVerticalPanels) || calculateLightDailyRateCosts(equipmentRental, staticInfo.price);
            break;
          case 'TypeXIVP':
            dailyRate = safeNumber(adminData.emergencyFields?.emergencyTypeXIVerticalPanels) || calculateLightDailyRateCosts(equipmentRental, staticInfo.price);
            break;
          case 'sharps':
            dailyRate = safeNumber(adminData.emergencyFields?.emergencySharps) || calculateLightDailyRateCosts(equipmentRental, staticInfo.price);
            break;
          default:
            dailyRate = calculateLightDailyRateCosts(equipmentRental, staticInfo.price);
        }
      } else {
        dailyRate = calculateLightDailyRateCosts(equipmentRental, staticInfo.price);
      }

      const itemRevenue = quantity * days * dailyRate;
      totalRevenue += itemRevenue;

      const dailyDepreciation = staticInfo.price / (staticInfo.usefulLife * 365);
      const itemDepreciationCost = dailyDepreciation * days * quantity;
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
  const relevantEquipmentTotals = phase.standardEquipment?.fourFootTypeIII.quantity + phase.standardEquipment.hStand.quantity + phase.standardEquipment.post.quantity
  return Math.ceil((relevantEquipmentTotals / 10) * phase.personnel * 2)
}

export function getNonRatedHoursPerPhase(adminData: AdminData, phase: Phase): number {
  if (!phase.personnel || phase.personnel === 0) {
    return 0;
  }
  const baseTrips = getTotalTripsPerPhase(phase);
  const totalTrips = baseTrips + safeNumber(phase.maintenanceTrips);
  const totalTravelTimeMins = (adminData.owTravelTimeHours !== undefined && adminData.owTravelTimeMinutes !== undefined)
    ? safeNumber(adminData.owTravelTimeHours) * 60 + safeNumber(adminData.owTravelTimeMinutes)
    : safeNumber(adminData.owTravelTimeMins);
  const nonRatedHours = ((totalTravelTimeMins / 60) * totalTrips * 2) * phase.personnel;
  
  return nonRatedHours;
}

export function getTotalTripsPerPhase(phase: Phase): number {
  // Check if phase or standardEquipment is undefined
  if (!phase || !phase.standardEquipment) {
    return 0;
  }

  // Safely access equipment quantities with null checks
  const fourFootQuantity = phase.standardEquipment?.fourFootTypeIII?.quantity || 0;
  const hStandQuantity = phase.standardEquipment.hStand?.quantity || 0;
  const postQuantity = phase.standardEquipment.post?.quantity || 0;

  const relevantEquipmentTotals = fourFootQuantity + hStandQuantity + postQuantity;
  return safeNumber(phase.maintenanceTrips) + (Math.ceil(relevantEquipmentTotals / 30) * 2);

}

export function calculateFlaggingCostSummary(adminData: AdminData, flagging: Flagging, isServiceWork: boolean): FlaggingSummary {
  // Helper function to ensure values are valid numbers  
  const toNumber = (value: any): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  // Sanitize inputs
  const personnel = toNumber(flagging?.personnel);
  const onSiteJobHours = toNumber(flagging?.onSiteJobHours) / 60; // Convert minutes to hours
  // Calculate total travel time in minutes, fall back to owTravelTimeMins
  const totalTravelTimeMins = (adminData.owTravelTimeHours !== undefined && adminData.owTravelTimeMinutes !== undefined)
    ? toNumber(adminData.owTravelTimeHours) * 60 + toNumber(adminData.owTravelTimeMinutes)
    : toNumber(adminData.owTravelTimeMins);
  const owTravelTimeHours = totalTravelTimeMins / 60; // Convert to hours for rtTravelTimeHoursCost
  const rtTravelTimeHours = owTravelTimeHours * 2; // Round-trip in hours
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

  // On-site hours cost (use converted onSiteJobHours)
  const totalOnSiteHours = onSiteJobHours; // Already in hours
  const onSiteJobHoursNoOvertime = totalOnSiteHours > 8 ? 8 : totalOnSiteHours;
  const onSiteJobHoursNoOvertimeCost = onSiteJobHoursNoOvertime * personnel * payRateToUse;
  const timeAndAHalfRate = payRateToUse * 1.5;
  const onSiteJobHoursOvertime = totalOnSiteHours > 8 ? totalOnSiteHours - onSiteJobHoursNoOvertime : 0;
  const onSiteJobHoursOvertimeCost = timeAndAHalfRate * onSiteJobHoursOvertime * personnel;
  const onSiteJobHoursCost = onSiteJobHoursNoOvertimeCost + onSiteJobHoursOvertimeCost;

  // Round-trip travel time cost
  const travelPayRate = totalOnSiteHours > 8 ? flaggingRate * 1.5 : flaggingRate;
  const rtTravelTimeHoursCost = rtTravelTimeHours * travelPayRate * personnel;

  // Total labor cost
  const totalHoursCost = onSiteJobHoursCost + rtTravelTimeHoursCost;
  const totalLaborCost = totalHoursCost + ((totalHoursCost / 1000) * (generalLiability === 0 ? 113.55 : generalLiability)) + ((totalHoursCost / 100) * (workerComp === 0 ? 4.96 : workerComp));

  // Fuel cost calculation
  const totalFuelCost = numberTrucks > 0 ? ((numberTrucks * owMiles * fuelCostPerGallon) / (fuelEconomyMPG === 0 ? 20 : fuelEconomyMPG)) + (truckDispatchFee === 0 ? 18.75 : truckDispatchFee) : 0;

  // Total flagging cost
  const totalFlaggingCost = flagging.standardPricing ? 0 : totalLaborCost + totalFuelCost + additionalEquipmentCost;

  // Total hours (on-site + round-trip travel)
  const totalHours = onSiteJobHours + rtTravelTimeHours;
  const totalCostPerHour = totalHours > 0 && personnel > 0 ? totalFlaggingCost / (totalHours * personnel) : 0;

  // Equipment and revenue
  const totalEquipCost = arrowBoardsCost + messageBoardsCost + tmaCost;
  const totalRevenueNoEquip = flagging.standardPricing ? flagging.standardLumpSum : totalFlaggingCost / (1 - (flagging.markupRate / 100));
  const totalRevenue = totalRevenueNoEquip + totalEquipCost;

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
    totalEquipCost,
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

/****PERM SIGNS HELPER FUNCTIONS */
//type b installs
export const getRequiredInstallHours = (numberInstalls: number, productivityRate: number, personnel: number): number => {
  return Math.round((numberInstalls / safeNumber(productivityRate)) * personnel * 100) / 100
}

export const getPermSignDaysRequired = (installHours: number, maxDailyHours: number): number => {
  return maxDailyHours > 0 ? Math.ceil(installHours / maxDailyHours) : 0
}

export const getPermSignTrips = (
  pmsItem: PMSItemNumbers,
  signItems: PMSItemNumbers[],
  maxDailyHours: number
): { updatedItems: PMSItemNumbers[], totalTrips: number } => {
  let totalTrips = 0;
  let remainingHours = 0;
  const updatedItems: PMSItemNumbers[] = [];

  const regularItems = signItems.filter(item => !item.separateMobilization);

  const separateMobilizationItems = signItems.filter(item => item.separateMobilization);

  for (const item of regularItems) {
    const installHours = item.installHoursRequired;
    const updatedItem = { ...item };

    if (remainingHours >= installHours) {
      updatedItem.days = 0;
      updatedItem.numberTrips = 0;
      remainingHours -= installHours;
    } else {
      const hoursNeeded = installHours - remainingHours;
      const daysForItem = Math.ceil(hoursNeeded / maxDailyHours);
      updatedItem.days = daysForItem;
      updatedItem.numberTrips = daysForItem * item.numberTrucks;
      totalTrips += daysForItem; // Add days to total trips
      remainingHours = (daysForItem * maxDailyHours) - hoursNeeded;
    }

    updatedItems.push(updatedItem);
  }

  for (const item of separateMobilizationItems) {
    const installHours = item.installHoursRequired;
    const daysForItem = Math.ceil(installHours / maxDailyHours);
    const updatedItem = {
      ...item,
      days: daysForItem,
      numberTrips: daysForItem * item.numberTrucks,
    };
    totalTrips += updatedItem.numberTrips;
    updatedItems.push(updatedItem);
  }

  const updatedMap = new Map(updatedItems.map(item => [item.id, item]));
  const sortedItems = signItems.map(item => updatedMap.get(item.id)!);

  return { updatedItems: sortedItems, totalTrips };
};

//only will get called on pms installs (type c, f, or b)
export const getPermSignSqFtCost = (permanentSigns: PermanentSigns, pmsItem: PMSItemNumbers): number => {
  if ('permSignCostSqFt' in pmsItem && typeof pmsItem.permSignCostSqFt === 'number' && pmsItem.signSqFootage) {
    return safeNumber(pmsItem.permSignCostSqFt) * pmsItem.signSqFootage;
  }
  const globalCost = permanentSigns.equipmentData.find(equip => equip.name === 'permSignCostSqFt')?.cost ?? 0;
  const sqFootage = ('signSqFootage' in pmsItem && pmsItem.signSqFootage) || 0;
  return safeNumber(globalCost) * sqFootage;
};

//(F36*$T$12)+(J36*$T$8)+(F39*$T$9)+(J39*$T$10)+(N39*$T$11)+(F42*$T$13)+(J42*$T$14)+(F45*$T$15)+(N42*$T$16)+(J45*$T$17)
export const getPermSignMaterialCost = (itemType: PMSItemKeys, permanentSigns: PermanentSigns, pmsItem: PMSItemNumbers): number => {

  const antiTheftBoltsPrice = safeNumber(permanentSigns.equipmentData.find(equip => equip.name === 'antiTheftBolts')?.cost);
  const postPrice = safeNumber(permanentSigns.equipmentData.find(equip => equip.name === 'post')?.cost);
  const permSignBoltsPrice = safeNumber(permanentSigns.equipmentData.find(equip => equip.name === 'permSignBolts')?.cost);
  const chevronBracketsPrice = safeNumber(permanentSigns.equipmentData.find(equip => equip.name === 'chevronBrackets')?.cost);
  const streetNameCrossBracketsPrice = safeNumber(permanentSigns.equipmentData.find(equip => equip.name === 'streetNameCrossBrackets')?.cost);
  const hiReflectiveStripsPrice = safeNumber(permanentSigns.equipmentData.find(equip => equip.name === 'hiReflectiveStrips')?.cost);
  const tmzBracketsPrice = safeNumber(permanentSigns.equipmentData.find(equip => equip.name === 'tmzBrackets')?.cost);
  const jennyBracketsPrice = safeNumber(permanentSigns.equipmentData.find(equip => equip.name === 'jennyBrackets')?.cost);
  const stiffenerPrice = safeNumber(permanentSigns.equipmentData.find(equip => equip.name === 'stiffenerInches')?.cost);
  const fygReflectiveStripsPrice = safeNumber(permanentSigns.equipmentData.find(equip => equip.name === 'fygReflectiveStrips')?.cost);

  if (itemType === 'pmsTypeB' || itemType === 'pmsTypeF') {
    const typeBItem = pmsItem as PostMountedInstall;
    const postCost = typeBItem.quantity * postPrice;
    const totalCost = (typeBItem.antiTheftBolts * antiTheftBoltsPrice) +
      (typeBItem.chevronBrackets * chevronBracketsPrice) +
      (typeBItem.streetNameCrossBrackets * streetNameCrossBracketsPrice) +
      //all installs will have this
      (typeBItem.permSignBolts! * permSignBoltsPrice) +
      (typeBItem.hiReflectiveStrips * hiReflectiveStripsPrice) +
      (typeBItem.tmzBrackets * tmzBracketsPrice) +
      (typeBItem.jennyBrackets * jennyBracketsPrice) +
      (typeBItem.stiffenerInches * stiffenerPrice) +
      (typeBItem.fygReflectiveStrips * fygReflectiveStripsPrice);
    return itemType === 'pmsTypeF' ? totalCost : totalCost + postCost
  }
  //=+(F211*$T$19)+(J211*$T$8)+(F214*$T$9)+(F217*$T$13)+(J217*$T$14)+(J214*$T$15)+(N214*$T$17)
  else if (itemType === 'pmsTypeC') {
    const typeCItem = pmsItem as PostMountedInstallTypeC;
    return (typeCItem.antiTheftBolts * antiTheftBoltsPrice) +
      (typeCItem.quantity * postPrice) +
      //all installs will have this
      (typeCItem.permSignBolts! * permSignBoltsPrice) +
      (typeCItem.hiReflectiveStrips * hiReflectiveStripsPrice) +
      (typeCItem.tmzBrackets * tmzBracketsPrice) +
      (typeCItem.stiffenerInches * stiffenerPrice) +
      (typeCItem.fygReflectiveStrips * fygReflectiveStripsPrice)
  }
  else if (itemType === 'resetTypeB' || itemType === 'resetTypeF') {
    const postCost = pmsItem.quantity * postPrice;
    //resets still have bolts
    const permSignBoltsCost = pmsItem.permSignBolts! * permSignBoltsPrice;
    const otherItemsCost = (pmsItem as PostMountedResetOrRemove).additionalItems.reduce((acc, item) => {
      const additionalItemCost = permanentSigns.equipmentData.find(equip => equip.name === item.equipmentType);
      acc += (item.quantity * safeNumber(additionalItemCost?.cost))
      return acc;
    }, 0)
    return postCost + permSignBoltsCost + otherItemsCost
  }
  else if (itemType === 'removeTypeB' || itemType === 'removeTypeF') {
    const otherItemsCost = (pmsItem as PostMountedResetOrRemove).additionalItems.reduce((acc, item) => {
      const additionalItemCost = permanentSigns.equipmentData.find(equip => equip.name === item.equipmentType);
      acc += (item.quantity * safeNumber(additionalItemCost?.cost))
      return acc;
    }, 0)
    return otherItemsCost
  }
  else if (itemType === 'flexibleDelineator') {
    const flexCost = pmsItem.quantity * (pmsItem as InstallFlexibleDelineators).flexibleDelineatorCost
    const otherItemsCost = (pmsItem as InstallFlexibleDelineators).additionalItems.reduce((acc, item) => {
      const additionalItemCost = permanentSigns.equipmentData.find(equip => equip.name === item.equipmentType);
      acc += (item.quantity * safeNumber(additionalItemCost?.cost))
      return acc;
    }, 0)
    //resets still have post costs involved, removals no
    return flexCost + otherItemsCost
  }
  else {
    console.error('wrong pms type passed to material cost calculator');
    return 0;
  }
}

export const getPermSignLaborCost = (pmsItem: PMSItemNumbers, adminData: AdminData): number => {
  return ((adminData.county.laborRate + adminData.county.fringeRate) * (pmsItem.installHoursRequired) * pmsItem.personnel) +
    (pmsItem.personnel * adminData.county.shopRate * pmsItem.numberTrips * (safeNumber(adminData?.owTravelTimeMins) * 2) / 60)
}
//=+(((W40*W35)/$X$7)*$G$14)+($X$8*W35)
export const getPermSignFuelCost = (pmsItem: PMSItemNumbers, adminData: AdminData, mptRental: MPTRentalEstimating): number => {
  const travelCosts = ((safeNumber(adminData?.owMileage) * 2 * pmsItem.numberTrips) / mptRental.mpgPerTruck) * safeNumber(adminData?.fuelCostPerGallon);
  const dispatchCosts = (mptRental.dispatchFee * pmsItem.numberTrips)
  return travelCosts + dispatchCosts
}

export const getPermSignTotalCost = (itemType: PMSItemKeys, permanentSigns: PermanentSigns, pmsItem: PMSItemNumbers, adminData: AdminData, mptRental: MPTRentalEstimating): number => {
  const laborCost = getPermSignLaborCost(pmsItem, adminData)
  const permSignSqFtCost = getPermSignSqFtCost(permanentSigns, pmsItem)
  const fuelCost = getPermSignFuelCost(pmsItem, adminData, mptRental);
  if (itemType === 'pmsTypeB' || itemType === 'pmsTypeF' || itemType === 'pmsTypeC') {
    const materialCost = getPermSignMaterialCost(itemType, permanentSigns, pmsItem);
    return laborCost + permSignSqFtCost + materialCost + fuelCost;
  }
  //only post installs include the perm sign sq ft cost
  else {
    const materialCost = getPermSignMaterialCost(itemType, permanentSigns, pmsItem);
    return laborCost + materialCost + fuelCost;
  }
}

export const getPermanentSignRevenueAndMargin = (permanentSigns: PermanentSigns, pmsItem: PMSItemNumbers, adminData: AdminData, mptRental: MPTRentalEstimating): { revenue: number, grossMargin: number } => {
  let revenue: number = 0;
  const itemType = determineItemType(pmsItem)
  const totalCost = getPermSignTotalCost(itemType, permanentSigns, pmsItem, adminData, mptRental);
  if (pmsItem.standardPricing) {
    //100% markup
    const laborCostWithMarkup = getPermSignLaborCost(pmsItem, adminData) * 2;
    const materialCostWithMarkup = getPermSignMaterialCost(itemType, permanentSigns, pmsItem) * (1 + (permanentSigns.itemMarkup / 100));
    const fuelCost = getPermSignFuelCost(pmsItem, adminData, mptRental);
    if (itemType === 'pmsTypeB' || itemType === 'pmsTypeC' || itemType === 'pmsTypeF') {
      const signPrice = safeNumber(permanentSigns.equipmentData.find(equip => equip.name === 'permSignPriceSqFt')?.cost) * (pmsItem as PostMountedInstall).signSqFootage;
      revenue = laborCostWithMarkup + signPrice + materialCostWithMarkup + fuelCost
    } else {
      revenue = laborCostWithMarkup + materialCostWithMarkup + fuelCost
    }
  } else {
    revenue = totalCost / (1 - (pmsItem.customMargin / 100));
  }
  return {
    revenue,
    grossMargin: (revenue - totalCost) / revenue
  }
}

export const getPermanentSignsCostSummary = (permanentSigns: PermanentSigns, adminData: AdminData, mptRental: MPTRentalEstimating): {
  totalRevenue: number,
  totalCost: number,
  grossMargin: number
} => {
  const totalRevenue = permanentSigns.signItems.reduce((acc, signItem) => acc += getPermanentSignRevenueAndMargin(permanentSigns, signItem, adminData, mptRental).revenue, 0)
  const totalCost = permanentSigns.signItems.reduce((acc, signItem) => acc += getPermSignTotalCost(determineItemType(signItem), permanentSigns, signItem, adminData, mptRental), 0)

  return {
    totalRevenue,
    totalCost,
    grossMargin: safeNumber((totalRevenue - totalCost) / totalCost)
  }
}
