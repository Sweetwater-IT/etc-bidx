"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Trash2, Plus } from "lucide-react";
import { useEstimate } from "@/contexts/EstimateContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { PMSItemKeys } from "@/types/TEstimateAction";
import { PMSRemoveB, PMSRemoveF, PMSResetB, PMSResetF, PMSTypeB, PMSTypeF } from "@/types/TPermanentSigns";
import {v4 as uuidv4} from 'uuid';

const PERMANENT_SIGN_ITEMS: Record<string, PMSItemKeys> = {
    'Type B Post Mount': 'pmsTypeB',
    'Reset Type B': 'resetTypeB',
    'Remove Type B': 'removeTypeB',
    'Type F Post Mount': 'pmsTypeF',
    'Reset Type F': 'resetTypeF',
    'Remove Type F': 'removeTypeF'
}

// Helper function to determine the type based on properties
const determineItemType = (item: PMSTypeB | PMSTypeF | PMSResetB | PMSResetF | PMSRemoveB | PMSRemoveF): PMSItemKeys => {
  if ('signSqFt' in item && 'chevronBracket' in item && 'streetNameCrossBracket' in item) {
    return 'pmsTypeB';
  }
  if ('antiTheftBolts' in item && !('signSqFt' in item)) {
    return 'resetTypeB';
  }
  
  // For items with only basic properties (3-4 fields), check the name pattern
  const keys = Object.keys(item);
  if (keys.length <= 4) {
    if (item.name?.includes('0935')) return 'pmsTypeF';
    if (item.name?.includes('0945')) return 'resetTypeF';
    if (item.name?.includes('0971')) return 'removeTypeB';
    if (item.name?.includes('0975')) return 'removeTypeF';
  }
  
  // Fallback - shouldn't happen with proper data
  return 'pmsTypeF';
};

const PermanentSignsSummaryStep = () => {
  const { permanentSigns, dispatch } = useEstimate();
  const [isAddingSign, setIsAddingSign] = useState(false);
  const [selectedType, setSelectedType] = useState<PMSItemKeys>();
  const [configuringId, setConfiguringId] = useState<string | null>(null);

  // Check if we should show add button initially
  useEffect(() => {
    if (permanentSigns?.signItems.length === 0) {
      setIsAddingSign(true);
    }
  }, [permanentSigns?.signItems.length]);

  const getDisplayName = (key: PMSItemKeys): string => {
    return Object.entries(PERMANENT_SIGN_ITEMS).find(([_, value]) => value === key)?.[0] || key;
  };

  const handleItemSubmit = () => {
    if (selectedType) {
      const newId = uuidv4()
      dispatch({
        type: 'ADD_PERMANENT_SIGNS_ITEM',
        payload: {
          key: selectedType,
          id: newId
        },
      });

      // Set the new item as configuring
      setConfiguringId(newId);
      setSelectedType(undefined);
      setIsAddingSign(false);
    }
  };

  const handleItemSave = () => {
    setConfiguringId(null);
    setIsAddingSign(true);
  };

  const handleItemDelete = (pmsId: string) => {
    dispatch({
      type: 'DELETE_PERMANENT_SIGNS_ITEM',
      payload: { signId: pmsId },
    });

    setConfiguringId(null);

    if (permanentSigns?.signItems.length === 1) {
      setIsAddingSign(true);
    }
  };

  const handleEditItem = (signId: string) => {
    setConfiguringId(signId);
    setIsAddingSign(false);
  };

  const handleFieldUpdate = (signId: string, field: keyof PMSTypeB, value: any) => {
    dispatch({
      type: 'UPDATE_PERMANENT_SIGNS_ITEM',
      payload: {
        signId,
        field,
        value,
      },
    });
  };

  const renderItemConfiguration = (data: PMSTypeB | PMSTypeF | PMSResetB | PMSResetF | PMSRemoveB | PMSRemoveF) => {
    const itemType = determineItemType(data);
    
    const renderFields = () => {
      // Always render numberInstalls and permSignBolts (common to all types)
      const commonFields = (
        <>
          <div>
            <Label className="text-sm font-medium mb-2 block"># of Installs</Label>
            <Input
              type="number"
              value={data?.numberInstalls || ""}
              onChange={(e) => handleFieldUpdate(data.id, 'numberInstalls', parseInt(e.target.value) || 0)}
              min={0}
              className="w-full"
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">Perm. Sign Bolts</Label>
            <Input
              type="number"
              value={data?.permSignBolts || ""}
              onChange={(e) => handleFieldUpdate(data.id, 'permSignBolts', parseInt(e.target.value) || 0)}
              min={0}
              className="w-full"
            />
          </div>
        </>
      );

      // Check what additional fields this item has
      const hasSignSqFt = 'signSqFt' in data;
      const hasAntiTheftBolts = 'antiTheftBolts' in data;
      const hasChevronBracket = 'chevronBracket' in data;
      const hasStreetNameCrossBracket = 'streetNameCrossBracket' in data;

      const additionalFields = (
        <>
          {hasSignSqFt && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Sign Sq. Ft.</Label>
              <Input
                type="number"
                value={(data as PMSTypeB).signSqFt || ""}
                onChange={(e) => handleFieldUpdate(data.id, 'signSqFt', parseFloat(e.target.value) || 0)}
                min={0}
                step="0.01"
                className="w-full"
              />
            </div>
          )}
          {hasAntiTheftBolts && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Anti-Theft Bolts</Label>
              <Input
                type="number"
                value={(data as PMSTypeB | PMSResetB).antiTheftBolts || ""}
                onChange={(e) => handleFieldUpdate(data.id, 'antiTheftBolts', parseInt(e.target.value) || 0)}
                min={0}
                className="w-full"
              />
            </div>
          )}
          {hasChevronBracket && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Chevron Bracket</Label>
              <Input
                type="number"
                value={(data as PMSTypeB).chevronBracket || ""}
                onChange={(e) => handleFieldUpdate(data.id, 'chevronBracket', parseInt(e.target.value) || 0)}
                min={0}
                className="w-full"
              />
            </div>
          )}
          {hasStreetNameCrossBracket && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Street Name Cross Bracket</Label>
              <Input
                type="number"
                value={(data as PMSTypeB).streetNameCrossBracket || ""}
                onChange={(e) => handleFieldUpdate(data.id, 'streetNameCrossBracket', parseInt(e.target.value) || 0)}
                min={0}
                className="w-full"
              />
            </div>
          )}
        </>
      );

      // Determine grid columns based on number of fields
      const fieldCount = 2 + // common fields
        (hasSignSqFt ? 1 : 0) +
        (hasAntiTheftBolts ? 1 : 0) +
        (hasChevronBracket ? 1 : 0) +
        (hasStreetNameCrossBracket ? 1 : 0);

      const gridCols = fieldCount <= 2 ? 'grid-cols-2' : fieldCount === 3 ? 'grid-cols-3' : 'grid-cols-3';

      return (
        <div className={`grid ${gridCols} gap-4`}>
          {commonFields}
          {additionalFields}
        </div>
      );
    };

    return (
      <div className="space-y-4 mt-4">
        <div className="text-lg font-medium">{getDisplayName(itemType)}</div>
        
        {/* Name Input */}
        <div className="w-full max-w-xs">
          <Label className="text-sm font-medium mb-2 block">Item Name/Number</Label>
          <Input
            type="text"
            value={data?.name || ""}
            onChange={(e) => handleFieldUpdate(data.id, 'name', e.target.value)}
            className="w-full"
            placeholder="Enter item name or number"
          />
        </div>
        
        {renderFields()}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6">
          <Button
            variant="outline"
            onClick={() => handleItemDelete(data.id)}
          >
            Cancel
          </Button>
          <Button onClick={() => handleItemSave()}>
            Save Sign Item
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="relative">
        {/* Permanent Signs List */}
        {permanentSigns && permanentSigns.signItems.map(pmsItem => {
          const isConfiguring = configuringId === pmsItem.id;
          const itemType = determineItemType(pmsItem);
          
          return (
            <div
              key={`sign-${pmsItem.id}`}
              className={cn(
                "rounded-lg border bg-card text-card-foreground shadow-sm mb-2",
                isConfiguring ? "p-5" : "p-4"
              )}
            >
              {isConfiguring ? (
                renderItemConfiguration(pmsItem)
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="font-medium">{getDisplayName(itemType)}</div>
                    <div className="text-sm text-muted-foreground">
                      {pmsItem?.numberInstalls ? `Installs: ${pmsItem.numberInstalls}` : 'Not configured'}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditItem(pmsItem.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleItemDelete(pmsItem.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add Sign Item Selector */}
        {isAddingSign && (
          <div className="w-full max-w-sm">
            <div className="flex gap-2 mb-2">
              <Select
                value={selectedType}
                onValueChange={(value) => {
                  setSelectedType(value as PMSItemKeys);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose permanent sign item" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PERMANENT_SIGN_ITEMS).map(([displayName, key]) => (
                      <SelectItem key={key} value={key}>
                        {displayName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleItemSubmit}
                disabled={!selectedType}
              >
                Add
              </Button>
            </div>
          </div>
        )}

        {!isAddingSign && permanentSigns && permanentSigns?.signItems.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setIsAddingSign(true)}
            className="w-full mt-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Another Sign Item
          </Button>
        )}
      </div>
    </div>
  );
};

export default PermanentSignsSummaryStep;