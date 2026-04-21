"use client";

import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { useQuoteForm } from "@/app/(app-shell)/quotes/create/QuoteFormProvider";
import { AssociatedItem, QuoteItem } from "@/types/IQuoteItem";
import { useState } from "react";
import { generateUniqueId } from "@/components/pages/active-bid/signs/generate-stable-id";
import QuoteItemsList from "./QuoteItemsList";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { SignPricePerSquareFootEditorDialog } from "./SignPricePerSquareFootEditorDialog";
import { toast } from "sonner";

enum UOM_TYPES {
  EA = "EA",
  LS = "LS",
  SF = "SF",
  LF = "LF",
  EA_MO = "EA/MO",
  EA_DAY = "EA/DAY",
  HR = "HR",
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

function createEmptyQuoteRow(quoteId: number | null): QuoteItem {
  return {
    quote_id: quoteId,
    id: generateUniqueId(),
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
    created: false,
  };
}

function isPlaceholderRow(item: QuoteItem) {
  return !item.itemNumber && !item.description;
}

export function QuoteItems() {
  const { quoteItems, setQuoteItems, quoteId, quoteMetadata, setQuoteMetadata } = useQuoteForm();
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingSubItemId, setEditingSubItemId] = useState<string | null>(null);
  const [selectingItemId, setSelectingItemId] = useState<string | null>(null);
  const [applyToAll, setApplyToAll] = useState<boolean>(false);
  const [pricingEditorOpen, setPricingEditorOpen] = useState(false);
  const [signPricePerSquareFootAll, setSignPricePerSquareFootAll] = useState<number>(11.15);
  const [facePricePerSquareFootAll, setFacePricePerSquareFootAll] = useState<number>(0);

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
      .filter((item) => !isPlaceholderRow(item))
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

  const ensureTrailingEmptyRow = (items: QuoteItem[]) => {
    if (items.some(isPlaceholderRow)) {
      return items;
    }

    return [...items, createEmptyQuoteRow(quoteId)];
  };

  const handleAddNewItem = async () => {
    const newItem = createEmptyQuoteRow(quoteId);
    setQuoteItems((prevItems) => [...prevItems, newItem]);
    setSelectingItemId(String(newItem.id));
  };

  const handleItemUpdate = async (
    itemId: string | number,
    field: keyof QuoteItem | "fullItem",
    value: any
  ) => {
    let updatedItem: QuoteItem | undefined;

    const updatedItems = quoteItems.map((item) => {
      if (item.id === itemId) {
        const newItem = field === "fullItem" ? value : { ...item, [field]: value };
        updatedItem = newItem as QuoteItem;
        return newItem;
      }
      return item;
    });

    const normalizedItems = ensureTrailingEmptyRow(updatedItems);
    setQuoteItems(normalizedItems);

    const parsedId = Number(updatedItem?.id);
    if (
      updatedItem &&
      !isPlaceholderRow(updatedItem) &&
      !isNaN(parsedId) &&
      isFinite(parsedId)
    ) {
      await updateQuoteItem(updatedItem);
    }

    setEditingSubItemId(null);
  };



  const handleRemoveItem = async (itemId: string) => {
    const parsedId = Number(itemId);

    if (isNaN(parsedId)) {
      setQuoteItems((prevItems) =>
        ensureTrailingEmptyRow(prevItems.filter((item) => String(item.id) !== itemId))
      );
      return;
    }

    const response = await deleteQuoteItem(itemId);
    if (response.success) {
      setQuoteItems((prevItems) =>
        ensureTrailingEmptyRow(prevItems.filter((item) => String(item.id) !== itemId))
      );
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

  const applyPricePerSquareFootToItems = async ({ signPrice, facePrice }: { signPrice: number; facePrice: number }) => {
    const itemsToUpdate = quoteItems.filter((item) => {
      const normalizedItemNumber = String(item.itemNumber || "").toUpperCase();
      return normalizedItemNumber === "SIGN" || normalizedItemNumber === "FACE";
    });

    const updatedItems = itemsToUpdate.map((item) => {
      const normalizedItemNumber = String(item.itemNumber || "").toUpperCase();
      const nextUnitPrice = normalizedItemNumber === "SIGN" ? signPrice : facePrice;
      const notes = String(item.notes || "").replace(/Rate:\s*\$[\d,.]+(?:\.\d+)?\s*per sq ft/i, `Rate: $${nextUnitPrice.toFixed(2)} per sq ft`);
      return {
        ...item,
        unitPrice: nextUnitPrice,
        notes,
      };
    });

    await Promise.all(
      updatedItems
        .filter((item) => item.id && !Number.isNaN(Number(item.id)))
        .map((item) => updateQuoteItem(item))
    );

    setQuoteItems((prev) =>
      prev.map((item) => {
        const match = updatedItems.find((updated) => updated.id === item.id);
        return match ?? item;
      })
    );

    setSignPricePerSquareFootAll(signPrice);
    setFacePricePerSquareFootAll(facePrice);
    toast.success("Updated sign and face pricing defaults.");
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString("en-US", { style: "currency", currency: "USD" });

  // --- Render ---
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <SignPricePerSquareFootEditorDialog
        open={pricingEditorOpen}
        onOpenChange={setPricingEditorOpen}
        initialSignPrice={signPricePerSquareFootAll}
        initialFacePrice={facePricePerSquareFootAll}
        onSave={applyPricePerSquareFootToItems}
      />

      <div className="flex flex-col gap-4 border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Quote Items</h2>

          <div className="flex flex-wrap items-center justify-end gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Standard Tax Rate:</span>
              <Input
                type="number"
                min={1}
                max={100}
                value={quoteMetadata?.tax_rate ?? "6"}
                onChange={(e) =>
                  setQuoteMetadata((prev) => ({
                    ...prev,
                    tax_rate: Number(e.target.value),
                  }))
                }
                className="h-9 w-16 text-sm"
              />
              <span className="text-sm font-medium">%</span>
            </div>

            <div className="flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Sign:</span>{" "}
                <span className="font-medium">{formatCurrency(signPricePerSquareFootAll)}/sq ft</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Face:</span>{" "}
                <span className="font-medium">{formatCurrency(facePricePerSquareFootAll)}/sq ft</span>
              </div>
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setPricingEditorOpen(true)}>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </div>

            <div className="flex flex-row items-center gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  className="shadow-sm"
                  id="terms"
                  checked={applyToAll}
                  onCheckedChange={async (checked) => {
                    const isChecked = !!checked;
                    setApplyToAll(isChecked);

                    const updatedItems = await Promise.all(
                      quoteItems.map(async (item) => {
                        if (!item.id) return item;

                        const updatedItem = {
                          ...item,
                          is_tax_percentage: isChecked,
                          tax: isChecked ? (quoteMetadata?.tax_rate ?? 6) : 0,
                        };

                        await updateQuoteItem(updatedItem);
                        return updatedItem;
                      })
                    );

                    setQuoteItems(updatedItems);
                  }}
                />


                <p>Apply tax to all?</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div
          className="grid min-w-[980px] gap-2 border-b bg-muted/30 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          style={{ gridTemplateColumns: "1.5fr 2.5fr 0.8fr 0.5fr 1fr 1fr 0.4fr 1fr 40px" }}
        >
          <div>Item # / SKU</div>
          <div className="text-center">Description</div>
          <div className="text-center">UOM</div>
          <div className="text-center">Qty</div>
          <div>Unit Price</div>
          <div>Discount</div>
          <div className="text-start">Tax?</div>
          <div>Ext Price</div>
        </div>

        <QuoteItemsList
          quoteItems={quoteItems}
          editingItemId={editingItemId}
          editingSubItemId={editingSubItemId}
          setEditingItemId={setEditingItemId}
          setEditingSubItemId={setEditingSubItemId}
          selectingItemId={selectingItemId}
          setSelectingItemId={setSelectingItemId}
          handleItemUpdate={handleItemUpdate}
          handleRemoveItem={handleRemoveItem}
          handleAddCompositeItem={handleAddCompositeItem}
          handleCompositeItemUpdate={handleCompositeItemUpdate}
          handleDeleteComposite={handleDeleteComposite}
          UOM_TYPES={UOM_TYPES}
          calculateCompositeUnitPrice={calculateCompositeUnitPrice}
          calculateExtendedPrice={calculateExtendedPrice}
          contractNumber={quoteMetadata?.ecsm_contract_number ?? null}
          defaultSignPricePerSquareFoot={signPricePerSquareFootAll}
          defaultFacePricePerSquareFoot={facePricePerSquareFootAll}
        />
      </div>

      <div className="flex items-center justify-between gap-4 border-t px-4 py-4">
        <Button onClick={handleAddNewItem}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Item
        </Button>

        <div className="text-right text-sm">
          <div>Total Items: {quoteItems.filter((item) => !isPlaceholderRow(item)).length}</div>
          <div className="font-medium">Total Value: ${totalValueCalculation()}</div>
        </div>
      </div>
    </div>
  );
}
