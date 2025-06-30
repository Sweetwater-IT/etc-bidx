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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { PMSItemKeys } from "@/types/TEstimateAction";
import { PMSRemoveB, PMSRemoveF, PMSResetB, PMSResetF, PMSTypeB, PMSTypeF } from "@/types/TPermanentSigns";
import { v4 as uuidv4 } from 'uuid';
import EmptyContainer from "./empty-container";

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
  const [selectedType, setSelectedType] = useState<PMSItemKeys>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PMSTypeB | PMSTypeF | PMSResetB | PMSResetF | PMSRemoveB | PMSRemoveF | null>(null);

  const getDisplayName = (key: PMSItemKeys): string => {
    return Object.entries(PERMANENT_SIGN_ITEMS).find(([_, value]) => value === key)?.[0] || key;
  };

  const createEmptyFormData = (type: PMSItemKeys): PMSTypeB | PMSTypeF | PMSResetB | PMSResetF | PMSRemoveB | PMSRemoveF => {
    const baseData = {
      id: uuidv4(),
      name: '',
      numberInstalls: 0,
      permSignBolts: 0
    };

    switch (type) {
      case 'pmsTypeB':
        return {
          ...baseData,
          signSqFt: 0,
          antiTheftBolts: 0,
          chevronBracket: 0,
          streetNameCrossBracket: 0
        } as PMSTypeB;
      case 'resetTypeB':
        return {
          ...baseData,
          antiTheftBolts: 0
        } as PMSResetB;
      case 'pmsTypeF':
      case 'resetTypeF':
      case 'removeTypeB':
      case 'removeTypeF':
      default:
        return baseData as PMSTypeF;
    }
  };

  const handleAddSign = () => {
    setSelectedType(undefined);
    setFormData(null);
    setEditingId(null);
    setDrawerOpen(true);
  };

  const handleEditItem = (signId: string) => {
    const item = permanentSigns?.signItems.find(item => item.id === signId);
    if (item) {
      setFormData({ ...item });
      setEditingId(signId);
      const itemType = determineItemType(item);
      setSelectedType(itemType);
      setDrawerOpen(true);
    }
  };

  const handleTypeChange = (value: PMSItemKeys) => {
    setSelectedType(value);
    // Create new form data based on the selected type
    const newFormData = createEmptyFormData(value);
    setFormData(newFormData);
  };

  const handleFieldUpdate = (field: keyof PMSTypeB, value: any) => {
    if (formData) {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handleSave = () => {
    if (!formData || !selectedType) return;

    if (editingId) {
      // Update existing item
      Object.keys(formData).forEach(field => {
        if (field !== 'id') {
          dispatch({
            type: 'UPDATE_PERMANENT_SIGNS_ITEM',
            payload: {
              signId: editingId,
              field: field as keyof PMSTypeB,
              value: (formData as any)[field],
            },
          });
        }
      });
    } else {
      // Add new item
      dispatch({
        type: 'ADD_PERMANENT_SIGNS_ITEM',
        payload: {
          key: selectedType,
          id: formData.id
        },
      });

      // Update the newly added item with form data
      Object.keys(formData).forEach(field => {
        if (field !== 'id') {
          dispatch({
            type: 'UPDATE_PERMANENT_SIGNS_ITEM',
            payload: {
              signId: formData.id,
              field: field as keyof PMSTypeB,
              value: (formData as any)[field],
            },
          });
        }
      });
    }

    setDrawerOpen(false);
    setFormData(null);
    setEditingId(null);
    setSelectedType(undefined);
  };

  const handleCancel = () => {
    setDrawerOpen(false);
    setFormData(null);
    setEditingId(null);
    setSelectedType(undefined);
  };

  const handleItemDelete = (pmsId: string) => {
    dispatch({
      type: 'DELETE_PERMANENT_SIGNS_ITEM',
      payload: { signId: pmsId },
    });
  };

  const renderFormFields = () => {
    if (!formData || !selectedType) return null;

    // Always render numberInstalls and permSignBolts (common to all types)
    const commonFields = (
      <>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block"># of Installs</Label>
          <Input
            type="number"
            value={formData?.numberInstalls || ""}
            onChange={(e) => handleFieldUpdate('numberInstalls', parseInt(e.target.value) || 0)}
            min={0}
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">Perm. Sign Bolts</Label>
          <Input
            type="number"
            value={formData?.permSignBolts || ""}
            onChange={(e) => handleFieldUpdate('permSignBolts', parseInt(e.target.value) || 0)}
            min={0}
            className="w-full"
          />
        </div>
      </>
    );

    // Check what additional fields this item has
    const hasSignSqFt = 'signSqFt' in formData;
    const hasAntiTheftBolts = 'antiTheftBolts' in formData;
    const hasChevronBracket = 'chevronBracket' in formData;
    const hasStreetNameCrossBracket = 'streetNameCrossBracket' in formData;

    const additionalFields = (
      <>
        {hasSignSqFt && (
          <div className="flex-1">
            <Label className="text-sm font-medium mb-2 block">Sign Sq. Ft.</Label>
            <Input
              type="number"
              value={(formData as PMSTypeB).signSqFt || ""}
              onChange={(e) => handleFieldUpdate('signSqFt', parseFloat(e.target.value) || 0)}
              min={0}
              step="0.01"
              className="w-full"
            />
          </div>
        )}
        {hasAntiTheftBolts && (
          <div className="flex-1">
            <Label className="text-sm font-medium mb-2 block">Anti-Theft Bolts</Label>
            <Input
              type="number"
              value={(formData as PMSTypeB | PMSResetB).antiTheftBolts || ""}
              onChange={(e) => handleFieldUpdate('antiTheftBolts', parseInt(e.target.value) || 0)}
              min={0}
              className="w-full"
            />
          </div>
        )}
        {hasChevronBracket && (
          <div className="flex-1">
            <Label className="text-sm font-medium mb-2 block">Chevron Bracket</Label>
            <Input
              type="number"
              value={(formData as PMSTypeB).chevronBracket || ""}
              onChange={(e) => handleFieldUpdate('chevronBracket', parseInt(e.target.value) || 0)}
              min={0}
              className="w-full"
            />
          </div>
        )}
        {hasStreetNameCrossBracket && (
          <div className="flex-1">
            <Label className="text-sm font-medium mb-2 block">Street Name Cross Bracket</Label>
            <Input
              type="number"
              value={(formData as PMSTypeB).streetNameCrossBracket || ""}
              onChange={(e) => handleFieldUpdate('streetNameCrossBracket', parseInt(e.target.value) || 0)}
              min={0}
              className="w-full"
            />
          </div>
        )}
      </>
    );

    return (
      <div className="space-y-4">
        {/* Name Input */}
        <div className="w-full">
          <Label className="text-sm font-medium mb-2 block">Item Name/Number</Label>
          <Input
            type="text"
            value={formData?.name || ""}
            onChange={(e) => handleFieldUpdate('name', e.target.value)}
            className="w-full"
            placeholder="Enter item name or number"
          />
        </div>

        {/* Fields in responsive grid */}
        <div className="grid grid-cols-2 gap-4">
          {commonFields}
          {additionalFields}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between pb-2 border-b mb-6">
        <h3 className="text-xl text-black font-semibold">
          Permanent Signs
        </h3>
        <Button onClick={handleAddSign}>
          <Plus className="mr-2 h-4 w-4" />
          Add Sign Item
        </Button>
      </div>

      <div className="relative">
        {/* Permanent Signs List */}
        {(!permanentSigns || permanentSigns.signItems.length === 0) && (
          <EmptyContainer topText="No permanent signs added yet" subtext="When you add permanent signs, they will appear here." />
        )}
        {permanentSigns && permanentSigns.signItems.map(pmsItem => {
          const itemType = determineItemType(pmsItem);

          return (
            <div
              key={`sign-${pmsItem.id}`}
              className="rounded-lg border bg-card text-card-foreground shadow-sm mb-2 p-4"
            >
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
            </div>
          );
        })}
      </div>

      {/* Drawer for adding/editing permanent signs */}
      <Drawer open={drawerOpen} direction="right" onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {editingId ? 'Edit Permanent Sign' : 'Add Permanent Sign'}
            </DrawerTitle>
            <DrawerDescription>
              {editingId
                ? 'Update the permanent sign details below.'
                : 'Configure the details for your new permanent sign item.'
              }
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 space-y-4">
            {/* Sign Type Selection */}
            <div className="w-full">
              <Label className="text-sm font-medium mb-2 block">Sign Item Type</Label>
              <Select
                value={selectedType}
                onValueChange={handleTypeChange}
                disabled={!!editingId}
              >
                <SelectTrigger className="w-full">
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
            </div>

            {/* Render form fields based on selected type */}
            {selectedType && renderFormFields()}
          </div>

          <DrawerFooter>
            <div className="flex justify-end space-x-3 w-full">
              <DrawerClose asChild>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </DrawerClose>
              <Button 
                onClick={handleSave}
                disabled={!selectedType}
              >
                {editingId ? 'Update Sign Item' : 'Save Sign Item'}
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default PermanentSignsSummaryStep;