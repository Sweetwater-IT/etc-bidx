"use client";

import { FormData } from "@/app/active-bid/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Trash2, Plus } from "lucide-react";
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

interface EquipmentData {
  id: string;
  itemName: string;
  qty: number;
  months: number;
  rentPrice: number;
  reRentCost: number;
  reRent: boolean;
  isConfiguring?: boolean;
}

const EquipmentSummaryStep = ({
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
  const [equipment, setEquipment] = useState<EquipmentData[]>(
    Array.isArray(formData.equipment) ? formData.equipment as EquipmentData[] : []
  );
  const [open, setOpen] = useState(false);
  const [isAddingEquipment, setIsAddingEquipment] = useState(equipment.length === 0);
  const [newItemName, setNewItemName] = useState("");

  const handleItemNameSubmit = () => {
    if (newItemName.trim()) {
      const newEquipment: EquipmentData = {
        id: Math.random().toString(36).substr(2, 9),
        itemName: newItemName.trim(),
        qty: 0,
        months: 0,
        rentPrice: 0,
        reRentCost: 0,
        reRent: false,
        isConfiguring: true,
      };
      setEquipment([...equipment, newEquipment]);
      setNewItemName("");
      setIsAddingEquipment(false);
    }
  };

  const handleEquipmentUpdate = (id: string, field: keyof EquipmentData, value: any) => {
    setEquipment(
      equipment.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleEquipmentSave = (id: string) => {
    setEquipment(
      equipment.map((item) =>
        item.id === id ? { ...item, isConfiguring: false } : item
      )
    );
    setIsAddingEquipment(true);
    // Update form data
    setFormData((prev: any) => ({
      ...prev,
      equipment: equipment.map((item) => ({ ...item, isConfiguring: undefined })),
    }));
  };

  const handleEquipmentDelete = (id: string) => {
    setEquipment(equipment.filter((item) => item.id !== id));
    // Update formData to remove the deleted equipment
    setFormData((prev: any) => ({
      ...prev,
      equipment: prev.equipment?.filter((item: EquipmentData) => item.id !== id) || []
    }));
    if (equipment.length === 1) {
      setIsAddingEquipment(true);
    }
  };

  const handleEditEquipment = (id: string) => {
    setEquipment(
      equipment.map((item) =>
        item.id === id ? { ...item, isConfiguring: true } : item
      )
    );
    setIsAddingEquipment(false);
  };

  return (
    <div>
      <div className="relative">
        {/* Equipment List */}
        {equipment.map((item) => (
          <div
            key={item.id}
            className={cn(
              "rounded-lg border bg-card text-card-foreground shadow-sm mb-2",
              item.isConfiguring ? "p-5" : "p-4"
            )}
          >
            {item.isConfiguring ? (
              <div className="space-y-4 mt-4">
                {/* Item Name */}
                <div className="w-full">
                  <Label className="text-base font-semibold mb-2.5 block">
                    Item Name
                  </Label>
                  <Input
                    value={item.itemName}
                    onChange={(e) =>
                      handleEquipmentUpdate(item.id, "itemName", e.target.value)
                    }
                    className="w-[200px]"
                  />
                </div>

                <div className="flex flex-row gap-4 w-full">
                  <div className="flex-1">
                    <Label className="text-sm font-medium mb-2 block">Qty</Label>
                    <Input
                      type="number"
                      value={item.qty || ""}
                      onChange={(e) =>
                        handleEquipmentUpdate(
                          item.id,
                          "qty",
                          parseInt(e.target.value)
                        )
                      }
                      min={0}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-medium mb-2 block">Months</Label>
                    <Input
                      type="number"
                      value={item.months || ""}
                      onChange={(e) =>
                        handleEquipmentUpdate(
                          item.id,
                          "months",
                          parseInt(e.target.value)
                        )
                      }
                      min={0}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-medium mb-2 block">Rent Price ($)</Label>
                    <Input
                      type="number"
                      value={item.rentPrice || ""}
                      onChange={(e) =>
                        handleEquipmentUpdate(
                          item.id,
                          "rentPrice",
                          parseFloat(e.target.value)
                        )
                      }
                      min={0}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-medium mb-2 block">Re-Rent Cost ($)</Label>
                    <Input
                      type="number"
                      value={item.reRentCost || ""}
                      onChange={(e) =>
                        handleEquipmentUpdate(
                          item.id,
                          "reRentCost",
                          parseFloat(e.target.value)
                        )
                      }
                      min={0}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-medium mb-2 block">Re-Rent</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`reRent-${item.id}`}
                        checked={item.reRent}
                        onCheckedChange={(checked) =>
                          handleEquipmentUpdate(item.id, "reRent", checked)
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-6">
                  <Button
                    variant="outline"
                    onClick={() => handleEquipmentDelete(item.id)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={() => handleEquipmentSave(item.id)}>
                    Save Equipment
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="font-medium">{item.itemName}</div>
                  <div className="text-sm text-muted-foreground">
                    Qty: {item.qty} • Months: {item.months} • Rent: ${item.rentPrice}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditEquipment(item.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEquipmentDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add Equipment Input or Button */}
        {isAddingEquipment && (
          <div className="w-full max-w-sm mt-4">
            <Label className="text-sm font-medium mb-2 block">
              Item Name
            </Label>
            <div className="flex gap-2">
              <Input
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleItemNameSubmit();
                  }
                }}
                placeholder="Enter item name"
              />
              <Button onClick={handleItemNameSubmit}>Add</Button>
            </div>
          </div>
        )}

        {!isAddingEquipment && equipment.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setIsAddingEquipment(true)}
            className="w-full mt-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Another Equipment
          </Button>
        )}
      </div>
    </div>
  );
};

export default EquipmentSummaryStep; 