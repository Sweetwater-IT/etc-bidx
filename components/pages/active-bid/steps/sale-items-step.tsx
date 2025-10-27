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
import { DataTable } from "@/components/data-table";
import { Textarea } from "@/components/ui/textarea";

const SaleItemsStep = () => {
  const { saleItems, dispatch } = useEstimate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem_number, setEditingItem_number] = useState<string | null>(null);
  const [formData, setFormData] = useState<SaleItem | null>(null);
  const [availableItems, setAvailableItems] = useState<{ item_number: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);

  const calculateMargin = (quote_price: number, markup_percentage: number) => {
    if (!quote_price || !markup_percentage) return 0;
    const sellingPrice = quote_price * (1 + markup_percentage / 100);
    return ((sellingPrice - quote_price) / sellingPrice) * 100;
  };

  const calculateSellingPrice = (quote_price: number, markup_percentage: number) => {
    if (!quote_price) return 0;
    if (!markup_percentage) return quote_price;
    return quote_price * (1 + markup_percentage / 100);
  };

  const calculateTotal = (item: SaleItem) => {
    const sellingPrice = calculateSellingPrice(item.quote_price, item.markup_percentage);
    return item.quantity * sellingPrice;
  };

  const formatCurrency = (value: number | null | undefined): string => {
    return value ? `$${value.toFixed(2)}` : "$0.00";
  };

  const handleAddItem = () => {
    setFormData({
      item_number: "",
      item_description: "",
      name: "",
      vendor: "",
      quantity: 0,
      quote_price: 0,
      markup_percentage: 0,
      notes: "",
      gross_profit: 0,
      gross_profit_margin: 0,
      revenue: 0,
      totalCost: 0
    });
    setEditingItem_number(null);
    setDrawerOpen(true);
    fetchItems();
  };

  const handleEditItem = (item_number: string) => {
    const item = saleItems.find(item => item.item_number === item_number);
    if (item) {
      setFormData({ ...item });
      setEditingItem_number(item_number);
      setDrawerOpen(true);
      fetchItems();
    }
  };

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/bid-items/sale-items");
      const data = await res.json();
      if (data.items) {
        // Filter unique items by item_number
        const uniqueSaleItems = data.items.filter(
          (item: { item_number: string }, index: number, self: { item_number: string }[]) =>
            index === self.findIndex((t: { item_number: string }) => t.item_number === item.item_number)
        );
        setAvailableItems(uniqueSaleItems);
      }
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
    if (!formData || !formData.item_number.trim()) return;

    if (editingItem_number) {
      // Update existing item
      dispatch({
        type: 'UPDATE_SALE_ITEM',
        payload: {
          oldItemNumber: editingItem_number,
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
    setEditingItem_number(null);
  };

  const handleCancel = () => {
    setDrawerOpen(false);
    setFormData(null);
    setEditingItem_number(null);
  };

  const handleItemDelete = (item_number: string) => {
    dispatch({
      type: 'DELETE_SALE_ITEM',
      payload: item_number,
    });
  };

  const SALE_ITEMS_COLUMNS = [
    {
      key: 'item_number',
      title: 'Item Number',
    },
    {
      key: 'name',
      title: 'Item Display Name',
    },
    {
      key: 'quantity',
      title: 'Quantity',
    },
    {
      key: 'salePrice',
      title: 'Sale Price',
      render: (item: SaleItem) => formatCurrency(calculateSellingPrice(item.quote_price, item.markup_percentage)),
    },
    {
      key: 'grossMargin',
      title: 'Gross Margin',
      render: (item: SaleItem) => {
        const margin = calculateMargin(item.quote_price, item.markup_percentage);
        return `${margin.toFixed(2)}%`;
      }
    },
  ];

  const formattedSaleItems = saleItems.map(item => ({
    ...item,
    salePrice: formatCurrency(
      calculateSellingPrice(item.quote_price, item.markup_percentage)
    ),
    grossMargin: `${calculateMargin(item.quote_price, item.markup_percentage).toFixed(2)}%`,
  }));

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

        {saleItems.length === 0 ? (
          <EmptyContainer
            topText="No sale items added yet"
            subtext="When you add sale items, they will appear here."
          />
        ) : (
          <DataTable
            data={formattedSaleItems}
            columns={SALE_ITEMS_COLUMNS}
            onDelete={(item) => handleItemDelete(item.item_number)}
            onEdit={(item) => handleEditItem(item.item_number)}
            hideDropdown={true}
          />
        )}

      </div>

      {/* Drawer for adding/editing sale items */}
      <Drawer open={drawerOpen} direction="right" onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {editingItem_number ? 'Edit Sale Item' : 'Add Sale Item'}
            </DrawerTitle>
            <DrawerDescription>
              {editingItem_number
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
                        {formData.item_number
                          ? `${formData.item_number} - ${formData.name}`
                          : "Select sale item..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-sm p-0">
                    <Command>
                      <CommandInput placeholder="Search sale item..." />
                      <CommandList onWheel={(e) => e.stopPropagation()}>
                        <div className="max-h-[200px] overflow-y-auto">
                          <CommandEmpty>No items found.</CommandEmpty>
                          <CommandGroup>
                            {availableItems.map((item) => (
                              <CommandItem
                                key={item.item_number}
                                value={`${item.name} ${item.item_number}`}
                                onSelect={(value) => {
                                  const selected = availableItems.find(i => i.item_number.trim() === value.split(" ").pop());                                  
                                  if (selected && formData) {
                                    setFormData({ ...formData, item_number: selected.item_number, name: selected.name });
                                  } else if (formData) {
                                    setFormData({ ...formData, item_number: "", name: "" });
                                  }
                                  setOpen(false);
                                }}
                                className="flex items-center"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.item_number === item.item_number ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span>{item.name}</span>
                                  <span className="text-xs text-muted-foreground">{item.item_number}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </div>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Item Number and Description Display */}
              {formData.item_number && formData.name && (
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Item Number: </span>{formData.item_number}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Description: </span>{formData.item_description || formData.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Vendor: </span>{formData.vendor || "-"}
                  </p>
                </div>
              )}


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
                    value={formData.quote_price || ""}
                    onChange={(e) => handleFormUpdate("quote_price", parseFloat(e.target.value) || 0)}
                    min={0}
                    step="0.01"
                    className="w-full"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Markup (%)</Label>
                  <Input
                    type="number"
                    value={formData.markup_percentage || ""}
                    onChange={(e) => handleFormUpdate("markup_percentage", parseFloat(e.target.value) || 0)}
                    min={0}
                    step="0.01"
                    className="w-full"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Margin (%)</Label>
                  <div className="h-10 flex items-center text-muted-foreground bg-gray-50 px-3 rounded-md border">
                    {calculateMargin(formData.quote_price, formData.markup_percentage).toFixed(2)}%
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Per Unit Sale Price</Label>
                  <div className="h-10 flex items-center text-muted-foreground bg-gray-50 px-3 rounded-md border">
                    ${calculateSellingPrice(formData.quote_price, formData.markup_percentage).toFixed(2)}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Total Sale Price</Label>
                  <div className="h-10 flex items-center text-muted-foreground bg-gray-50 px-3 rounded-md border">
                    ${calculateTotal(formData).toFixed(2)}
                  </div>
                </div>

              </div>
              <div className="w-full">
                <Label className="text-sm font-medium mb-2 block">Notes</Label>
                <Textarea
                  value={formData.notes || ""}
                  onChange={(e) => handleFormUpdate("notes", e.target.value)}
                  placeholder="Add any notes related to this sale item..."
                  className="w-full h-24 p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
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
                disabled={!formData?.item_number?.trim()}
              >
                {editingItem_number ? 'Update Sale Item' : 'Save Sale Item'}
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );


};

export default SaleItemsStep;
