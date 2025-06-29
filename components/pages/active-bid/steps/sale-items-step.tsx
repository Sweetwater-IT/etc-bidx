"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Trash2, Plus } from "lucide-react";
import { useEstimate } from "@/contexts/EstimateContext";
import { SaleItem } from "@/types/TSaleItem";
import EmptyContainer from "@/components/BidItems/empty-container";

const SaleItemsStep = () => {
  const { saleItems, dispatch } = useEstimate();
  const [isAddingItem, setIsAddingItem] = useState(saleItems.length === 0);
  const [newItemNumber, setNewItemNumber] = useState("");
  const [configuringItemNumber, setConfiguringItemNumber] = useState<string | null>(null);

  const calculateMargin = (quotePrice: number, markupPercentage: number) => {
    if (!quotePrice || !markupPercentage) return 0;
    const sellingPrice = quotePrice * (1 + markupPercentage / 100);
    return ((sellingPrice - quotePrice) / sellingPrice) * 100;
  };

  const handleItemNumberSubmit = () => {
    if (newItemNumber.trim()) {
      const newItem: SaleItem = {
        itemNumber: newItemNumber.trim(),
        name: "",
        vendor: "",
        quantity: 0,
        quotePrice: 0,
        markupPercentage: 0,
      };
      
      dispatch({
        type: 'ADD_SALE_ITEM',
        payload: newItem,
      });
      
      // Set the new item as configuring
      setConfiguringItemNumber(newItemNumber.trim());
      setNewItemNumber("");
      setIsAddingItem(false);
    }
  };

  const handleItemUpdate = (
    itemNumber: string,
    field: keyof SaleItem,
    value: any
  ) => {
    const item = saleItems.find(item => item.itemNumber === itemNumber);
    if (!item) return;
    
    const updatedItem = { ...item, [field]: value };
    
    // Calculate margin if quote price or markupPercentage changes
    if (field === "quotePrice" || field === "markupPercentage") {
      calculateMargin(
        field === "quotePrice" ? value : item.quotePrice,
        field === "markupPercentage" ? value : item.markupPercentage
      );
    }
    
    dispatch({
      type: 'UPDATE_SALE_ITEM',
      payload: {
        oldItemNumber: itemNumber,
        item: updatedItem,
      },
    });
  };

  const handleItemSave = (itemNumber: string) => {
    setConfiguringItemNumber(null);
    setIsAddingItem(true);
  };

  const handleItemDelete = (itemNumber: string) => {
    dispatch({
      type: 'DELETE_SALE_ITEM',
      payload: itemNumber,
    });
    
    setConfiguringItemNumber(null);
    
    if (saleItems.length === 1) {
      setIsAddingItem(true);
    }
  };

  const handleEditItem = (itemNumber: string) => {
    setConfiguringItemNumber(itemNumber);
    setIsAddingItem(false);
  };

  return (
    <div>
      <div className="relative">
      <h3 className="text-xl text-black font-semibold text-left pb-2 border-b mb-6">
        Sale Items
      </h3>
        {/* Sale Items List */}
        {saleItems.length === 0 && <EmptyContainer topText="No sale items added yet" subtext="When you add sale items, they will appear here." />}
        {saleItems.map((item) => {
          const isConfiguring = configuringItemNumber === item.itemNumber;
          return (
            <div
              key={item.itemNumber}
              className={cn(
                "rounded-lg border bg-card text-card-foreground shadow-sm mb-2 ",
                isConfiguring ? "p-5" : "p-4"
              )}
            >
              {isConfiguring ? (
                <div className="space-y-4">
                  {/* Item Number */}
                  <div className="w-full">
                    <Label className="text-base font-semibold mb-2.5 block">
                      Item Number
                    </Label>
                    <Input
                      value={item.itemNumber}
                      onChange={(e) =>
                        handleItemUpdate(item.itemNumber, "itemNumber", e.target.value)
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
                          handleItemUpdate(item.itemNumber, "name", e.target.value)
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
                          handleItemUpdate(item.itemNumber, "vendor", e.target.value)
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
                            item.itemNumber,
                            "quantity",
                            parseInt(e.target.value) || 0
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
                            item.itemNumber,
                            "quotePrice",
                            parseFloat(e.target.value) || 0
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
                        value={item.markupPercentage || ""}
                        onChange={(e) =>
                          handleItemUpdate(
                            item.itemNumber,
                            "markupPercentage",
                            parseFloat(e.target.value) || 0
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
                        {calculateMargin(item.quotePrice, item.markupPercentage).toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-start space-x-3 pt-6">
                    <Button
                      variant="outline"
                      onClick={() => handleItemDelete(item.itemNumber)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={() => handleItemSave(item.itemNumber)}>
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
                      onClick={() => handleEditItem(item.itemNumber)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleItemDelete(item.itemNumber)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

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