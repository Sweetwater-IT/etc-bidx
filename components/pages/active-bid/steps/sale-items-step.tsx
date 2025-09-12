"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Trash2, Plus, Check, ChevronsUpDown } from "lucide-react";
import { useEstimate } from "@/contexts/EstimateContext";
import { SaleItem } from "@/types/TSaleItem";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import EmptyContainer from "@/components/BidItems/empty-container";

const SaleItemsStep = () => {
  const { saleItems, dispatch } = useEstimate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItemNumber, setEditingItemNumber] = useState<string | null>(null);
  const [formData, setFormData] = useState<SaleItem | null>(null);
  const [availableItems, setAvailableItems] = useState<{ item_number: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);

  const calculateMargin = (quotePrice: number, markupPercentage: number) => {
    if (!quotePrice || !markupPercentage) return 0;
    const sellingPrice = quotePrice * (1 + markupPercentage / 100);
    return ((sellingPrice - quotePrice) / sellingPrice) * 100;
  };

  const handleAddItem = () => {
    setFormData({
      itemNumber: "",
      name: "",
      vendor: "",
      quantity: 0,
      quotePrice: 0,
      markupPercentage: 0,
    });
    setEditingItemNumber(null);
    setDrawerOpen(true);
    fetchItems(); 
  };

const handleEditItem = (itemNumber: string) => {
  const item = saleItems.find(item => item.itemNumber === itemNumber);
  if (item) {
    setFormData({ ...item });
    setEditingItemNumber(itemNumber);
    setDrawerOpen(true);
    fetchItems(); 
  }
};

const fetchItems = async () => {
  try {
    const res = await fetch("/api/bid-items/sale-items");
    const data = await res.json();
    if (data.items) setAvailableItems(data.items);
  } catch (error) {
    console.error("Error fetching sale items:", error);
  }
};


  const handleFormUpdate = (field: keyof SaleItem, value: any) => {
    if (formData) {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handleSave = () => {
    if (!formData || !formData.itemNumber.trim()) return;

    if (editingItemNumber) {
      // Update existing item
      dispatch({
        type: 'UPDATE_SALE_ITEM',
        payload: {
          oldItemNumber: editingItemNumber,
          item: formData,
        },
      });
    } else {
      // Add new item
      dispatch({
        type: 'ADD_SALE_ITEM',
        payload: formData,
      });
    }

    setDrawerOpen(false);
    setFormData(null);
    setEditingItemNumber(null);
  };

  const handleCancel = () => {
    setDrawerOpen(false);
    setFormData(null);
    setEditingItemNumber(null);
  };

  const handleItemDelete = (itemNumber: string) => {
    dispatch({
      type: 'DELETE_SALE_ITEM',
      payload: itemNumber,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between pb-2 border-b mb-6">
        <h3 className="text-xl text-black font-semibold">Sale Items</h3>
        <Button onClick={handleAddItem}>
          <Plus className="mr-2 h-4 w-4" />
          Add Sale Item
        </Button>
      </div>

      <div className="relative">
        {/* Sale Items List */}
        {saleItems.length === 0 && (
          <EmptyContainer
            topText="No sale items added yet"
            subtext="When you add sale items, they will appear here."
          />
        )}
        {saleItems.map((item) => (
          <div
            key={item.itemNumber}
            className="rounded-lg border bg-card text-card-foreground shadow-sm mb-2 p-4"
          >
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
          </div>
        ))}
      </div>

      {/* Drawer for adding/editing sale items */}
      <Drawer open={drawerOpen} direction="right" onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {editingItemNumber ? 'Edit Sale Item' : 'Add Sale Item'}
            </DrawerTitle>
            <DrawerDescription>
              {editingItemNumber
                ? 'Update the sale item details below.'
                : 'Configure the details for your new sale item.'}
            </DrawerDescription>
          </DrawerHeader>

          {formData && (
            <div className="px-4 space-y-4">
              {/* Item Number Dropdown */}
              <div className="w-full">
                <Label className="text-sm font-medium mb-2 block">Item Number</Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between overflow-hidden"
                    >
                      <span className="truncate">
                        {formData.itemNumber || "Select an item number"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-sm p-0">
                    <Command>
                      <CommandInput placeholder="Search item number..." />
                      <CommandList onWheel={(e) => e.stopPropagation()}>
                        <div className="max-h-[200px] overflow-y-auto">
                          <CommandEmpty>No items found.</CommandEmpty>
                          <CommandGroup>
                            {availableItems.map((item) => (
                              <CommandItem
                                key={item.item_number}
                                value={item.item_number}
                                onSelect={(value) => {
                                  const selected = availableItems.find(i => i.item_number === value);
                                  if (selected && formData) {
                                    setFormData({ ...formData, itemNumber: selected.item_number, name: selected.name });
                                  } else if (formData) {
                                    setFormData({ ...formData, itemNumber: "", name: "" });
                                  }
                                  setOpen(false);
                                }}
                                className="flex items-center"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.itemNumber === item.item_number ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {item.item_number}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </div>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Name Autocomplete */}
              <div className="w-full">
                <Label className="text-sm font-medium mb-2 block">Name</Label>
                <Input
                  value={formData.name || ""}
                  readOnly
                  className="w-full bg-gray-100"
                  placeholder="Name will auto-fill"
                />
              </div>

              {/* Other fields */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Vendor</Label>
                <Input
                  value={formData.vendor}
                  onChange={(e) => handleFormUpdate("vendor", e.target.value)}
                  className="w-full"
                  placeholder="Enter vendor name (optional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Quantity</Label>
                  <Input
                    type="number"
                    value={formData.quantity || ""}
                    onChange={(e) => handleFormUpdate("quantity", parseInt(e.target.value) || 0)}
                    min={0}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Quote Price ($)</Label>
                  <Input
                    type="number"
                    value={formData.quotePrice || ""}
                    onChange={(e) => handleFormUpdate("quotePrice", parseFloat(e.target.value) || 0)}
                    min={0}
                    step="0.01"
                    className="w-full"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Markup (%)</Label>
                  <Input
                    type="number"
                    value={formData.markupPercentage || ""}
                    onChange={(e) => handleFormUpdate("markupPercentage", parseFloat(e.target.value) || 0)}
                    min={0}
                    step="0.01"
                    className="w-full"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Margin (%)</Label>
                  <div className="h-10 flex items-center text-muted-foreground bg-gray-50 px-3 rounded-md border">
                    {calculateMargin(formData.quotePrice, formData.markupPercentage).toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          <DrawerFooter>
            <div className="flex justify-end space-x-3 w-full">
              <DrawerClose asChild>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </DrawerClose>
              <Button
                onClick={handleSave}
                disabled={!formData?.itemNumber.trim()}
              >
                {editingItemNumber ? 'Update Sale Item' : 'Save Sale Item'}
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );


};

export default SaleItemsStep;
