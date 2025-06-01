"use client";

import { useState, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { EyeIcon, PencilIcon, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { type ActiveBid } from "@/data/active-bids";
import { format } from "date-fns";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";
import { Customer } from "@/types/Customer";
import { updateBid } from "@/lib/api-client";
import { toast } from "sonner";
import { Separator } from "./ui/separator";

interface ActiveBidDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bid?: ActiveBid;
  onEdit?: (item: ActiveBid) => void;
  onNavigate?: (direction: 'up' | 'down') => void;
  onRefresh?: () => void; // Callback to refresh the data table
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SUBCONTRACTOR_OPTIONS = [
  "ETC",
  "Atlas",
  "RoadSafe",
  "Rae-Lynn",
  "Unknown",
  "Other"
];

export function ActiveBidDetailsSheet({ open, onOpenChange, bid, onEdit, onNavigate, onRefresh }: ActiveBidDetailsSheetProps) {
  const [lettingDate, setLettingDate] = useState<Date | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingContractor, setEditingContractor] = useState(false);
  const [editingSubcontractor, setEditingSubcontractor] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<string>('');
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<string>('');
  const [originalContractor, setOriginalContractor] = useState<string>('');
  const [originalSubcontractor, setOriginalSubcontractor] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);
  
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contractors')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      const formattedCustomers: Customer[] = data.map((customer: any) => ({
        id: customer.id,
        name: customer.name,
        displayName: customer.display_name || customer.name,
        emails: [],
        phones: [],
        names: [],
        roles: [],
        contactIds: [],
        address: customer.address || '',
        url: customer.web || '',
        created: customer.created || '',
        updated: customer.updated || '',
        city: customer.city || '',
        state: customer.state || '',
        zip: customer.zip || '',
        customerNumber: customer.customer_number || 0,
        mainPhone: customer.main_phone || '',
        paymentTerms: customer.payment_terms || ''
      }));

      setCustomers(formattedCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' && onNavigate) {
        e.preventDefault();
        onNavigate('down');
      } else if (e.key === 'ArrowUp' && onNavigate) {
        e.preventDefault();
        onNavigate('up');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onNavigate]);
  
  useEffect(() => {
    if (open) {
      fetchCustomers();
    }
  }, [open, fetchCustomers]);

  useEffect(() => {
    if (bid) {
      const contractorValue = formatValue(bid.contractor);
      const subcontractorValue = formatValue(bid.subcontractor);
      
      setSelectedContractor(contractorValue);
      setSelectedSubcontractor(subcontractorValue);
      setOriginalContractor(contractorValue);
      setOriginalSubcontractor(subcontractorValue);
      try {
        setLettingDate((bid.lettingDate && bid.lettingDate !== '-') ? 
          new Date(bid.lettingDate) : undefined);
      } catch (e) {
        console.error("Invalid letting date format:", bid.lettingDate);
        setLettingDate(undefined);
      }
      
      try {
        setStartDate((bid.startDate && bid.startDate !== '-') ? 
          new Date(bid.startDate) : undefined);
      } catch (e) {
        console.error("Invalid start date format:", bid.startDate);
        setStartDate(undefined);
      }
      
      try {
        setEndDate((bid.endDate && bid.endDate !== '-') ? 
          new Date(bid.endDate) : undefined);
      } catch (e) {
        console.error("Invalid end date format:", bid.endDate);
        setEndDate(undefined);
      }
    } else {
      setLettingDate(undefined);
      setStartDate(undefined);
      setEndDate(undefined);
    }
  }, [bid]);



  const handleEdit = () => {
    if (hasChanges) {
      // Save changes
      saveChanges();
    } else if (bid && onEdit) {
      // Open the full edit form
      onOpenChange(false);
      onEdit(bid);
    }
  };

  useEffect(() => {
    setSelectedContractor('');
    setSelectedSubcontractor('');
  }, [open])

  const handleContractorSelect = (value: string) => {
    setSelectedContractor(value);
    setHasChanges(value !== originalContractor);
    setEditingContractor(false);
  };

  const handleSubcontractorSelect = (value: string) => {
    setSelectedSubcontractor(value);
    setHasChanges(value !== originalSubcontractor);
    setEditingSubcontractor(false);
  };
  
  const saveChanges = async () => {
    if (!bid?.id || !hasChanges) return;
    
    setSaving(true);
    try {
      // Save contractor changes if any
      if (selectedContractor !== originalContractor) {
        // Find contractor ID from name
        const { data: contractorData, error: contractorError } = await supabase
          .from('contractors')
          .select('id')
          .eq('name', selectedContractor)
          .single();
        
        if (contractorError) {
          throw new Error(`Contractor not found: ${contractorError.message}`);
        }
        
        // Check if project_metadata exists for this bid
        const { data: metadataData, error: metadataError } = await supabase
          .from('project_metadata')
          .select('id')
          .eq('bid_estimate_id', bid.id);
        
        if (metadataError) {
          throw new Error(`Error checking metadata: ${metadataError.message}`);
        }
        
        if (metadataData && metadataData.length > 0) {
          // Update existing metadata
          await supabase
            .from('project_metadata')
            .update({ contractor_id: contractorData.id })
            .eq('bid_estimate_id', bid.id);
        } else {
          // Create new metadata
          await supabase
            .from('project_metadata')
            .insert({ bid_estimate_id: bid.id, contractor_id: contractorData.id });
        }
        
        setOriginalContractor(selectedContractor);
      }
      
      // Save subcontractor changes if any
      if (selectedSubcontractor !== originalSubcontractor) {
        // Find subcontractor ID from name or create a new one
        let subcontractorId;
        
        const { data: existingSubcontractor, error: subError } = await supabase
          .from('subcontractors')
          .select('id')
          .eq('name', selectedSubcontractor)
          .single();
        
        if (subError) {
          // Create new subcontractor
          const { data: newSubcontractor, error: createError } = await supabase
            .from('subcontractors')
            .insert({ name: selectedSubcontractor })
            .select('id')
            .single();
          
          if (createError) {
            throw new Error(`Error creating subcontractor: ${createError.message}`);
          }
          
          subcontractorId = newSubcontractor.id;
        } else {
          subcontractorId = existingSubcontractor.id;
        }
        
        // Check if project_metadata exists for this bid
        const { data: metadataData, error: metadataError } = await supabase
          .from('project_metadata')
          .select('id')
          .eq('bid_estimate_id', bid.id);
        
        if (metadataError) {
          throw new Error(`Error checking metadata: ${metadataError.message}`);
        }
        
        if (metadataData && metadataData.length > 0) {
          // Update existing metadata
          await supabase
            .from('project_metadata')
            .update({ subcontractor_id: subcontractorId })
            .eq('bid_estimate_id', bid.id);
        } else {
          // Create new metadata
          await supabase
            .from('project_metadata')
            .insert({ bid_estimate_id: bid.id, subcontractor_id: subcontractorId });
        }
        
        setOriginalSubcontractor(selectedSubcontractor);
      }
      
      toast.success("Changes saved successfully");
      setHasChanges(false);
      
      // Refresh the data table before closing the drawer
      if (onRefresh) {
        onRefresh();
      }
      
      onOpenChange(false); // Close the drawer after saving
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  // Helper function to format display values
  const formatValue = (value: any): string => {
    if (value === null || value === undefined || value === '') return '';
    
    // Handle objects with main and secondary properties
    if (typeof value === 'object' && value !== null) {
      if ('main' in value) {
        return String(value.main);
      }
    }
    
    return String(value);
  };

  const formatCurrency = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined || value === '') return '';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numValue);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col p-0">
        <SheetHeader className="p-6 pb-0">
          <div className="flex items-center gap-2">
            <SheetTitle>Active bid{bid?.originalContractNumber ? `: ${bid.originalContractNumber}` : ''}</SheetTitle>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-md flex items-center gap-1">View bid summary <EyeIcon className="h-3 w-3" /></span>
          </div>
          <Separator/>
        </SheetHeader>
        
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6 pt-2">
            <div className="space-y-5">
              {/* Letting Date */}
              <div className="space-y-1 w-full">
                <Label className="font-medium">Letting Date</Label>
                <div className="text-sm text-muted-foreground">
                  {lettingDate ? format(lettingDate, 'MM/dd/yyyy') : '-'}
                </div>
              </div>

              {/* Contract Number */}
              <div className="space-y-1 w-full">
                <Label className="font-medium">Contract Number</Label>
                <div className="text-sm text-muted-foreground uppercase">
                  {formatValue(bid?.originalContractNumber) || '-'}
                </div>
              </div>

              {/* Contractor & Subcontractor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 w-full">
                  <div className="flex items-center gap-2">
                    <Label className="font-medium">Contractor</Label>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 rounded-full focus:outline-none" 
                      onClick={() => setEditingContractor(!editingContractor)}
                      tabIndex={-1}
                    >
                      <PencilIcon className="h-3 w-3" />
                    </Button>
                  </div>
                  {editingContractor ? (
                    <Popover open={true} modal={true} onOpenChange={setEditingContractor}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-fit justify-between"
                        >
                          {selectedContractor || "Select contractor..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search contractor..." />
                          <CommandEmpty>No contractor found.</CommandEmpty>
                          <CommandGroup className="overflow-y-auto max-h-80">
                            {customers.map((customer) => (
                              <CommandItem
                                key={customer.id}
                                value={customer.name}
                                onSelect={handleContractorSelect}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedContractor === customer.name ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {customer.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {selectedContractor || '-'}
                    </div>
                  )}
                </div>

                <div className="space-y-1 w-full">
                  <div className="flex items-center gap-2">
                    <Label className="font-medium">Subcontractor</Label>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 rounded-full focus:outline-none" 
                      onClick={() => setEditingSubcontractor(!editingSubcontractor)}
                      tabIndex={-1}
                    >
                      <PencilIcon className="h-3 w-3" />
                    </Button>
                  </div>
                  {editingSubcontractor ? (
                    <Popover open={true} onOpenChange={setEditingSubcontractor}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                        >
                          {selectedSubcontractor || "Select subcontractor..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search subcontractor..." />
                          <CommandEmpty>No subcontractor found.</CommandEmpty>
                          <CommandGroup>
                            {SUBCONTRACTOR_OPTIONS.map((option) => (
                              <CommandItem
                                key={option}
                                value={option}
                                onSelect={handleSubcontractorSelect}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedSubcontractor === option ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {option}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {selectedSubcontractor || '-'}
                    </div>
                  )}
                </div>
              </div>

              {/* Owner */}
              <div className="space-y-1 w-full">
                <Label className="font-medium">Owner</Label>
                <div className="text-sm text-muted-foreground">
                  {formatValue(bid?.owner) || '-'}
                </div>
              </div>

              {/* County & Branch */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 w-full">
                  <Label className="font-medium">County</Label>
                  <div className="text-sm text-muted-foreground">
                    {formatValue(bid?.county) || '-'}
                  </div>
                </div>

                <div className="space-y-1 w-full">
                  <Label className="font-medium">Branch</Label>
                  <div className="text-sm text-muted-foreground">
                    {formatValue(bid?.branch) || '-'}
                  </div>
                </div>
              </div>

              {/* Estimator & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 w-full">
                  <Label className="font-medium">Estimator</Label>
                  <div className="text-sm text-muted-foreground">
                    {formatValue(bid?.estimator) || '-'}
                  </div>
                </div>

                <div className="space-y-1 w-full">
                  <Label className="font-medium">Status</Label>
                  <div className="text-sm text-muted-foreground">
                    {formatValue(bid?.status) || '-'}
                  </div>
                </div>
              </div>

              {/* Division */}
              <div className="space-y-1 w-full">
                <Label className="font-medium">Division</Label>
                <div className="text-sm text-muted-foreground">
                  {formatValue(bid?.division) || '-'}
                </div>
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 w-full">
                  <Label className="font-medium">Start Date</Label>
                  <div className="text-sm text-muted-foreground">
                    {startDate ? format(startDate, 'MM/dd/yyyy') : '-'}
                  </div>
                </div>

                <div className="space-y-1 w-full">
                  <Label className="font-medium">End Date</Label>
                  <div className="text-sm text-muted-foreground">
                    {endDate ? format(endDate, 'MM/dd/yyyy') : '-'}
                  </div>
                </div>
              </div>

              {/* Project Days & Total Hours */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 w-full">
                  <Label className="font-medium">Project Days</Label>
                  <div className="text-sm text-muted-foreground">
                    {formatValue(bid?.projectDays) || '-'}
                  </div>
                </div>

                <div className="space-y-1 w-full">
                  <Label className="font-medium">Total Hours</Label>
                  <div className="text-sm text-muted-foreground">
                    {formatValue(bid?.totalHours) || '-'}
                  </div>
                </div>
              </div>

              {/* MPT Value & Perm Sign Value */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 w-full">
                  <Label className="font-medium">MPT Value</Label>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(bid?.mptValue) || '-'}
                  </div>
                </div>

                <div className="space-y-1 w-full">
                  <Label className="font-medium">Perm Sign Value</Label>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(bid?.permSignValue) || '-'}
                  </div>
                </div>
              </div>

              {/* Rental Value */}
              <div className="space-y-1 w-full">
                <Label className="font-medium">Rental Value</Label>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(bid?.rentalValue) || '-'}
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="fixed bottom-0 right-0">
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                onClick={handleEdit}
                disabled={saving}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {hasChanges ? (originalContractor || originalSubcontractor ? "Update" : "Save") : "Edit"}
              </Button>
            </div>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
} 