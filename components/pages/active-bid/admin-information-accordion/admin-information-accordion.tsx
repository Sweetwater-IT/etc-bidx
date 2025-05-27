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

type EditableField = keyof AdminData;
type SpecialField = 'branch' | 'totalDays';

const AdminInformationAccordion = ({ currentStep }: AdminInformationAccordionProps) => {
  const [value, setValue] = useState<string[]>([]);
  const { adminData, dispatch } = useEstimate();
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [tempValue, setTempValue] = useState<string>("");
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
    if (adminData.startDate && adminData.endDate) {
      const start = new Date(adminData.startDate);
      const end = new Date(adminData.endDate);
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

  const handleEdit = (field: EditableField, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue === "-" ? "" : currentValue);
  };

  const handleSave = (field: EditableField) => {
    dispatch({
      type: "UPDATE_ADMIN_DATA",
      payload: {
        key: field,
        value: tempValue
      }
    });
    setEditingField(null);
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

      dispatch({
        type: 'UPDATE_ADMIN_DATA',
        payload: { key: 'county', value: newCounty }
      });
      setEditingField(null);
    }
  };

  const handleEstimatorChange = (estimatorName: string) => {
    dispatch({
      type: 'UPDATE_ADMIN_DATA',
      payload: { key: 'estimator', value: estimatorName }
    });
    setEditingField(null);
  };

  const handleOwnerChange = (ownerName: string) => {
    dispatch({
      type: 'UPDATE_ADMIN_DATA',
      payload: { key: 'owner', value: ownerName }
    });
    setEditingField(null);
  };

  const renderField = (label: string, field: EditableField | SpecialField, value: string | number | null) => {
    const isEditing = editingField === field;
    const displayValue = value || "-";

    if (field === "branch" || field === "totalDays") {
      return (
        <>
          <div className="text-muted-foreground">{label}</div>
          <div className="text-right">{displayValue}</div>
        </>
      );
    }

    return (
      <>
        <div className="text-muted-foreground">{label}</div>
        <div className="text-right flex items-center justify-end gap-2">
          {isEditing ? (
            <>
              {field === "county" ? (
                <Popover open={openStates.county} onOpenChange={(open) => setOpenStates(prev => ({ ...prev, county: open }))}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openStates.county}
                      className="w-48 justify-between"
                    >
                      {adminData.county?.name || "Select county..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search county..." />
                      <CommandEmpty>No county found.</CommandEmpty>
                      <CommandGroup>
                        {counties.map((county) => (
                          <CommandItem
                            key={county.id}
                            value={county.name}
                            onSelect={() => handleCountyChange(county.id.toString())}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                adminData.county?.name === county.name ? "opacity-100" : "opacity-0"
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
                      {adminData.estimator || "Select estimator..."}
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
                                adminData.estimator === estimator.name ? "opacity-100" : "opacity-0"
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
                      className="w-48 justify-between"
                    >
                      {adminData.owner || "Select owner..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                            onSelect={() => handleOwnerChange(owner.name)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                adminData.owner === owner.name ? "opacity-100" : "opacity-0"
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
                  value={adminData.division || 'PUBLIC'}
                  onValueChange={(value) => {
                    dispatch({
                      type: 'UPDATE_ADMIN_DATA',
                      payload: { key: 'division', value }
                    });
                    setEditingField(null);
                  }}
                  className="flex flex-col space-y-1"
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
                  value={adminData[field] ? (typeof adminData[field] === 'string' ? adminData[field] : (adminData[field] as Date).toISOString().split('T')[0]) : ""}
                  onChange={(e) => {
                    dispatch({
                      type: 'UPDATE_ADMIN_DATA',
                      payload: {
                        key: field,
                        value: e.target.value ? new Date(e.target.value) : null
                      }
                    });
                    setEditingField(null);
                  }}
                  className="w-48 h-8"
                />
              ) : (
                <>
                  <Input
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="w-48 h-8"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSave(field as EditableField)}
                    className="h-8 w-8 p-0"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </>
              )}
            </>
          ) : (
            <>
              {displayValue}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(field as EditableField, displayValue.toString())}
                className="h-8 w-8 p-0"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </>
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
            <div className="grid grid-cols-2 gap-y-2 text-sm mt-4">
              {renderField("Contract #", "contractNumber", adminData.contractNumber)}
              {renderField("Owner", "owner", adminData.owner)}
              {renderField("County", "county", adminData.county?.name)}
              {renderField("Branch", "branch", adminData.county?.branch)}
              {renderField("Township", "location", adminData.location)}
              {renderField("Division", "division", adminData.division)}
              {renderField("Start Date", "startDate", formatDate(adminData.startDate))}
              {renderField("End Date", "endDate", formatDate(adminData.endDate))}
              {renderField("Total Days", "totalDays", getTotalDays())}
              {renderField("Letting Date", "lettingDate", formatDate(adminData.lettingDate))}
              {renderField("SR Route", "srRoute", adminData.srRoute)}
              {renderField("DBE %", "dbe", adminData.dbe)}
              {renderField("One Way Travel Time (min)", "owTravelTimeMins", adminData.owTravelTimeMins ?? null)}
              {renderField("One Way Mileage", "owMileage", adminData.owMileage ?? null)}
              {renderField("Diesel Cost per Gallon", "fuelCostPerGallon", adminData.fuelCostPerGallon ?? null)}
              
              {(adminData.winterStart || adminData.winterEnd) && (
                <>
                  {renderField("Winter Start", "winterStart", formatDate(adminData.winterStart))}
                  {renderField("Winter End", "winterEnd", formatDate(adminData.winterEnd))}
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