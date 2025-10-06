"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useQuoteForm } from "@/app/quotes/create/QuoteFormProvider";
import { AssociatedItem, QuoteItem } from "@/types/IQuoteItem";
import { useState } from "react";
import { generateUniqueId } from "@/components/pages/active-bid/signs/generate-stable-id";
import QuoteItemsList from "./QuoteItemsList";

enum UOM_TYPES {
  EA = "EA",
  LS = "LS",
  SF = "SF",
  LF = "LF",
  EA_MO = "EA/MO",
  EA_DAY = "EA/DAY",
  HR = "HR",
}

// --- Endpoints ---
async function createQuoteItem(item: QuoteItem) {
  const res = await fetch("/api/quotes/quoteItems", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  return res.json();
}

async function updateQuoteItem(item: QuoteItem) {
  const normalizedItem = {
    ...item,
    unitPrice: Number(item.unitPrice) || 0,
    tax: Number(item.tax) || 0,
  };

  const res = await fetch(`/api/quotes/quoteItems/${item.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(normalizedItem),
  });

  return res.json();
}

async function deleteQuoteItem(itemId: string) {
  const res = await fetch(`/api/quotes/quoteItems/${itemId}`, { method: "DELETE" });
  return res.json();
}

export function QuoteItems() {
  const { quoteItems, setQuoteItems, quoteId } = useQuoteForm();
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingSubItemId, setEditingSubItemId] = useState<string | null>(null);

  // --- Price calculations ---
  const calculateCompositeUnitPrice = (item: QuoteItem) => {
    if (!item.associatedItems || item.associatedItems.length === 0) return item.unitPrice;
    return item.associatedItems.reduce(
      (acc, associatedItem) => acc + associatedItem.quantity * associatedItem.unitPrice,
      0
    );
  };

  const calculateExtendedPrice = (item: QuoteItem) => {
    const unitPrice = calculateCompositeUnitPrice(item);
    const basePrice = item.quantity * unitPrice;
    const discountAmount =
      item.discountType === "dollar"
        ? item.discount
        : basePrice * (item.discount / 100);
    return (basePrice - discountAmount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const totalValueCalculation = () => {
    return quoteItems
      .reduce((sum, item) => {
        const unitPrice = calculateCompositeUnitPrice(item);
        const basePrice = (item.quantity || 0) * unitPrice;
        const discountAmount =
          item.discountType === "dollar"
            ? item.discount
            : basePrice * (item.discount / 100);
        return sum + (basePrice - discountAmount);
      }, 0)
      .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleAddNewItem = async () => {
    const newId = generateUniqueId();
    const newItem: QuoteItem = {
      quote_id: quoteId,
      id: newId,
      itemNumber: "",
      description: "",
      uom: "",
      quantity: 0,
      unitPrice: 0,
      discount: 0,
      discountType: "dollar",
      notes: "",
      associatedItems: [],
      is_tax_percentage: false,
      tax: 0,
    };

    const response = await createQuoteItem(newItem);
    if (response.success) {
      setQuoteItems((prevItems) => [...prevItems, response.item]);
      setEditingItemId(response.item.id);
    }
  };  

  const handleItemUpdate = async (itemId: string, field: keyof QuoteItem | "fullItem", value: any) => {
    let updatedItem: QuoteItem | null = null;
    
    setQuoteItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          const newItem = field === "fullItem" ? value : { ...item, [field]: value };
          updatedItem = newItem; 
          return newItem;
        }
        return item;
      })
    );
    
    if (updatedItem) {
      await updateQuoteItem(updatedItem);
    }

    setEditingSubItemId(null);
  };


  const handleRemoveItem = async (itemId: string) => {
    const response = await deleteQuoteItem(itemId);
    if (response.success) {
      setQuoteItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    }
  };

  const handleAddCompositeItem = async (parentItem: QuoteItem) => {
    const newSubItem: AssociatedItem = {
      id: generateUniqueId(),
      itemNumber: "",
      description: "",
      uom: "",
      quantity: 0,
      unitPrice: 0,
      notes: '',
    };

    setQuoteItems((prevItems: any[]) =>
      prevItems.map((item) =>
        item.id === parentItem.id
          ? { ...item, associatedItems: [...(item.associatedItems || []), newSubItem] }
          : item
      )
    );

    const updatedParent = {
      ...parentItem,
      associatedItems: [...(parentItem.associatedItems || []), newSubItem],
    };

    await updateQuoteItem(updatedParent as any);
  };


  const handleCompositeItemUpdate = async (
    parentItemId: string,
    subItemId: string,
    field: keyof AssociatedItem,
    value: string | number
  ) => {
    setQuoteItems((prevItems) =>
      prevItems.map((item) =>
        item.id === parentItemId
          ? {
            ...item,
            associatedItems:
              item.associatedItems?.map((ai) =>
                ai.id === subItemId ? { ...ai, [field]: value } : ai
              ) || [],
          }
          : item
      )
    );

    const parentItem = quoteItems.find((i) => i.id === parentItemId);
    if (parentItem) await updateQuoteItem(parentItem);
  };

  const handleDeleteComposite = async (parentItemId: string, subItemId: string) => {
    setQuoteItems((prevItems) =>
      prevItems.map((item) =>
        item.id === parentItemId
          ? {
            ...item,
            associatedItems: item.associatedItems?.filter((ai) => ai.id !== subItemId) || [],
          }
          : item
      )
    );

    const parentItem = quoteItems.find((i) => i.id === parentItemId);
    if (parentItem) await updateQuoteItem({ ...parentItem, associatedItems: parentItem.associatedItems?.filter((ai) => ai.id !== subItemId) || [] });
  };

  // --- Render ---
  return (
    <div className="rounded-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Quote Items</h2>
        <Button onClick={handleAddNewItem}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Item
        </Button>
      </div>

      <div className="space-y-4">
        <div
          className="grid text-sm font-medium text-muted-foreground border-b pb-2 mb-1 gap-2"
          style={{ gridTemplateColumns: "2fr 2fr 1fr 2fr 1fr 1fr 2fr 40px" }}
        >
          <div className="uppercase">Item # / SKU</div>
          <div className="uppercase pl-2">Description</div>
          <div className="uppercase">UOM</div>
          <div className="uppercase">Qty</div>
          <div className="uppercase">Unit Price</div>
          <div className="uppercase">Discount</div>
          <div className="uppercase">Extended Price</div>
        </div>

        <QuoteItemsList
          quoteItems={quoteItems}
          editingItemId={editingItemId}
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
      </div>

      <div className="mt-6 flex justify-end space-y-1 text-sm">
        <div className="text-right">
          <div>Total Items: {quoteItems.length}</div>
          <div className="font-medium">Total Value: ${totalValueCalculation()}</div>
        </div>
      </div>
    </div>
  );
}
