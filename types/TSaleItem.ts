export type SaleItem = {
  item_number: string
  name: string
  notes: string
  quantity: number
  description?: string;
  totalCost: number
  revenue: number
  gross_profit: number
  gross_profit_margin: number
  vendor?: string
  item_description: string
  quote_price: number;
  markup_percentage: number
  uom?: any;

}