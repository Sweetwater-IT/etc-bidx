"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Pencil, Check } from "lucide-react";
import { useQuoteForm } from "@/app/quotes/create/QuoteFormProvider";
import { AssociatedItem, QuoteItem } from "@/types/IQuoteItem";
import { useState } from "react";
import { generateUniqueId } from "../active-bid/signs/generate-stable-id";

enum UOM_TYPES {
  EA = "EA",
  LS = "LS",
  SF = "SF",
  LF = "LF",
  EA_MO = "EA/MO",
  EA_DAY = "EA/DAY",
  HR = "HR",
}

export function QuoteItems() {
  const { quoteItems, setQuoteItems } = useQuoteForm();
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingSubItemId, setEditingSubItemId] = useState<string | null>(null);
  const [newQuoteItem, setNewQuoteItem] = useState<QuoteItem>({
    id: generateUniqueId(),
    itemNumber: "",
    description: "",
    uom: "",
    quantity: 0,
    unitPrice: 0,
    discount: 0,
    discountType: "percentage",
    notes: "",
    associatedItems: [],
  });

  // Calculate unit price for composite items (items with sub-items)
  const calculateCompositeUnitPrice = (item: QuoteItem) => {
    if (!item.associatedItems || item.associatedItems.length === 0) {
      return item.unitPrice;
    }

    return item.associatedItems.reduce(
      (acc, associatedItem) =>
        acc + associatedItem.quantity * associatedItem.unitPrice,
      0
    );
  };

  // Calculate extended price based on quantity, unit price, and discount
  const calculateExtendedPrice = (item: QuoteItem) => {
    const unitPrice = calculateCompositeUnitPrice(item);
    const basePrice = item.quantity * unitPrice;

    // If discount type is dollar, use the direct amount, otherwise calculate percentage
    const discountAmount =
      item.discountType === "dollar"
        ? item.discount
        : basePrice * (item.discount / 100);
    return (basePrice - discountAmount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Calculate total value
  const totalValueCalculation = () => {
    return quoteItems
      .reduce((sum, item) => {
        const unitPrice = calculateCompositeUnitPrice(item);
        const basePrice = (item.quantity || 0) * unitPrice;

        // If discount type is dollar, use the direct amount, otherwise calculate percentage
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
  };

  // Handle item updates
  const handleItemUpdate = (
    itemId: string,
    field: keyof QuoteItem,
    value: string | number
  ) => {
    setQuoteItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  // Handle adding custom item
  const handleAddCustomItem = () => {
    if (quoteItems.some((qi) => qi.itemNumber === newQuoteItem.itemNumber))
      return;
    if (newQuoteItem.itemNumber && newQuoteItem.description) {
      setQuoteItems((prevState) => [
        ...prevState,
        {
          ...newQuoteItem,
          isCustom: true,
        },
      ]);

      // Reset form
      setNewQuoteItem({
        id: generateUniqueId(),
        itemNumber: "",
        description: "",
        uom: "",
        quantity: 0,
        unitPrice: 0,
        discount: 0,
        discountType: "percentage",
        notes: "",
        associatedItems: [],
      });
      setShowCustomForm(false);
    }
  };

  // Handle removing item
  const handleRemoveItem = (itemId: string) => {
    setQuoteItems((prevItems) =>
      prevItems.filter((item) => item.id !== itemId)
    );
  };

  // Handle adding sub-item
  const handleAddCompositeItem = (parentItem: QuoteItem) => {
    const newId = generateUniqueId();
    setQuoteItems((prevItems) =>
      prevItems.map((item) =>
        item.id === parentItem.id
          ? {
              ...item,
              associatedItems: [
                ...(item.associatedItems || []),
                {
                  id: newId,
                  itemNumber: "",
                  description: "",
                  uom: "",
                  quantity: 0,
                  unitPrice: 0,
                  notes: "",
                },
              ],
            }
          : item
      )
    );
    setEditingSubItemId(newId);
  };

  // Handle sub-item updates
  const handleCompositeItemUpdate = (
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
  };

  // Handle removing sub-item
  const handleDeleteComposite = (parentItemId: string, subItemId: string) => {
    setQuoteItems((prevItems) =>
      prevItems.map((item) =>
        item.id === parentItemId
          ? {
              ...item,
              associatedItems:
                item.associatedItems?.filter((ai) => ai.id !== subItemId) || [],
            }
          : item
      )
    );
  };

  // Handle new item form changes
  const handleCustomItemChange = (
    field: keyof QuoteItem,
    value: string | number
  ) => {
    setNewQuoteItem((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="rounded-lg py-4 pb-12">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Quote Items</h2>
        <Button onClick={() => setShowCustomForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Item
        </Button>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        {/* Header */}
        <div className="grid grid-cols-9 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
          <div>Item # / SKU</div>
          <div>Description</div>
          <div>UOM</div>
          <div>Qty</div>
          <div>Unit Price</div>
          <div>Disc. Type</div>
          <div>Discount</div>
          <div>Extended Price</div>
          <div className="text-right">Actions</div>
        </div>

        {/* Items */}
        {quoteItems.map((item) => {
          const hasAssociatedItems =
            item.associatedItems && item.associatedItems.length > 0;
          const displayUnitPrice = hasAssociatedItems
            ? calculateCompositeUnitPrice(item)
            : item.unitPrice;
          const isEditing = editingItemId === item.id;

          return (
            <div
              key={item.id}
              className="rounded-lg border bg-card p-4 shadow-sm space-y-4"
            >
              {/* Main Item Row */}
              {isEditing ? (
                <div className="grid grid-cols-9 gap-2 items-center rounded-lg bg-card">
                  <div>
                    <Input
                      placeholder="Item Number"
                      value={item.itemNumber}
                      onChange={(e) =>
                        handleItemUpdate(item.id, "itemNumber", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) =>
                        handleItemUpdate(item.id, "description", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Select
                      value={item.uom}
                      onValueChange={(value) =>
                        handleItemUpdate(item.id, "uom", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select UOM" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(UOM_TYPES).map((uom) => (
                          <SelectItem key={uom} value={uom}>
                            {uom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity || ""}
                      onChange={(e) =>
                        handleItemUpdate(
                          item.id,
                          "quantity",
                          Number(e.target.value)
                        )
                      }
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Unit Price"
                      value={displayUnitPrice.toFixed(2)}
                      onChange={(e) =>
                        handleItemUpdate(
                          item.id,
                          "unitPrice",
                          Number(e.target.value)
                        )
                      }
                      disabled={hasAssociatedItems}
                      className={hasAssociatedItems ? "bg-muted" : ""}
                    />
                  </div>
                  <div>
                    <Select
                      value={item.discountType}
                      onValueChange={(value) =>
                        handleItemUpdate(item.id, "discountType", value)
                      }
                    >
                      <SelectTrigger className="shrink-[2]">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dollar">$</SelectItem>
                        <SelectItem value="percentage">%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Discount"
                      value={item.discount || ""}
                      onChange={(e) =>
                        handleItemUpdate(
                          item.id,
                          "discount",
                          Number(e.target.value)
                        )
                      }
                    />
                  </div>
                  <div>${calculateExtendedPrice(item)}</div>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingItemId(null)}
                      aria-label="Save"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-9 gap-2 items-center px-4">
                  <div className="truncate font-medium text-foreground">
                    {item.itemNumber}
                  </div>
                  <div className="truncate text-foreground">
                    {item.description}
                  </div>
                  <div className="text-foreground">{item.uom}</div>
                  <div className="text-foreground">{item.quantity}</div>
                  <div className="text-foreground">
                    {displayUnitPrice.toFixed(2)}
                  </div>
                  <div className="text-foreground">
                    {item.discountType === "percentage" ? "%" : "$"}
                  </div>
                  <div className="text-foreground">{item.discount}</div>
                  <div className="font-semibold">
                    ${calculateExtendedPrice(item)}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingItemId(item.id)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Sub Items */}
              {item.associatedItems && item.associatedItems.length > 0 && (
                <div>
                  <div className="text-md font-semibold mb-3 mt-6 text-muted-foreground">
                    Sub Items
                  </div>
                  <div className="grid grid-cols-7 gap-2 text-xs text-muted-foreground font-medium mb-1">
                    <div>Sub Item #</div>
                    <div>Description</div>
                    <div>UOM</div>
                    <div>Qty</div>
                    <div>Unit Price</div>
                    <div>Total</div>
                    <div className="text-right">Actions</div>
                  </div>
                  <div className="space-y-2">
                    {item.associatedItems.map((subItem) => {
                      const isEditingSub = editingSubItemId === subItem.id;
                      return (
                        <div
                          key={subItem.id}
                          className="grid grid-cols-7 gap-2 rounded border bg-muted/40 p-3 items-center shadow-sm"
                        >
                          {isEditingSub ? (
                            <>
                              <div>
                                <Input
                                  placeholder="Sub Item #"
                                  value={subItem.itemNumber}
                                  onChange={(e) =>
                                    handleCompositeItemUpdate(
                                      item.id,
                                      subItem.id,
                                      "itemNumber",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <Input
                                  placeholder="Description"
                                  value={subItem.description}
                                  onChange={(e) =>
                                    handleCompositeItemUpdate(
                                      item.id,
                                      subItem.id,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <Select
                                  value={subItem.uom}
                                  onValueChange={(value) =>
                                    handleCompositeItemUpdate(
                                      item.id,
                                      subItem.id,
                                      "uom",
                                      value
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="UOM" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.values(UOM_TYPES).map((uom) => (
                                      <SelectItem key={uom} value={uom}>
                                        {uom}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Input
                                  type="number"
                                  placeholder="Qty"
                                  value={subItem.quantity || ""}
                                  onChange={(e) =>
                                    handleCompositeItemUpdate(
                                      item.id,
                                      subItem.id,
                                      "quantity",
                                      Number(e.target.value)
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <Input
                                  type="number"
                                  placeholder="Unit Price"
                                  value={subItem.unitPrice || ""}
                                  onChange={(e) =>
                                    handleCompositeItemUpdate(
                                      item.id,
                                      subItem.id,
                                      "unitPrice",
                                      Number(e.target.value)
                                    )
                                  }
                                />
                              </div>
                              <div>
                                $
                                {(subItem.quantity * subItem.unitPrice).toFixed(
                                  2
                                )}
                              </div>
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingSubItemId(null)}
                                  aria-label="Save"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleDeleteComposite(item.id, subItem.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="truncate font-medium text-foreground">
                                {subItem.itemNumber}
                              </div>
                              <div className="truncate text-foreground">
                                {subItem.description}
                              </div>
                              <div className="text-foreground">
                                {subItem.uom}
                              </div>
                              <div className="text-foreground">
                                {subItem.quantity}
                              </div>
                              <div className="text-foreground">
                                {subItem.unitPrice}
                              </div>
                              <div className="font-semibold">
                                $
                                {(subItem.quantity * subItem.unitPrice).toFixed(
                                  2
                                )}
                              </div>
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setEditingSubItemId(subItem.id)
                                  }
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleDeleteComposite(item.id, subItem.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <div className="text-xs font-semibold mb-1 text-muted-foreground">
                  Notes
                </div>
                <Textarea
                  placeholder="Notes"
                  value={item.notes || ""}
                  onChange={(e) =>
                    handleItemUpdate(item.id, "notes", e.target.value)
                  }
                  className="min-h-[60px]"
                />
              </div>

              {/* Add Sub Item Button */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddCompositeItem(item)}
                  disabled={item.associatedItems?.some(
                    (ai) => !ai.itemNumber || ai.itemNumber === ""
                  )}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Sub Item
                </Button>
              </div>
            </div>
          );
        })}

        {/* Add Custom Item Form */}
        {showCustomForm && (
          <div className="grid grid-cols-9 gap-2 items-center">
            <div>
              <Input
                placeholder="Item Number"
                value={newQuoteItem.itemNumber}
                onChange={(e) =>
                  handleCustomItemChange("itemNumber", e.target.value)
                }
              />
            </div>
            <div>
              <Input
                placeholder="Description"
                value={newQuoteItem.description}
                onChange={(e) =>
                  handleCustomItemChange("description", e.target.value)
                }
              />
            </div>
            <div>
              <Select
                value={newQuoteItem.uom}
                onValueChange={(value) => handleCustomItemChange("uom", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select UOM" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(UOM_TYPES).map((uom) => (
                    <SelectItem key={uom} value={uom}>
                      {uom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Input
                type="number"
                placeholder="Qty"
                value={newQuoteItem.quantity || ""}
                onChange={(e) =>
                  handleCustomItemChange("quantity", Number(e.target.value))
                }
              />
            </div>
            <div>
              <Input
                type="number"
                placeholder="Unit Price"
                value={newQuoteItem.unitPrice || ""}
                onChange={(e) =>
                  handleCustomItemChange("unitPrice", Number(e.target.value))
                }
              />
            </div>
            <div>
              <Select
                value={newQuoteItem.discountType}
                onValueChange={(value) =>
                  handleCustomItemChange("discountType", value)
                }
              >
                <SelectTrigger className="max-w-18">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dollar">$</SelectItem>
                  <SelectItem value="percentage">%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Input
                type="number"
                placeholder="Discount"
                value={newQuoteItem.discount || ""}
                onChange={(e) =>
                  handleCustomItemChange("discount", Number(e.target.value))
                }
                className="grow"
              />
            </div>
            <div className="font-semibold text-muted-foreground text-center">
              —
            </div>
            <div className="flex items-center justify-end">
              <Button onClick={handleAddCustomItem}>Add</Button>
            </div>
          </div>
        )}
      </div>

      {/* Botão Add New Item full width */}
      {!showCustomForm && (
        <Button className="w-full mt-4" variant="outline" onClick={() => setShowCustomForm(true)}>
          + Add New Item
        </Button>
      )}

      {/* Totals */}
      <div className="mt-6 flex justify-end space-y-1 text-sm">
        <div className="text-right">
          <div>Total Items: {quoteItems.length}</div>
          <div className="font-medium">
            Total Value: ${totalValueCalculation()}
          </div>
        </div>
      </div>
    </div>
  );
}
