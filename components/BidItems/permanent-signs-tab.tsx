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

const PERMANENT_SIGN_ITEMS: Record<string, PMSItemKeys> = {
    'Type B Post Mount': 'pmsTypeB',
    'Reset Type B': 'resetTypeB',
    'Remove Type B': 'removeTypeB',
    'Type F Post Mount': 'pmsTypeF',
    'Reset Type F': 'resetTypeF',
    'Remove Type F': 'removeTypeF'
}

const PermanentSignsSummaryStep = () => {
  const { permanentSigns, dispatch } = useEstimate();
  const [isAddingSign, setIsAddingSign] = useState(false);
  const [selectedType, setSelectedType] = useState<PMSItemKeys>();
  const [configuringKey, setConfiguringKey] = useState<PMSItemKeys | null>(null);

  // Get existing permanent sign items
  const existingItems: { key: PMSItemKeys; data: PMSTypeB | PMSTypeF | PMSResetB | PMSResetF | PMSRemoveB | PMSRemoveF }[] = !!permanentSigns ? Object.entries(permanentSigns)
  .filter((entry): entry is [PMSItemKeys, PMSTypeB | PMSTypeF | PMSResetB | PMSResetF | PMSRemoveB | PMSRemoveF] => {
    const [key, value] = entry;
    return (['pmsTypeB', 'pmsTypeF', 'resetTypeB', 'resetTypeF', 'removeTypeB', 'removeTypeF'] as const).includes(key as PMSItemKeys) && 
           value !== undefined && 
           typeof value !== 'number' && 
           typeof value !== 'boolean';
  })
  .map(([key, value]) => ({ key: key as PMSItemKeys, data: value })) : [];

  // Check if we should show add button initially
  useEffect(() => {
    if (existingItems.length === 0) {
      setIsAddingSign(true);
    }
  }, []);

  const getDisplayName = (key: PMSItemKeys): string => {
    return Object.entries(PERMANENT_SIGN_ITEMS).find(([_, value]) => value === key)?.[0] || key;
  };

  const handleItemSubmit = () => {
    if (selectedType) {
      dispatch({
        type: 'ADD_PERMANENT_SIGNS_ITEM',
        payload: {
          key: selectedType,
        },
      });

      // Set the new item as configuring
      setConfiguringKey(selectedType);
      setSelectedType(undefined);
      setIsAddingSign(false);
    }
  };

  const handleItemSave = () => {
    setConfiguringKey(null);
    setIsAddingSign(true);
  };

  const handleItemDelete = (key: PMSItemKeys) => {
    // You'll need to add a DELETE_PERMANENT_SIGNS_ITEM action to your reducer
    dispatch({
      type: 'DELETE_PERMANENT_SIGNS_ITEM',
      payload: { key },
    });

    setConfiguringKey(null);

    if (existingItems.length === 1) {
      setIsAddingSign(true);
    }
  };

  const handleEditItem = (key: PMSItemKeys) => {
    setConfiguringKey(key);
    setIsAddingSign(false);
  };

  const handleFieldUpdate = (key: PMSItemKeys, field: string, value: any) => {
    dispatch({
      type: 'UPDATE_PERMANENT_SIGNS_ITEM',
      payload: {
        key,
        field,
        value,
      },
    });
  };

  const renderItemConfiguration = (key: PMSItemKeys, data: PMSTypeB | PMSTypeF | PMSResetB | PMSResetF | PMSRemoveB | PMSRemoveF) => {
    const renderFields = () => {
      switch (key) {
        case 'pmsTypeB':
          return (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block"># of Installs</Label>
                <Input
                  type="number"
                  value={data?.numberInstalls || ""}
                  onChange={(e) => handleFieldUpdate(key, 'numberInstalls', parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-full"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Sign Sq. Ft.</Label>
                <Input
                  type="number"
                  value={(data as PMSTypeB).signSqFt || ""}
                  onChange={(e) => handleFieldUpdate(key, 'signSqFt', parseFloat(e.target.value) || 0)}
                  min={0}
                  step="0.01"
                  className="w-full"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Perm. Sign Bolts</Label>
                <Input
                  type="number"
                  value={(data as PMSTypeB).permSignBolts || ""}
                  onChange={(e) => handleFieldUpdate(key, 'permSignBolts', parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-full"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Anti-Theft Bolts</Label>
                <Input
                  type="number"
                  value={(data as PMSTypeB).antiTheftBolts || ""}
                  onChange={(e) => handleFieldUpdate(key, 'antiTheftBolts', parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-full"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Chevron Bracket</Label>
                <Input
                  type="number"
                  value={(data as PMSTypeB).chevronBracket || ""}
                  onChange={(e) => handleFieldUpdate(key, 'chevronBracket', parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-full"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Street Name Cross Bracket</Label>
                <Input
                  type="number"
                  value={(data as PMSTypeB).streetNameCrossBracket || ""}
                  onChange={(e) => handleFieldUpdate(key, 'streetNameCrossBracket', parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-full"
                />
              </div>
            </div>
          );

        case 'pmsTypeF':
          return (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block"># of Installs</Label>
                <Input
                  type="number"
                  value={data?.numberInstalls || ""}
                  onChange={(e) => handleFieldUpdate(key, 'numberInstalls', parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-full"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Perm. Sign Bolts</Label>
                <Input
                  type="number"
                  value={data?.permSignBolts || ""}
                  onChange={(e) => handleFieldUpdate(key, 'permSignBolts', parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-full"
                />
              </div>
            </div>
          );

        case 'resetTypeB':
          return (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block"># of Installs</Label>
                <Input
                  type="number"
                  value={data?.numberInstalls || ""}
                  onChange={(e) => handleFieldUpdate(key, 'numberInstalls', parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-full"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Perm. Sign Bolts</Label>
                <Input
                  type="number"
                  value={data?.permSignBolts || ""}
                  onChange={(e) => handleFieldUpdate(key, 'permSignBolts', parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-full"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Anti-Theft Bolts</Label>
                <Input
                  type="number"
                  value={(data as PMSResetB).antiTheftBolts || ""}
                  onChange={(e) => handleFieldUpdate(key, 'antiTheftBolts', parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-full"
                />
              </div>
            </div>
          );

        case 'resetTypeF':
        case 'removeTypeB':
        case 'removeTypeF':
          return (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block"># of Installs</Label>
                <Input
                  type="number"
                  value={data?.numberInstalls || ""}
                  onChange={(e) => handleFieldUpdate(key, 'numberInstalls', parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-full"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Perm. Sign Bolts</Label>
                <Input
                  type="number"
                  value={data?.permSignBolts || ""}
                  onChange={(e) => handleFieldUpdate(key, 'permSignBolts', parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-full"
                />
              </div>
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div className="space-y-4 mt-4">
        <div className="text-lg font-medium">{getDisplayName(key)}</div>
        
        {/* Name Input */}
        <div className="w-full max-w-xs">
          <Label className="text-sm font-medium mb-2 block">Item Name/Number</Label>
          <Input
            type="text"
            value={data?.name || ""}
            onChange={(e) => handleFieldUpdate(key, 'name', e.target.value)}
            className="w-full"
            placeholder="Enter item name or number"
          />
        </div>
        
        {renderFields()}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6">
          <Button
            variant="outline"
            onClick={() => handleItemDelete(key)}
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
        {existingItems.map(({ key, data }) => {
          const isConfiguring = configuringKey === key;
          return (
            <div
              key={`sign-${key}`}
              className={cn(
                "rounded-lg border bg-card text-card-foreground shadow-sm mb-2",
                isConfiguring ? "p-5" : "p-4"
              )}
            >
              {isConfiguring ? (
                renderItemConfiguration(key, data)
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="font-medium">{getDisplayName(key)}</div>
                    <div className="text-sm text-muted-foreground">
                      {data?.numberInstalls ? `Installs: ${data.numberInstalls}` : 'Not configured'}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditItem(key)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleItemDelete(key)}
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
                  {Object.entries(PERMANENT_SIGN_ITEMS)
                    .filter(([_, key]) => !existingItems.some(item => item.key === key))
                    .map(([displayName, key]) => (
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

        {!isAddingSign && existingItems.length > 0 && existingItems.length < 6 && (
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