// types/ContractManagementData.ts
import { AdminData } from '@/types/TAdminData';
import { Customer } from '@/types/Customer';

export interface ContractManagementData {
    adminData: AdminData;
    customer: Customer | null;
    customerContractNumber: string;
    projectManager: string;
    pmEmail: string;
    pmPhone: string;
    sender: {
        name: string;
        email: string;
        role: string;
    };
    evDescription: string;
    addedFiles: {
        'W-9': boolean;
        'EEO-SHARP Policy': boolean;
        'Safety Program': boolean;
        'Sexual Harassment Policy': boolean;
        'Avenue of Appeals': boolean;
    };
    files: File[];
    certified_payroll: 'STATE' | 'FEDERAL' | 'N/A';
    laborGroup: string;
}