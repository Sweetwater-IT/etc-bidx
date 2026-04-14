import { useSovPickerItems } from "@/hooks/use-sov-picker-items";
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
  selectingItemId: string | null;
  setSelectingItemId: (id: string | null) => void;
  contractNumber?: string | null;
}

// QuoteItemsList
const QuoteItemsList = ({ quoteItems, editingItemId, ...rest }: QuoteItemsListProps) => {
  const { items, loading } = useSovPickerItems("");
  return (
    <>
      {quoteItems.map((item, ix) => (
        <QuoteItemRow
          key={item.id ?? `quote-item-${ix}`}
          item={item}
          isEditing={editingItemId === item.id}
          products={items}
          loading={loading}
          {...rest}
        />
      ))}
    </>
  );
};


export default QuoteItemsList;
