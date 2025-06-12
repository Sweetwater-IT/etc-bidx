"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  EyeIcon,
  PencilIcon,
  Check,
  ChevronsUpDown,
  Loader2,
  XIcon,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { type ActiveBid } from "@/data/active-bids";
import { format } from "date-fns";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  onNavigate?: (direction: "up" | "down") => void;
  onRefresh?: () => void; // Callback to refresh the data table
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SUBCONTRACTOR_OPTIONS = [
  { name: "ETC", id: 1 },
  { name: "ATLAS", id: 2 },
  { name: "ROADSAFE", id: 3 },
  { name: "RAE-LYNN", id: 4 },
  { name: "UNKNOWN", id: 5 },
  { name: "OTHER", id: 6 },
];

export function ActiveBidDetailsSheet({
  open,
  onOpenChange,
  bid,
  onEdit,
  onNavigate,
  onRefresh,
}: ActiveBidDetailsSheetProps) {
  const [lettingDate, setLettingDate] = useState<Date | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<Customer>();
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<{ name: string, id: number }>();
  const [originalContractor, setOriginalContractor] = useState<Customer>();
  const [originalSubcontractor, setOriginalSubcontractor] = useState<{ name: string, id: number }>();
  const [hasChanges, setHasChanges] = useState(false);
  const [openStates, setOpenStates] = useState({
    contractor: false,
    subContractor: false
  });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contractors")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      const formattedCustomers: Customer[] = data.map((customer: any) => ({
        id: customer.id,
        name: customer.name,
        displayName: customer.display_name
          ? customer.display_name
          : customer.name,
        emails: [],
        phones: [],
        names: [],
        roles: [],
        contactIds: [],
        address: customer.address || "",
        url: customer.web || "",
        created: customer.created || "",
        updated: customer.updated || "",
        city: customer.city || "",
        state: customer.state || "",
        zip: customer.zip || "",
        customerNumber: customer.customer_number || 0,
        mainPhone: customer.main_phone || "",
        paymentTerms: customer.payment_terms || "",
      }));

      setCustomers(formattedCustomers);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" && onNavigate) {
        e.preventDefault();
        onNavigate("down");
      } else if (e.key === "ArrowUp" && onNavigate) {
        e.preventDefault();
        onNavigate("up");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onNavigate]);

  useEffect(() => {
    if (open) {
      fetchCustomers();
    }
  }, [open, fetchCustomers]);

  useEffect(() => {
    const fetchContractors = async () => {
      if (!bid?.id || customers.length === 0) return;

      try {
        const response = await fetch(`/api/active-bids/update-contractors/${bid.id}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            // Find and set the contractor
            if (result.data.contractor_id) {
              const contr = customers.find(c => c.id === result.data.contractor_id);
              if (contr) {
                setSelectedContractor(contr);
                setOriginalContractor(contr);
              }
            }

            // Find and set the subcontractor
            if (result.data.subcontractor_id) {
              const sub = SUBCONTRACTOR_OPTIONS.find(s => s.id === result.data.subcontractor_id);
              if (sub) {
                setSelectedSubcontractor(sub);
                setOriginalSubcontractor(sub);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching contractors:', error);
      }

      // Set dates
      try {
        setLettingDate(
          bid.lettingDate && bid.lettingDate !== "-"
            ? new Date(bid.lettingDate)
            : undefined
        );
      } catch (e) {
        console.error("Invalid letting date format:", bid.lettingDate);
        setLettingDate(undefined);
      }

      try {
        setStartDate(
          bid.startDate && bid.startDate !== "-"
            ? new Date(bid.startDate)
            : undefined
        );
      } catch (e) {
        console.error("Invalid start date format:", bid.startDate);
        setStartDate(undefined);
      }

      try {
        setEndDate(
          bid.endDate && bid.endDate !== "-" ? new Date(bid.endDate) : undefined
        );
      } catch (e) {
        console.error("Invalid end date format:", bid.endDate);
        setEndDate(undefined);
      }
    };

    if (bid && customers.length > 0) {
      fetchContractors();
    } else if (!bid) {
      setLettingDate(undefined);
      setStartDate(undefined);
      setEndDate(undefined);
      setSelectedContractor(undefined);
      setSelectedSubcontractor(undefined);
      setOriginalContractor(undefined);
      setOriginalSubcontractor(undefined);
    }
  }, [bid, customers]);

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

  const handleContractorSelect = (name: string) => {
    const contractor = customers.find(c => c.name === name);
    setSelectedContractor(contractor);
    setHasChanges(
      !originalContractor ? !!contractor : contractor?.id !== originalContractor.id
    );
    setOpenStates(prev => ({ ...prev, contractor: false }));
  };

  const handleSubcontractorSelect = (name: string) => {
    const subcontractor = SUBCONTRACTOR_OPTIONS.find(sub => sub.name === name);
    setSelectedSubcontractor(subcontractor);
    setHasChanges(
      !originalSubcontractor ? !!subcontractor : subcontractor?.id !== originalSubcontractor.id
    );
    setOpenStates(prev => ({ ...prev, subContractor: false }));
  };

  const saveChanges = async () => {
    if (!bid?.id || !hasChanges) return;

    setSaving(true);
    try {
      const body: any = {};
      if (selectedContractor) body.contractor_id = selectedContractor.id;
      if (selectedSubcontractor) body.subcontractor_id = selectedSubcontractor.id;

      const response = await fetch('/api/active-bids/update-contractors/' + bid.id, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to save contractors');
      } else {
        const result = await response.json();
        toast.success(result.message || 'Successfully updated contractors');
        setOriginalContractor(selectedContractor);
        setOriginalSubcontractor(selectedSubcontractor);
        setHasChanges(false);

        // Refresh the data table before closing the drawer
        if (onRefresh) {
          onRefresh();
        }

        onOpenChange(false); // Close the drawer after saving
      }
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
    if (value === null || value === undefined || value === "") return "";

    // Handle objects with main and secondary properties
    if (typeof value === "object" && value !== null) {
      if ("main" in value) {
        return String(value.main);
      }
    }

    return String(value);
  };

  const formatCurrency = (
    value: string | number | null | undefined
  ): string => {
    if (value === null || value === undefined || value === "") return "";
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(numValue);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[400px] sm:w-[540px] flex flex-col p-0"
      >
        <div className="flex flex-col gap-2 relative z-10 bg-background">
          <SheetHeader className="p-6 pb-4">
            <div className="flex justify-between items-center">
              <SheetTitle>
                Active bid
                {bid?.originalContractNumber
                  ? `: ${bid.originalContractNumber}`
                  : ""}
              </SheetTitle>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-md flex items-center gap-1 text-nowrap">
                View bid summary <EyeIcon className="h-3 w-3" />
              </span>
            </div>
          </SheetHeader>
          <Separator className="w-full -mt-2" />
        </div>

        <div className="flex flex-col overflow-y-auto h-full">
          <div className="flex-1 p-6 pt-3">
            <div className="space-y-5">
              <div className="flex">
                <div className="space-y-1 w-1/2">
                  <Label className="font-semibold">
                    Contract Number
                  </Label>
                  <div className="text-muted-foreground uppercase">
                    {formatValue(bid?.originalContractNumber) || "-"}
                  </div>
                </div>
                {/* Letting Date */}
                <div className="space-y-1 w-1/2">
                  <Label className="font-semibold">
                    Letting Date
                  </Label>
                  <div className="text-muted-foreground">
                    {lettingDate ? format(lettingDate, "MM/dd/yyyy") : "-"}
                  </div>
                </div>
              </div>

              {/* Contractor & Subcontractor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 w-full">
                  <Label className="font-semibold">Contractor</Label>
                  <Popover
                    open={openStates.contractor}
                    modal={true}
                    onOpenChange={(open) => setOpenStates(prev => ({ ...prev, contractor: open }))}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className='w-full justify-between text-muted-foreground'
                      >
                        <span className="truncate">
                          {selectedContractor?.displayName ||
                            selectedContractor?.name ||
                            "Select contractor..."}
                        </span>
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
                                  selectedContractor?.id === customer.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {customer.displayName}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1 w-full">
                  <Label className="font-semibold">Subcontractor</Label>
                  <Popover open={openStates.subContractor} onOpenChange={(open) => setOpenStates(prev => ({ ...prev, subContractor: open }))}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between text-muted-foreground"
                      >
                        <span className="truncate">
                        {selectedSubcontractor ? selectedSubcontractor.name : "Select subcontractor..."}
                        </span>
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
                              key={option.id}
                              value={option.name}
                              onSelect={handleSubcontractorSelect}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedSubcontractor?.id === option.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {option.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Owner */}
              <div className="space-y-1 w-full">
                <Label className="font-semibold">
                  Owner
                </Label>
                <div className="text-muted-foreground">
                  {formatValue(bid?.owner) || "-"}
                </div>
              </div>

              {/* County & Branch */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 w-full">
                  <Label className="font-semibold">
                    County
                  </Label>
                  <div className="text-muted-foreground">
                    {formatValue(bid?.county) || "-"}
                  </div>
                </div>

                <div className="space-y-1 w-full">
                  <Label className="font-semibold">
                    Branch
                  </Label>
                  <div className="text-muted-foreground">
                    {formatValue(bid?.branch) || "-"}
                  </div>
                </div>
              </div>

              {/* Estimator & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 w-full">
                  <Label className="font-semibold">
                    Estimator
                  </Label>
                  <div className="text-muted-foreground">
                    {formatValue(bid?.estimator) || "-"}
                  </div>
                </div>

                <div className="space-y-1 w-full">
                  <Label className="font-semibold">
                    Status
                  </Label>
                  <div className="text-muted-foreground">
                    {formatValue(bid?.status) || "-"}
                  </div>
                </div>
              </div>

              {/* Division */}
              <div className="space-y-1 w-full">
                <Label className="font-semibold">
                  Division
                </Label>
                <div className="text-muted-foreground">
                  {formatValue(bid?.division) || "-"}
                </div>
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 w-full">
                  <Label className="font-semibold">
                    Start Date
                  </Label>
                  <div className="text-muted-foreground">
                    {startDate ? format(startDate, "MM/dd/yyyy") : "-"}
                  </div>
                </div>

                <div className="space-y-1 w-full">
                  <Label className="font-semibold">
                    End Date
                  </Label>
                  <div className="text-muted-foreground">
                    {endDate ? format(endDate, "MM/dd/yyyy") : "-"}
                  </div>
                </div>
              </div>

              {/* Project Days & Total Hours */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 w-full">
                  <Label className="font-semibold">
                    Project Days
                  </Label>
                  <div className="text-muted-foreground">
                    {formatValue(bid?.projectDays) || "-"}
                  </div>
                </div>

                <div className="space-y-1 w-full">
                  <Label className="font-semibold">
                    Total Hours
                  </Label>
                  <div className="text-muted-foreground">
                    {formatValue(bid?.totalHours) || "-"}
                  </div>
                </div>
              </div>

              {/* MPT Value & Perm Sign Value */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 w-full">
                  <Label className="font-semibold">
                    MPT Value
                  </Label>
                  <div className="text-muted-foreground">
                    {formatCurrency(bid?.mptValue) || "-"}
                  </div>
                </div>

                <div className="space-y-1 w-full">
                  <Label className="font-semibold">
                    Perm Sign Value
                  </Label>
                  <div className="text-muted-foreground">
                    {formatCurrency(bid?.permSignValue) || "-"}
                  </div>
                </div>
              </div>

              {/* Rental Value */}
              <div className="space-y-1 w-full">
                <Label className="font-semibold">
                  Rental Value
                </Label>
                <div className="text-muted-foreground">
                  {formatCurrency(bid?.rentalValue) || "-"}
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="px-4 py-4 border-t flex gap-2 sticky bottom-0 bg-background z-10">
            <div className="flex justify-between gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={saving} className="flex-1">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {hasChanges
                  ? originalContractor || originalSubcontractor
                    ? "Update"
                    : "Save"
                  : "Edit"}
              </Button>
            </div>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}