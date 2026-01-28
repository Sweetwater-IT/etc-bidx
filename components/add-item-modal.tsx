'use client'

import { useCallback, memo, useState, useEffect } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from 'sonner'
//import { createDailyTrackerEntry } from '@/hooks/use-daily-tracker-swr'
//import { DailyTrackerEntry } from '@/types/DailyTrackerEntry'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AddItemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: DailyTrackerEntry | null
  isViewMode: boolean
  onSuccess: () => void
}

// Dummy data for signs - replace with actual data fetching later
const SIGNS = [
  { id: '1', designation: 'Stop Sign', dimension: '24x24' },
  { id: '2', designation: 'Yield Sign', dimension: '30x30' },
  { id: '3', designation: 'No Parking', dimension: '12x18' },
  { id: '4', designation: 'Speed Limit 35', dimension: '18x24' },
];

export const AddItemModal = memo(function AddItemModal({
  open,
  onOpenChange,
  entry,
  isViewMode,
  onSuccess
}: AddItemModalProps) {
  const [signDesignation, setSignDesignation] = useState(entry?.signDesignation || '');
  const [dimension, setDimension] = useState(entry?.dimension || '');
  const [quantity, setQuantity] = useState(entry?.quantity.toString() || '');
  const [selectedSign, setSelectedSign] = useState<{ designation: string, dimension: string } | null>(null);

  const resetForm = useCallback(() => {
    setSignDesignation('');
    setDimension('');
    setQuantity('');
    setSelectedSign(null);
  }, []);

  useEffect(() => {
    if (open && !isViewMode && !entry) { // Only reset if opening for create mode
      resetForm();
    } else if (open && isViewMode && entry) { // Populate for view mode
      setSignDesignation(entry.signDesignation || '');
      setDimension(entry.dimension || '');
      setQuantity(entry.quantity.toString() || '');
      setSelectedSign({ designation: entry.signDesignation, dimension: entry.dimension });
    }
  }, [open, isViewMode, entry, resetForm]);

  const handleSignChange = useCallback((value: string) => {
    const sign = SIGNS.find(s => s.designation === value);
    if (sign) {
      setSelectedSign(sign);
      setSignDesignation(sign.designation);
      setDimension(sign.dimension);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!signDesignation || !dimension || !quantity) {
      toast.error("Please fill in all fields.");
      return;
    }

    const newEntry = {
      signDesignation,
      dimension,
      quantity: parseInt(quantity, 10),
    };

    try {
      if (isViewMode && entry) {
        // Handle update logic here if needed, for now only create is supported
        toast.info("Update functionality is not yet implemented.");
      } else {
        await createDailyTrackerEntry(newEntry);
        toast.success("Entry added successfully!");
      }
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Failed to save entry:", error);
      toast.error("Failed to save entry.");
    }
  }, [signDesignation, dimension, quantity, isViewMode, entry, onSuccess, onOpenChange, resetForm]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="customer-drawer-content">
        <style jsx global>{`
          .customer-drawer-content {
            width: 47.5vw !important;
            max-width: none !important;
          }
          
          @media (min-width: 640px) {
            .customer-drawer-content {
              width: 25vw !important;
              max-width: none !important;
            }
          }
          
          .customer-drawer-content[data-vaul-drawer-direction="right"] {
            width: 47.5vw !important;
            max-width: none !important;
          }
          
          @media (min-width: 640px) {
            .customer-drawer-content[data-vaul-drawer-direction="right"] {
              width: 25vw !important;
              max-width: none !important;
            }
          }
        `}</style>
        
        <DrawerHeader className="p-0">
          <div className="flex items-center p-6 pb-2">
            <DrawerTitle className="text-xl font-semibold">
              {isViewMode ? 'Entry Details' : 'Add New Entry'}
            </DrawerTitle>
            <DrawerClose className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-gray-100 ml-2">
              <X className="h-4 w-4" />
            </DrawerClose>
          </div>
          <Separator />
        </DrawerHeader>
        
        <div className="flex-1 overflow-auto p-6 pt-2 pb-24">
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signDesignation">Sign Designation</Label>
              <Select onValueChange={handleSignChange} value={selectedSign?.designation || ''} disabled={isViewMode}>
                <SelectTrigger id="signDesignation">
                  <SelectValue placeholder="Select a sign" />
                </SelectTrigger>
                <SelectContent>
                  {SIGNS.map((sign) => (
                    <SelectItem key={sign.id} value={sign.designation}>
                      {sign.designation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dimension">Dimension</Label>
              <Input
                id="dimension"
                type="text"
                value={dimension}
                onChange={(e) => setDimension(e.target.value)}
                readOnly // Dimension is derived from sign selection
                disabled={isViewMode}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={isViewMode}
              />
            </div>

            {!isViewMode && (
              <Button type="submit" className="w-full">
                Add Entry
              </Button>
            )}
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}); 
