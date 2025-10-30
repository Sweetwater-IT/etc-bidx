"use client";

import { FormData } from "@/types/IFormData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Trash2, Plus } from "lucide-react";
import { EquipmentRentalItem } from "@/types/IEquipmentRentalItem";

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
  const [equipment, setEquipment] = useState<EquipmentRentalItem[]>(formData.equipmentItems);
  const [open, setOpen] = useState(false);
  const [isAddingEquipment, setIsAddingEquipment] = useState(equipment.length === 0);
  const [newItemName, setNewItemName] = useState("");

  const handleItemNameSubmit = () => {
    if (newItemName.trim()) {
      const newEquipment: EquipmentRentalItem = {
        name: newItemName.trim(),
        item_number: '',
        item_description: '',
        quantity: 0,
        uom: 0,
        rentPrice: 0,
        reRentPrice: 0,
        reRentForCurrentJob: false,
        usefulLifeYrs: 0,
        totalCost: 0,
        notes: '',
        uom_type: ''
      };
      setEquipment([...equipment, newEquipment]);
      setNewItemName("");
      setIsAddingEquipment(false);
    }
  };

  const handleEquipmentUpdate = (name: string, field: keyof EquipmentRentalItem, value: any) => {
    setEquipment(
      equipment.map((item) =>
        item.name === name ? { ...item, [field]: value } : item
      )
    );
  };

  const handleEquipmentSave = (name: string) => {
    setEquipment(
      equipment.map((item) =>
        item.name === name ? { ...item, isConfiguring: false } : item
      )
    );
    setIsAddingEquipment(true);
    // Update form data
    setFormData((prev: any) => ({
      ...prev,
      equipment: equipment.map((item) => ({ ...item, isConfiguring: undefined })),
    }));
  };

  const handleEquipmentDelete = (name: string) => {
    setEquipment(equipment.filter((item) => item.name !== name));
    // Update formData to remove the deleted equipment
    setFormData((prev: any) => ({
      ...prev,
      equipment: prev.equipment?.filter((item: EquipmentRentalItem) => item.name !== name) || []
    }));
    if (equipment.length === 1) {
      setIsAddingEquipment(true);
    }
  };

  const handleEditEquipment = (name: string) => {
    setEquipment(
      equipment.map((item) =>
        item.name === name ? { ...item, isConfiguring: true } : item
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
            key={item.name}
            className={cn(
              "rounded-lg border bg-card text-card-foreground shadow-sm mb-2 p-4"
            )}
          >     
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Qty: {item.quantity} • Months: {item.uom} • Rent: ${item.rentPrice}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditEquipment(item.name)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEquipmentDelete(item.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            
          </div>
        ))}

        {/* 
        ment Input or Button */}
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