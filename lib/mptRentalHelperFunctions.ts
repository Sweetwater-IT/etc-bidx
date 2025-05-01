import { Phase } from "@/types/MPTEquipment";
import { MPTRentalEstimating } from "@/types/MPTEquipment";
import { EquipmentType } from "@/types/MPTEquipment";
import { SheetingType } from "@/types/MPTEquipment";
import { MPTEquipmentCost } from "@/types/MPTEquipmentCost";
import { AdminData } from "@/types/TAdminData";
import { LaborCostSummary } from "@/types/ILaborCostSummary";
import { safeNumber } from "./safe-number";
import { LightAndDrumCostSummary } from "@/types/ILightAndDrumCostSummary";
import { AllTotals } from "@/types/IAllTotals";

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

    // Use safeNumber to prevent NaN values
    const quantity = safeNumber(item.totalQuantity);
    const price = safeNumber(staticInfo.price);
    const discountRate = safeNumber(staticInfo.discountRate);
    const usefulLife = safeNumber(staticInfo.usefulLife) || 365;
    const daysRequired = safeNumber(item.totalDaysRequired);

    const itemCost = quantity * price;
    totalCost += itemCost;

    const itemRevenue = itemCost - (itemCost * (discountRate / 100));
    totalRevenue += itemRevenue;

    const dailyDepreciation = usefulLife > 0 ? price / (usefulLife * 365) : 0;
    const itemDepreciationCost = dailyDepreciation * daysRequired * quantity;
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
  try {
    const phaseTotals = returnPhaseTotals(mptRental);

    const laborRate = safeNumber(adminData?.county?.laborRate);
    const fringeRate = safeNumber(adminData?.county?.fringeRate);
    const totalRate = laborRate + fringeRate;

    const ratedLaborHours = safeNumber(phaseTotals.totalPersonnel) * 8 * safeNumber(phaseTotals.totalDays) + safeNumber(phaseTotals.totalAdditionalRatedHours);
    const nonRatedLaborHours = safeNumber(phaseTotals.totalPersonnel) * 8 * safeNumber(phaseTotals.totalDays) + safeNumber(phaseTotals.totalAdditionalNonRatedHours);

    const totalRatedLaborCost = ratedLaborHours * totalRate;
    const totalNonRateLaborCost = nonRatedLaborHours * totalRate;

    const isRated = adminData?.rated === 'RATED';
    const totalRatedLaborRevenue = totalRatedLaborCost * 2;
    const nonRateLaborRevenue = totalNonRateLaborCost * 2;
    const revenue = isRated ? totalRatedLaborRevenue : nonRateLaborRevenue;

    const ratedGrossProfit = totalRatedLaborRevenue - totalRatedLaborCost;
    const nonRateGrossProfit = nonRateLaborRevenue - totalNonRateLaborCost;
    const grossProfit = isRated ? ratedGrossProfit : nonRateGrossProfit;

    const nonRateGrossMargin = nonRateLaborRevenue !== 0 ? (nonRateGrossProfit / nonRateLaborRevenue) * 100 : 0;
    const grossMargin = revenue !== 0 ? (grossProfit / revenue) * 100 : 0;

    return {
      totalRatedLaborCost,
      totalNonRateLaborCost,
      totalRatedLaborRevenue,
      revenue,
      grossProfit,
      grossMargin,
      nonRateLaborRevenue,
      nonRateGrossProfit,
      nonRateGrossMargin,
      ratedLaborHours,
      nonRatedLaborHours
    };
  } catch (error) {
    console.error('Error calculating labor cost summary:', error);
    return {
      totalRatedLaborCost: 0,
      totalNonRateLaborCost: 0,
      totalRatedLaborRevenue: 0,
      revenue: 0,
      grossProfit: 0,
      grossMargin: 0,
      nonRateLaborRevenue: 0,
      nonRateGrossProfit: 0,
      nonRateGrossMargin: 0,
      ratedLaborHours: 0,
      nonRatedLaborHours: 0
    };
  }
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
    let phaseTrips = getTotalTripsPerPhase(phase);
    let phaseTrucks = Number(phase.numberTrucks) || 0;
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

export function getAllTotals(adminData: AdminData, mptRental: MPTRentalEstimating): AllTotals {

  if (!mptRental.phases || mptRental.phases.length === 0) {
    console.warn('No phases found in mptRental data');
    return getEmptyTotals();
  }

  if (!mptRental.staticEquipmentInfo || Object.keys(mptRental.staticEquipmentInfo).length === 0) {
    console.warn('No static equipment info found');
    return getEmptyTotals();
  }

  try {
    const mptRentalStats = calculateEquipmentCostSummary(mptRental);
    const lightAndDrumRentalStats = calculateLightAndDrumCostSummary(adminData, mptRental);

    const totalSignCostStats = calculateTotalSignCostSummary(mptRental);

    const totalRatedLaborStats = calculateLaborCostSummary(adminData, mptRental);

    const totalTruckAndFuelStats = calculateTruckAndFuelCostSummary(adminData, mptRental);

    const mptTotalCost = safeNumber(mptRentalStats.depreciationCost) +
      safeNumber(lightAndDrumRentalStats.total.depreciationCost) +
      safeNumber(totalSignCostStats.HI.depreciationCost) +
      safeNumber(totalSignCostStats.DG.depreciationCost) +
      safeNumber(totalSignCostStats.Special.depreciationCost) +
      safeNumber(totalRatedLaborStats.totalRatedLaborCost) +
      safeNumber(totalRatedLaborStats.totalNonRateLaborCost) +
      safeNumber(totalTruckAndFuelStats?.cost);

    const mptTotalRevenue = safeNumber(mptRentalStats.revenue) +
      safeNumber(lightAndDrumRentalStats.total.revenue) +
      safeNumber(totalSignCostStats.HI.revenue) +
      safeNumber(totalSignCostStats.DG.revenue) +
      safeNumber(totalSignCostStats.Special.revenue) +
      safeNumber(totalRatedLaborStats.revenue) +
      safeNumber(totalTruckAndFuelStats?.revenue);

    const mptGrossProfit = safeNumber(mptRentalStats.grossProfit) +
      safeNumber(lightAndDrumRentalStats.total.grossProfit) +
      safeNumber(totalSignCostStats.HI.grossProfit) +
      safeNumber(totalSignCostStats.DG.grossProfit) +
      safeNumber(totalSignCostStats.Special.grossProfit) +
      safeNumber(totalRatedLaborStats.grossProfit) +
      safeNumber(totalTruckAndFuelStats?.grossProfit);

    const totalRevenue = mptTotalRevenue;
    const totalGrossProfit = mptGrossProfit;
    const mptGrossMargin = mptTotalRevenue !== 0 ? (mptGrossProfit / mptTotalRevenue) * 100 : 0;
    const totalGrossMargin = totalRevenue !== 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

    return {
      mptTotalCost,
      mptTotalRevenue,
      mptGrossProfit,
      mptGrossMargin,
      totalRevenue,
      totalCost: mptTotalCost,
      totalGrossProfit,
      totalGrossMargin,
    };
  } catch (error) {
    console.error('Error calculating totals:', error);
    return getEmptyTotals();
  }
}

function getEmptyTotals(): AllTotals {
  return {
    mptTotalCost: 0,
    mptTotalRevenue: 0,
    mptGrossProfit: 0,
    mptGrossMargin: 0,
    totalRevenue: 0,
    totalCost: 0,
    totalGrossProfit: 0,
    totalGrossMargin: 0,
  };
}

// MPTRentalHelperFunctions.ts

const LIGHT_EQUIPMENT_TYPES = ['BLights', 'ACLights', 'TypeXIVP', 'HIVP', 'sharps'] as const;
type LightEquipmentType = typeof LIGHT_EQUIPMENT_TYPES[number];

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
  const fourFootTypeIII = phase?.standardEquipment?.fourFootTypeIII?.quantity || 0;
  const hStand = phase?.standardEquipment?.hStand?.quantity || 0;
  const post = phase?.standardEquipment?.post?.quantity || 0;

  const relevantEquipmentTotals = fourFootTypeIII + hStand + post;
  return (safeNumber(phase?.maintenanceTrips) + Math.ceil(relevantEquipmentTotals / 30)) * 2
}