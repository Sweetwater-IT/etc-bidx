export interface QuoteItem {
  id: string;
  itemNumber: string;
  description: string;
  uom: string;
  notes: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  discountType: 'dollar' | 'percentage'
  associatedItems: Omit<QuoteItem, 'discount' | 'discountType' | 'associatedItems' | 'notes'>[];
  isCustom?: any
  tax: any
  is_tax_percentage: boolean
  quote_id: any
}

export interface AssociatedItem {
  id: string;
  itemNumber: string;
  description: string;
  uom: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}