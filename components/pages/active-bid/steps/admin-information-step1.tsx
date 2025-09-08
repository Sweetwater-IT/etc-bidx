"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Step } from "@/types/IStep";
import {
  createActiveBid,
  fetchActiveBidById,
  fetchBidById,
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
import { useSearchParams } from "next/navigation";
import { useLoading } from "@/hooks/use-loading";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { safeNumber } from "@/lib/safe-number";
import { formatDecimal } from "@/lib/formatDecimals";
import { defaultFlaggingObject } from "@/types/default-objects/defaultFlaggingObject";
import { useAuth } from "@/contexts/auth-context";
import { defaultPermanentSignsObject } from "@/types/default-objects/defaultPermanentSignsObject";
import { INote } from "@/types/TEstimate";


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
    { name: "oneWayTravelTime", label: "One Way Travel Time*", type: "number" },
    { name: "oneWayMileage", label: "One Way Mileage*", type: "number", placeholder: "One Way Mileage" },
    { name: "dieselCost", label: "Diesel Cost Per Gallon*", type: "text", placeholder: "Diesel Cost Per Gallon" },
    { name: "laborRate", label: "Labor Rate*", type: "text", placeholder: "0", hasToggle: true },
    { name: "fringeRate", label: "Fringe Rate*", type: "text", placeholder: "0", hasToggle: true },
    { name: "shopRate", label: "Shop Rate*", type: "text", placeholder: "0", hasToggle: true },
    { name: "winterShutdown", label: "Winter Shutdown", type: "toggle" },
  ],
};

const AdminInformationStep1 = () => {

  const { adminData, dispatch, ratesAcknowledged, firstSaveTimestamp, mptRental,
    flagging, serviceWork, saleItems, equipmentRental, notes, permanentSigns } = useEstimate();

  const searchParams = useSearchParams();
  const availableJobId = searchParams?.get('jobId');
  const source = searchParams?.get('source');
  const bidId = searchParams?.get('bidId')
  const { startLoading, stopLoading } = useLoading();
  const { user } = useAuth();

  useEffect(() => {
    dispatch({ type: 'ADD_MPT_RENTAL' })
    dispatch({ type: 'ADD_FLAGGING' });
    dispatch({ type: 'ADD_SERVICE_WORK' })
    dispatch({ type: 'ADD_PERMANENT_SIGNS' })
  }, [dispatch])

  // State for toggle buttons
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({
    laborRate: false,
    fringeRate: false,
    shopRate: false,
    winterShutdown: !!adminData.winterStart || !!adminData.winterEnd,
  });

  const [digits, setDigits] = useState({
    laborRate: "000",
    fringeRate: "000",
    shopRate: "000",
    dieselCost: "000",
  });

  const [owHours, setOwHours] = useState<number>(Math.floor(safeNumber(adminData.owTravelTimeMins) / 60));
  const [owMinutes, setOwMinutes] = useState<number>((safeNumber(adminData.owTravelTimeMins) % 60));
  const owDecimalHours = (owHours + owMinutes / 60).toFixed(1); 
  const owTotalMinutes = owHours * 60 + owMinutes;

  const handleOwTravelTimeChange = (type: 'hours' | 'minutes', value: number) => {
    const currentOwMinutes = safeNumber(adminData.owTravelTimeMins);
    const extraMinutes = currentOwMinutes % 60;
    const newOwMinutes = type === 'hours' ? (value * 60) + extraMinutes : (safeNumber(owHours) * 60) + value;
    dispatch({
      type: 'UPDATE_ADMIN_DATA',
      payload: {
        key: 'owTravelTimeMins',
        value: newOwMinutes
      }
    })

    setOwHours(Math.floor(newOwMinutes / 60))
    setOwMinutes(newOwMinutes % 60);
  }

  useEffect(() => {
    const totalMins = safeNumber(adminData.owTravelTimeMins); 
    setOwHours(Math.floor(totalMins / 60));
    setOwMinutes(totalMins % 60);
  }, [adminData.owTravelTimeMins]);


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

  // Function to check if all rates are acknowledged and have values
  const areAllRatesAcknowledged = () => {
    // All three checkboxes must be checked
    return (
      toggleStates.laborRate &&
      toggleStates.fringeRate &&
      toggleStates.shopRate
    );
  };

  const setProjectEndDateFromDays = (days: number) => {
    if (!adminData.startDate) return;

    const startDate = adminData.startDate;
    // Calculate new end date
    const newEndDate = new Date(startDate.getTime() + (days * 24 * 60 * 60 * 1000));

    // Update context
    dispatch({
      type: 'UPDATE_ADMIN_DATA',
      payload: { key: 'endDate', value: newEndDate }
    });
  };

  //set toggle states to true when editing a bid
  useEffect(() => {
    if (bidId && bidId !== '')
      setToggleStates(prev => ({ ...prev, fringeRate: true, laborRate: true, shopRate: true }))
  }, [bidId])

  useEffect(() => {
    const allRatesAcknowledged = toggleStates.laborRate && toggleStates.fringeRate && toggleStates.shopRate;

    // Only dispatch if the value actually needs to change
    if (allRatesAcknowledged !== ratesAcknowledged) {
      dispatch({
        type: 'SET_RATES_ACKNOWLEDGED',
        payload: allRatesAcknowledged
      });
    }
  }, [toggleStates.laborRate, toggleStates.fringeRate, toggleStates.shopRate, dispatch])

  // Fetch reference data for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      startLoading();

      let countiesData: County[] = [];
      let ownersData: { id: string, name: string }[] = [];
      try {
        // Fetch counties
        countiesData = await fetchReferenceData("counties");
        setCounties(countiesData);

        // Fetch estimators (users)
        const estimatorsData = await fetchReferenceData("users");
        setEstimators(estimatorsData);

        // Fetch owners
        ownersData = await fetchReferenceData("owners");
        setOwners(ownersData);

        // If we have prefilled data, set the open states to show the selected values
        if (adminData) {
          // Check if we have prefilled values and update open states
          if (adminData.county && adminData.county.name) {
            setOpenStates(prev => ({ ...prev, county: false }));
          }
          if (adminData.estimator) {
            setOpenStates(prev => ({ ...prev, estimator: false }));
          }
          if (adminData.owner) {
            setOpenStates(prev => ({ ...prev, owner: false }));
          }

          // Set toggle states based on prefilled data
          setToggleStates(prev => ({
            ...prev,
            winterShutdown: !!adminData.winterStart || !!adminData.winterEnd
          }));
        }
      } catch (error) {
        toast.error("Error fetching reference data:" + error);
      }

      if (availableJobId && source && source === 'available-jobs') {
        try {
          const data = await fetchBidById(parseInt(availableJobId), true);

          dispatch({ type: 'UPDATE_ADMIN_DATA', payload: { key: 'contractNumber', value: data.contract_number } });
          dispatch({ type: 'UPDATE_ADMIN_DATA', payload: { key: 'dbe', value: data.dbe_percentage ? Number(data.dbe_percentage) : 0 } });
          if (!!data.letting_date) {
            dispatch({ type: 'UPDATE_ADMIN_DATA', payload: { key: 'lettingDate', value: new Date(data.letting_date) } });
          }
          dispatch({ type: 'UPDATE_ADMIN_DATA', payload: { key: 'location', value: data.location } });
          dispatch({ type: 'UPDATE_ADMIN_DATA', payload: { key: 'srRoute', value: data.state_route } });
          const associatedCounty = countiesData.find(c => c.name === data.county)
          if (associatedCounty) {
            dispatch({ type: 'UPDATE_ADMIN_DATA', payload: { key: 'county', value: associatedCounty } })
          }
          const associatedOwner = ownersData.find(o => o.name === data.owner);
          if (associatedOwner) {
            dispatch({ type: 'UPDATE_ADMIN_DATA', payload: { key: 'owner', value: associatedOwner.name } });
          }
        } catch (err) {
          toast.error("Couldn't populate bid with data from available job " + availableJobId + ' ' + err)
        }
      }
      else if (bidId) {
        const data = await fetchActiveBidById(bidId);
        const bidNotes: INote[] = data.notes.map(note => ({
          text: note.text,
          timestamp: new Date(note.created_at).getTime()
        }));

        //estimate-view is not completley accurate yet, but eventually we could pass the whole down
        //to one reducer functio nand update all the state at once
        dispatch({ type: 'COPY_ADMIN_DATA', payload: data.admin_data as any });
        dispatch({ type: 'COPY_MPT_RENTAL', payload: data.mpt_rental as any });
        dispatch({ type: 'COPY_EQUIPMENT_RENTAL', payload: data.equipment_rental as any });
        dispatch({ type: 'COPY_FLAGGING', payload: data.flagging as any });
        dispatch({ type: 'COPY_SERVICE_WORK', payload: data.service_work as any });
        dispatch({ type: 'COPY_SALE_ITEMS', payload: data.sale_items as any });
        dispatch({ type: 'COPY_PERMANENT_SIGNS', payload: data.permanent_signs ?? defaultPermanentSignsObject });
        dispatch({ type: 'COPY_NOTES', payload: bidNotes });
        dispatch({ type: 'SET_FIRST_SAVE', payload: new Date(data.created_at).getTime() })
      }
      stopLoading();
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (adminData.rated === 'NON-RATED') {
      setToggleStates(prev => ({
        ...prev,
        laborRate: true,
        fringeRate: true
      }))
    }
  }, [adminData.rated])

  //When county changes, update digits for rates
  useEffect(() => {
    if (adminData.county) {
      setDigits((prev) => ({
        ...prev,
        laborRate: Math.round((adminData.county.laborRate || 0) * 100)
          .toString()
          .padStart(3, "0"),

        fringeRate: Math.round((adminData.county.fringeRate || 0) * 100)
          .toString()
          .padStart(3, "0"),

        shopRate: Math.round((adminData.county.shopRate || 0) * 100)
          .toString()
          .padStart(3, "0"),
      }));
    }
  }, [adminData.county]);

  useEffect(() => {
    // Set initial estimator to logged-in user if not already set
    if (
      estimators.length > 0 &&
      user?.email &&
      !adminData.estimator // only if not already set
    ) {
      const dbUser = estimators.find((u: any) => u.email === user.email);
      if (dbUser) {
        dispatch({
          type: 'UPDATE_ADMIN_DATA',
          payload: { key: 'estimator', value: dbUser.name }
        });
      }
    }
  }, [estimators, user, adminData.estimator, dispatch]);

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
      console.log("Diesel Cost", value);
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
        market: selectedCounty.market || 'LOCAL',
        country: selectedCounty.country || 'USA'
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

  function handleNextDigits(current: string, inputType: string, data: string): string {
    let digits = current;

    if (inputType === "insertText" && /\d/.test(data)) {
      const candidate = current + data;
      if (parseInt(candidate, 10) <= 99999) digits = candidate;
    } else if (inputType === "deleteContentBackward") {
      digits = current.slice(0, -1);
    }

    return digits.padStart(3, "0");
  }

  //sync with changes from accordion
  useEffect(() => {
    if (adminData.fuelCostPerGallon !== null && adminData.fuelCostPerGallon !== undefined) {
      setDigits((prev) => ({
        ...prev,
        dieselCost: Math.round((adminData.fuelCostPerGallon || 0) * 100)
          .toString()
          .padStart(3, "0"),
      }));
    }
  }, [adminData.fuelCostPerGallon]);

  return (
    <div>
      <div className="relative">
        {/* Collapsible Content */}
        <div className="mt-2 mb-6 ml-12 text-sm text-muted-foreground">
          <div className="space-y-8">
            {adminData.startDate && (
              <div className="bg-muted w-fit px-4 py-2 rounded-md">
                <div className="flex flex-col gap-4">
                  <div className="text-sm font-medium">
                    Set project end date as number of days out from start date:
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      className="px-3 py-1 cursor-pointer hover:bg-primary"
                      onClick={() => setProjectEndDateFromDays(30)}
                    >
                      30
                    </Badge>
                    <Badge
                      className="px-3 py-1 cursor-pointer hover:bg-primary"
                      onClick={() => setProjectEndDateFromDays(60)}
                    >
                      60
                    </Badge>
                    <Badge
                      className="px-3 py-1 cursor-pointer hover:bg-primary"
                      onClick={() => setProjectEndDateFromDays(90)}
                    >
                      90
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Input
                        className="w-20"
                        onChange={(e) => setProjectEndDateFromDays(safeNumber(parseInt(e.target.value)))}
                        placeholder="Days"
                        type="number"
                        min="1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="max-w-xl grid grid-cols-2 gap-6">
              {step.fields.map((field) => (
                <div key={field.name} className="space-y-2.5">
                  <Label
                    htmlFor={field.name}
                    className="text-sm font-medium text-muted-foreground"
                  >
                    {field.label}
                  </Label>
                  {field.name === "county" ? (
                    <Popover open={openStates.county} modal={false} onOpenChange={(open) => setOpenStates(prev => ({ ...prev, county: open }))}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openStates.county}
                          className="w-full justify-between"
                        >
                          {adminData.county?.name || "Select county..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-full p-0"
                        avoidCollisions={false} // Prevents auto-repositioning
                      >
                        <Command>
                          <CommandInput placeholder="Search county..." />
                          <CommandEmpty>No county found.</CommandEmpty>
                          <CommandGroup className="h-80 overflow-y-auto">
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
                  ) : field.name === "estimator" ? (
                    <Popover open={openStates.estimator} onOpenChange={(open) => setOpenStates(prev => ({ ...prev, estimator: open }))}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openStates.estimator}
                          className="w-full justify-between"
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
                  ) : field.name === "owner" ? (
                    <Popover open={openStates.owner} onOpenChange={(open) => setOpenStates(prev => ({ ...prev, owner: open }))}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openStates.owner}
                          className="w-full justify-between"
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
                  ) : field.name === "division" || field.name === "workType" ? (
                    <RadioGroup
                      value={field.name === "division" ? adminData.division || undefined : adminData.rated}
                      onValueChange={(value) =>
                        field.name === "division"
                          ? dispatch({ type: 'UPDATE_ADMIN_DATA', payload: { key: 'division', value } })
                          : dispatch({ type: 'UPDATE_ADMIN_DATA', payload: { key: 'rated', value } })
                      }
                      className="flex flex-col space-y-1"
                    >
                      {field.options?.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`${field.name}-${option.value}`} />
                          <Label
                            htmlFor={`${field.name}-${option}`}
                            className="text-sm font-normal"
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : field.name === "winterShutdown" ? (
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
                  ) : field.name === "oneWayTravelTime" ? (
                    <div className="space-y-2">
                      <div className="flex space-x-4">
                        <div className="flex-1 flex flex-col space-y-2">
                          <Label htmlFor="owHoursInput" className="text-sm font-medium">
                            Hours
                          </Label>
                          <Input
                            id="owHoursInput"
                            type="number"
                            min="0"
                            value={owHours === 0 ? "" : owHours}
                            onChange={(e) => {
                              const value = e.target.value;
                              const numValue = value === "" ? 0 : parseInt(value);
                              if (!isNaN(numValue)) {
                                handleOwTravelTimeChange("hours", numValue);
                              }
                            }}
                            placeholder="00"
                            className="h-10"
                            onKeyDown={(e) => ["e", "E", "+", "-", "."].includes(e.key) && e.preventDefault()}
                          />
                        </div>
                        <div className="flex-1 flex flex-col space-y-2">
                          <Label htmlFor="owMinutesInput" className="text-sm font-medium">
                            Minutes
                          </Label>
                          <Input
                            id="owMinutesInput"
                            type="number"
                            min="0"
                            max="59"
                            value={owMinutes === 0 ? "" : owMinutes}
                            onChange={(e) => {
                              const value = e.target.value;
                              const numValue = value === "" ? 0 : Math.min(parseInt(value), 59);
                              if (!isNaN(numValue)) {
                                handleOwTravelTimeChange("minutes", numValue);
                              }
                            }}
                            placeholder="00"
                            className="h-10"
                            onKeyDown={(e) => ["e", "E", "+", "-", "."].includes(e.key) && e.preventDefault()}
                          />
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center space-x-2">
                        <p className="text-sm text-gray-500">
                          ({owTotalMinutes} mins, {owDecimalHours} hrs)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative space-y-2">
                      <Input
                        id={field.name}
                        type={field.type}
                        inputMode="decimal"
                        pattern="^\\d*(\\.\\d{0,2})?$"
                        placeholder={field.placeholder}
                        value={
                          field.name === "contractNumber" ? adminData.contractNumber || "" :
                            field.name === "township" ? adminData.location || "" :
                              field.name === "srRoute" ? adminData.srRoute || "" :
                                field.name === "dbePercentage" ? adminData.dbe || "" :
                                  //date handling to parse a date if necessary
                                  field.name === "lettingDate" ?
                                    adminData.lettingDate ?
                                      (typeof adminData.lettingDate === 'string' ?
                                        adminData.lettingDate :
                                        adminData.lettingDate.toISOString().split('T')[0])
                                      : "" :
                                    //date handling to parse a date if necessary
                                    field.name === "startDate" ?
                                      adminData.startDate ?
                                        (typeof adminData.startDate === 'string' ?
                                          adminData.startDate :
                                          adminData.startDate.toISOString().split('T')[0])
                                        : "" :
                                      //date handling to parse a date if necessary
                                      field.name === "endDate" ?
                                        adminData.endDate ?
                                          (typeof adminData.endDate === 'string' ?
                                            adminData.endDate :
                                            adminData.endDate.toISOString().split('T')[0])
                                          : "" :
                                        field.name === "oneWayMileage" ? adminData.owMileage || "" :
                                          field.name === "dieselCost" ? `$ ${formatDecimal(digits.dieselCost)}` || "" :
                                            field.name === "laborRate" ? `$ ${formatDecimal(digits.laborRate)}` || "" :
                                              field.name === "fringeRate" ? `$ ${formatDecimal(digits.fringeRate)}` || "" :
                                                field.name === "shopRate" ? `$ ${formatDecimal(digits.shopRate)}` || "" :
                                                  ""
                        }
                        onBlur={async () => {
                          if (field.name === 'contractNumber' && (!bidId || bidId.trim() === '') && !firstSaveTimestamp) {
                            try {
                              // add 0 to simulate saving state
                              dispatch({ type: 'SET_FIRST_SAVE', payload: 0 })
                              const createResponse = await createActiveBid(adminData, mptRental, equipmentRental, flagging ?? defaultFlaggingObject,
                                serviceWork ?? defaultFlaggingObject, saleItems, permanentSigns ?? defaultPermanentSignsObject, 'DRAFT', notes);
                              dispatch({ type: 'SET_FIRST_SAVE', payload: 1 })
                              dispatch({ type: 'SET_ID', payload: createResponse.id })
                            } catch (err) {
                              toast.error('Failed to save bid' + err)
                            }
                          }
                        }}
                        onChange={(e) => {
                          const ev = e.nativeEvent as InputEvent;
                          const { inputType } = ev;
                          const data = (ev.data || "").replace(/\$/g, "");

                          if (
                            field.name === "dieselCost" ||
                            field.name === "laborRate" ||
                            field.name === "fringeRate" ||
                            field.name === "shopRate"
                          ) {
                            const nextDigits = handleNextDigits(digits[field.name], inputType, data);
                            setDigits((prev) => ({ ...prev, [field.name]: nextDigits, }));

                            const formatted = (parseInt(nextDigits, 10) / 100).toFixed(2);

                            if (field.name === "dieselCost") {
                              handleInputChange("dieselCost", formatted);
                            } else {
                              handleRateChange(field.name, formatted);
                            }
                          } else {
                            const valueToUse = (field.name === "contractNumber" || field.name === "township" || field.name === "srRoute") ? e.target.value.toUpperCase() : e.target.value
                            handleInputChange(field.name, valueToUse);
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInformationStep1;
