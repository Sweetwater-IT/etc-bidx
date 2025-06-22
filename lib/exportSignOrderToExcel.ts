import ExcelJS from 'exceljs';
import { ExtendedPrimarySign, ExtendedSecondarySign } from '@/types/MPTEquipment';
import { SignOrder } from '@/types/TSignOrder';

export const exportSignOrderToExcel = async (signOrder: SignOrder, signItems: (ExtendedPrimarySign | ExtendedSecondarySign)[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sign Shop Order');

  // Define columns with adjusted widths
  worksheet.columns = [
    { header: 'Designation', key: 'designation', width: 15 },
    { header: 'Description', key: 'description', width: 25 },
    { header: 'Width (in)', key: 'width', width: 12 },
    { header: 'Height (in)', key: 'height', width: 12 },
    { header: 'Quantity', key: 'quantity', width: 10 },
    { header: 'Sheeting', key: 'sheeting', width: 15 },
    { header: 'Substrate', key: 'substrate', width: 15 },
    { header: 'In Stock', key: 'inStock', width: 10 },
    { header: 'Order', key: 'order', width: 10 },
    { header: 'Make', key: 'make', width: 10 }
  ];

  // Filter and sort signs: inStock descending, then order descending, then make descending
  const sortedSigns = signItems
    .filter(sign => sign.designation !== '' && sign.quantity > 0) // Only include valid signs
    .sort((a, b) => {
      // First sort by inStock (descending - highest first)
      if ((b.inStock || 0) !== (a.inStock || 0)) {
        return (b.inStock || 0) - (a.inStock || 0);
      }
      // Then by order (descending - highest first)
      if ((b.order || 0) !== (a.order || 0)) {
        return (b.order || 0) - (a.order || 0);
      }
      // Finally by make (descending - highest first)
      return (b.make || 0) - (a.make || 0);
    });

  // Process each sign (both primary and secondary)
  sortedSigns.forEach(sign => {
    // Add sign row
    const row = worksheet.addRow({
      designation: sign.designation,
      description: sign.description,
      width: Number(sign.width),
      height: Number(sign.height),
      quantity: sign.quantity,
      sheeting: sign.sheeting,
      substrate: sign.substrate || '',
      inStock: sign.inStock || 0,
      order: sign.order || 0,
      make: sign.make || 0
    });

    // If it's a secondary sign, indent the designation
    if ('primarySignId' in sign) {
      const designationCell = row.getCell('designation');
      designationCell.alignment = { indent: 1 };
    }
  });

  // Add totals row
  const totals = sortedSigns.reduce((acc, sign) => ({
    totalSigns: acc.totalSigns + 1,
    totalQuantity: acc.totalQuantity + (sign.quantity || 0),
    totalInStock: acc.totalInStock + (sign.inStock || 0),
    totalOrder: acc.totalOrder + (sign.order || 0),
    totalMake: acc.totalMake + (sign.make || 0)
  }), { totalSigns: 0, totalQuantity: 0, totalInStock: 0, totalOrder: 0, totalMake: 0 });

  // Add spacing before totals
  worksheet.addRow({});

  const totalRow = worksheet.addRow({
    designation: 'TOTALS',
    quantity: totals.totalQuantity,
    inStock: totals.totalInStock,
    order: totals.totalOrder,
    make: totals.totalMake
  });
  totalRow.font = { bold: true };
  totalRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE4E4E4' }
  };

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
      ['width', 'height', 'quantity', 'inStock', 'order', 'make'].forEach(key => {
        const cell = row.getCell(key);
        const value = cell.value;
        
        // Convert numeric strings to actual numbers
        if (typeof value === 'string' && !isNaN(Number(value)) && value !== '') {
          cell.value = Number(value);
        }
      });
    }
  });

  // Add borders to all cells
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      
      // Center align numeric columns
      if (['width', 'height', 'quantity', 'inStock', 'order', 'make'].includes(worksheet.getColumn(colNumber).key as string)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { vertical: 'middle' };
      }
    });
  });

  // Set row heights for better appearance
  worksheet.eachRow((row) => {
    row.height = 20;
  });

  // Generate filename
  const jobNumber = signOrder.job_number || 'Unknown';
  const contractNumber = signOrder.contract_number || 'Unknown';
  const filename = `${jobNumber}_${contractNumber}_sign_shop_order.xlsx`;

  // Export the file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};