import ExcelJS from 'exceljs';

interface SignItem {
  id: number;
  designation: string;
  description: string;
  width: number;
  height: number;
  quantity: number;
  sheeting: string;
  stiffner: string;
  assigned_to: string;
  in_stock: number;
  order: number;
  make: number;
  structure: string;
  bLights: number;
  covers: number;
  substrate?: string;
  targetDate?: string;
  includeCover?: boolean;
  includeStiffener?: boolean;
  isCustom?: boolean;
}

interface SignOrder {
  id: number;
  requestor: string;
  contractor_id: number;
  contractors?: { name: string };
  branch?: string;
  order_date: string;
  need_date: string;
  start_date: string;
  end_date: string;
  job_number: string;
  contract_number: string;
  sale: boolean;
  rental: boolean;
  perm_signs: boolean;
  status: string;
  shop_status?: string;
  assigned_to?: string;
}

// Add this import to your main component file:
// import { exportSignOrderToExcel } from '@/lib/exportSignOrderToExcel';

export const exportSignOrderToExcel = async (signOrder: SignOrder, signItems: SignItem[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sign Order Summary');

  // Define column widths to match the screenshot
  worksheet.columns = [
    { key: 'designation', width: 15 },
    { key: 'description', width: 25 },
    { key: 'dimensions', width: 15 },
    { key: 'qty', width: 8 },
    { key: 'sheeting', width: 15 },
    { key: 'substrate', width: 15 },
    { key: 'stiffener', width: 15 }
  ];

  let currentRow = 1;

  // Add main title
  const titleRow = worksheet.getRow(currentRow);
  titleRow.getCell(1).value = 'SIGN ORDER SUMMARY';
  titleRow.getCell(1).font = { bold: true, size: 14 };
  titleRow.getCell(1).alignment = { horizontal: 'center' };
  worksheet.mergeCells(currentRow, 1, currentRow, 7);
  
  // Add border around title
  for (let col = 1; col <= 7; col++) {
    titleRow.getCell(col).border = {
      top: { style: 'thick' },
      bottom: { style: 'thick' },
      left: col === 1 ? { style: 'thick' } : undefined,
      right: col === 7 ? { style: 'thick' } : undefined
    };
  }
  
  currentRow += 2;

  // Helper function to add a section
  const addSection = (sectionTitle: string, items: SignItem[]) => {
    // Section title row
    const sectionRow = worksheet.getRow(currentRow);
    sectionRow.getCell(1).value = sectionTitle;
    sectionRow.getCell(1).font = { bold: true, size: 12 };
    sectionRow.getCell(1).alignment = { horizontal: 'center' };
    worksheet.mergeCells(currentRow, 1, currentRow, 7);
    
    // Add border around section title
    for (let col = 1; col <= 7; col++) {
      sectionRow.getCell(col).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: col === 1 ? { style: 'thick' } : { style: 'thin' },
        right: col === 7 ? { style: 'thick' } : { style: 'thin' }
      };
    }
    
    currentRow++;

    // Header row
    const headerRow = worksheet.getRow(currentRow);
    const headers = ['DESIGNATION', 'DESCRIPTION', 'DIMENSIONS', 'QTY', 'SHEETING', 'SUBSTRATE', 'STIFFENER'];
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, size: 10 };
      cell.alignment = { horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: index === 0 ? { style: 'thick' } : { style: 'thin' },
        right: index === headers.length - 1 ? { style: 'thick' } : { style: 'thin' }
      };
    });
    
    currentRow++;

    // Add data rows (minimum 10 rows for each section)
    const minRows = 10;
    const maxRows = Math.max(minRows, items.length);
    
    for (let i = 0; i < maxRows; i++) {
      const dataRow = worksheet.getRow(currentRow);
      const item = items[i];
      
      if (item) {
        // Format dimensions as "width x height"
        const dimensions = item.width && item.height ? `${item.width} x ${item.height}` : '';
        
        dataRow.getCell(1).value = item.designation || '';
        dataRow.getCell(2).value = item.description || '';
        dataRow.getCell(3).value = dimensions;
        dataRow.getCell(4).value = item.quantity || '';
        dataRow.getCell(5).value = item.sheeting || '';
        dataRow.getCell(6).value = item.substrate || '';
        dataRow.getCell(7).value = item.stiffner || '';
      }
      
      // Add borders to all cells in the row
      for (let col = 1; col <= 7; col++) {
        const cell = dataRow.getCell(col);
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: col === 1 ? { style: 'thick' } : { style: 'thin' },
          right: col === 7 ? { style: 'thick' } : { style: 'thin' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
      
      currentRow++;
    }
    
    currentRow++; // Add space between sections
  };

  // Filter items by category
  const inStockItems = signItems.filter(item => item.in_stock > 0);
  const manufactureItems = signItems.filter(item => item.make > 0);
  const onOrderItems = signItems.filter(item => item.order > 0);

  // Add sections
  addSection('IN STOCK', inStockItems);
  addSection('MANUFACTURE', manufactureItems);
  addSection('ON ORDER', onOrderItems);

  // Set row heights for better appearance
  worksheet.eachRow((row) => {
    row.height = 20;
  });

  // Generate filename
  const jobNumber = signOrder.job_number || 'Unknown';
  const contractNumber = signOrder.contract_number || 'Unknown';
  const filename = `${jobNumber}_${contractNumber}_sign_order_summary.xlsx`;

  // Update your handleExport function in the main component:
  const handleExport = async () => {
    if (!signOrder) {
      alert('No sign order data available for export');
      return;
    }
    
    try {
      await exportSignOrderToExcel(signOrder, signItems);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export Excel file');
    }
  };

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