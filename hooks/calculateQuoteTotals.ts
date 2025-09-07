import { QuoteItem } from "@/types/IQuoteItem";

export function calculateItemTotal(item: QuoteItem): number {
  const subtotal = item.quantity * item.unitPrice;

  let total = subtotal;
  if (item.discountType === "dollar") {
    total -= item.discount;
  } else if (item.discountType === "percentage") {
    total -= (subtotal * item.discount) / 100;
  }

  // También sumamos el total de los associatedItems
  if (item.associatedItems && item.associatedItems.length > 0) {
    const associatedTotal = item.associatedItems.reduce((acc, assoc) => {
      return acc + assoc.quantity * assoc.unitPrice;
    }, 0);
    total += associatedTotal;
  }

  return Math.max(total, 0); 
}

export function calculateQuoteTotals(items: QuoteItem[]) {
  const itemsWithTotals = items.map(item => ({
    ...item,
    total: calculateItemTotal(item)
  }));

  const grandTotal = itemsWithTotals.reduce((acc, item) => acc + item.total, 0);

  return {
    itemsWithTotals,
    grandTotal,
  };
}
