import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { fetchSignDesignations } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { PrimarySign, SecondarySign, SheetingType } from '@/types/MPTEquipment';
import { Check, Search, Plus } from 'lucide-react';
import React, { Dispatch, SetStateAction, useEffect, useState, useMemo } from 'react';
import { processSignData } from './process-sign-data';

interface SignDesignation {
  designation: string;
  description: string;
  sheeting: SheetingType;
  dimensions: SignDimension[];
}

interface SignDimension {
  width: number;
  height: number;
}

interface Props {
  localSign: PrimarySign | SecondarySign;
  setLocalSign: Dispatch<SetStateAction<PrimarySign | SecondarySign | undefined>>;
  onDesignationSelected?: (updatedSign: PrimarySign | SecondarySign) => void;
}

const DesignationSearcher = ({ localSign, setLocalSign, onDesignationSelected }: Props) => {
  const [open, setOpen] = useState(false);
  const [designationData, setDesignationData] = useState<SignDesignation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDesignation, setSelectedDesignation] = useState<SignDesignation | null>(null);
  const [dimensionModalOpen, setDimensionModalOpen] = useState(false);

  useEffect(() => {
    const loadSignData = async () => {
      try {
        const data = await fetchSignDesignations();
        if (data && Array.isArray(data) && data.length > 0) {
          const processedData = await processSignData(data);
          setDesignationData(processedData);
        } else {
          console.warn("No sign data returned from API or invalid format");
          setDesignationData([]);
        }
      } catch (error) {
        console.error("Error fetching sign data:", error);
        setDesignationData([]);
      }
    };

    loadSignData();
  }, []);

  const filteredDesignations = useMemo(() => {
    if (!searchQuery.trim()) return designationData;

    const query = searchQuery.toLowerCase();
    return designationData.filter(item =>
      item.designation.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    );
  }, [designationData, searchQuery]);

  const handleSelectDesignation = (designation: SignDesignation) => {
    setSelectedDesignation(designation);
    setDimensionModalOpen(true);
  };

  const handleSelectDimension = (width: number, height: number) => {
    if (!selectedDesignation) return;

    const updatedSign = {
      ...localSign,
      designation: selectedDesignation.designation,
      width,
      height,
      sheeting: selectedDesignation.sheeting,
      description: selectedDesignation.description,
    };

    setLocalSign(updatedSign);
    if (onDesignationSelected) {
      onDesignationSelected(updatedSign);
    }
    setOpen(false);
    setDimensionModalOpen(false);
    setSelectedDesignation(null);
    setSearchQuery("");
  };

  const handleCustomDesignation = () => {
    const updatedSign = {
      ...localSign,
      designation: "",
      width: 0,
      height: 0,
      sheeting: localSign.sheeting,
      description: "",
      isCustom: true,
    };
    setLocalSign(updatedSign);
    if (onDesignationSelected) {
      onDesignationSelected(updatedSign);
    }
    setOpen(false);
    setSearchQuery("");
  };

  const closeModals = () => {
    setOpen(false);
    setDimensionModalOpen(false);
    setSelectedDesignation(null);
    setSearchQuery("");
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full sm:w-[300px] justify-start text-left font-normal"
      >
        <span className="truncate">
          {localSign.designation
            ? `${localSign.designation}${localSign.width && localSign.height ? ` (${localSign.width} x ${localSign.height})` : ''}`
            : "Select designation..."
          }
        </span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl h-[600px] flex flex-col p-0">
          <div className="flex flex-col gap-2 relative z-10 bg-background">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle>Select Sign Designation</DialogTitle>
            </DialogHeader>
            <Separator className="w-full -mt-2" />
          </div>

          {/* Fixed Controls Section */}
          <div className="px-6 py-4 space-y-4 bg-background border-b">
            {/* Add Custom Designation Button */}
            <div className="flex justify-start">
              <Button
                variant="outline"
                onClick={handleCustomDesignation}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Custom Designation
              </Button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search designations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
          </div>

          {/* Scrollable Sign Table */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-sm">Designation</th>
                  <th className="text-left px-4 py-3 font-medium text-sm">Description</th>
                  <th className="text-left px-4 py-3 font-medium text-sm">Available Sizes</th>
                  <th className="text-left px-4 py-3 font-medium text-sm">Sheeting</th>
                </tr>
              </thead>
              <tbody>
                {filteredDesignations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? "No designations found matching your search." : "No designations available."}
                    </td>
                  </tr>
                ) : (
                  filteredDesignations.map((item, index) => (
                    <tr
                      key={item.designation}
                      onClick={() => handleSelectDesignation(item)}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-muted/50 border-b last:border-b-0",
                        index % 2 === 0 ? "bg-background" : "bg-muted/20",
                        localSign.designation === item.designation && "bg-primary/5"
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {item.designation}
                          </span>
                          {localSign.designation === item.designation && (
                            <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {item.description || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">
                          {item.dimensions.length} size{item.dimensions.length !== 1 ? 's' : ''} available
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">
                          {item.sheeting}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Separator />
          <div className="flex justify-end items-center p-4 px-6">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dimension Selection Modal */}
      <Dialog open={dimensionModalOpen} onOpenChange={setDimensionModalOpen}>
        <DialogContent className="max-w-2xl h-[500px] flex flex-col p-0">
          <div className="flex flex-col gap-2 relative z-10 bg-background">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle>
                Select Size for {selectedDesignation?.designation}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-2">
                {selectedDesignation?.description}
              </p>
            </DialogHeader>
            <Separator className="w-full -mt-2" />
          </div>

          {/* Dimension Options */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedDesignation?.dimensions.map((dim) => (
                <button
                  key={`${dim.width}x${dim.height}`}
                  onClick={() => handleSelectDimension(dim.width, dim.height)}
                  className={cn(
                    "p-4 border rounded-lg text-left transition-colors hover:bg-muted/50",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    localSign.designation === selectedDesignation?.designation &&
                    localSign.width === dim.width &&
                    localSign.height === dim.height
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">
                        {dim.width}″ × {dim.height}″
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {selectedDesignation.sheeting}
                      </div>
                    </div>
                    {localSign.designation === selectedDesignation?.designation &&
                     localSign.width === dim.width &&
                     localSign.height === dim.height && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Separator />
          <div className="flex justify-between items-center p-4 px-6">
            <Button
              variant="outline"
              onClick={() => setDimensionModalOpen(false)}
            >
              Back to Designations
            </Button>
            <Button variant="outline" onClick={closeModals}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DesignationSearcher;
