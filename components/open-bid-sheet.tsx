"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarIcon,
  UserIcon,
  HashIcon,
  MapPinIcon,
  LayersIcon,
  GlobeIcon,
  Check,
  ChevronsUpDown,
  Search,
  PercentIcon,
  RouteIcon,
  TruckIcon,
  AlertCircle,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { createBid, updateBid, fetchReferenceData } from "@/lib/api-client";
import { toast } from "sonner";
import { County } from "@/types/TCounty";
import {
  AVAILABLE_JOB_SERVICES,
  AvailableJob,
  AvailableJobServices,
} from "@/data/available-jobs";
import { formatDate } from "@/lib/formatUTCDate";
import { Separator } from "./ui/separator";
import { useAuth } from "@/contexts/auth-context";

interface OpenBidSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  job?: AvailableJob;
}

export function OpenBidSheet({
  open,
  onOpenChange,
  onSuccess,
  job,
}: OpenBidSheetProps) {
  const [lettingDate, setLettingDate] = useState<Date>();
  const [dueDate, setDueDate] = useState<Date>();
  const [contractNumber, setContractNumber] = useState("");
  const [requestor, setRequestor] = useState("");
  const [owner, setOwner] = useState("");
  const [county, setCounty] = useState("");
  const [branch, setBranch] = useState("");
  const [location, setLocation] = useState("");
  const [platform, setPlatform] = useState("");
  const [status, setStatus] = useState<"Bid" | "No Bid" | "Unset">("Unset");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dbe, setDbe] = useState("");
  const [stateRoute, setStateRoute] = useState("");
  const [selectedServices, setSelectedServices] = useState<
    Record<AvailableJobServices, boolean>
  >({
    MPT: false,
    Flagging: false,
    "Perm Signs": false,
    "Equipment Rental": false,
    Other: false,
  });

  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [owners, setOwners] = useState<{ id: string; name: string }[]>([]);
  const [counties, setCounties] = useState<County[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [noBidReason, setNoBidReason] = useState<string>();
  const [customReasonSelected, setCustomReasonSelected] =
    useState<boolean>(false);
  const [customText, setCustomText] = useState<string>("");

  // State for popover open states
  const [openStates, setOpenStates] = useState({
    requestor: false,
    owner: false,
    county: false,
    lettingDate: false,
    // dueDate: false,
  });

  const { user } = useAuth();

  // Function to check if all required fields are filled
  const areAllRequiredFieldsFilled = () => {
    return (
      contractNumber.trim() !== "" &&
      dbe.trim() !== "" &&
      stateRoute.trim() !== "" &&
      requestor.trim() !== "" &&
      owner.trim() !== "" &&
      county.trim() !== "" &&
      branch.trim() !== "" &&
      location.trim() !== "" &&
      platform.trim() !== ""
    );
  };

  useEffect(() => {
    async function loadReferenceData() {
      setIsLoading(true);
      try {
        const [usersData, ownersData, countiesData] = await Promise.all([
          fetchReferenceData("users"),
          fetchReferenceData("owners"),
          fetchReferenceData("counties"),
        ]);

        setUsers(usersData);
        setOwners(ownersData);
        setCounties(countiesData);

        const branchNames = countiesData.map((county) => county.branch);
        const uniqueBranchNames = Array.from(new Set(branchNames));
        const branchesData = uniqueBranchNames
          .filter(
            (branchName): branchName is string => typeof branchName === "string"
          )
          .map((branchName) => ({
            id: branchName.toLowerCase().replace(/\s+/g, "-"),
            name: branchName,
          }));

        setBranches(branchesData);

        if (
          !job &&
          usersData.length &&
          ownersData.length &&
          countiesData.length
        ) {
          // Get branch from county
          const selectedCounty = countiesData.find(
            (c) => c.id.toString() === countiesData[0].id.toString()
          );
          if (selectedCounty?.branch) {
            const branchId = selectedCounty.branch
              .toLowerCase()
              .replace(/\s+/g, "-");
            setBranch(branchId);
          }
        }
      } catch (error) {
        console.error("Error loading reference data:", error);
        toast.error("Failed to load form data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    if (open) {
      loadReferenceData();
    }
  }, [open, job]);

  useEffect(() => {
    if (job) {
      setContractNumber(job.contractNumber);
      setRequestor(job.requestor);
      setOwner(job.owner);
      setCounty(job.county.main);
      setBranch(job.county.secondary);
      setLocation(job.location);
      setPlatform(job.platform);
      setStatus(job.status as "Bid" | "No Bid" | "Unset");
      setLettingDate(job.lettingDate ? new Date(job.lettingDate) : undefined);
      setDueDate(job.dueDate ? new Date(job.dueDate) : undefined);
      setDbe(job.dbe ? job.dbe.toString() : "");
      setStateRoute(job.stateRoute || "");
      setSelectedServices(job.services);

      // Handle noBidReason
      if (job.noBidReason) {
        const predefinedReasons = [
          "No MPT",
          "Outside of service area",
          "Project cancelled",
          "Outside of scope",
        ];

        if (predefinedReasons.includes(job.noBidReason)) {
          // It's a predefined reason
          setNoBidReason(job.noBidReason);
          setCustomReasonSelected(false);
          setCustomText("");
        } else {
          // It's a custom reason
          setNoBidReason("Custom");
          setCustomReasonSelected(true);
          setCustomText(job.noBidReason);
        }
      } else {
        // No reason set
        setNoBidReason(undefined);
        setCustomReasonSelected(false);
        setCustomText("");
      }
    } else {
      // Form will be reset with default values from the reference data
      setContractNumber("");
      setLocation("");
      setPlatform("");
      setStatus("Unset");
      setLettingDate(undefined);
      setDueDate(undefined);
      setDbe("");
      setStateRoute("");
      setNoBidReason(undefined);
      setCustomReasonSelected(false);
      setCustomText("");
      setSelectedServices({
        MPT: false,
        Flagging: false,
        "Equipment Rental": false,
        "Perm Signs": false,
        Other: false,
      });
    }
  }, [job, open]);

  useEffect(() => {
    // Set initial requestor to logged-in user if not editing a job
    if (open && !job && user) {
      const userName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email ||
        "";
      setRequestor(userName);
    }
  }, [open, job, user]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setContractNumber("");
      setRequestor("");
      setOwner("");
      setCounty("");
      setBranch("");
      setLocation("");
      setPlatform("");
      setStatus("Unset");
      setLettingDate(undefined);
      setDueDate(undefined);
      setDbe("");
      setStateRoute("");
      setNoBidReason(undefined);
      setCustomReasonSelected(false);
      setCustomText("");
    }
    onOpenChange(open);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted");

    const requiredFields = [
      { field: contractNumber, name: "Contract number" },
      { field: dbe, name: "DBE %" },
      { field: stateRoute, name: "State Route" },
      { field: requestor, name: "Requestor" },
      { field: owner, name: "Owner" },
      { field: county, name: "County" },
      { field: branch, name: "Branch" },
      { field: location, name: "Location" },
      { field: platform, name: "Platform" },
    ];

    for (const { field, name } of requiredFields) {
      if (!field) {
        console.log(`Missing field: ${name}`);
        toast.error(`${name} is required`);
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const today = new Date().toISOString().split("T")[0];

      // Use ISO date format (YYYY-MM-DD) directly to avoid timezone issues
      const formattedLettingDate = lettingDate
        ? lettingDate.toISOString().split('T')[0]
        : today;
      const formattedDueDate = dueDate 
        ? dueDate.toISOString().split('T')[0] 
        : today;
        
      console.log('Submitting dates:', {
        lettingDate: lettingDate ? lettingDate.toISOString() : null,
        formattedLettingDate,
        dueDate: dueDate ? dueDate.toISOString() : null,
        formattedDueDate
      });

      const bidData = {
        contract_number: contractNumber,
        requestor,
        owner,
        county,
        branch,
        location,
        platform,
        status,
        letting_date: formattedLettingDate,
        due_date: formattedDueDate,
        entry_date: today,
        dbe_percentage: parseInt(dbe) || 0,
        state_route: stateRoute,
        mpt: selectedServices.MPT,
        flagging: selectedServices.Flagging,
        perm_signs: selectedServices["Perm Signs"],
        equipment_rental: selectedServices["Equipment Rental"],
        other: selectedServices.Other,
        no_bid_reason: noBidReason === "Custom" ? customText : noBidReason,
      };

      try {
        if (job) {
          // Update existing bid
          console.log("Updating bid:", job.id, bidData);
          await updateBid(job.id, bidData);
          toast.success("Bid updated successfully");
        } else {
          // Create new bid
          console.log("Creating new bid:", bidData);
          await createBid(bidData);
          toast.success("Bid created successfully");
        }
      } catch (error) {
        console.error("API error:", error);
        throw error;
      }

      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error creating/updating bid:", error);
      toast.error(
        `Failed to ${job ? "update" : "create"} bid. Please try again.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNoBidReasonChange = (value: string) => {
    if (value === "Custom") {
      setCustomReasonSelected(true);
    }
    if (
      value === "No MPT" ||
      value === "Outside of service area" ||
      value === "Project cancelled" ||
      value === "Outside of scope"
    ) {
      setCustomReasonSelected(false);
    }

    setNoBidReason(value);
  };

  useEffect(() => {
    if (!lettingDate) return;

    const newDueDate = new Date(lettingDate);
    newDueDate.setDate(newDueDate.getDate() - 2);
    setDueDate(newDueDate);
  }, [lettingDate]);

  const handleCountyChange = (countyName: string) => {
    const selectedCounty = counties.find((c) => c.name === countyName);
    if (selectedCounty) {
      setCounty(selectedCounty.name);
      // Auto-set branch based on county
      if (selectedCounty.branch) {
        setBranch(selectedCounty.branch);
      }
      setOpenStates((prev) => ({ ...prev, county: false }));
    }
  };

  const handleRequestorChange = (requestorName: string) => {
    setRequestor(requestorName);
    setOpenStates((prev) => ({ ...prev, requestor: false }));
  };

  const handleOwnerChange = (ownerName: string) => {
    setOwner(ownerName);
    setOpenStates((prev) => ({ ...prev, owner: false }));
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-[400px] sm:w-[540px] flex flex-col p-0"
      >
        <div className="flex flex-col gap-2 relative z-10 bg-background">
          <SheetHeader className="p-6 pb-4">
            <SheetTitle>
              {job ? "Edit Open Bid" : "Create a new Open Bid"}
            </SheetTitle>
          </SheetHeader>
          <Separator className="w-full -mt-2" />
        </div>

        <form
          onSubmit={handleSubmit}
          className="-mt-4 flex flex-col overflow-y-auto h-full"
        >
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 w-full">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Contract Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Contract Number"
                      className="h-10"
                      value={contractNumber}
                      onChange={(e) =>
                        setContractNumber(e.target.value.toUpperCase())
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <Label className="text-sm font-medium text-muted-foreground">
                    DBE % <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="DBE %"
                      className="h-10"
                      type="number"
                      min="0"
                      max="100"
                      value={dbe}
                      onChange={(e) => setDbe(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <Label className="text-sm font-medium text-muted-foreground">
                    State Route <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="State Route"
                      className="h-10"
                      value={stateRoute}
                      onChange={(e) =>
                        setStateRoute(e.target.value.toUpperCase())
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Requestor <span className="text-red-500">*</span>
                  </Label>
                  <Popover
                    open={openStates.requestor}
                    onOpenChange={(open) =>
                      setOpenStates((prev) => ({ ...prev, requestor: open }))
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openStates.requestor}
                        className="w-full justify-between text-muted-foreground"
                        disabled={isLoading}
                      >
                        {requestor || "Select requestor..."}
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-full p-0"
                      avoidCollisions={false}
                    >
                      <Command>
                        <CommandInput placeholder="Search requestor..." />
                        <CommandEmpty>No requestor found.</CommandEmpty>
                        <CommandGroup>
                          {users.map((user) => (
                            <CommandItem
                              key={user.id}
                              value={user.name}
                              onSelect={() => handleRequestorChange(user.name)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  requestor === user.name
                                    ? "opacity-100"
                                    : "opacity-0"
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

                <div className="space-y-2 w-full">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Owner <span className="text-red-500">*</span>
                  </Label>
                  <Popover
                    open={openStates.owner}
                    onOpenChange={(open) =>
                      setOpenStates((prev) => ({ ...prev, owner: open }))
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openStates.owner}
                        className="w-full justify-between text-muted-foreground"
                        disabled={isLoading}
                      >
                        {owner || "Select owner..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search owner..." />
                        <CommandEmpty>No owner found.</CommandEmpty>
                        <CommandGroup>
                          {owners.map((ownerItem) => (
                            <CommandItem
                              key={ownerItem.id}
                              value={ownerItem.name}
                              onSelect={() => handleOwnerChange(ownerItem.name)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  owner === ownerItem.name
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {ownerItem.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2 w-full">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Platform <span className="text-red-500">*</span>
                  </Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger className="w-full font-medium text-muted-foreground relative">
                      <SelectValue placeholder="Select platform..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ECMS">ECMS</SelectItem>
                      <SelectItem value="PENNBID">PENNBID</SelectItem>
                      <SelectItem value="TURNPIKE">TURNPIKE</SelectItem>
                      <SelectItem value="OTHER">OTHER</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 w-full">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Letting Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="letting-date"
                    type="date"
                    pattern="^\\d*(\\.\\d{0,2})?$"
                    placeholder={"Letting date"}
                    value={
                      lettingDate ? lettingDate.toISOString().split("T")[0] : ""
                    }
                    onChange={(e) => setLettingDate(new Date(e.target.value))}
                    className="h-10"
                  />
                  {/* <Popover open={openStates.lettingDate} onOpenChange={(open) => setOpenStates(prev => ({ ...prev, lettingDate: open }))}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full text-muted-foreground justify-between text-left font-normal"
                      >
                        <span>
                          {lettingDate ? formatDate(lettingDate) : "Select date"}
                        </span>
                        <CalendarIcon className="h-4 w-4 opacity-50 ml-2" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={lettingDate}
                        onSelect={(date) => {
                          setLettingDate(date);
                          setOpenStates(prev => ({ ...prev, lettingDate: false }));
                        }}
                      />
                    </PopoverContent>
                  </Popover> */}
                </div>

                <div className="space-y-2 w-full">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Due Date
                  </Label>
                  {/**Leaving popover in in case this needs to be editable again */}
                  {/* <Popover open={openStates.dueDate} onOpenChange={(open) => setOpenStates(prev => ({ ...prev, dueDate: open }))}>
                    <PopoverTrigger asChild> */}
                  <Input
                    id="due-date"
                    type="date"
                    pattern="^\\d*(\\.\\d{0,2})?$"
                    placeholder={"Due date"}
                    value={dueDate ? dueDate.toISOString().split("T")[0] : ""}
                    onChange={(e) => setDueDate(new Date(e.target.value))}
                    className="h-10"
                  />
                  {/* </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={(date) => {
                          setDueDate(date);
                          setOpenStates(prev => ({ ...prev, dueDate: false }));
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover> */}
                </div>

                <div className="space-y-2 w-full">
                  <Label className="text-sm font-medium text-muted-foreground">
                    County <span className="text-red-500">*</span>
                  </Label>
                  <Popover
                    open={openStates.county}
                    onOpenChange={(open) =>
                      setOpenStates((prev) => ({ ...prev, county: open }))
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openStates.county}
                        className="w-full font-medium text-muted-foreground justify-between"
                        disabled={isLoading}
                      >
                        {county || "Select county..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-full p-0"
                      avoidCollisions={false}
                    >
                      <Command>
                        <CommandInput placeholder="Search county..." />
                        <CommandEmpty>No county found.</CommandEmpty>
                        <CommandGroup>
                          {counties.map((countyItem) => (
                            <CommandItem
                              key={countyItem.id}
                              value={countyItem.name}
                              onSelect={() =>
                                handleCountyChange(countyItem.name)
                              }
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  county === countyItem.name
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {countyItem.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2 w-full">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Location <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Location"
                      className="h-10"
                      value={location}
                      onChange={(e) =>
                        setLocation(e.target.value.toUpperCase())
                      }
                    />
                  </div>
                </div>
              </div>

              {!!job && (
                <div className="space-y-2 w-full">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Status <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={status}
                    onValueChange={(value) =>
                      setStatus(value as "Bid" | "No Bid" | "Unset")
                    }
                  >
                    <SelectTrigger className="w-full pl-9 relative">
                      <LayersIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bid">Bid</SelectItem>
                      <SelectItem value="No Bid">No Bid</SelectItem>
                      <SelectItem value="Unset">Unset</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {status === "No Bid" && (
                <Select
                  value={noBidReason}
                  onValueChange={handleNoBidReasonChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No MPT">No MPT</SelectItem>
                    <SelectItem value="Outside of service area">
                      Outside of service area
                    </SelectItem>
                    <SelectItem value="Project cancelled">
                      Project cancelled
                    </SelectItem>
                    <SelectItem value="Outside of scope">
                      Outside of scope
                    </SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {customReasonSelected && (
                <Input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value.toUpperCase())}
                  placeholder="Enter custom reason"
                  className="h-10"
                />
              )}
              <div className="space-y-2 w-full">
                <Label className="text-sm font-medium text-muted-foreground">
                  Services Required <span className="text-red-500">*</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Select all that apply
                </p>
                <div className="flex flex-wrap gap-4">
                  {AVAILABLE_JOB_SERVICES.map((service) => (
                    <div key={service} className="flex items-center space-x-2">
                      <Checkbox
                        id={service}
                        onCheckedChange={(checked) =>
                          setSelectedServices((prev) => ({
                            ...prev,
                            [service]: checked,
                          }))
                        }
                        checked={selectedServices[service]}
                      />
                      <Label htmlFor={service}>{service}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Separator />
          <div className="p-4 pt-4 flex items-center justify-center">
            <div className="flex flex-col gap-2 w-full">
              {!areAllRequiredFieldsFilled() && (
                <div className="flex items-center mt-2 text-sm gap-2 text-amber-500">
                  <AlertCircle size={14} />
                  <span>
                    Please fill in all required fields before proceeding.
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center gap-2 h-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  type="submit"
                  disabled={isSubmitting || !areAllRequiredFieldsFilled()}
                  onClick={(e) => {
                    console.log("Submit button clicked");
                    if (!isSubmitting) {
                      handleSubmit(e as unknown as React.FormEvent);
                    }
                  }}
                >
                  {isSubmitting
                    ? job
                      ? "Updating..."
                      : "Creating..."
                    : job
                    ? "Update"
                    : "Create"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
