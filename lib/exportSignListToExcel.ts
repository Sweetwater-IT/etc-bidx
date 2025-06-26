import ExcelJS from 'exceljs';
import { MPTRentalEstimating, PrimarySign, SecondarySign } from '@/types/MPTEquipment';
import { returnSignTotalsByPhase, getAssociatedSignEquipment } from './mptRentalHelperFunctions';

export const exportSignListToExcel = async (contractNumber: string, mptRental: MPTRentalEstimating) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sign List');

  // Define columns with adjusted widths
  worksheet.columns = [
    { header: 'Phase', key: 'phase', width: 18 }, // Increased width for phase column
    { header: 'Designation', key: 'designation', width: 15 },
    { header: 'Description', key: 'description', width: 25 },
    { header: 'Width (in)', key: 'width', width: 12 },
    { header: 'Height (in)', key: 'height', width: 12 },
    { header: 'Quantity', key: 'quantity', width: 10 },
    { header: 'Sheeting', key: 'sheeting', width: 30 }, // Wider for totals text
    { header: 'Structure', key: 'displayStructure', width: 20 }, // Wider for totals text
    { header: 'B Lights', key: 'bLights', width: 10 },
    { header: 'Covers', key: 'covers', width: 10 }
  ];

  const structureMapping = {
    hStand: 'H Stand',
    none: 'None',
    fourFootTypeIII: '4\' Type III',
    post: 'Post'
  };

  // Add data for each phase
  mptRental?.phases.forEach((phase, phaseIndex) => {
    // Phase header
    const headerRow = worksheet.addRow({
      phase: `Phase ${phaseIndex + 1}`
    });
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE4E4E4' }
    };

    // Find all primary signs with quantity > 0
    const primarySigns = phase.signs.filter(
      sign => !('primarySignId' in sign) && sign.quantity > 0 && sign.width > 0 && sign.height > 0
    ) as PrimarySign[];

    // Process each primary sign followed by its secondary signs
    primarySigns.forEach(primarySign => {
      // Add primary sign row
      worksheet.addRow({
        phase: `Phase ${phaseIndex + 1}`,
        designation: primarySign.designation,
        description: primarySign.description,
        width: Number(primarySign.width),
        height: Number(primarySign.height),
        quantity: primarySign.quantity,
        sheeting: primarySign.sheeting,
        displayStructure: primarySign.displayStructure,
        bLights: primarySign.bLights,
        covers: primarySign.cover ? primarySign.quantity : 0
      });

      // Find and add all secondary signs for this primary sign
      const secondarySigns = phase.signs.filter(
        sign => 'primarySignId' in sign && 
              (sign as SecondarySign).primarySignId === primarySign.id && 
              sign.quantity > 0 && 
              sign.width > 0 && 
              sign.height > 0
      ) as SecondarySign[];

      secondarySigns.forEach(secondarySign => {
        const row = worksheet.addRow({
          phase: `Phase ${phaseIndex + 1}`,
          designation: secondarySign.designation, // Will indent this visually below
          description: secondarySign.description,
          width: Number(secondarySign.width),
          height: Number(secondarySign.height),
          quantity: secondarySign.quantity,
          sheeting: secondarySign.sheeting,
          structure: '-',
          bLights: '-',
          covers: '-'
        });
        
        // Manually indent the designation cell by setting indent level
        const designationCell = row.getCell('designation');
        designationCell.alignment = { indent: 1 };
      });
    });

    // Add phase totals
    const phaseTotals = returnSignTotalsByPhase(phase);
    const totalRow = worksheet.addRow({
      phase: `Phase ${phaseIndex + 1} Totals`,
    });
    totalRow.getCell('sheeting').value = `HI: ${phaseTotals.HI.totalSquareFootage.toFixed(1)} sq.ft | DG: ${phaseTotals.DG.totalSquareFootage.toFixed(1)} sq.ft | Special: ${phaseTotals.Special.totalSquareFootage.toFixed(1)} sq.ft`;
    totalRow.getCell('bLights').value = getAssociatedSignEquipment(phase).BLights;
    totalRow.getCell('covers').value = getAssociatedSignEquipment(phase).covers;
    totalRow.font = { bold: true };

    // Add structure totals
    const structureTotals = getAssociatedSignEquipment(phase);
    const structureRow = worksheet.addRow({
      phase: `Phase ${phaseIndex + 1} Structure Totals`,
    });
    structureRow.getCell('sheeting').value = `4' Type III: ${structureTotals.fourFootTypeIII} | Post: ${structureTotals.post} | H Stand: ${structureTotals.hStand}`;
    structureRow.font = { bold: true };

    // Add spacing between phases
    worksheet.addRow({});
  });

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF8F9FA' }
  };

  // Ensure numbers are displayed as numbers, not text
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) { // Skip header row
      ['width', 'height', 'quantity', 'bLights', 'covers'].forEach(key => {
        const cell = row.getCell(key);
        const value = cell.value;
        
        // Convert numeric strings to actual numbers
        if (typeof value === 'string' && !isNaN(Number(value)) && value !== '-') {
          cell.value = Number(value);
        }
      });
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${contractNumber}_sign_list.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
};