"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useEstimate } from "@/contexts/EstimateContext";
import { safeNumber } from "@/lib/safe-number";
import { EquipmentRentalItem } from "@/types/IEquipmentRentalItem";

// Define rental items mapping (matching database names to our internal names)
const rentalItemList = [
  { name: "TMA", label: "TMA", dbName: "TMA" },
  { name: "Arrow Board", label: "Arrow Board", dbName: "A.BOARD" },
  { name: "Message Board", label: "Message Board", dbName: "M.BOARD" },
  { name: "Speed Trailer", label: "Speed Trailer", dbName: "S.TRAILER" },
  { name: "Custom", label: "Custom Item", dbName: "CUSTOM" }
];

const EquipmentRentalTab = () => {
  const { equipmentRental, dispatch } = useEstimate();

  // Handle input changes
  const handleInputChange = (
    index: number,
    field: string,
    value: string | number | boolean
  ) => {
    dispatch({
      type: 'UPDATE_RENTAL_ITEM',
      payload: {
        index,
        key: field as keyof EquipmentRentalItem,
        value,
      },
    });
  };

  // Add a new rental item
  const handleAddItem = () => {
    const newItem = {
      name: '',
      quantity: 0,
      months: 0,
      rentPrice: 0,
      reRentPrice: 0,
      reRentForCurrentJob: false,
      totalCost: 0,
      usefulLifeYrs: 0,
    };

    dispatch({
      type: 'ADD_RENTAL_ITEM',
      payload: newItem,
    });
  };

  // Delete rental item
  const handleRemoveItem = (index: number) => {
    dispatch({
      type: 'DELETE_RENTAL_ITEM',
      payload: { index },
    });
  };

  // Determine if an item is custom (not one of the standard items)
  const isCustomItem = (name: string) => {
    return !rentalItemList.slice(0, 4).some(item => item.name === name);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-base text-left font-semibold mb-4">
        Equipment Rental
      </h3>
      {/* Rental Items */}
      <div className="space-y-6">
        {equipmentRental && equipmentRental.map((item, index) => (
          <div key={`rental-item-${index}`} className="p-4 border rounded-md">
            <div className="space-y-4">
              {/* First Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`item-name-${index}`}>Item Name</Label>
                  <Select
                    value={item.name || ""}
                    onValueChange={(value) => {
                      handleInputChange(index, 'name', value);
                      
                      // Reset custom fields if switching from custom to standard
                      if (value !== "Custom" && isCustomItem(item.name)) {
                        handleInputChange(index, 'totalCost', 0);
                        handleInputChange(index, 'usefulLifeYrs', 0);
                      }
                    }}
                  >
                    <SelectTrigger id={`item-name-${index}`} className="w-full">
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      {rentalItemList.map((option) => (
                        <SelectItem key={option.name} value={option.name}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`re-rent-${index}`}>Re-Rent for Current Job</Label>
                    <Switch
                      id={`re-rent-${index}`}
                      checked={item.reRentForCurrentJob || false}
                      onCheckedChange={(checked) => handleInputChange(index, 'reRentForCurrentJob', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Second Row */}
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                  <Input
                    id={`quantity-${index}`}
                    type="number"
                    min={0}
                    value={item.quantity || ""}
                    onChange={(e) => handleInputChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`months-${index}`}>Months</Label>
                  <Input
                    id={`months-${index}`}
                    type="number"
                    min={0}
                    value={item.months || ""}
                    onChange={(e) => handleInputChange(index, 'months', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`rent-price-${index}`}>Rent Price ($)</Label>
                  <Input
                    id={`rent-price-${index}`}
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.rentPrice || ""}
                    onChange={(e) => handleInputChange(index, 'rentPrice', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`re-rent-price-${index}`}>Re-Rent Cost ($)</Label>
                  <Input
                    id={`re-rent-price-${index}`}
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.reRentPrice || ""}
                    onChange={(e) => handleInputChange(index, 'reRentPrice', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Custom Fields (only show for Custom items or if not re-renting) */}
              {(item.name === "Custom" || isCustomItem(item.name)) && !item.reRentForCurrentJob && (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor={`total-cost-${index}`}>Total Cost ($)</Label>
                    <Input
                      id={`total-cost-${index}`}
                      type="number"
                      min={0}
                      step={0.01}
                      value={safeNumber(item.totalCost) === 0 ? "" : item.totalCost}
                      onChange={(e) => handleInputChange(index, 'totalCost', parseFloat(e.target.value) || 0)}
                      disabled={item.reRentForCurrentJob}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`useful-life-${index}`}>Useful Life (Years)</Label>
                    <Input
                      id={`useful-life-${index}`}
                      type="number"
                      min={0}
                      value={safeNumber(item.usefulLifeYrs) === 0 ? "" : item.usefulLifeYrs}
                      onChange={(e) => handleInputChange(index, 'usefulLifeYrs', parseFloat(e.target.value) || 0)}
                      disabled={item.reRentForCurrentJob}
                    />
                  </div>
                </div>
              )}

              {/* Remove button */}
              <div className="flex justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveItem(index)}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Remove Item
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Separator className="my-4" />

      {/* Add New Item Button */}
      <Button
        onClick={handleAddItem}
        className="mt-4 mr-auto"
      >
        <Plus className="mr-2 h-4 w-4" /> Add Rental Item
      </Button>
    </div>
  );
};

export default EquipmentRentalTab;