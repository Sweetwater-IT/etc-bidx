import { useProductsSearch } from "@/hooks/useProductsSearch";
import QuoteItemRow from "./QuoteItemRow";
import { QuoteItem, AssociatedItem } from "@/types/IQuoteItem";

interface QuoteItemsListProps {
  quoteItems: QuoteItem[];
  editingItemId: string | null;
  editingSubItemId: string | null;
  setEditingItemId: (id: string | null) => void;
  setEditingSubItemId: (id: string | null) => void;
  handleItemUpdate: (
    itemId: string,
    field: keyof QuoteItem,
    value: any
  ) => void;
  handleRemoveItem: (itemId: string) => void;
  handleAddCompositeItem: (parentItem: QuoteItem) => void;
  handleCompositeItemUpdate: (
    parentItemId: string,
    subItemId: string,
    field: keyof AssociatedItem,
    value: any
  ) => void;
  handleDeleteComposite: (parentItemId: string, subItemId: string) => void;
  UOM_TYPES: any;
  calculateCompositeUnitPrice: (item: QuoteItem) => number;
  calculateExtendedPrice: (item: QuoteItem) => string;
}

// QuoteItemsList
const QuoteItemsList = ({ quoteItems, editingItemId, ...rest }: QuoteItemsListProps) => {
  const { products, loading } = useProductsSearch(""); // fetch global
  return (
    <>
      {quoteItems.map((item, ix) => (
        <QuoteItemRow
          key={ix}
          item={item}
          isEditing={editingItemId === item.id}
          products={products}
          loading={loading}
          {...rest}
        />
      ))}
    </>
  );
};


export default QuoteItemsList;