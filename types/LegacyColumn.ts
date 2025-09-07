export interface LegacyColumn {
    key: string;
    title: string;
    className?: string;
    sortable?: boolean;
}

export interface EquipmentRentalTableData {
    name: string;
    quantity: number | null;
    months: number | null;
    rentPrice: number | null;
    reRentPrice: number | null;
    reRentForCurrentJob: string;
    totalCost: number | null;
    equipmentCost: number | null;
    usefulLifeYrs: number | null;
}
