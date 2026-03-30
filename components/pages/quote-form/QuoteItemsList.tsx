import { useProductsSearch } from "@/hooks/useProductsSearch";
import { QuoteItem } from "@/types/IQuoteItem";

import QuoteItemRow from "./QuoteItemRow";

interface QuoteItemsListProps {
  quoteItems: QuoteItem[];
  savingItemId: string | null;
  onSelectProduct: (item: QuoteItem, product?: any) => void;
  onEditItem: (item: QuoteItem) => void;
  onRemoveItem: (itemId: string) => void;
  onQuickQuantityUpdate: (item: QuoteItem, quantity: number) => Promise<void> | void;
  calculateExtendedPrice: (item: QuoteItem) => string;
}

const QuoteItemsList = ({
  quoteItems,
  savingItemId,
  onSelectProduct,
  onEditItem,
  onRemoveItem,
  onQuickQuantityUpdate,
  calculateExtendedPrice,
}: QuoteItemsListProps) => {
  const { products, loading } = useProductsSearch("");

  return (
    <>
      {quoteItems.map((item) => (
        <QuoteItemRow
          key={item.id ?? `${item.itemNumber}-${item.description}`}
          item={item}
          products={products}
          loading={loading}
          saving={savingItemId === String(item.id)}
          onSelectProduct={onSelectProduct}
          onEditItem={onEditItem}
          onRemoveItem={onRemoveItem}
          onQuickQuantityUpdate={onQuickQuantityUpdate}
          calculateExtendedPrice={calculateExtendedPrice}
        />
      ))}
    </>
  );
};

export default QuoteItemsList;
