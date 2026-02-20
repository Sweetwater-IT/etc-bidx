'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, Plus, Minus } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import {
  PataKit,
  PtsKit,
  SignDesignation,
  SheetingType,
  DisplayStructures,
  AssociatedStructures,
  structureMap,
} from '@/types/MPTEquipment';

interface KitSignConfiguration {
  id: string;
  designation: string;
  quantity: number;
  width: number;
  height: number;
  sheeting: SheetingType;
  substrate: 'Plastic' | 'Aluminum' | 'Aluminum-Composite' | 'Roll Up' | 'Face';
  displayStructure: DisplayStructures;
  associatedStructure: AssociatedStructures;
  bLights: number;
  cover: boolean;
  stiffener: boolean;
  description: string;
  availableDimensions: { width: number; height: number }[];
}

interface Props {
  kit: PataKit | PtsKit;
  kitType: 'pata' | 'pts';
  signsData: SignDesignation[];
  onSave: (configurations: KitSignConfiguration[]) => void;
  onCancel: () => void;
  isSignOrder?: boolean;
}

const KitConfigurationTable = ({
  kit,
  kitType,
  signsData,
  onSave,
  onCancel,
  isSignOrder = false
}: Props) => {
  const [configurations, setConfigurations] = useState<KitSignConfiguration[]>([]);

  // Initialize configurations when kit changes
  useEffect(() => {
    const initialConfigs: KitSignConfiguration[] = kit.contents.map((content, index) => {
      // Find the sign data for this designation
      const signData = signsData.find(s => s.designation === content.sign_designation);

      return {
        id: `kit-sign-${index}`,
        designation: content.sign_designation,
        quantity: content.quantity,
        width: signData?.dimensions[0]?.width || 0,
        height: signData?.dimensions[0]?.height || 0,
        sheeting: signData?.sheeting || 'DG',
        substrate: 'Plastic' as const,
        displayStructure: 'LOOSE' as const,
        associatedStructure: 'none' as const,
        bLights: 0,
        cover: false,
        stiffener: false,
        description: signData?.description || '',
        availableDimensions: signData?.dimensions || [{ width: 0, height: 0 }],
      };
    });

    setConfigurations(initialConfigs);
  }, [kit, signsData]);

  const updateConfiguration = (index: number, field: keyof KitSignConfiguration, value: any) => {
    const updatedConfigs = [...configurations];
    updatedConfigs[index] = { ...updatedConfigs[index], [field]: value };

    // Special handling for displayStructure -> associatedStructure mapping
    if (field === 'displayStructure') {
      updatedConfigs[index].associatedStructure = structureMap[value as DisplayStructures];
    }

    setConfigurations(updatedConfigs);
  };

  const updateQuantity = (index: number, delta: number) => {
    const newQuantity = Math.max(1, configurations[index].quantity + delta);
    updateConfiguration(index, 'quantity', newQuantity);
  };

  const removeSign = (index: number) => {
    const updatedConfigs = configurations.filter((_, i) => i !== index);
    setConfigurations(updatedConfigs);
  };

  const handleDimensionChange = (index: number, dimensionStr: string) => {
    const [widthStr, heightStr] = dimensionStr.split('x');
    const width = parseFloat(widthStr);
    const height = parseFloat(heightStr);

    if (!isNaN(width) && !isNaN(height)) {
      updateConfiguration(index, 'width', width);
      updateConfiguration(index, 'height', height);
    }
  };

  const getDimensionOptions = (config: KitSignConfiguration) => {
    return config.availableDimensions.map(dim => ({
      value: `${dim.width}x${dim.height}`,
      label: `${dim.width}" × ${dim.height}"`
    }));
  };

  const handleSave = () => {
    onSave(configurations);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Main content area with independent scrolling */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
        {/* Left: Kit Diagram - independently scrollable */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Kit Diagram</h3>
            <div className="text-sm text-muted-foreground">
              {configurations.length} sign{configurations.length !== 1 ? 's' : ''} to configure
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="border rounded-lg p-4 bg-muted/20">
              {kit.image_url ? (
                <img
                  src={kit.image_url}
                  alt={`${kitType?.toUpperCase()} Kit ${kit.code} Diagram`}
                  className="w-full h-auto object-contain rounded border"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                    e.currentTarget.alt = 'Diagram failed to load';
                  }}
                />
              ) : (
                <div className="w-full h-[400px] bg-muted/50 flex items-center justify-center rounded border border-dashed">
                  <p className="text-muted-foreground text-sm">No diagram available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Configuration Table - independently scrollable */}
        <div className="flex flex-col min-h-0">
          <h3 className="text-lg font-semibold mb-4">Sign Configuration</h3>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-[200px]">Designation</TableHead>
                    <TableHead className="w-[150px]">Dimensions</TableHead>
                    <TableHead className="w-[120px]">Sheeting</TableHead>
                    <TableHead className="w-[140px]">Substrate</TableHead>
                    <TableHead className="w-[140px]">Structure</TableHead>
                    <TableHead className="w-[120px]">Quantity</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configurations.map((config, index) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium text-sm">{config.designation}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {config.description}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Select
                          value={`${config.width}x${config.height}`}
                          onValueChange={(value) => handleDimensionChange(index, value)}
                        >
                          <SelectTrigger className="w-full h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getDimensionOptions(config).map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell>
                        <Select
                          value={config.sheeting}
                          onValueChange={(value) => updateConfiguration(index, 'sheeting', value)}
                        >
                          <SelectTrigger className="w-full h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="HI">HI</SelectItem>
                            <SelectItem value="DG">DG</SelectItem>
                            <SelectItem value="FYG">FYG</SelectItem>
                            <SelectItem value="TYPEXI">Type XI</SelectItem>
                            <SelectItem value="Special">Special</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell>
                        <Select
                          value={config.substrate}
                          onValueChange={(value) => updateConfiguration(index, 'substrate', value)}
                        >
                          <SelectTrigger className="w-full h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Plastic">Plastic</SelectItem>
                            <SelectItem value="Aluminum">Aluminum</SelectItem>
                            <SelectItem value="Aluminum-Composite">Aluminum Composite</SelectItem>
                            {isSignOrder && (
                              <>
                                <SelectItem value="Roll Up">Roll Up</SelectItem>
                                <SelectItem value="Face">Face</SelectItem>
                              </>
                            )}
                          </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell>
                      <Select
                        value={config.displayStructure}
                        onValueChange={(value) => updateConfiguration(index, 'displayStructure', value)}
                      >
                        <SelectTrigger className="w-full h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4 FT T-III RIGHT">4 FT T-III RIGHT</SelectItem>
                          <SelectItem value="4 FT T-III LEFT">4 FT T-III LEFT</SelectItem>
                          <SelectItem value="6 FT T-III RIGHT">6 FT T-III RIGHT</SelectItem>
                          <SelectItem value="6 FT T-III LEFT">6 FT T-III LEFT</SelectItem>
                          <SelectItem value="H-FOOT">H-FOOT</SelectItem>
                          <SelectItem value="8 FT POST">8 FT POST</SelectItem>
                          <SelectItem value="10 FT POST">10 FT POST</SelectItem>
                          <SelectItem value="12 FT POST">12 FT POST</SelectItem>
                          <SelectItem value="14 FT POST">14 FT POST</SelectItem>
                          <SelectItem value="LOOSE">LOOSE</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => updateQuantity(index, -1)}
                          disabled={config.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min={1}
                          value={config.quantity}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value) && value >= 1) {
                              updateConfiguration(index, 'quantity', value);
                            }
                          }}
                          className="w-12 h-8 text-center"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => updateQuantity(index, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSign(index)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed footer */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t bg-background">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={configurations.length === 0}>
          Add Signs to Order
        </Button>
      </div>
    </div>
  );
};

export default KitConfigurationTable;