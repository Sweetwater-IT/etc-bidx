import { County } from "./TCounty";

export type Branches = 'Bedford' | 'Hatfield' | 'Turbotville'

export type AdminData = {
    id?: number;
    contractNumber: string,
    contract_number: string,
    estimator: string,
    division: 'PUBLIC' | 'PRIVATE' | null,
    lettingDate: Date | null,
    owner: 'PENNDOT' | 'TURNPIKE' | 'PRIVATE' | 'OTHER' | 'SEPTA' | null,
    county: County,
    srRoute: string,
    location: string,
    jobNumber?: string;

    branch?: string;
    paymentTerms?: string;
    dbe: string,
    job_id?: number | null;
    startDate: Date | null,
    endDate: Date | null,
    winterStart?: Date | undefined,
    winterEnd?: Date | undefined,
    owTravelTimeHours?: number
    owTravelTimeMinutes?: number
    owTravelTimeMins?: number // For backward compatibility
    owMileage?: number;
    fuelCostPerGallon?: number;
    emergencyJob: boolean;
    rated: 'RATED' | 'NON-RATED';
    emergencyFields: EmergencyFields;
    etcRep: string;
}

export type EmergencyFields = {
    emergencyHIVerticalPanels?: number,
    emergencyTypeXIVerticalPanels?: number,
    emergencyBLites?: number,
    emergencyACLites?: number,
    emergencySharps?: number
}
