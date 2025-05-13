"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Trash2, Plus } from "lucide-react";
import { useEstimate } from "@/contexts/EstimateContext";
import { EquipmentRentalItem } from "@/types/IEquipmentRentalItem";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

const EquipmentSummaryStep = () => {
  const { equipmentRental, dispatch } = useEstimate();
  const [isAddingEquipment, setIsAddingEquipment] = useState(equipmentRental.length === 0);
  const [selectedType, setSelectedType] = useState("");
  const [customName, setCustomName] = useState("");
  const [configuringIndex, setConfiguringIndex] = useState<number | null>(null);

  const handleItemNameSubmit = () => {
    const itemName = selectedType === "custom" ? customName : selectedType;
    
    if (itemName.trim()) {
      const newEquipment: EquipmentRentalItem = {
        name: itemName.trim(),
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
        payload: newEquipment,
      });
      
      // Set the new item as configuring
      setConfiguringIndex(equipmentRental.length);
      setSelectedType("");
      setCustomName("");
      setIsAddingEquipment(false);
    }
  };

  const handleEquipmentUpdate = (index: number, field: keyof EquipmentRentalItem, value: any) => {
    dispatch({
      type: 'UPDATE_RENTAL_ITEM',
      payload: {
        index,
        key: field,
        value,
      },
    });
  };

  const handleEquipmentSave = (index: number) => {
    setConfiguringIndex(null);
    setIsAddingEquipment(true);
  };

  const handleEquipmentDelete = (index: number) => {
    dispatch({
      type: 'DELETE_RENTAL_ITEM',
      payload: { index },
    });
    
    setConfiguringIndex(null);
    
    if (equipmentRental.length === 1) {
      setIsAddingEquipment(true);
    }
  };

  const handleEditEquipment = (index: number) => {
    setConfiguringIndex(index);
    setIsAddingEquipment(false);
  };

  return (
    <div>
      <div className="relative">
        {/* Equipment List */}
        {equipmentRental.map((item, index) => {
          const isConfiguring = configuringIndex === index;
          return (
            <div
              key={`equipment-${index}`}
              className={cn(
                "rounded-lg border bg-card text-card-foreground shadow-sm mb-2",
                isConfiguring ? "p-5" : "p-4"
              )}
            >
              {isConfiguring ? (
                <div className="space-y-4 mt-4">
                  {/* Item Name */}
                  <div className="w-full">
                    <Input
                      value={item.name}
                      onChange={(e) =>
                        handleEquipmentUpdate(index, "name", e.target.value)
                      }
                      className="w-[200px]"
                    />
                  </div>

                  <div className="flex flex-row gap-4 w-full">
                    <div className="flex-1">
                      <Label className="text-sm font-medium mb-2 block">Qty</Label>
                      <Input
                        type="number"
                        value={item.quantity || ""}
                        onChange={(e) =>
                          handleEquipmentUpdate(
                            index,
                            "quantity",
                            parseInt(e.target.value) || 0
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
                            index,
                            "months",
                            parseInt(e.target.value) || 0
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
                            index,
                            "rentPrice",
                            parseFloat(e.target.value) || 0
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
                        value={item.reRentPrice || ""}
                        onChange={(e) =>
                          handleEquipmentUpdate(
                            index,
                            "reRentPrice",
                            parseFloat(e.target.value) || 0
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
                          id={`reRent-${index}`}
                          checked={item.reRentForCurrentJob}
                          onCheckedChange={(checked) =>
                            handleEquipmentUpdate(index, "reRentForCurrentJob", checked)
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-6">
                    <Button
                      variant="outline"
                      onClick={() => handleEquipmentDelete(index)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={() => handleEquipmentSave(index)}>
                      Save Equipment
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Qty: {item.quantity} • Months: {item.months} • Rent: ${item.rentPrice}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditEquipment(index)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEquipmentDelete(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add Equipment Input or Button */}
        {isAddingEquipment && (
          <div className="w-full max-w-sm">
            <div className="flex gap-2 mb-2">
              <Select 
                value={selectedType} 
                onValueChange={(value) => {
                  setSelectedType(value);
                  if (value !== "custom") {
                    setCustomName("");
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose equipment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Truck Mounted Attenuator">Truck Mounted Attenuator</SelectItem>
                  <SelectItem value="Arrow Board">Arrow Board</SelectItem>
                  <SelectItem value="Message Board">Message Board</SelectItem>
                  <SelectItem value="Speed Trailer">Speed Trailer</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleItemNameSubmit}
                disabled={!selectedType || (selectedType === "custom" && !customName.trim())}
              >
                Add
              </Button>
            </div>
            
            {selectedType === "custom" && (
              <Input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && customName.trim()) {
                    handleItemNameSubmit();
                  }
                }}
                placeholder="Enter custom item name"
                className="mb-2"
              />
            )}
          </div>
        )}

        {!isAddingEquipment && equipmentRental.length > 0 && (
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