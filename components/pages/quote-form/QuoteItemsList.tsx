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
  createQuoteItem?: (item: any) => Promise<any>;
  updateQuoteItem?: (item: any) => Promise<any>;
}

const QuoteItemsList = ({
  quoteItems,
  editingItemId,
  createQuoteItem,
  updateQuoteItem,
  ...rest
}: QuoteItemsListProps) => {
  return (
    <>{quoteItems.map((item) => <QuoteItemRow 
      createQuoteItem={createQuoteItem}
      updateQuoteItem={updateQuoteItem}
      key={item.id} 
      item={item} 
      isEditing={editingItemId === item.id} {...rest} />)}</>
  );
};

export default QuoteItemsList;