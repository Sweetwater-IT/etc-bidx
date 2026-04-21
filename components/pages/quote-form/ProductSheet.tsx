import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useEffect, useMemo, useState, Fragment } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuoteForm } from "@/app/(app-shell)/quotes/create/QuoteFormProvider";
import { QuoteItem } from "@/types/IQuoteItem";
import { restorePointerEvents } from "@/lib/pointer-events-fix";
import { QuantityInput } from "@/components/ui/quantity-input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSovPickerItems, type SovPickerItem, getSovPickerItemUomOptions } from "@/hooks/use-sov-picker-items";
import { Plus } from "lucide-react";
import { toast } from "sonner";

async function createQuoteItem(item: QuoteItem) {
  console.log('recibo', item);

  const res = await fetch("/api/quotes/quoteItems", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  return res.json();
}

function formatWorkTypeLabel(value: string) {
  if (value === "CUSTOM") return "Custom";
  if (value === "DELIVERY") return "Delivery";
  if (value === "SERVICE") return "Service";
  if (value === "RENTAL") return "Rental";
  if (value === "SALE") return "Sale";

  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

type CustomDraft = {
  itemNumber: string;
  description: string;
  workType: string;
  uom: string;
};

const EMPTY_CUSTOM_DRAFT: CustomDraft = {
  itemNumber: "",
  description: "",
  workType: "CUSTOM",
  uom: "EA",
};

const CUSTOM_UOM_OPTIONS = ["EA", "LS", "SF", "LF", "EA/WK", "EA/DAY", "HR"] as const;
const CUSTOM_WORK_TYPE_OPTIONS = [
  "DELIVERY",
  "SERVICE",
  "LANE CLOSURE",
  "FLAGGING",
  "MPT",
  "RENTAL",
  "SALE",
  "PERMANENT SIGN",
  "CUSTOM",
] as const;

export function ProductSheet({
  open,
  onOpenChange,
  initialStep = "configure",
  newProduct,
  setNewProduct,
  digits,
  setDigits,
  UOM_TYPES,
  formatDecimal,
  formatPercentage,
  handleNextDigits,
  editingSubItemId,
  handleItemUpdate,
  item,
  setProductInput,
  setEditingItemId,
  setEditingSubItemId,
  contractNumber = null,
  defaultSignPricePerSquareFoot = 0,
  defaultFacePricePerSquareFoot = 0,
}) {
  const { setQuoteItems, quoteId, quoteMetadata } = useQuoteForm()
  const [isSaving, setIsSaving] = useState(false)
  const [editorStep, setEditorStep] = useState<"pick" | "configure" | "custom">(initialStep === "pick" ? "pick" : "configure")
  const [selectorSearch, setSelectorSearch] = useState("")
  const [customDraft, setCustomDraft] = useState<CustomDraft>(EMPTY_CUSTOM_DRAFT)
  const [savingCustom, setSavingCustom] = useState(false)
  const [draftAvailableUoms, setDraftAvailableUoms] = useState<string[]>(
    Array.isArray(item?.availableUoms) && item.availableUoms.length > 0
      ? item.availableUoms
      : Object.values(UOM_TYPES)
  )
  const availableUoms = draftAvailableUoms.length > 0 ? draftAvailableUoms : Object.values(UOM_TYPES)
  const { groupedItems, items, loading, refresh } = useSovPickerItems(selectorSearch)
  const [signDimensions, setSignDimensions] = useState({ width: "", height: "" })
  const [signDescription, setSignDescription] = useState("")
  const [signRatePerSquareFoot, setSignRatePerSquareFoot] = useState(0)
  const [includeMatchingFace, setIncludeMatchingFace] = useState(true)
  const [faceDescription, setFaceDescription] = useState("")
  const [faceRatePerSquareFoot, setFaceRatePerSquareFoot] = useState(0)
  const [faceTaxable, setFaceTaxable] = useState(false)
  const duplicateCustomItem = useMemo(() => {
    const normalizedItemNumber = customDraft.itemNumber.trim().toUpperCase();
    if (!normalizedItemNumber) return null;

    return items.find(
      (pickerItem) => pickerItem.is_custom && pickerItem.item_number.trim().toUpperCase() === normalizedItemNumber
    ) || null;
  }, [customDraft.itemNumber, items]);

  const isSignItem = newProduct.itemNumber === "SIGN";
  const isFaceItem = newProduct.itemNumber === "FACE";
  const isSquareFootSignFlow = isSignItem || isFaceItem;

  const squareFeet = useMemo(() => {
    const width = Number(signDimensions.width);
    const height = Number(signDimensions.height);
    if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
      return 0;
    }
    return (width * height) / 144;
  }, [signDimensions.height, signDimensions.width]);

  const parsedSignMeta = useMemo(() => {
    const notes = String(item?.notes || "");
    const widthMatch = notes.match(/Width:\s*([\d.]+)\s*in/i);
    const heightMatch = notes.match(/Height:\s*([\d.]+)\s*in/i);
    const rateMatch = notes.match(/Rate:\s*\$([\d,.]+(?:\.\d+)?)\s*per sq ft/i);

    return {
      width: widthMatch?.[1] || "",
      height: heightMatch?.[1] || "",
      rate: rateMatch ? Number(rateMatch[1].replace(/,/g, "")) : null,
    };
  }, [item?.notes]);

  useEffect(() => {
    if (open) {
      return;
    }

    restorePointerEvents();

    const frameId = window.requestAnimationFrame(() => {
      restorePointerEvents();
    });

    const timeoutId = window.setTimeout(() => {
      restorePointerEvents();
    }, 0);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setEditorStep(initialStep === "pick" ? "pick" : "configure");
      setSelectorSearch("");
      setCustomDraft(EMPTY_CUSTOM_DRAFT);
      setDraftAvailableUoms(
        Array.isArray(item?.availableUoms) && item.availableUoms.length > 0
          ? item.availableUoms
          : Object.values(UOM_TYPES)
      );
      const defaultTax = quoteMetadata?.tax ?? 0;
      if (editingSubItemId) {
        const subItem = item.associatedItems?.find(
          (s) => s.id === editingSubItemId
        );

        if (subItem) {
          setNewProduct({
            itemNumber: subItem.itemNumber || "",
            description: subItem.description || "",
            uom: subItem.uom || "",
            quantity: subItem.quantity || 1,
            unitPrice: subItem.unitPrice || "",
            discountType: subItem.discountType || "dollar",
            discount: subItem.discount || "",
            notes: subItem.notes || "",
            tax: subItem.tax ?? defaultTax,
            is_tax_percentage: subItem.is_tax_percentage || false,

          });
          setDigits({
            unitPrice: subItem.unitPrice
              ? (subItem.unitPrice * 100).toString().padStart(3, "0")
              : "000",
            discount: subItem.discount
              ? (subItem.discount * 100).toString().padStart(3, "0")
              : "000",
          });
        } else {
          setNewProduct({
            itemNumber: "",
            description: "",
            uom: "",
            quantity: 1,
            unitPrice: "",
            discountType: "dollar",
            discount: "",
            notes: "",
            tax: "",
            is_tax_percentage: false,
          });
          setDigits({
            unitPrice: "000",
            discount: "000",
          });
        }
      } else {
        setNewProduct({
          itemNumber: item.itemNumber || "",
          description: item.description || "",
          uom: item.uom || "",
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || "",
          discountType: item.discountType || "dollar",
          discount: item.discount || "",
          notes: item.notes || "",
          tax: item.tax ?? defaultTax,
          is_tax_percentage: item.is_tax_percentage || false,
        });
        setDigits({
          unitPrice: item.unitPrice
            ? (item.unitPrice * 100).toString().padStart(3, "0")
            : "000",
          discount: item.discount
            ? (item.discount * 100).toString().padStart(3, "0")
            : "000",
        });
      }

      setSignDimensions({
        width: parsedSignMeta.width,
        height: parsedSignMeta.height,
      });
      setSignDescription(item.description || "");
      setSignRatePerSquareFoot(
        parsedSignMeta.rate ??
          (item.itemNumber === "FACE"
            ? Number(item.unitPrice || defaultFacePricePerSquareFoot || 0)
            : Number(item.unitPrice || defaultSignPricePerSquareFoot || 0))
      );
      setIncludeMatchingFace(item.itemNumber === "SIGN");
      setFaceDescription(item.description || "");
      setFaceRatePerSquareFoot(defaultFacePricePerSquareFoot || 0);
      setFaceTaxable(false);
    } else {
      setNewProduct({
        itemNumber: "",
        description: "",
        uom: "",
        quantity: 1,
        unitPrice: "",
        discountType: "dollar",
        discount: "",
        notes: "",
        tax: "",
        is_tax_percentage: false,
      });
      setDigits({
        unitPrice: "000",
        discount: "000",
      });
      setSignDimensions({ width: "", height: "" });
      setSignDescription("");
      setSignRatePerSquareFoot(0);
      setIncludeMatchingFace(true);
      setFaceDescription("");
      setFaceRatePerSquareFoot(0);
      setFaceTaxable(false);
    }
  }, [
    open,
    initialStep,
    editingSubItemId,
    UOM_TYPES,
    item.associatedItems,
    item.availableUoms,
    item.description,
    item.discount,
    item.discountType,
    item.itemNumber,
    item.is_tax_percentage,
    item.notes,
    item.quantity,
    item.tax,
    item.unitPrice,
    item.uom,
    quoteMetadata?.tax,
    setDigits,
    setNewProduct,
    parsedSignMeta.height,
    parsedSignMeta.rate,
    parsedSignMeta.width,
    defaultFacePricePerSquareFoot,
    defaultSignPricePerSquareFoot,
  ]);

  const closeSheet = () => {
    onOpenChange(false)
    restorePointerEvents()
    window.requestAnimationFrame(() => {
      restorePointerEvents()
    })
    window.setTimeout(() => {
      restorePointerEvents()
    }, 0)
  }

  const handleProductSelect = (product: SovPickerItem) => {
    const selectedItemNumber = product.display_item_number || product.item_number;
    setNewProduct((prev) => ({
      ...prev,
      itemNumber: selectedItemNumber,
      description: product.display_name || product.description,
      uom: getSovPickerItemUomOptions(product)[0] || product.uom || "",
      notes: product.notes || prev.notes || "",
    }))
    setDraftAvailableUoms(getSovPickerItemUomOptions(product))
    if (selectedItemNumber === "SIGN") {
      setSignRatePerSquareFoot(defaultSignPricePerSquareFoot);
      setIncludeMatchingFace(true);
      setFaceRatePerSquareFoot(defaultFacePricePerSquareFoot);
    }
    if (selectedItemNumber === "FACE") {
      setSignRatePerSquareFoot(defaultFacePricePerSquareFoot);
      setIncludeMatchingFace(false);
    }

    setEditorStep("configure")
  }

  const buildSquareFootNotes = (itemLabel: "SIGN" | "FACE", description: string, rate: number) => {
    return [
      `${itemLabel} priced from dimensions`,
      `Width: ${signDimensions.width} in`,
      `Height: ${signDimensions.height} in`,
      `Square feet: ${squareFeet.toFixed(2)}`,
      `Rate: $${Number(rate || 0).toFixed(2)} per sq ft`,
      description ? `Details: ${description}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  };

  const handleCustomSave = async () => {
    if (savingCustom) return;
    if (duplicateCustomItem) {
      toast.error(`Custom item ${customDraft.itemNumber.trim()} already exists.`);
      return;
    }

    setSavingCustom(true);
    try {
      const response = await fetch("/api/sov-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemNumber: customDraft.itemNumber.trim(),
          description: customDraft.description.trim(),
          workType: customDraft.workType.trim() || "CUSTOM",
          uom: customDraft.uom.trim() || "EA",
          contractNumber: contractNumber || "",
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to create custom SOV item");
      }

      await refresh();
      setCustomDraft(EMPTY_CUSTOM_DRAFT);
      handleProductSelect(result.item);
      setEditorStep("configure");
      toast.success(`Custom SOV item ${result.item.item_number} created`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create custom SOV item");
    } finally {
      setSavingCustom(false);
    }
  };

  const handleSaveProduct = async () => {
    if (isSaving) {
      return
    }

    setIsSaving(true)

    try {
      let needAddItem = true;

      if (editingSubItemId) {
        const subItemData = {
          id: editingSubItemId,
          itemNumber: newProduct.itemNumber,
          description: newProduct.description,
          uom: newProduct.uom,
          quantity: Number(newProduct.quantity),
          unitPrice: Number(newProduct.unitPrice),
          discountType: newProduct.discountType,
          discount: Number(newProduct.discount),
          notes: newProduct.notes,
          isCustom: true,
          tax: newProduct.tax,
          is_tax_percentage: newProduct.is_tax_percentage,
        };

        const updatedAssociatedItems = item.associatedItems?.some(
          (ai) => ai.id === editingSubItemId
        )
          ? item.associatedItems.map((ai) =>
            ai.id === editingSubItemId ? subItemData : ai
          )
          : [...(item.associatedItems || []), subItemData];

        await handleItemUpdate(item.id, "associatedItems", updatedAssociatedItems);
      } else {
        if (isSquareFootSignFlow) {
          const width = Number(signDimensions.width);
          const height = Number(signDimensions.height);

          if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
            toast.error("Enter width and height before saving.");
            return;
          }

          if (!Number.isFinite(Number(signRatePerSquareFoot)) || Number(signRatePerSquareFoot) <= 0) {
            toast.error("Enter a price per square foot before saving.");
            return;
          }

          if (isSignItem && includeMatchingFace && (!Number.isFinite(Number(faceRatePerSquareFoot)) || Number(faceRatePerSquareFoot) <= 0)) {
            toast.error("Enter a face price per square foot before saving the matching FACE item.");
            return;
          }

          const normalizedSquareFeet = Number(squareFeet.toFixed(2));
          const mainDescription = signDescription.trim() || newProduct.itemNumber;
          let savedMainItem: QuoteItem | null = null;
          const updatedItem = {
            ...item,
            itemNumber: newProduct.itemNumber,
            description: mainDescription,
            uom: "SF",
            quantity: normalizedSquareFeet,
            unitPrice: Number(Number(signRatePerSquareFoot).toFixed(2)),
            discountType: newProduct.discountType,
            discount: Number(newProduct.discount),
            tax: newProduct.tax ? Number(newProduct.tax) : 0,
            is_tax_percentage: newProduct.is_tax_percentage,
            isCustom: false,
            notes: buildSquareFootNotes(isSignItem ? "SIGN" : "FACE", mainDescription, Number(signRatePerSquareFoot)),
            availableUoms: ["SF"],
            quote_id: quoteId || null,
          };

          if ('created' in updatedItem) {
            delete updatedItem.created;
          }

          if (updatedItem?.id && !isNaN(parseInt(updatedItem.id))) {
            await handleItemUpdate(item.id, "fullItem", updatedItem);
            needAddItem = false;
            savedMainItem = updatedItem as QuoteItem;
          } else {
            const { success, item: createdItem } = await createQuoteItem(updatedItem);
            if (success && createdItem) {
              savedMainItem = createdItem;
              setQuoteItems((prev) => prev.map((entry) => (entry.id === updatedItem.id ? createdItem : entry)));
            }
          }

          if (isSignItem && includeMatchingFace) {
            const facePayload: QuoteItem = {
              itemNumber: "FACE",
              description: faceDescription.trim() || mainDescription,
              uom: "SF",
              quantity: normalizedSquareFeet,
              unitPrice: Number(Number(faceRatePerSquareFoot).toFixed(2)),
              discount: 0,
              discountType: "dollar",
              notes: buildSquareFootNotes("FACE", faceDescription.trim() || mainDescription, Number(faceRatePerSquareFoot)),
              associatedItems: [],
              isCustom: false,
              tax: faceTaxable ? (quoteMetadata?.tax_rate ?? 6) : 0,
              is_tax_percentage: faceTaxable,
              quote_id: quoteId || null,
            };

            const { success, item: createdFaceItem } = await createQuoteItem(facePayload);
            if (success && createdFaceItem) {
              setQuoteItems((prev) => {
                const withoutPlaceholder = prev.filter((entry) => entry.id !== updatedItem.id);
                const nextItems = savedMainItem
                  ? withoutPlaceholder.map((entry) => (entry.id === savedMainItem?.id ? savedMainItem : entry))
                  : withoutPlaceholder;
                return [...nextItems, createdFaceItem];
              });
            }
          }

          setProductInput?.(newProduct.itemNumber);
          setDigits({
            unitPrice: "000",
            discount: "000",
          });
          closeSheet();
          return;
        }

        const updatedItem = {
          ...item,
          itemNumber: newProduct.itemNumber,
          description: newProduct.description,
          uom: newProduct.uom,
          quantity: Number(newProduct.quantity),
          unitPrice: Number(newProduct.unitPrice),
          discountType: newProduct.discountType,
          discount: Number(newProduct.discount),
          tax: newProduct.tax ? Number(newProduct.tax) : 0,
          is_tax_percentage: newProduct.is_tax_percentage,
          isCustom: true,
          notes: newProduct.notes,
          availableUoms: draftAvailableUoms,
          quote_id: quoteId || null,
        };

        if ('created' in updatedItem) {
          delete updatedItem.created;
        }

        if (updatedItem?.id && !isNaN(parseInt(updatedItem.id))) {
          await handleItemUpdate(item.id, "fullItem", updatedItem);
          needAddItem = false;
        } else {
          const { success, item: createdItem } = await createQuoteItem(updatedItem);
          if (success) {
            setQuoteItems((prev) => prev.map((item) => {
              if (item.id === updatedItem.id) {
                return createdItem
              }
              return item
            }));
          }
        }

        setProductInput?.(newProduct.itemNumber);
      }

      setDigits({
        unitPrice: "000",
        discount: "000",
      });

      if (needAddItem) {
        const baseItem: QuoteItem = {
          itemNumber: "",
          description: "",
          uom: "",
          quantity: 0,
          unitPrice: 0,
          discountType: "dollar",
          discount: 0,
          notes: "",
          tax: 0,
          is_tax_percentage: false,
          associatedItems: [],
          quote_id: quoteId || null,
          created: false,
        };

        setNewProduct(baseItem);
        setQuoteItems((prev) => ([...prev, baseItem]))
      }

      closeSheet()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && closeSheet()}>
        <DialogContent className="flex h-[85vh] max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-[1100px]">
          <div className="shrink-0 px-6 pt-6">
            <DialogHeader>
              <DialogTitle className="text-sm">
                {editorStep === "pick"
                  ? "Choose SOV Item"
                  : editorStep === "custom"
                    ? "Add Custom Item"
                    : "Configure Quote Item"}
              </DialogTitle>
              <DialogDescription>
                {editorStep === "pick"
                  ? "Search the SOV master table and choose the line item you want to add."
                  : editorStep === "custom"
                    ? "Create a reusable custom SOV item without leaving this dialog."
                    : "Review the row values before saving them into the quote."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            {editorStep === "pick" && (
              <div className="space-y-3">
                <div className="max-h-[500px] overflow-auto rounded-md border">
                  <div className="sticky top-0 z-20 border-b bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                    <Input
                      placeholder="Search item #, display #, description, or category…"
                      value={selectorSearch}
                      onChange={(e) => setSelectorSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-[#FAFAFA]">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="sticky top-0 bg-[#FAFAFA] text-[11px] w-[150px]">Item #</TableHead>
                        <TableHead className="sticky top-0 bg-[#FAFAFA] text-[11px] w-[150px]">Display #</TableHead>
                        <TableHead className="sticky top-0 bg-[#FAFAFA] text-[11px]">Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow
                        className="cursor-pointer border-b border-border/40 transition-colors hover:bg-[#16335A]/6 data-[state=selected]:bg-[#16335A]/8"
                        onClick={() => setEditorStep("custom")}
                      >
                        <TableCell colSpan={3} className="py-2 text-[11px] font-semibold uppercase tracking-wide text-foreground/85">
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add Custom Item
                          </div>
                        </TableCell>
                      </TableRow>
                      {groupedItems.map((group) => (
                        <Fragment key={group.heading}>
                          <TableRow className="border-t border-[#16335A]/15 bg-[#16335A]/5 hover:bg-[#16335A]/5 data-[state=selected]:bg-[#16335A]/5">
                            <TableCell colSpan={3} className="py-2 text-[11px] font-semibold uppercase tracking-wide text-[#16335A]">
                              {formatWorkTypeLabel(group.heading)}
                            </TableCell>
                          </TableRow>
                          {group.items.map((pickerItem) => (
                            <TableRow
                              key={`${pickerItem.is_custom ? "custom" : "standard"}-${pickerItem.id}`}
                              className="cursor-pointer border-b border-border/40 transition-colors hover:bg-[#16335A]/6 data-[state=selected]:bg-[#16335A]/8"
                              onClick={() => handleProductSelect(pickerItem)}
                            >
                              <TableCell className="w-[150px] text-xs font-mono text-foreground/90">{pickerItem.item_number}</TableCell>
                              <TableCell className="w-[150px] text-xs font-mono text-foreground/80">{pickerItem.display_item_number || pickerItem.item_number}</TableCell>
                              <TableCell className="text-xs text-foreground/85">{pickerItem.display_name || pickerItem.description}</TableCell>
                            </TableRow>
                          ))}
                        </Fragment>
                      ))}
                      {!loading && groupedItems.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="py-6 text-center text-xs text-muted-foreground">
                            No matching items found.
                          </TableCell>
                        </TableRow>
                      )}
                      {loading && (
                        <TableRow>
                          <TableCell colSpan={3} className="py-6 text-center text-xs text-muted-foreground">
                            Loading…
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {editorStep === "configure" && (
              <div className="space-y-4 pb-2">
                {isSquareFootSignFlow ? (
                  <>
                    <div className="grid gap-3 rounded-md border bg-muted/30 p-3 md:grid-cols-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Item Number</p>
                        <p className="text-sm font-mono">{newProduct.itemNumber || "-"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">UOM</p>
                        <p className="text-sm">SF</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Square Feet</p>
                        <p className="text-sm">{squareFeet > 0 ? squareFeet.toFixed(2) : "-"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Tax</p>
                        <p className="text-sm">{newProduct.is_tax_percentage ? `${newProduct.tax || quoteMetadata?.tax_rate || 0}%` : "None"}</p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <Label className="text-[15px] font-medium text-muted-foreground">Width (inches)</Label>
                        <Input
                          className="bg-background"
                          inputMode="numeric"
                          placeholder="30"
                          value={signDimensions.width}
                          onChange={(e) =>
                            setSignDimensions((prev) => ({ ...prev, width: e.target.value.replace(/[^\d.]/g, "") }))
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-[15px] font-medium text-muted-foreground">Height (inches)</Label>
                        <Input
                          className="bg-background"
                          inputMode="numeric"
                          placeholder="30"
                          value={signDimensions.height}
                          onChange={(e) =>
                            setSignDimensions((prev) => ({ ...prev, height: e.target.value.replace(/[^\d.]/g, "") }))
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <Label className="text-[15px] font-medium text-muted-foreground">
                          {isSignItem ? "Sign description" : "Face description"}
                        </Label>
                        <Textarea
                          className="bg-background min-h-[100px]"
                          placeholder={isSignItem ? "Describe the sign" : "Describe the face"}
                          value={signDescription}
                          onChange={(e) => setSignDescription(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-[15px] font-medium text-muted-foreground">
                          {isSignItem ? "Sign" : "Face"} Price per Square Foot
                        </Label>
                        <div className="flex h-10 items-center rounded-md border bg-background transition-colors focus-within:border-[#16335A]/25 focus-within:bg-[#16335A]/5 focus-within:shadow-[0_0_0_1px_rgba(22,51,90,0.15)]">
                          <span className="border-r px-3 text-sm text-muted-foreground">$</span>
                          <CurrencyInput
                            value={Math.round(Number(signRatePerSquareFoot || 0) * 100).toString()}
                            onChange={(nextDigits) => setSignRatePerSquareFoot(parseInt(nextDigits || "0", 10) / 100)}
                            className="h-10 w-full cursor-text border-0 bg-transparent pr-3 text-right focus-visible:ring-0"
                          />
                        </div>
                      </div>
                      <div className="rounded-md border bg-background p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Calculated Line Total</p>
                        <p className="mt-1 text-lg font-semibold">
                          ${(squareFeet * Number(signRatePerSquareFoot || 0)).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {squareFeet > 0 ? `${squareFeet.toFixed(2)} SF x $${Number(signRatePerSquareFoot || 0).toFixed(2)}` : "Enter dimensions to calculate"}
                        </p>
                      </div>
                    </div>

                    {isSignItem && (
                      <div className="space-y-4 rounded-md border p-4">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            className="w-4 shadow-md"
                            checked={includeMatchingFace}
                            onCheckedChange={(checked) => setIncludeMatchingFace(checked === true)}
                          />
                          <span className="text-sm text-muted-foreground">Also create matching FACE item</span>
                        </div>

                        {includeMatchingFace && (
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="flex flex-col gap-1 md:col-span-2">
                              <div className="flex items-center justify-between gap-3">
                                <Label className="text-[15px] font-medium text-muted-foreground">Face description</Label>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setFaceDescription(signDescription)}
                                >
                                  Copy sign description
                                </Button>
                              </div>
                              <Textarea
                                className="bg-background min-h-[100px]"
                                placeholder="Describe the matching face"
                                value={faceDescription}
                                onChange={(e) => setFaceDescription(e.target.value)}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label className="text-[15px] font-medium text-muted-foreground">Face Price per Square Foot</Label>
                              <div className="flex h-10 items-center rounded-md border bg-background transition-colors focus-within:border-[#16335A]/25 focus-within:bg-[#16335A]/5 focus-within:shadow-[0_0_0_1px_rgba(22,51,90,0.15)]">
                                <span className="border-r px-3 text-sm text-muted-foreground">$</span>
                                <CurrencyInput
                                  value={Math.round(Number(faceRatePerSquareFoot || 0) * 100).toString()}
                                  onChange={(nextDigits) => setFaceRatePerSquareFoot(parseInt(nextDigits || "0", 10) / 100)}
                                  className="h-10 w-full cursor-text border-0 bg-transparent pr-3 text-right focus-visible:ring-0"
                                />
                              </div>
                            </div>
                            <div className="flex flex-col justify-end gap-3">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  className="w-4 shadow-md"
                                  checked={faceTaxable}
                                  onCheckedChange={(checked) => setFaceTaxable(checked === true)}
                                />
                                <span className="text-sm text-muted-foreground">Apply tax to FACE</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                FACE total: ${(squareFeet * Number(faceRatePerSquareFoot || 0)).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col gap-1">
                      <Label className="text-[15px] font-medium text-muted-foreground">Tax</Label>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          className="w-4 shadow-md"
                          checked={!!newProduct?.is_tax_percentage}
                          onCheckedChange={(checked) =>
                            setNewProduct((prev) => ({
                              ...prev,
                              is_tax_percentage: !!checked,
                              tax: checked ? prev.tax || quoteMetadata?.tax_rate || 0 : "",
                            }))
                          }
                        />
                        <span className="text-sm text-muted-foreground">
                          Apply tax to {isSignItem ? "SIGN" : "FACE"}?
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                <div className="grid gap-3 rounded-md border bg-muted/30 p-3 md:grid-cols-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Item Number</p>
                    <p className="text-sm font-mono">{newProduct.itemNumber || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">UOM</p>
                    <p className="text-sm">{newProduct.uom || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Tax</p>
                    <p className="text-sm">{newProduct.is_tax_percentage ? `${newProduct.tax || quoteMetadata?.tax_rate || 0}%` : "None"}</p>
                  </div>
                  <div className="md:col-span-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Description</p>
                    <p className="text-sm">{newProduct.description || "-"}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <Label className="text-[15px] font-medium text-muted-foreground">Item # / SKU</Label>
                    <Input
                      className="bg-background"
                      placeholder="Enter item number or SKU"
                      value={newProduct.itemNumber}
                      onChange={(e) =>
                        setNewProduct((prev) => ({
                          ...prev,
                          itemNumber: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-[15px] font-medium text-muted-foreground">Description</Label>
                    <Input
                      className="bg-background"
                      placeholder="Enter product description"
                      value={newProduct.description}
                      onChange={(e) =>
                        setNewProduct((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-[15px] font-medium text-muted-foreground">UOM</Label>
                    <Select
                      value={newProduct.uom}
                      onValueChange={(value) =>
                        setNewProduct((prev) => ({ ...prev, uom: value }))
                      }
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select UOM" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUoms.map((uom: any) => (
                          <SelectItem key={uom} value={uom}>
                            {uom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-[15px] font-medium text-muted-foreground">Quantity</Label>
                    <QuantityInput
                      value={Math.max(1, Number(newProduct.quantity) || 1)}
                      min={1}
                      onChange={(value) =>
                        setNewProduct((prev) => ({
                          ...prev,
                          quantity: value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-[15px] font-medium text-muted-foreground">Unit Price</Label>
                    <div className="flex h-10 items-center rounded-md border bg-background transition-colors focus-within:border-[#16335A]/25 focus-within:bg-[#16335A]/5 focus-within:shadow-[0_0_0_1px_rgba(22,51,90,0.15)]">
                      <span className="border-r px-3 text-sm text-muted-foreground">$</span>
                      <CurrencyInput
                        value={digits.unitPrice}
                        onChange={(nextDigits) => {
                          setDigits((prev) => ({ ...prev, unitPrice: nextDigits || "0" }));
                          setNewProduct((prev) => ({
                            ...prev,
                            unitPrice: parseInt(nextDigits || "0", 10) / 100,
                          }));
                        }}
                        className="h-10 w-full cursor-text border-0 bg-transparent pr-3 text-right focus-visible:ring-0"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-[15px] font-medium text-muted-foreground">Discount</Label>
                    <div className="flex items-center">
                      <Input
                        type="text"
                        className="bg-background rounded-r-none"
                        placeholder="0"
                        value={
                          digits.discount
                            ? newProduct.discountType === "dollar"
                              ? formatDecimal(digits.discount / 100)
                              : formatPercentage(digits.discount)
                            : ""
                        }
                        onChange={(e: any) => {
                          const ev = e.nativeEvent;
                          const { inputType } = ev;
                          const data = (ev.data || "").replace(/[$%\s,]/g, "");

                          const nextDigits = handleNextDigits(digits.discount, inputType, data);

                          setDigits((prev) => ({ ...prev, discount: nextDigits }));

                          if (newProduct.discountType === "dollar") {
                            setNewProduct((prev) => ({
                              ...prev,
                              discount: nextDigits / 100,
                            }));
                          } else {
                            setNewProduct((prev) => ({
                              ...prev,
                              discount: nextDigits,
                            }));
                          }
                        }}
                      />
                      <div className="w-[80px]">
                        <Select
                          value={newProduct.discountType}
                          onValueChange={(value) =>
                            setNewProduct((prev) => ({ ...prev, discountType: value }))
                          }
                        >
                          <SelectTrigger className="rounded-l-none w-[80px] border-l-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dollar">$</SelectItem>
                            <SelectItem value="percentage">%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <Label className="text-[15px] font-medium text-muted-foreground">Tax</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      className="w-4 shadow-md"
                      checked={!!newProduct?.is_tax_percentage}
                      onCheckedChange={(checked) =>
                        setNewProduct((prev) => ({
                          ...prev,
                          is_tax_percentage: !!checked,
                          tax: checked
                            ? prev.tax || quoteMetadata?.tax_rate || 0
                            : "",
                        }))
                      }
                    />
                    <span className="text-sm text-muted-foreground">Apply Tax?</span>
                  </div>
                  {newProduct.is_tax_percentage && (
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      className="bg-background"
                      placeholder="Enter tax %"
                      value={newProduct.tax ?? ''}
                      onChange={(e) =>
                        setNewProduct((prev) => ({
                          ...prev,
                          tax: e.target.value,
                        }))
                      }
                    />
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <Label className="text-[15px] font-medium text-muted-foreground">Notes</Label>
                  <Textarea
                    className="bg-background min-h-[100px]"
                    placeholder="Enter any additional notes"
                    value={newProduct.notes}
                    onChange={(e) =>
                      setNewProduct((prev) => ({ ...prev, notes: e.target.value }))
                    }
                  />
                </div>
                  </>
                )}
              </div>
            )}

            {editorStep === "custom" && (
              <div className="space-y-4 pb-2">
                <div className="space-y-2">
                  <Label htmlFor="custom-item-number">Item Number</Label>
                  <Input
                    id="custom-item-number"
                    value={customDraft.itemNumber}
                    onChange={(event) =>
                      setCustomDraft((prev) => ({ ...prev, itemNumber: event.target.value.toUpperCase() }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-item-description">Description</Label>
                  <Input
                    id="custom-item-description"
                    value={customDraft.description}
                    onChange={(event) =>
                      setCustomDraft((prev) => ({ ...prev, description: event.target.value }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="custom-item-work-type">Work Type</Label>
                    <Select
                      value={customDraft.workType}
                      onValueChange={(value) =>
                        setCustomDraft((prev) => ({ ...prev, workType: value }))
                      }
                    >
                      <SelectTrigger id="custom-item-work-type" className="bg-background">
                        <SelectValue placeholder="Select work type" />
                      </SelectTrigger>
                      <SelectContent>
                        {CUSTOM_WORK_TYPE_OPTIONS.map((workType) => (
                          <SelectItem key={workType} value={workType}>
                            {formatWorkTypeLabel(workType)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-item-uom">UOM</Label>
                    <Select
                      value={customDraft.uom}
                      onValueChange={(value) =>
                        setCustomDraft((prev) => ({ ...prev, uom: value }))
                      }
                    >
                      <SelectTrigger id="custom-item-uom" className="bg-background">
                        <SelectValue placeholder="Select UOM" />
                      </SelectTrigger>
                      <SelectContent>
                        {CUSTOM_UOM_OPTIONS.map((uom) => (
                          <SelectItem key={uom} value={uom}>
                            {uom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {duplicateCustomItem && (
                  <p className="text-sm text-destructive">
                    A custom item with this item number already exists.
                  </p>
                )}
                {!contractNumber && (
                  <p className="text-sm text-muted-foreground">
                    Select a project or estimate with a contract number before saving a shared custom SOV item.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex shrink-0 justify-end gap-3 border-t bg-background px-6 py-4">
            {(editorStep === "configure" || editorStep === "custom") && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditorStep("pick")}
                disabled={isSaving || savingCustom}
              >
                Back
              </Button>
            )}
            <Button type="button" variant="outline" onClick={closeSheet} disabled={isSaving || savingCustom}>
              Cancel
            </Button>
            {editorStep === "configure" && (
              <Button type="button" onClick={() => void handleSaveProduct()} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Product"}
              </Button>
            )}
            {editorStep === "custom" && (
              <Button
                type="button"
                onClick={() => void handleCustomSave()}
                disabled={
                  savingCustom ||
                  !customDraft.itemNumber.trim() ||
                  !customDraft.description.trim() ||
                  !contractNumber ||
                  Boolean(duplicateCustomItem)
                }
              >
                {savingCustom ? "Saving..." : "Save Custom Item"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
