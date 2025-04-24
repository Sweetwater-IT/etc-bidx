"use client";

import { FormData } from "@/app/active-bid/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Trash2, Plus } from "lucide-react";

interface SaleItemData {
  id: string;
  itemNumber: string;
  name: string;
  vendor: string;
  quantity: number;
  quotePrice: number;
  markup: number;
  margin: number;
  isConfiguring?: boolean;
}

const SaleItemsStep = ({
  currentStep,
  setCurrentStep,
  formData,
  setFormData,
}: {
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}) => {
  const [saleItems, setSaleItems] = useState<SaleItemData[]>(
    Array.isArray(formData.saleItems)
      ? (formData.saleItems as SaleItemData[])
      : []
  );
  const [isAddingItem, setIsAddingItem] = useState(saleItems.length === 0);
  const [newItemNumber, setNewItemNumber] = useState("");

  const calculateMargin = (quotePrice: number, markup: number) => {
    if (!quotePrice || !markup) return 0;
    const sellingPrice = quotePrice * (1 + markup / 100);
    return ((sellingPrice - quotePrice) / sellingPrice) * 100;
  };

  const handleItemNumberSubmit = () => {
    if (newItemNumber.trim()) {
      const newItem: SaleItemData = {
        id: Math.random().toString(36).substr(2, 9),
        itemNumber: newItemNumber.trim(),
        name: "",
        vendor: "",
        quantity: 0,
        quotePrice: 0,
        markup: 0,
        margin: 0,
        isConfiguring: true,
      };
      setSaleItems([...saleItems, newItem]);
      setNewItemNumber("");
      setIsAddingItem(false);
    }
  };

  const handleItemUpdate = (
    id: string,
    field: keyof SaleItemData,
    value: any
  ) => {
    setSaleItems(
      saleItems.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === "quotePrice" || field === "markup") {
            updatedItem.margin = calculateMargin(
              field === "quotePrice" ? value : item.quotePrice,
              field === "markup" ? value : item.markup
            );
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const handleItemSave = (id: string) => {
    setSaleItems(
      saleItems.map((item) =>
        item.id === id ? { ...item, isConfiguring: false } : item
      )
    );
    setIsAddingItem(true);
    // Update form data
    setFormData((prev: any) => ({
      ...prev,
      saleItems: saleItems.map((item) => ({
        ...item,
        isConfiguring: undefined,
      })),
    }));
  };

  const handleItemDelete = (id: string) => {
    setSaleItems(saleItems.filter((item) => item.id !== id));
    // Update formData to remove the deleted item
    setFormData((prev: any) => ({
      ...prev,
      saleItems: prev.saleItems?.filter((item: SaleItemData) => item.id !== id) || []
    }));
    if (saleItems.length === 1) {
      setIsAddingItem(true);
    }
  };

  const handleEditItem = (id: string) => {
    setSaleItems(
      saleItems.map((item) =>
        item.id === id ? { ...item, isConfiguring: true } : item
      )
    );
    setIsAddingItem(false);
  };

  return (
    <div>
      <div className="relative">
        {/* Sale Items List */}
        {saleItems.map((item) => (
          <div
            key={item.id}
            className={cn(
              "rounded-lg border bg-card text-card-foreground shadow-sm mb-2 ",
              item.isConfiguring ? "p-5" : "p-4"
            )}
          >
            {item.isConfiguring ? (
              <div className="space-y-4">
                {/* Item Number */}
                <div className="w-full">
                  <Label className="text-base font-semibold mb-2.5 block">
                    Item Number
                  </Label>
                  <Input
                    value={item.itemNumber}
                    onChange={(e) =>
                      handleItemUpdate(item.id, "itemNumber", e.target.value)
                    }
                    className="w-[200px]"
                  />
                </div>

                {/* Other Fields in a single line */}
                <div className="flex flex-row gap-4 w-full">
                  <div className="flex-1">
                    <Label className="text-sm font-medium mb-2 block">
                      Name
                    </Label>
                    <Input
                      value={item.name}
                      onChange={(e) =>
                        handleItemUpdate(item.id, "name", e.target.value)
                      }
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-medium mb-2 block">
                      Vendor
                    </Label>
                    <Input
                      value={item.vendor}
                      onChange={(e) =>
                        handleItemUpdate(item.id, "vendor", e.target.value)
                      }
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-medium mb-2 block">
                      Quantity
                    </Label>
                    <Input
                      type="number"
                      value={item.quantity || ""}
                      onChange={(e) =>
                        handleItemUpdate(
                          item.id,
                          "quantity",
                          parseInt(e.target.value)
                        )
                      }
                      min={0}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-medium mb-2 block">
                      Quote Price ($)
                    </Label>
                    <Input
                      type="number"
                      value={item.quotePrice || ""}
                      onChange={(e) =>
                        handleItemUpdate(
                          item.id,
                          "quotePrice",
                          parseFloat(e.target.value)
                        )
                      }
                      min={0}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-medium mb-2 block">
                      Markup (%)
                    </Label>
                    <Input
                      type="number"
                      value={item.markup || ""}
                      onChange={(e) =>
                        handleItemUpdate(
                          item.id,
                          "markup",
                          parseFloat(e.target.value)
                        )
                      }
                      min={0}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-medium mb-2 block">
                      Margin (%)
                    </Label>
                    <div className="h-10 flex items-center text-muted-foreground">
                      {item.margin.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-6">
                  <Button
                    variant="outline"
                    onClick={() => handleItemDelete(item.id)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={() => handleItemSave(item.id)}>
                    Save Item
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="font-medium">{item.itemNumber}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.name} • {item.vendor} • Qty: {item.quantity}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditItem(item.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleItemDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add Sale Item Input or Button */}
        {isAddingItem && (
          <div className="w-full max-w-sm">
            <Label className="text-sm font-medium mb-2 block">
              Item Number
            </Label>
            <div className="flex gap-2">
              <Input
                value={newItemNumber}
                onChange={(e) => setNewItemNumber(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleItemNumberSubmit();
                  }
                }}
                placeholder="Enter item number"
              />
              <Button onClick={handleItemNumberSubmit}>Add</Button>
            </div>
          </div>
        )}

        {!isAddingItem && saleItems.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setIsAddingItem(true)}
            className="w-full mt-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Another Item
          </Button>
        )}
      </div>
    </div>
  );
};

export default SaleItemsStep;
