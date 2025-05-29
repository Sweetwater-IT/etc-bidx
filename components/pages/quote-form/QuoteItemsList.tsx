import QuoteItemRow from "./QuoteItemRow";

export default function QuoteItemsList({
  quoteItems,
  editingItemId,
  editingSubItemId,
  setEditingItemId,
  setEditingSubItemId,
  handleItemUpdate,
  handleRemoveItem,
  handleAddCompositeItem,
  handleCompositeItemUpdate,
  handleDeleteComposite,
  UOM_TYPES,
  calculateCompositeUnitPrice,
  calculateExtendedPrice,
}) {
  return (
    <>
      {quoteItems.map((item) => (
        <QuoteItemRow
          key={item.id}
          item={item}
          isEditing={editingItemId === item.id}
          editingSubItemId={editingSubItemId}
          setEditingItemId={setEditingItemId}
          setEditingSubItemId={setEditingSubItemId}
          handleItemUpdate={handleItemUpdate}
          handleRemoveItem={handleRemoveItem}
          handleAddCompositeItem={handleAddCompositeItem}
          handleCompositeItemUpdate={handleCompositeItemUpdate}
          handleDeleteComposite={handleDeleteComposite}
          UOM_TYPES={UOM_TYPES}
          calculateCompositeUnitPrice={calculateCompositeUnitPrice}
          calculateExtendedPrice={calculateExtendedPrice}
        />
      ))}
    </>
  );
} 