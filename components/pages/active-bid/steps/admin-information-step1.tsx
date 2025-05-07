import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Step } from "@/types/IStep";
import {
  fetchReferenceData,
} from "@/lib/api-client";
import React, { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { County } from "@/types/TCounty";
import { useEstimate } from "@/contexts/EstimateContext";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const step: Step = {
  id: "step-1",
  name: "Admin Information",
  description: "Basic information about the bid",
  fields: [
    { name: "contractNumber", label: "Contract Number*", type: "text", placeholder: "Contract Number" },
    { name: "estimator", label: "Estimator*", type: "select", placeholder: "Estimator" },
    { name: "owner", label: "Owner*", type: "select", placeholder: "Choose", },
    { name: "county", label: "County*", type: "select", placeholder: "Choose County" },
    { name: "township", label: "Township*", type: "text", placeholder: "Township" },
    { name: "division", label: "Division*", type: "select", placeholder: "Choose", options: ['PUBLIC', 'PRIVATE'] },
    { name: "lettingDate", label: "Letting Date*", type: "date", placeholder: "Select date" },
    { name: "startDate", label: "Start Date*", type: "date", placeholder: "Select date" },
    { name: "endDate", label: "End Date*", type: "date", placeholder: "Select date" },
    { name: "srRoute", label: "SR Route*", type: "text", placeholder: "SR Route" },
    { name: "dbePercentage", label: "DBE %*", type: "text", placeholder: "DBE %" },
    { name: "workType", label: "Work Type", type: "select", placeholder: "Choose", options: ['RATED', 'NON-RATED'] },
    { name: "oneWayTravelTime", label: "One Way Travel Time (Mins)*", type: "number", placeholder: "One Way Travel Time (Mins)" },
    { name: "oneWayMileage", label: "One Way Mileage*", type: "number", placeholder: "One Way Mileage" },
    { name: "dieselCost", label: "Diesel Cost Per Gallon*", type: "number", placeholder: "Diesel Cost Per Gallon" },
    { name: "laborRate", label: "Labor Rate*", type: "number", placeholder: "0", hasToggle: true },
    { name: "fringeRate", label: "Fringe Rate*", type: "number", placeholder: "0", hasToggle: true },
    { name: "shopRate", label: "Shop Rate*", type: "number", placeholder: "0", hasToggle: true },
    { name: "winterShutdown", label: "Winter Shutdown", type: "toggle" },
  ],
};

const AdminInformationStep1 = ({
  currentStep,
  setCurrentStep,
}: {
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
}) => {

  const { adminData, dispatch } = useEstimate();

  useEffect(() => {
    dispatch({type: 'ADD_MPT_RENTAL'})
    dispatch({ type: 'ADD_FLAGGING' });
    dispatch({ type: 'ADD_SERVICE_WORK' })
  }, [])
  
  // State for toggle buttons
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({
    laborRate: false,
    fringeRate: false,
    shopRate: false,
    winterShutdown: !!adminData.winterStart || !!adminData.winterEnd,
  });

  // State for dropdown options
  const [counties, setCounties] = useState<County[]>([]);
  const [estimators, setEstimators] = useState<{ id: number; name: string }[]>([]);
  const [owners, setOwners] = useState<{ id: string; name: string }[]>([]);

  // State for popover open states
  const [openStates, setOpenStates] = useState({
    county: false,
    estimator: false,
    owner: false,
  });

  // State for loading status
  const [isLoading, setIsLoading] = useState({
    counties: false,
    branches: false,
    estimators: false,
    divisions: false,
    owners: false,
  });

  // Function to check if all rates are acknowledged and have values
  const areAllRatesAcknowledged = () => {
    // All three checkboxes must be checked
    return (
      toggleStates.laborRate &&
      toggleStates.fringeRate &&
      toggleStates.shopRate
    );
  };

  // Fetch reference data for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch counties
        setIsLoading((prev) => ({ ...prev, counties: true }));
        const countiesData = await fetchReferenceData("counties");
        console.log(countiesData)
        setCounties(countiesData);
        setIsLoading((prev) => ({ ...prev, counties: false }));

        // Fetch estimators (users)
        setIsLoading((prev) => ({ ...prev, estimators: true }));
        const estimatorsData = await fetchReferenceData("users");
        setEstimators(estimatorsData);
        setIsLoading((prev) => ({ ...prev, estimators: false }));

        // Fetch owners
        setIsLoading((prev) => ({ ...prev, owners: true }));
        const ownersData = await fetchReferenceData("owners");
        setOwners(ownersData);
        setIsLoading((prev) => ({ ...prev, owners: false }));
      } catch (error) {
        console.error("Error fetching reference data:", error);
        // Reset loading states
        setIsLoading({
          counties: false,
          branches: false,
          estimators: false,
          divisions: false,
          owners: false,
        });
      }
    };

    fetchData();
  }, []);

  // When county changes
  useEffect(() => {
    // If county selection changes, any necessary updates 
  }, [adminData.county]);

  const handleInputChange = (field: string, value: string | number | boolean) => {
    // Map the field names to the appropriate adminData structure
    if (field === "contractNumber" || 
        field === "estimator" || 
        field === "owner" || 
        field === "srRoute") {
      dispatch({ 
        type: 'UPDATE_ADMIN_DATA', 
        payload: { key: field, value } 
      });
    } else if (field === "dbePercentage") {
      dispatch({ 
        type: 'UPDATE_ADMIN_DATA', 
        payload: { key: "dbe", value } 
      });
    } else if (field === "township") {
      dispatch({ 
        type: 'UPDATE_ADMIN_DATA', 
        payload: { key: "location", value } 
      });
    } else if (field === "division") {
      const divisionValue = (value === "PUBLIC" || value === "PRIVATE") ? value : null;
      dispatch({ 
        type: 'UPDATE_ADMIN_DATA', 
        payload: { key: "division", value: divisionValue } 
      });
    } else if (field === "workType") {
      dispatch({ 
        type: 'UPDATE_ADMIN_DATA', 
        payload: { key: "rated", value } 
      });
    } else if (field === "lettingDate") {
      dispatch({ 
        type: 'UPDATE_ADMIN_DATA', 
        payload: { key: "lettingDate", value: value ? new Date(value as string) : null } 
      });
    } else if (field === "startDate" || field === "endDate") {
      dispatch({ 
        type: 'UPDATE_ADMIN_DATA', 
        payload: { key: field, value: value ? new Date(value as string) : null } 
      });
    } else if (field === "oneWayTravelTime") {
      dispatch({ 
        type: 'UPDATE_ADMIN_DATA', 
        payload: { key: "owTravelTimeMins", value: Number(value) } 
      });
    } else if (field === "oneWayMileage") {
      dispatch({ 
        type: 'UPDATE_ADMIN_DATA', 
        payload: { key: "owMileage", value: Number(value) } 
      });
    } else if (field === "dieselCost") {
      dispatch({ 
        type: 'UPDATE_ADMIN_DATA', 
        payload: { key: "fuelCostPerGallon", value: Number(value) } 
      });
    }
  };

  const handleCountyChange = (countyId: string) => {
    const selectedCounty = counties.find(c => c.id.toString() === countyId);
    if (selectedCounty) {
      // Create a new County object with the required properties
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

      setOpenStates(prev => ({ ...prev, county: false }));
    }
  };

  const handleEstimatorChange = (estimatorName: string) => {
    dispatch({
      type: 'UPDATE_ADMIN_DATA',
      payload: { key: 'estimator', value: estimatorName }
    });
    setOpenStates(prev => ({ ...prev, estimator: false }));
  };

  const handleOwnerChange = (ownerName: string) => {
    dispatch({
      type: 'UPDATE_ADMIN_DATA',
      payload: { key: 'owner', value: ownerName }
    });
    setOpenStates(prev => ({ ...prev, owner: false }));
  };

  const handleRateChange = (field: string, value: string) => {
    const numValue = Number(value);
    if (field === "laborRate") {
      dispatch({
        type: 'UPDATE_ADMIN_DATA',
        payload: { key: 'county.laborRate', value: numValue }
      });
    } else if (field === "fringeRate") {
      dispatch({
        type: 'UPDATE_ADMIN_DATA',
        payload: { key: 'county.fringeRate', value: numValue }
      });
    } else if (field === "shopRate") {
      dispatch({
        type: 'UPDATE_ADMIN_DATA',
        payload: { key: 'county.shopRate', value: numValue }
      });
    }
  };

  const handleToggleChange = (field: string) => {
    setToggleStates((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleNext = () => {
    setCurrentStep(2);
  };

  return (
    <div>
      <div className="relative">
        <button
          onClick={() => setCurrentStep(1)}
          className={`group flex w-full items-start gap-4 py-4 text-left ${currentStep === 1 ? "text-foreground" : "text-muted-foreground"
            }`}
        >
          <div
            className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm ${1 <= currentStep
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground bg-background"
              }`}
          >
            1
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-base font-medium">{step.name}</div>
            <div className="text-sm text-muted-foreground">
              {step.description}
            </div>
          </div>
        </button>

        {/* Collapsible Content */}
        {currentStep === 1 && (
          <div className="mt-2 mb-6 ml-12 text-sm text-muted-foreground">
            <div className="space-y-8">
              <div className="max-w-xl grid grid-cols-2 gap-6">
                {step.fields.map((field) => (
                  <div key={field.name} className="space-y-2.5">
                    <Label
                      htmlFor={field.name}
                      className="text-sm font-medium text-muted-foreground"
                    >
                      {field.label}
                    </Label>
                    {field.name === "county" || field.name === "estimator" || field.name === "owner" ? (
                      <Popover
                        open={openStates[field.name]}
                        onOpenChange={(open) => setOpenStates(prev => ({...prev, [field.name]: open}))}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openStates[field.name]}
                            className="w-full justify-between"
                          >
                            {field.name === "county" ? 
                              (adminData.county && adminData.county.name ? adminData.county.name : "Select county...") :
                             field.name === "estimator" ? 
                              (adminData.estimator || "Select estimator...") :
                             field.name === "owner" ? 
                              (adminData.owner || "Select owner...") :
                              "Select..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                          <Command>
                            <CommandInput placeholder={`Search ${field.name}...`} />
                            <CommandEmpty>No {field.name} found.</CommandEmpty>
                            <CommandGroup className="max-h-[200px] overflow-y-auto">
                              {field.name === "county" && counties.map((county) => (
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
                              {field.name === "estimator" && estimators.map((estimator) => (
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
                              {field.name === "owner" && owners.map((owner) => (
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
                    ) : field.name === "division" || field.name === "workType" ? (
                      <RadioGroup
                        value={
                          field.name === "division" ? adminData.division || "" :
                          field.name === "workType" ? (adminData.rated === "RATED" ? "RATED" : "NON-RATED") : ""
                        }
                        onValueChange={(value) => handleInputChange(field.name, value)}
                        className="flex flex-col space-y-1"
                      >
                        {field.options &&
                          field.options.map((option, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <RadioGroupItem value={option} id={`${field.name}-${option}`} />
                              <Label htmlFor={`${field.name}-${option}`}>{option}</Label>
                            </div>
                          ))}
                      </RadioGroup>
                    ) : field.type === "toggle" ? (
                      <div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={field.name}
                            checked={toggleStates.winterShutdown}
                            onCheckedChange={(checked) => {
                              setToggleStates(prev => ({
                                ...prev,
                                winterShutdown: checked
                              }));
                            }}
                          />
                          <Label htmlFor={field.name} className="text-sm">
                            {field.label}
                          </Label>
                        </div>
                        
                        {toggleStates.winterShutdown && (
                          <div className="mt-4 grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="winterStart" className="text-sm">Winter Start Date</Label>
                              <Input
                                id="winterStart"
                                type="date"
                                value={adminData.winterStart 
                                  ? (typeof adminData.winterStart === 'string' 
                                    ? adminData.winterStart 
                                    : adminData.winterStart.toISOString().split('T')[0])
                                  : ""}
                                onChange={(e) => {
                                  dispatch({
                                    type: 'UPDATE_ADMIN_DATA',
                                    payload: { 
                                      key: 'winterStart', 
                                      value: e.target.value ? new Date(e.target.value) : null 
                                    }
                                  });
                                }}
                                className="h-10"
                              />
                            </div>
                            <div>
                              <Label htmlFor="winterEnd" className="text-sm">Winter End Date</Label>
                              <Input
                                id="winterEnd"
                                type="date"
                                value={adminData.winterEnd 
                                  ? (typeof adminData.winterEnd === 'string' 
                                    ? adminData.winterEnd 
                                    : adminData.winterEnd.toISOString().split('T')[0])
                                  : ""}
                                onChange={(e) => {
                                  dispatch({
                                    type: 'UPDATE_ADMIN_DATA',
                                    payload: { 
                                      key: 'winterEnd', 
                                      value: e.target.value ? new Date(e.target.value) : null 
                                    }
                                  });
                                }}
                                className="h-10"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Input
                          id={field.name}
                          type={field.type}
                          placeholder={field.placeholder}
                          value={
                            field.name === "contractNumber" ? adminData.contractNumber || "" :
                            field.name === "township" ? adminData.location || "" :
                            field.name === "srRoute" ? adminData.srRoute || "" :
                            field.name === "dbePercentage" ? adminData.dbe || "" :
                            field.name === "lettingDate" ? 
                              adminData.lettingDate ? 
                                (typeof adminData.lettingDate === 'string' ? 
                                  adminData.lettingDate : 
                                  adminData.lettingDate.toISOString().split('T')[0]) 
                                : "" :
                            field.name === "startDate" ? 
                              adminData.startDate ? 
                                (typeof adminData.startDate === 'string' ? 
                                  adminData.startDate : 
                                  adminData.startDate.toISOString().split('T')[0]) 
                                : "" :
                            field.name === "endDate" ? 
                              adminData.endDate ? 
                                (typeof adminData.endDate === 'string' ? 
                                  adminData.endDate : 
                                  adminData.endDate.toISOString().split('T')[0]) 
                                : "" :
                            field.name === "oneWayTravelTime" ? adminData.owTravelTimeMins || "" :
                            field.name === "oneWayMileage" ? adminData.owMileage || "" :
                            field.name === "dieselCost" ? adminData.fuelCostPerGallon || "" :
                            field.name === "laborRate" ? adminData.county?.laborRate || "" :
                            field.name === "fringeRate" ? adminData.county?.fringeRate || "" :
                            field.name === "shopRate" ? adminData.county?.shopRate || "" :
                            ""
                          }
                          onChange={(e) => {
                            if (field.name === "laborRate" || field.name === "fringeRate" || field.name === "shopRate") {
                              handleRateChange(field.name, e.target.value);
                            } else {
                              handleInputChange(field.name, e.target.value);
                            }
                          }}
                          className="h-10"
                        />
                        {field.hasToggle && (
                          <div className="flex items-center gap-2">
                            <Label
                              htmlFor={`${field.name}-toggle`}
                              className="text-sm text-muted-foreground"
                            >
                              Use this rate?
                            </Label>
                            <input
                              id={`${field.name}-toggle`}
                              type="checkbox"
                              checked={!!toggleStates[field.name]}
                              onChange={() => handleToggleChange(field.name)}
                              className="h-4 w-4"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-4">
                {!areAllRatesAcknowledged() && (
                  <div className="flex items-center gap-2 text-amber-500">
                    <AlertCircle size={16} />
                    <span>
                      Please ensure all rate fields have values and are
                      acknowledged by checking the boxes before proceeding.
                    </span>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button
                    onClick={handleNext}
                    disabled={!areAllRatesAcknowledged()}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInformationStep1;