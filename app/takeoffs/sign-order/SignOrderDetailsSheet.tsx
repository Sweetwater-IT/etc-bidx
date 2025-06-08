"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { IconBulb } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { User } from "@/types/User";
import { Customer } from "@/types/Customer";
import { SignOrderAdminInformation, OrderTypes } from "./SignOrderContentSimple";

const BRANCHES = [
    { value: "All", label: "All" },
    { value: "Turbotville", label: "Turbotville" },
    { value: "Hatfield", label: "Hatfield" },
    { value: "Bedford", label: "Bedford" },
];

interface SignOrderDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminInfo: SignOrderAdminInformation;
  setAdminInfo: (info: SignOrderAdminInformation) => void;
  allUsers: User[];
  customers: Customer[];
}

export function SignOrderDetailsSheet({
  open,
  onOpenChange,
  adminInfo,
  setAdminInfo,
  allUsers,
  customers,
}: SignOrderDetailsSheetProps) {
  // Local state for form fields
  const [localRequestor, setLocalRequestor] = useState<User | null>(adminInfo.requestor);
  const [localCustomer, setLocalCustomer] = useState<Customer | null>(adminInfo.customer);
  const [localOrderDate, setLocalOrderDate] = useState(adminInfo.orderDate);
  const [localNeedDate, setLocalNeedDate] = useState(adminInfo.needDate);
  const [localOrderType, setLocalOrderType] = useState<OrderTypes[]>(adminInfo.orderType);
  const [localSelectedBranch, setLocalSelectedBranch] = useState(adminInfo.selectedBranch);
  const [localJobNumber, setLocalJobNumber] = useState(adminInfo.jobNumber);
  const [localContractNumber, setLocalContractNumber] = useState(adminInfo.contractNumber);
  const [localStartDate, setLocalStartDate] = useState(adminInfo.startDate);
  const [localEndDate, setLocalEndDate] = useState(adminInfo.endDate);

  // Popover states
  const [openRequestor, setOpenRequestor] = useState(false);
  const [openCustomer, setOpenCustomer] = useState(false);

  // Update local state when adminInfo changes or when sheet opens
  useEffect(() => {
    if (open) {
      setLocalRequestor(adminInfo.requestor);
      setLocalCustomer(adminInfo.customer);
      setLocalOrderDate(adminInfo.orderDate);
      setLocalNeedDate(adminInfo.needDate);
      setLocalOrderType(adminInfo.orderType);
      setLocalSelectedBranch(adminInfo.selectedBranch);
      setLocalJobNumber(adminInfo.jobNumber);
      setLocalContractNumber(adminInfo.contractNumber);
      setLocalStartDate(adminInfo.startDate);
      setLocalEndDate(adminInfo.endDate);
    }
  }, [open, adminInfo]);

  // Update branch when requestor changes
  useEffect(() => {
    if (localRequestor && localRequestor.branches) {
      setLocalSelectedBranch(localRequestor.branches.name);
    }
  }, [localRequestor]);

  const handleSave = () => {
    setAdminInfo({
      ...adminInfo,
      requestor: localRequestor,
      customer: localCustomer,
      orderDate: localOrderDate,
      needDate: localNeedDate,
      orderType: localOrderType,
      selectedBranch: localSelectedBranch,
      jobNumber: localJobNumber,
      contractNumber: localContractNumber,
      startDate: localStartDate,
      endDate: localEndDate,
    });
    onOpenChange(false);
  };

  const handleOrderTypeChange = (orderType: OrderTypes, checked: boolean) => {
    if (checked) {
      setLocalOrderType(prev => [...prev, orderType]);
    } else {
      setLocalOrderType(prev => prev.filter(type => type !== orderType));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:max-w-[600px] pt-2">
        <SheetHeader>
          <SheetTitle className="text-2xl font-semibold">
            Edit Sign Order Details
          </SheetTitle>
        </SheetHeader>
        <div className="border-b" />
        
        <div className="mt-4 space-y-6 px-4">
          {/* Job Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Job Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Job Number</Label>
                <Input
                  type="text"
                  value={localJobNumber}
                  onChange={(e) => setLocalJobNumber(e.target.value)}
                  placeholder="Job number"
                />
              </div>

              <div className="space-y-2">
                <Label>Contract Number</Label>
                <Input
                  type="text"
                  value={localContractNumber}
                  onChange={(e) => setLocalContractNumber(e.target.value)}
                  placeholder="Contract number"
                />
              </div>
            </div>
          </div>

          {/* Order Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Order Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Requestor */}
              <div className="space-y-2">
                <Label>Requestor</Label>
                <Popover open={openRequestor} onOpenChange={setOpenRequestor}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openRequestor}
                      className="w-full justify-between"
                    >
                      {localRequestor ? localRequestor.name : "Select requestor..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput placeholder="Search requestor..." />
                      <CommandEmpty>No requestor found.</CommandEmpty>
                      <CommandGroup className="max-h-[200px] overflow-y-auto">
                        {allUsers.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={user.name}
                            onSelect={() => {
                              setLocalRequestor(user);
                              setOpenRequestor(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                localRequestor?.id === user.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {user.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Branch */}
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select value={localSelectedBranch} onValueChange={setLocalSelectedBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANCHES.map(branch => (
                      <SelectItem key={branch.value} value={branch.value}>
                        {branch.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Customer */}
              <div className="space-y-2">
                <Label>Customer</Label>
                <Popover open={openCustomer} onOpenChange={setOpenCustomer}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCustomer}
                      className="w-full justify-between"
                    >
                      <span className="truncate">
                        {localCustomer ? localCustomer.displayName : "Select contractor..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput placeholder="Search contractor..." />
                      <CommandEmpty>No contractor found.</CommandEmpty>
                      <CommandGroup className="max-h-[200px] overflow-y-auto">
                        {customers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={customer.name}
                            onSelect={() => {
                              setLocalCustomer(customer);
                              setOpenCustomer(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                localCustomer?.id === customer.id ? "opacity-100" : "opacity-0"
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

              {/* Order Date */}
              <div className="space-y-2">
                <Label>Order Date</Label>
                <Input
                  type="date"
                  value={localOrderDate.toISOString().split('T')[0]}
                  onChange={(e) => setLocalOrderDate(new Date(e.target.value))}
                />
              </div>

              {/* Need Date */}
              <div className="space-y-2">
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex gap-x-2">
                      <Label>Need Date</Label>
                      <IconBulb className="h-5" color="gray" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div>Sale = date requested by customer</div>
                    <div>Rental = 1 week before job start</div>
                  </TooltipContent>
                </Tooltip>
                <Input
                  type="date"
                  value={localNeedDate.toISOString().split('T')[0]}
                  onChange={(e) => setLocalNeedDate(new Date(e.target.value))}
                />
              </div>
            </div>

            {/* Order Type */}
            <div className="space-y-2">
              <Label>Order Type</Label>
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sale-checkbox-sheet"
                    checked={localOrderType.includes('sale')}
                    onCheckedChange={(checked) => handleOrderTypeChange('sale', checked as boolean)}
                  />
                  <Label htmlFor="sale-checkbox-sheet">Sale</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rental-checkbox-sheet"
                    checked={localOrderType.includes('rental')}
                    onCheckedChange={(checked) => handleOrderTypeChange('rental', checked as boolean)}
                  />
                  <Label htmlFor="rental-checkbox-sheet">Rental</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="perm-signs-checkbox-sheet"
                    checked={localOrderType.includes('permanent signs')}
                    onCheckedChange={(checked) => handleOrderTypeChange('permanent signs', checked as boolean)}
                  />
                  <Label htmlFor="perm-signs-checkbox-sheet">Permanent Signs</Label>
                </div>
              </div>
            </div>

            {/* Rental Dates - Only show if rental is selected */}
            {localOrderType.includes('rental') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={localStartDate ? localStartDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                    onChange={(e) => setLocalStartDate(new Date(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={localEndDate ? localEndDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                    onChange={(e) => setLocalEndDate(new Date(e.target.value))}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-6 mr-4">
          <Button onClick={handleSave} variant="default">
            Save Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}