export type MPTEquipmentCost = {
    cost : number
    revenue : number
    depreciationCost : number
    grossProfit : number
    grossMargin: number
    details?: {
        equipmentBreakdown: Array<{
            type: string
            quantity: number
            days: number
            cost: number
            revenue: number
        }>
        formula: string
    }
}