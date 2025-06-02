import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import React, { useState, useEffect } from "react";
import { useEstimate } from "@/contexts/EstimateContext";
import { formatDate } from "@/lib/formatUTCDate";
import { Pencil, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminData } from "@/types/TAdminData";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { County } from "@/types/TCounty";
import { fetchReferenceData } from "@/lib/api-client";

interface AdminInformationAccordionProps {
  currentStep: number;
}

const AdminInformationAccordion = ({ currentStep }: AdminInformationAccordionProps) => {
  const [value, setValue] = useState<string[]>([]);
  const { adminData, dispatch } = useEstimate();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  
  // Temporary state for editing
  const [tempData, setTempData] = useState<Partial<AdminData>>({});
  
  const [openStates, setOpenStates] = useState({
    county: false,
    estimator: false,
    owner: false,
  });

  // States for dropdown options
  const [counties, setCounties] = useState<County[]>([]);
  const [estimators, setEstimators] = useState<{ id: number; name: string }[]>([]);
  const [owners, setOwners] = useState<{ id: string; name: string }[]>([]);

  // Fetch reference data for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch counties
        const countiesData = await fetchReferenceData("counties");
        setCounties(countiesData);

        // Fetch estimators (users)
        const estimatorsData = await fetchReferenceData("users");
        setEstimators(estimatorsData);

        // Fetch owners
        const ownersData = await fetchReferenceData("owners");
        setOwners(ownersData);
      } catch (error) {
        console.error("Error fetching reference data:", error);
      }
    };

    fetchData();
  }, []);

  // Calculate total days between start and end date
  const getTotalDays = () => {
    const startDate = isEditing ? tempData.startDate : adminData.startDate;
    const endDate = isEditing ? tempData.endDate : adminData.endDate;
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  // Open accordion when currentStep is 1
  useEffect(() => {
    if (currentStep === 1) {
      setValue(["item-1"]);
    } else {
      setValue([]);
    }
  }, [currentStep]);

  const handleEdit = () => {
    setIsEditing(true);
    setTempData({
      contractNumber: adminData.contractNumber || "",
      estimator: adminData.estimator || "",
      owner: adminData.owner || undefined,
      county: adminData.county || null,
      location: adminData.location || "",
      division: adminData.division || null,
      startDate: adminData.startDate || null,
      endDate: adminData.endDate || null,
      lettingDate: adminData.lettingDate || null,
      srRoute: adminData.srRoute || "",
      dbe: adminData.dbe || "",
      owTravelTimeMins: adminData.owTravelTimeMins || 0,
      owMileage: adminData.owMileage || 0,
      fuelCostPerGallon: adminData.fuelCostPerGallon || 0,
      winterStart: adminData.winterStart || undefined,
      winterEnd: adminData.winterEnd || undefined,
    });
  };

  const handleSave = () => {
    // Update all fields at once
    Object.entries(tempData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        dispatch({
          type: "UPDATE_ADMIN_DATA",
          payload: {
            key: key as keyof AdminData,
            value: value
          }
        });
      }
    });
    
    setIsEditing(false);
    setTempData({});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempData({});
    setOpenStates({
      county: false,
      estimator: false,
      owner: false,
    });
  };

  const handleCountyChange = (countyId: string) => {
    const selectedCounty = counties.find(c => c.id.toString() === countyId);
    if (selectedCounty) {
      const newCounty: County = {
        id: selectedCounty.id,
        name: selectedCounty.name,
        district: selectedCounty.district || 0,
        branch: selectedCounty.branch || '',
        laborRate: selectedCounty.laborRate || 0,
        fringeRate: selectedCounty.fringeRate || 0,
        shopRate: selectedCounty.shopRate || 0,
        flaggingRate: selectedCounty.flaggingRate || 0,
        flaggingBaseRate: selectedCounty.flaggingBaseRate || 0,
        flaggingFringeRate: selectedCounty.flaggingFringeRate || 0,
        ratedTargetGM: selectedCounty.ratedTargetGM || 0,
        nonRatedTargetGM: selectedCounty.nonRatedTargetGM || 0,
        insurance: selectedCounty.insurance || 0,
        fuel: selectedCounty.fuel || 0,
        market: selectedCounty.market || 'LOCAL'
      };

      setTempData(prev => ({ ...prev, county: newCounty }));
      setOpenStates(prev => ({ ...prev, county: false }));
    }
  };

  const handleEstimatorChange = (estimatorName: string) => {
    setTempData(prev => ({ ...prev, estimator: estimatorName }));
    setOpenStates(prev => ({ ...prev, estimator: false }));
  };

  const handleOwnerChange = (ownerName: 'SEPTA' | 'PENNDOT' | 'OTHER' | 'TURNPIKE' | 'PRIVATE') => {
    setTempData(prev => ({ ...prev, owner: ownerName }));
    setOpenStates(prev => ({ ...prev, owner: false }));
  };

  const renderField = (label: string, field: keyof AdminData | 'branch' | 'totalDays', value: string | number | null) => {
    const displayValue = value || "-";

    if (field === "branch" || field === "totalDays") {
      return (
        <>
          <div className="text-muted-foreground">{label}</div>
          <div className="text-right">{displayValue}</div>
        </>
      );
    }

    if (!isEditing) {
      return (
        <>
          <div className="text-muted-foreground">{label}</div>
          <div className="text-right">{displayValue}</div>
        </>
      );
    }

    // Editing mode
    return (
      <>
        <div className="text-muted-foreground">{label}</div>
        <div className="text-right flex items-center justify-end">
          {field === "county" ? (
            <Popover open={openStates.county} onOpenChange={(open) => setOpenStates(prev => ({ ...prev, county: open }))}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openStates.county}
                  className="w-34 justify-between text-muted-foreground"
                >
                  {tempData.county?.name || adminData.county?.name || "Select county..."}
                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search county..." />
                  <CommandEmpty>No county found.</CommandEmpty>
                  <CommandGroup className="h-50 overflow-y-auto">
                    {counties.map((county) => (
                      <CommandItem
                        key={county.id}
                        value={county.name}
                        onSelect={() => handleCountyChange(county.id.toString())}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            (tempData.county?.name || adminData.county?.name) === county.name ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {county.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          ) : field === "estimator" ? (
            <Popover open={openStates.estimator} onOpenChange={(open) => setOpenStates(prev => ({ ...prev, estimator: open }))}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openStates.estimator}
                  className="w-48 justify-between"
                >
                  {tempData.estimator || adminData.estimator || "Select estimator..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search estimator..." />
                  <CommandEmpty>No estimator found.</CommandEmpty>
                  <CommandGroup>
                    {estimators.map((estimator) => (
                      <CommandItem
                        key={estimator.id}
                        value={estimator.name}
                        onSelect={() => handleEstimatorChange(estimator.name)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            (tempData.estimator || adminData.estimator) === estimator.name ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {estimator.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          ) : field === "owner" ? (
            <Popover open={openStates.owner} onOpenChange={(open) => setOpenStates(prev => ({ ...prev, owner: open }))}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openStates.owner}
                  className="w-34 justify-between text-muted-foreground"
                >
                  {tempData.owner || adminData.owner || "Select owner..."}
                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search owner..." />
                  <CommandEmpty>No owner found.</CommandEmpty>
                  <CommandGroup>
                    {owners.map((owner) => (
                      <CommandItem
                        key={owner.id}
                        value={owner.name}
                        onSelect={() => handleOwnerChange(owner.name as 'PENNDOT' | 'TURNPIKE' | 'PRIVATE' | 'SEPTA' | 'OTHER')}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            (tempData.owner || adminData.owner) === owner.name ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {owner.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          ) : field === "division" ? (
            <RadioGroup
              value={tempData.division || adminData.division || undefined}
              onValueChange={(value) => {
                setTempData(prev => ({ ...prev, division: value as 'PUBLIC' | 'PRIVATE' }));
              }}
              className="flex"
            >
              {['PUBLIC', 'PRIVATE'].map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`division-${option}`} />
                  <Label htmlFor={`division-${option}`} className="text-sm font-normal">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : field === "startDate" || field === "endDate" || field === "lettingDate" || field === "winterStart" || field === "winterEnd" ? (
            <Input
              type="date"
              value={
                tempData[field] 
                  ? (typeof tempData[field] === 'string' 
                      ? tempData[field] as string
                      : (tempData[field] as Date).toISOString().split('T')[0]) 
                  : (adminData[field] 
                      ? (typeof adminData[field] === 'string' 
                          ? adminData[field] as string
                          : (adminData[field] as Date).toISOString().split('T')[0])
                      : "")
              }
              onChange={(e) => {
                setTempData(prev => ({
                  ...prev,
                  [field]: e.target.value ? new Date(e.target.value) : null
                }));
              }}
              className="w-48 h-8"
            />
          ) : (
            <Input
              value={tempData[field as keyof AdminData] as number || adminData[field as keyof AdminData] as number || ''}
              onChange={(e) => {
                const value = field === "owTravelTimeMins" || field === "owMileage" || field === "fuelCostPerGallon" 
                  ? (e.target.value ? Number(e.target.value) : null)
                  : e.target.value;
                setTempData(prev => ({ ...prev, [field]: value }));
              }}
              className="w-48 h-8"
              type={field === "owTravelTimeMins" || field === "owMileage" || field === "fuelCostPerGallon" ? "number" : "text"}
            />
          )}
        </div>
      </>
    );
  };

  return (
    <Card className="p-4">
      <Accordion type="multiple" value={value} onValueChange={setValue} className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger className="py-0">
            <h3 className="font-semibold">Admin Information</h3>
          </AccordionTrigger>
          <AccordionContent>
            {/* Edit/Save buttons inside accordion content */}
            <div className="flex justify-end mb-4">
              {isEditing ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    className="h-8 px-3 mr-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSave}
                    className="h-8 w-8 p-0"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEdit}
                  className="h-8 w-8 p-0"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              {renderField("Contract #", "contractNumber", adminData.contractNumber)}
              {renderField("Owner", "owner", adminData.owner)}
              {renderField("County", "county", adminData.county?.name)}
              {renderField("Branch", "branch", adminData.county?.branch)}
              {renderField("Township", "location", adminData.location)}
              {renderField("Division", "division", adminData.division)}
              {renderField("Start Date", "startDate", formatDate(isEditing ? tempData.startDate : adminData.startDate))}
              {renderField("End Date", "endDate", formatDate(isEditing ? tempData.endDate : adminData.endDate))}
              {renderField("Total Days", "totalDays", getTotalDays().toString() + ' days')}
              {renderField("Letting Date", "lettingDate", formatDate(isEditing ? tempData.lettingDate : adminData.lettingDate))}
              {renderField("SR Route", "srRoute", adminData.srRoute)}
              {renderField("DBE %", "dbe", adminData.dbe + '%')}
              {renderField("One Way Travel Time (min)", "owTravelTimeMins", adminData.owTravelTimeMins ?  adminData.owTravelTimeMins + ' mins' : null)}
              {renderField("One Way Mileage", "owMileage", adminData.owMileage ? adminData.owMileage + ' mi' : null)}
              {renderField("Diesel Cost per Gallon", "fuelCostPerGallon", adminData.fuelCostPerGallon ? `$${adminData.fuelCostPerGallon.toFixed(2)}` : null)}
              
              {((isEditing ? tempData.winterStart : adminData.winterStart) || (isEditing ? tempData.winterEnd : adminData.winterEnd)) && (
                <>
                  {renderField("Winter Start", "winterStart", formatDate(isEditing ? tempData.winterStart : adminData.winterStart))}
                  {renderField("Winter End", "winterEnd", formatDate(isEditing ? tempData.winterEnd : adminData.winterEnd))}
                </>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default AdminInformationAccordion;