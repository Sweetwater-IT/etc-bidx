import ExcelJS from 'exceljs';
import { AvailableJob } from '@/data/available-jobs';

const statusColors = [
    { status: 'Unset', label: 'Unset', color: 'gray' },
    { status: 'No Bid', label: 'No Bid', color: 'red' },
    { status: 'Bid', label: 'Bid', color: 'green' }
]

export const exportAvailableJobsToExcel = async (data: AvailableJob[]) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Open Bid List');

    worksheet.columns = [
        { header: 'Status', key: 'status', width: 10 },
        { header: 'Branch', key: 'branch_name', width: 10 },
        { header: 'Contract Number', key: 'contract_number', width: 25 },
        { header: 'County', key: 'county', width: 12 },
        { header: 'Due Date', key: 'due_date', width: 12 },
        { header: 'Letting Date', key: 'letting_date', width: 15 },
        { header: 'Entry Date', key: 'created_at', width: 10 },
        { header: 'Location', key: 'location', width: 15 },
        { header: 'Owner', key: 'owner', width: 10 },
        { header: 'Platform', key: 'platform', width: 10 },
        { header: 'Requestor', key: 'requestor', width: 10 },
        { header: 'DBE', key: 'dbe', width: 10},
        // Replace services with individual columns for each service type
        { header: 'MPT', key: 'mpt_service', width: 8 },
        { header: 'Flagging', key: 'flagging_service', width: 8 },
        { header: 'Perm Signs', key: 'perm_signs_service', width: 10 },
        { header: 'Equipment Rental', key: 'equipment_rental_service', width: 15 },
        { header: 'Other', key: 'other_service', width: 8 },
        { header: 'No Bid Reason', key: 'no_bid_reason', width: 15 }
    ];

    data.forEach((dataRow) => {
        const rowData = {
            status: dataRow.status === 'Unset' ? 'Unset' : statusColors.find(statusColor => statusColor.status === dataRow.status)?.label,
            branch_name: dataRow.county.secondary,
            contract_number: dataRow.contractNumber,
            county: dataRow.county.main,
            due_date: dataRow.dueDate ? new Date(dataRow.dueDate).toLocaleString().split(',')[0] : '-',
            letting_date: dataRow.lettingDate ? new Date(dataRow.lettingDate).toLocaleString().split(',')[0] : '-',
            created_at: dataRow.createdAt ? new Date(dataRow.createdAt).toLocaleString().split(',')[0] : '-',
            location: dataRow.location,
            owner: dataRow.owner,
            platform: dataRow.platform,
            requestor: dataRow.requestor,
            dbe: dataRow.dbe,
            // Replace services array with individual yes/no fields
            mpt_service: dataRow.services.MPT ? 'Yes' : 'No',
            flagging_service: dataRow.services.Flagging ? 'Yes' : 'No',
            perm_signs_service: dataRow.services['Perm Signs'] ? 'Yes' : 'No',
            equipment_rental_service: dataRow.services['Equipment Rental'] ? 'Yes' : 'No',
            other_service: dataRow.services.Other ? 'Yes' : 'No',
            no_bid_reason: dataRow.noBidReason || '-'
        };

        const excelRow = worksheet.addRow(rowData);

        if (dataRow.status === 'No Bid') {
            excelRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFE6E6' }
            };
        }
    });

    // Rest of the export code remains the same
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().split('T')[0];
    link.download = `open_bids_${timestamp}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
};