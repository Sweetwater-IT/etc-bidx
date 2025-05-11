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