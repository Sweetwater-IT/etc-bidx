"use client";

import { useCallback, useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";

import { useQuoteForm } from "@/app/quotes/create/QuoteFormProvider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { restorePointerEvents } from "@/lib/pointer-events-fix";
import { QuoteItem } from "@/types/IQuoteItem";
import { toast } from "sonner";

import { QuoteItemEditorDialog } from "./QuoteItemEditorDialog";
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
  const res = await fetch(`/api/quotes/quoteItems/${itemId}`, {
    method: "DELETE",
  });

  return res.json();
}

function createEmptyItem(quoteId: number | null): QuoteItem {
  return {
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
    quote_id: quoteId,
  };
}

function normalizeItemForSave(item: QuoteItem, quoteId: number | null): QuoteItem {
  return {
    ...item,
    itemNumber: item.itemNumber.trim(),
    description: item.description.trim(),
    uom: item.uom.trim(),
    notes: item.notes.trim(),
    quantity: Math.max(0, Number(item.quantity) || 0),
    unitPrice: Math.max(0, Number(item.unitPrice) || 0),
    discount: Math.max(0, Number(item.discount) || 0),
    tax: item.is_tax_percentage ? Math.max(0, Number(item.tax) || 0) : 0,
    quote_id: quoteId,
    associatedItems: item.associatedItems || [],
  };
}

function isPlaceholderItem(item: QuoteItem) {
  return (
    !item.id &&
    !item.itemNumber &&
    !item.description &&
    !item.uom &&
    !item.notes &&
    Number(item.quantity || 0) === 0 &&
    Number(item.unitPrice || 0) === 0 &&
    Number(item.discount || 0) === 0 &&
    Number(item.tax || 0) === 0 &&
    (!item.associatedItems || item.associatedItems.length === 0)
  );
}

export function QuoteItems() {
  const { quoteItems, setQuoteItems, quoteId, quoteMetadata, setQuoteMetadata } = useQuoteForm();

  const [applyToAll, setApplyToAll] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorItem, setEditorItem] = useState<QuoteItem | null>(null);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [savingEditor, setSavingEditor] = useState(false);

  const visibleQuoteItems = useMemo(
    () => quoteItems.filter((item) => !isPlaceholderItem(item)),
    [quoteItems]
  );

  const calculateCompositeUnitPrice = useCallback((item: QuoteItem) => {
    if (!item.associatedItems || item.associatedItems.length === 0) {
      return item.unitPrice;
    }

    return item.associatedItems.reduce(
      (sum, associatedItem) => sum + associatedItem.quantity * associatedItem.unitPrice,
      0
    );
  }, []);

  const calculateExtendedPrice = useCallback(
    (item: QuoteItem) => {
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
    },
    [calculateCompositeUnitPrice]
  );

  const totalValueCalculation = useMemo(() => {
    return visibleQuoteItems
      .reduce((sum, item) => {
        const unitPrice = calculateCompositeUnitPrice(item);
        const basePrice = (item.quantity || 0) * unitPrice;
        const discountAmount =
          item.discountType === "dollar"
            ? item.discount
            : basePrice * (item.discount / 100);

        return sum + (basePrice - discountAmount);
      }, 0)
      .toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
  }, [calculateCompositeUnitPrice, visibleQuoteItems]);

  const openEditorForItem = useCallback(
    (item?: QuoteItem, product?: any) => {
      const baseItem = item ? { ...item } : createEmptyItem(quoteId);

      const nextItem: QuoteItem = product
        ? {
            ...baseItem,
            itemNumber: product.item_number || "",
            description: product.description || "",
            uom: product.uom || "",
            notes: product.notes || "",
          }
        : baseItem;

      setEditorItem(nextItem);
      setEditorOpen(true);
      restorePointerEvents();
    },
    [quoteId]
  );

  const handleSaveEditorItem = useCallback(async () => {
    if (!editorItem) {
      return;
    }

    const normalizedItem = normalizeItemForSave(editorItem, quoteId);

    setSavingEditor(true);
    setSavingItemId(editorItem.id ? String(editorItem.id) : "__new__");

    try {
      if (editorItem.id) {
        const result = await updateQuoteItem(normalizedItem);

        if (!result.success) {
          throw new Error(result.message || "Failed to update quote item");
        }

        setQuoteItems((currentItems) =>
          currentItems.map((currentItem) =>
            currentItem.id === editorItem.id ? result.item : currentItem
          )
        );
      } else {
        const result = await createQuoteItem(normalizedItem);

        if (!result.success) {
          throw new Error(result.message || "Failed to create quote item");
        }

        setQuoteItems((currentItems) => [
          ...currentItems.filter((currentItem) => !isPlaceholderItem(currentItem)),
          result.item,
        ]);
      }

      toast.success(editorItem.id ? "Quote item updated" : "Quote item added");
      setEditorOpen(false);
      setEditorItem(null);
      restorePointerEvents();
    } catch (error) {
      console.error("Failed to save quote item:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save quote item");
    } finally {
      setSavingEditor(false);
      setSavingItemId(null);
    }
  }, [editorItem, quoteId, setQuoteItems]);

  const handleRemoveItem = useCallback(async (itemId: string) => {
    setSavingItemId(itemId);

    try {
      const response = await deleteQuoteItem(itemId);

      if (!response.success) {
        throw new Error(response.message || "Failed to delete quote item");
      }

      setQuoteItems((currentItems) => currentItems.filter((item) => String(item.id) !== itemId));
      toast.success("Quote item removed");
      restorePointerEvents();
    } catch (error) {
      console.error("Failed to remove quote item:", error);
      toast.error(error instanceof Error ? error.message : "Failed to remove quote item");
    } finally {
      setSavingItemId(null);
    }
  }, [setQuoteItems]);

  const handleQuickQuantityUpdate = useCallback(async (item: QuoteItem, quantity: number) => {
    if (!item.id) {
      setEditorItem({
        ...item,
        quantity,
      });
      return;
    }

    const updatedItem = normalizeItemForSave(
      {
        ...item,
        quantity,
      },
      quoteId
    );

    setSavingItemId(String(item.id));

    try {
      const result = await updateQuoteItem(updatedItem);

      if (!result.success) {
        throw new Error(result.message || "Failed to update quantity");
      }

      setQuoteItems((currentItems) =>
        currentItems.map((currentItem) =>
          String(currentItem.id) === String(item.id) ? result.item : currentItem
        )
      );
      restorePointerEvents();
    } catch (error) {
      console.error("Failed to update item quantity:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update quantity");
    } finally {
      setSavingItemId(null);
    }
  }, [quoteId, setQuoteItems]);

  const handleApplyTaxToAll = useCallback(async (checked: boolean) => {
    const nextChecked = !!checked;
    setApplyToAll(nextChecked);

    const itemsToUpdate = visibleQuoteItems.filter((item) => item.id);
    if (itemsToUpdate.length === 0) {
      return;
    }

    setSavingItemId("__bulk__");

    try {
      const updatedItems = await Promise.all(
        itemsToUpdate.map(async (item) => {
          const updatedItem = {
            ...item,
            is_tax_percentage: nextChecked,
            tax: nextChecked ? Number(quoteMetadata?.tax_rate ?? 6) : 0,
          };

          const result = await updateQuoteItem(updatedItem);
          if (!result.success) {
            throw new Error(result.message || "Failed to update tax settings");
          }

          return result.item;
        })
      );

      const updatedById = new Map(updatedItems.map((item) => [String(item.id), item]));
      setQuoteItems((currentItems) =>
        currentItems.map((item) => updatedById.get(String(item.id)) || item)
      );
      toast.success("Tax settings updated");
      restorePointerEvents();
    } catch (error) {
      console.error("Failed to update tax settings:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update tax settings");
    } finally {
      setSavingItemId(null);
    }
  }, [quoteMetadata?.tax_rate, setQuoteItems, visibleQuoteItems]);

  return (
    <>
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b px-4 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Quote Items</h2>

            <div className="flex items-center gap-[50px]">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Standard Tax Rate:</span>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={quoteMetadata?.tax_rate ?? "6"}
                  onChange={(event) =>
                    setQuoteMetadata((prev) => ({
                      ...prev,
                      tax_rate: Number(event.target.value),
                    }))
                  }
                  className="h-9 w-16 text-sm"
                />
                <span className="text-sm font-medium">%</span>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  className="shadow-sm"
                  id="quote-apply-tax-to-all"
                  checked={applyToAll}
                  disabled={savingItemId === "__bulk__"}
                  onCheckedChange={handleApplyTaxToAll}
                />
                <p>Apply tax to all?</p>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div
            className="grid min-w-[980px] gap-2 border-b bg-muted/30 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            style={{ gridTemplateColumns: "1.7fr 2.4fr 0.8fr 0.6fr 1fr 1fr 0.6fr 1fr 40px" }}
          >
            <div>Item # / SKU</div>
            <div>Description</div>
            <div className="text-center">UOM</div>
            <div className="text-center">Qty</div>
            <div>Unit Price</div>
            <div>Discount</div>
            <div>Tax</div>
            <div>Ext Price</div>
          </div>

          {visibleQuoteItems.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No quote items yet. Add one to get started.
            </div>
          ) : (
            <QuoteItemsList
              quoteItems={visibleQuoteItems}
            savingItemId={savingItemId}
            onSelectProduct={openEditorForItem}
            onEditItem={(item) => openEditorForItem(item)}
            onRemoveItem={handleRemoveItem}
            onQuickQuantityUpdate={handleQuickQuantityUpdate}
            calculateExtendedPrice={calculateExtendedPrice}
          />
        )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t px-4 py-4">
          <Button onClick={() => openEditorForItem()} disabled={savingEditor || savingItemId === "__bulk__"}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Item
          </Button>

          <div className="text-right text-sm">
            <div>Total Items: {visibleQuoteItems.length}</div>
            <div className="font-medium">Total Value: ${totalValueCalculation}</div>
          </div>
        </div>
      </div>

      <QuoteItemEditorDialog
        open={editorOpen}
        item={editorItem}
        saving={savingEditor}
        uomOptions={Object.values(UOM_TYPES)}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) {
            setEditorItem(null);
            restorePointerEvents();
          }
        }}
        onItemChange={(nextItem) => setEditorItem(nextItem)}
        onSave={handleSaveEditorItem}
      />

      {savingItemId === "__bulk__" ? (
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Updating tax settings...
        </div>
      ) : null}
    </>
  );
}
