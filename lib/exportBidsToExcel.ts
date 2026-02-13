import { AdminData } from '@/types/TAdminData';
import { AvailableJobStatus } from '@/data/available-jobs';
import { MPTRentalEstimating, CustomLightAndDrumItem, Phase } from '@/types/MPTEquipment';
import ExcelJS from 'exceljs';
import { calculateEquipmentCostSummary, calculateLaborCostSummary, calculateLightAndDrumCostSummary, calculateRentalSummary, calculateTotalSignCostSummary, getAllTotals, getEquipmentTotalsPerPhase, getWeightedAverageDays, returnSignTotalsSquareFootage } from './mptRentalHelperFunctions';
import { EquipmentRentalItem } from '@/types/IEquipmentRentalItem';
import { safeNumber } from './safe-number';
import { Flagging } from '@/types/TFlagging';
import { SaleItem } from '@/types/TSaleItem';
import { formatDate } from './formatUTCDate';
import { AllTotals } from './mptRentalHelperFunctions';
import { defaultMPTObject } from '@/types/default-objects/defaultMPTObject';
import { defaultAdminObject } from '@/types/default-objects/defaultAdminData';
import { defaultFlaggingObject } from '@/types/default-objects/defaultFlaggingObject';
import { defaultPermanentSignsObject } from '@/types/default-objects/defaultPermanentSignsObject';


//generic wrapper for objects returned from the db as they are identical other than dates being iso strings
type DateFieldsToStrings<T> = {
    [K in keyof T]: T[K] extends Date | null 
        ? string | null 
        : T[K] extends Date | undefined 
        ? string | undefined 
        : T[K]
}

//how the estimate data gets returned from the estimates_complete view
export type EstimateData = {
    id: number;
    status: string;
    total_revenue: number;
    total_cost: number;
    total_gross_profit: number;
    //this will be an ISO date in string form
    created_at: string;
    archived: boolean;
    admin_data: DateFieldsToStrings<AdminData>
    mpt_rental: DateFieldsToStrings<MPTRentalEstimating> | undefined
    equipment_rental: EquipmentRentalItem[]  | undefined
    flagging: Flagging | undefined
    service_work: Flagging | undefined
    permanent_signs: any;
    sale_items: SaleItem[] | undefined
    project_manager: string | null;
    pm_email: string | null;
    pm_phone: string | null;
    customer_contract_number: string | null;
    contractor_name: string | null
    subcontractor_name: string | null;
    total_phases: number;
    total_days: number | null;
    total_hours: number
    contractNumber: string
}

const formatDateForExcel = (date: Date | null | undefined): string => {
    if (!date || isNaN(date.getTime())) return '-';
    
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
};

const getCustomItems = (data: EstimateData[]) => {
    const customItems = new Set<string>();
    data.forEach(row => {
        row.mpt_rental?.phases?.forEach(phase => {
            if (phase.customLightAndDrumItems) {
                phase.customLightAndDrumItems.forEach((item: CustomLightAndDrumItem) => {
                    if (item.id) customItems.add(item.id);
                });
            }
        });
    });
    return Array.from(customItems);
};

//this is for signs who don't have a quantity (secondary signs stored incorrectly as some point)
function normalizeSignData(phases: Phase[]): Phase[] {
    return phases.map(phase => ({
      ...phase,
      startDate: new Date(formatDate(phase.startDate)),
      endDate: new Date(formatDate(phase.endDate)),
      signs: phase.signs.map(sign => {
        // If it's a secondary sign without quantity, find its primary sign
        if ('primarySignId' in sign && (sign.quantity === undefined || sign.quantity === 0)) {
          const primarySign = phase.signs.find(s => s.id === sign.primarySignId);
          return {
            ...sign,
            quantity: primarySign?.quantity || 0
          };
        }
        return sign;
      })
    }));
  }


const getOtherRentalItems = (data: EstimateData[]) => {
    const otherItems = new Set<string>();
    const standardItems = ['Truck Mounted Attenuator', 'TMA', 'Arrow Board', 'Message Board', 'Speed Trailer'];
    
    data.forEach(row => {
        row.equipment_rental?.forEach(equip => {
            if(!equip) return;
            if (!standardItems.includes(equip.name)) {
                otherItems.add(equip.name);
            }
        });
    });
    return Array.from(otherItems);
};

const calculateCustomItemTotal = (phases: any[], itemId: string) => {
    return phases.reduce((total, phase) => {
        if (!phase.customLightAndDrumItems) return total;
        const item = phase.customLightAndDrumItems.find((i : CustomLightAndDrumItem) => i.id === itemId);
        return total + (item?.quantity || 0);
    }, 0);
};

export const exportBidsToExcel = async (data: EstimateData[]) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Bids List');

    // Get all custom items and other rental items for column creation
    const customItems = getCustomItems(data);
    const otherRentalItems = getOtherRentalItems(data);

    // Create columns including custom and other rental items
    const columns: Partial<ExcelJS.Column>[] = [
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Letting Date', key: 'bidDate', width: 12, style: { numFmt: 'mm/dd/yyyy' } },
        { header: 'Contract Number', key: 'contractNumber', width: 25 },
        { header: 'Contractor', key: 'contractor', width: 20 },
        { header: 'Subcontractor', key: 'subcontractor', width: 20 },
        { header: 'Owner', key: 'owner', width: 15 },
        { header: 'County', key: 'county', width: 15 },
        { header: 'Branch', key: 'branch', width: 15 },
        { header: 'Division', key: 'division', width: 15 },
        { header: 'Estimator', key: 'estimator', width: 15 },
        { header: 'ETC Rep', key: 'etcRep', width: 15 },
        { header: 'Start Date', key: 'start_date', width: 12, style: { numFmt: 'mm/dd/yyyy' } },
        { header: 'End Date', key: 'end_date', width: 12, style: { numFmt: 'mm/dd/yyyy' } },
        { header: 'Project Days', key: 'project_days', width: 12 },
        { header: 'Base Rate', key: 'base_rate', width: 12 },
        { header: 'Fringe Rate', key: 'fringe_rate', width: 12 },
        { header: 'R/T Miles', key: 'rtMiles', width: 12 },
        { header: 'R/T Travel', key: 'rtTravel', width: 12 },
        { header: 'Emergency Job', key: 'emergencyJob', width: 12 },
        { header: 'Rated Hours', key: 'ratedHours', width: 12 },
        { header: 'Nonrated Hours', key: 'nonratedHours', width: 12 },
        { header: 'Total Hours', key: 'totalHours', width: 12 },
        { header: 'Phases', key: 'phases', width: 15 },
        { header: '4\' Ft Type III', key: 'fourFootTypeIII', width: 15 },
        { header: '6 Ft Wings', key: 'sixFootWings', width: 15},
        { header: 'H Stands', key: 'hStand', width: 15 },
        { header: 'Posts', key: 'post', width: 15 },
        { header: 'Sand Bags', key: 'sandbag', width: 15 },
        { header: 'Covers', key: 'covers', width: 15 },
        { header: 'Spring Loaded Metal Stands', key: 'metalStands', width: 15 },
        { header: 'HI Vertical Panels', key: 'HIVP', width: 15 },
        { header: 'Type XI Vertical Panels', key: 'TypeXIVP', width: 15 },
        { header: 'B-Lites', key: 'BLights', width: 15 },
        { header: 'A/C-Lites', key: 'ACLights', width: 15 },
        { header: 'Sharps', key: 'sharps', width: 15},
        { header: 'HI Signs (sq ft)', key: 'hi_signs', width: 15 },
        { header: 'DG Signs (sq ft)', key: 'dg_signs', width: 15 },
        { header: 'Special Signs (sq ft)', key: 'special_signs', width: 15 },
        { header: 'TMA', key: 'tma', width: 15 },
        { header: 'Arrow Board', key: 'arrow_board', width: 15 },
        { header: 'Message Board', key: 'message_board', width: 15 },
        { header: 'Speed Trailer', key: 'speed_trailer', width: 15 },
        ...otherRentalItems.map(item => ({
            header: item,
            key: item.toLowerCase().replace(/\s+/g, '_'),
            width: 15
        })),
        ...customItems.map(item => ({
            header: item,
            key: `custom_${item.toLowerCase().replace(/\s+/g, '_')}`,
            width: 15
        })),
        { header: 'MPT Value', key: 'mptRevenue', width: 12 },
        { header: 'MPT Gross Profit', key: 'mptGrossProfit', width: 12 },
        { header: 'MPT GM %', key: 'mptGrossMargin', width: 12 },
        { header: 'Perm Sign Value', key: 'permSignValue', width: 12 },
        { header: 'Perm Sign Gross Profit', key: 'permSignProfit', width: 12 },
        { header: 'Perm Sign GM %', key: 'permSignMargin', width: 12 },
        { header: 'Rental Value', key: 'rentalRevenue', width: 12 },
        { header: 'Rental Gross Profit', key: 'rentalGrossProfit', width: 12 },
        { header: 'Rental GM %', key: 'rentalGrossMargin', width: 12 },
    ];

    worksheet.columns = columns;

    data.forEach((dataRow) => {
        // Handle MPT rental calculations with format flexibility
        let equipmentTotals;
        let signTotals;
        let laborSummary;
        let allTotals : AllTotals = {
            mptGrossMargin: 0,
            mptGrossProfit: 0,
            mptTotalCost: 0,
            mptTotalRevenue: 0,
            totalCost: 0,
            totalRevenue: 0,
            totalGrossMargin: 0,
            totalGrossProfit: 0,
            revenuePercentages: {
                mpt: 0,
                sale: 0,
                rental: 0,
                permanentSigns: 0,
                flagging: 0,
            }
        };
        const equipmentRentalToUse : EquipmentRentalItem[] = dataRow.equipment_rental ? dataRow.equipment_rental : []

        const mappedAdminData : AdminData = dataRow.admin_data ? {
            ...dataRow.admin_data,
            lettingDate: new Date(formatDate(dataRow.admin_data.lettingDate)),
            startDate: new Date(formatDate(dataRow.admin_data.startDate)),
            endDate: new Date(formatDate(dataRow.admin_data.endDate)),
            winterStart: new Date(formatDate(dataRow.admin_data.winterStart)),
            winterEnd: new Date(formatDate(dataRow.admin_data.winterEnd))
        } : defaultAdminObject

        const mappedMPTData : MPTRentalEstimating = !dataRow.mpt_rental ? defaultMPTObject : {
            ...dataRow.mpt_rental,
            phases: dataRow.mpt_rental.phases ? normalizeSignData(dataRow.mpt_rental.phases) : []
        }
        
        try {                
            equipmentTotals = getEquipmentTotalsPerPhase(mappedMPTData);
            signTotals = returnSignTotalsSquareFootage(mappedMPTData);
            laborSummary = calculateLaborCostSummary(mappedAdminData, mappedMPTData);
            allTotals = getAllTotals(mappedAdminData, mappedMPTData, equipmentRentalToUse, dataRow.flagging ?? defaultFlaggingObject, dataRow.service_work ?? defaultFlaggingObject, dataRow.sale_items ?? [], (dataRow as any).permanent_signs ?? defaultPermanentSignsObject)
        } catch (error) {
            console.error("Error calculating MPT rental data:", error);
            equipmentTotals = {
                fourFootTypeIII: { totalQuantity: 0 },
                sixFootWings: { totalQuantity: 0 },
                hStand: { totalQuantity: 0 },
                post: { totalQuantity: 0 },
                sandbag: { totalQuantity: 0 },
                covers: { totalQuantity: 0 },
                metalStands: { totalQuantity: 0 },
                HIVP: { totalQuantity: 0 },
                TypeXIVP: { totalQuantity: 0 },
                BLights: { totalQuantity: 0 },
                ACLights: { totalQuantity: 0 },
                sharps: { totalQuantity: 0}
            };
            signTotals = {
                HI: { totalSquareFootage: 0 },
                DG: { totalSquareFootage: 0 },
                Special: { totalSquareFootage: 0 }
            };
            laborSummary = {
                ratedLaborHours: 0,
                nonRatedLaborHours: 0
            };
        }

        const calculateEquipmentQuantity = (items : EquipmentRentalItem[], equipmentName : string): number => {
            return items.filter(i => i.name === equipmentName).reduce((acc, item) => item.quantity += acc, 0)
        }

        const rowData = {
            status: dataRow.status,
            bidDate: mappedAdminData.lettingDate && !isNaN(mappedAdminData.lettingDate.getTime()) ? mappedAdminData.lettingDate : null,
            contractNumber: mappedAdminData.contractNumber,
            contractor: dataRow.contractor_name || '-',
            subcontractor: dataRow.subcontractor_name || '-',
            owner: mappedAdminData.owner,
            county: mappedAdminData.county.name,
            branch: mappedAdminData.county.branch,
            division: mappedAdminData.division,
            estimator: mappedAdminData.estimator ?? '-',
            etcRep: mappedAdminData.etcRep ?? '-',
            start_date: mappedAdminData.startDate && !isNaN(mappedAdminData.startDate.getTime()) ? mappedAdminData.startDate : null,
            end_date: mappedAdminData.endDate && !isNaN(mappedAdminData.endDate.getTime()) ? mappedAdminData.endDate : null,
            project_days: dataRow.total_days ?? 0,
            base_rate: mappedAdminData.county.laborRate,
            fringe_rate: mappedAdminData.county.fringeRate,
            rtMiles: (mappedAdminData.owMileage ?? 0) * 2,
            rtTravel: (mappedAdminData.owTravelTimeMins ?? 0) * 2,
            emergencyJob: mappedAdminData.emergencyJob,
            ratedHours: laborSummary.ratedLaborHours.toFixed(2),
            nonratedHours: laborSummary.nonRatedLaborHours.toFixed(2),
            totalHours: (laborSummary.ratedLaborHours + laborSummary.nonRatedLaborHours).toFixed(2),
            phases: dataRow.total_phases,
            // Equipment totals
            fourFootTypeIII: equipmentTotals?.fourFootTypeIII?.totalQuantity,
            sixFootWings: equipmentTotals.sixFootWings.totalQuantity,
            hStand: equipmentTotals.hStand.totalQuantity,
            post: equipmentTotals.post.totalQuantity,
            sandbag: equipmentTotals.sandbag.totalQuantity,
            covers: equipmentTotals.covers.totalQuantity,
            metalStands: equipmentTotals.metalStands.totalQuantity,
            HIVP: equipmentTotals.HIVP.totalQuantity,
            TypeXIVP: equipmentTotals.TypeXIVP.totalQuantity,
            BLights: equipmentTotals.BLights.totalQuantity,
            ACLights: equipmentTotals.ACLights.totalQuantity,
            sharps: equipmentTotals.sharps.totalQuantity,
            // Sign totals
            hi_signs: signTotals.HI.totalSquareFootage.toFixed(2),
            dg_signs: signTotals.DG.totalSquareFootage.toFixed(2),
            special_signs: signTotals.Special.totalSquareFootage.toFixed(2),
            // Standard rental totals using the helper function
            tma: calculateEquipmentQuantity(equipmentRentalToUse, 'TMA') + calculateEquipmentQuantity(equipmentRentalToUse, 'Truck Mounted Attenuator'),
            arrow_board: calculateEquipmentQuantity(equipmentRentalToUse, 'Arrow Board'),
            message_board: calculateEquipmentQuantity(equipmentRentalToUse, 'Message Board'),
            speed_trailer: calculateEquipmentQuantity(equipmentRentalToUse, 'Speed Trailer'),
            // Other rental totals
            ...Object.fromEntries(
                otherRentalItems.map(item => [
                    item.toLowerCase().replace(/\s+/g, '_'),
                    calculateEquipmentQuantity(equipmentRentalToUse, item)
                ])
            ),
            // Custom item totals
            ...Object.fromEntries(
                customItems.map(item => [
                    `custom_${item.toLowerCase().replace(/\s+/g, '_')}`,
                    calculateCustomItemTotal(mappedMPTData.phases, item)
                ])
            ),
            // MPT financials
            mptRevenue: safeNumber(allTotals.mptTotalRevenue).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
            mptGrossProfit: safeNumber(allTotals.mptTotalCost).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
            mptGrossMargin: safeNumber(allTotals.mptGrossMargin).toFixed(2),

            // Permanent Sign financials
            permSignValue: 0,
            permSignProfit: 0,
            permSignMargin: 0,

            // Rental financials
            rentalRevenue: safeNumber(calculateRentalSummary(equipmentRentalToUse).totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2}),
            rentalGrossProfit: safeNumber(calculateRentalSummary(equipmentRentalToUse).totalGrossProfit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2}),
            rentalGrossMargin: safeNumber(calculateRentalSummary(equipmentRentalToUse).totalGrossProfitMargin).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2}),
        };

        const excelRow = worksheet.addRow(rowData);

        // Apply status-based color coding
        if (dataRow.status.toLowerCase() === 'draft') {
            excelRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFE6E6' }
            };
        } else if (dataRow.status.toLowerCase() === 'won' || dataRow.status.toLowerCase() === 'won-pending') {
            excelRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE6FFE6' }
            };
        } else if (dataRow.status.toLowerCase() === 'lost') {
            excelRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFE6E6' }
            };
        }
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
        column.width = Math.max(
            column.width || 10,
            15
        );
    });

    worksheet.columns.forEach(column => {
        if (column.key) {
            column.alignment = { horizontal: 'left' };
        }
    });

    // Add header styling
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0F0F0' }
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().split('T')[0];
    link.download = `bids_list_${timestamp}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
};