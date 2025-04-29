import { FormData } from "@/types/IFormData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Step } from "@/types/IStep";
import { InputData } from "@/types/InputData";
import {
    fetchBranchShopRate,
    fetchCountyRates,
    fetchReferenceData,
} from "@/lib/api-client";
import React, { useEffect, useState, useCallback } from "react";
import { AlertCircle } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

const step: Step = {
    id: "step-1",
    name: "Admin Information",
    description: "Basic information about the bid",
    fields: [
        { name: "contractNumber", label: "Contract Number*", type: "text", placeholder: "Contract Number" },
        { name: "estimator", label: "Estimator*", type: "select", placeholder: "Estimator" },
        //Potential to-do: add owners as a table in db to allow for new owners to be added from control panel
        //for now we'll hardcode them
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
    formData,
    setFormData,
}: {
    currentStep: number;
    setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
    formData: FormData;
    setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}) => {
    // State for toggle buttons
    const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({
        laborRate: false,
        fringeRate: false,
        shopRate: false,
        winterShutdown: false,
    });

    // Function to check if all rates are acknowledged and have values
    const areAllRatesAcknowledged = () => {
        // All three checkboxes must be checked AND their corresponding inputs must have values
        return (
            toggleStates.laborRate &&
            toggleStates.fringeRate &&
            toggleStates.shopRate &&
            !!formData.adminData.county.laborRate &&
            !!formData.adminData.county.fringeRate &&
            !!formData.adminData.county.shopRate
        );
    };

    // State for dropdown options
    const [counties, setCounties] = useState<{ id: number; name: string }[]>([]);
    const [estimators, setEstimators] = useState<{ id: number; name: string }[]>(
        []
    );
    const [owners, setOwners] = useState<{ id: string; name: string }[]>([]);

    // State for loading status
    const [isLoading, setIsLoading] = useState({
        counties: false,
        branches: false,
        estimators: false,
        divisions: false,
        owners: false,
    });

    const [openStates, setOpenStates] = useState<Record<string, boolean>>({});

    // Fetch reference data for dropdowns
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch counties
                setIsLoading((prev) => ({ ...prev, counties: true }));
                const countiesData = await fetchReferenceData("counties");
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

    const updateFormData = useCallback(
        (updates: Partial<FormData>) => {
            setFormData((prev) => ({
                ...prev,
                ...updates,
            }));
        },
        [setFormData]
    );

    // TO-DO just take this whole thing out and get the information from the first api call to the counties
    // useEffect(() => {
    //     const updateRatesAndBranch = async () => {
    //         if (formData.adminData.county) {
    //             try {
    //                 const rates = await fetchCountyRates(formData.adminData.county.name);
    //                 if (rates) {
    //                     const updates: Partial<FormData> = {};

    //                     // Always set the branch value from county data
    //                     if (rates.branch_id) {
    //                         updates.adminData.county.branch = rates.branch_id.toString();
    //                     }

    //                     // Only update rates if not manually set
    //                     if (!toggleStates.laborRate) {
    //                         updates.laborRate = rates.labor_rate?.toString() || "";
    //                     }

    //                     if (!toggleStates.fringeRate) {
    //                         updates.fringeRate = rates.fringe_rate?.toString() || "";
    //                     }

    //                     if (!toggleStates.shopRate && rates.branch_id) {
    //                         try {
    //                             const shopRate = await fetchBranchShopRate(rates.branch_id);
    //                             if (shopRate) {
    //                                 updates.shopRate = shopRate.toString();
    //                             }
    //                         } catch (error) {
    //                             console.error("Error fetching branch shop rate:", error);
    //                         }
    //                     }

    //                     updateFormData(updates);
    //                 }
    //             } catch (error) {
    //                 console.error("Error fetching county rates:", error);
    //             }
    //         }
    //     };

    //     updateRatesAndBranch();
    // }, [
    //     formData.adminData.county,
    //     toggleStates.laborRate,
    //     toggleStates.fringeRate,
    //     toggleStates.shopRate,
    //     updateFormData,
    // ]);

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => {
            const newFormData = { ...prev };
            
            if (field === "contractNumber" || 
                field === "estimator" || 
                field === "owner" || 
                field === "srRoute" || 
                field === "dbePercentage") {
                newFormData.adminData = {
                    ...newFormData.adminData,
                    [field]: value
                };
            } else if (field === "township") {
                newFormData.adminData = {
                    ...newFormData.adminData,
                    location: value
                };
            } else if (field === "division") {
                newFormData.adminData = {
                    ...newFormData.adminData,
                    division: value
                };
            } else if (field === "county") {
                // For county, we need to update the county object
                const selectedCounty = counties.find(c => c.id.toString() === value);
                if (selectedCounty) {
                    newFormData.adminData = {
                        ...newFormData.adminData,
                        county: {
                            ...newFormData.adminData.county,
                            name: selectedCounty.name,
                            // Keep other county properties
                        }
                    };
                }
            } else if (field === "lettingDate" || field === "startDate" || field === "endDate") {
                // Handle date fields
                newFormData.adminData = {
                    ...newFormData.adminData,
                    [field]: value
                };
            } else {
                // For any other fields, use the original behavior
                newFormData[field as keyof FormData] = value as any;
            }
            
            return newFormData;
        });
    };

    const handleToggleChange = (field: string) => {
        setToggleStates((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    const handleNext = () => {
        // Don't need required fields as it's possible not all are known at the time
        // const requiredFields = [
        //     "contractNumber",
        //     "estimator",
        //     "owner",
        //     "county",
        //     "township",
        //     "branch",
        //     "division",
        //     "lettingDate",
        //     "startDate",
        //     "endDate",
        //     "srRoute",
        //     "dbePercentage",
        //     "oneWayTravelTime",
        //     "oneWayMileage",
        //     "dieselCost",
        //     "laborRate",
        //     "fringeRate",
        //     "shopRate",
        // ];

        // const missingFields = requiredFields.filter((field) => {
        //     const value = formData[field as keyof FormData];
        //     return !value || value === "";
        // });

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
                                        {field.name === "county" ? (
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
                                                        {formData.adminData.county && formData.adminData.county.name
                                                            ? formData.adminData.county.name
                                                            : "Select county..."}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Search county..." />
                                                        <CommandEmpty>No county found.</CommandEmpty>
                                                        <CommandGroup className="max-h-[200px] overflow-y-auto">
                                                            {counties.map((county) => (
                                                                <CommandItem
                                                                    key={county.id}
                                                                    value={county.name}
                                                                    onSelect={() => {
                                                                        handleInputChange("county", county.id.toString());
                                                                        setOpenStates(prev => ({...prev, [field.name]: false}));
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            formData.adminData.county.name === county.name ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {county.name}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        ) : field.type === "select" ? (
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
                                                        {field.name === "contractNumber" ? formData.adminData.contractNumber :
                                                         field.name === "estimator" ? formData.adminData.estimator :
                                                         field.name === "owner" ? formData.adminData.owner :
                                                         field.name === "county" ? formData.adminData.county?.name :
                                                         field.name === "township" ? formData.adminData.location :
                                                         field.name === "division" ? formData.adminData.division :
                                                         field.name === "workType" ? formData.adminData.rated :
                                                         `Select ${field.label.toLowerCase()}...`}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                                    <Command>
                                                        <CommandInput placeholder={`Search ${field.label.toLowerCase()}...`} />
                                                        <CommandEmpty>No {field.label.toLowerCase()} found.</CommandEmpty>
                                                        <CommandGroup className="max-h-[200px] overflow-y-auto">
                                                        </CommandGroup>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        ) : (
                                            <div className="space-y-2">
                                                <Input
                                                    id={field.name}
                                                    type={field.type}
                                                    placeholder={field.placeholder}
                                                    value={
                                                        field.name === "contractNumber" ? formData.adminData.contractNumber || "" :
                                                        field.name === "township" ? formData.adminData.location || "" :
                                                        field.name === "srRoute" ? formData.adminData.srRoute || "" :
                                                        field.name === "dbePercentage" ? formData.adminData.dbe || "" :
                                                        field.name === "lettingDate" && formData.adminData.lettingDate ? 
                                                            (typeof formData.adminData.lettingDate === 'string' ? 
                                                                formData.adminData.lettingDate : 
                                                                formData.adminData.lettingDate.toISOString().split('T')[0]) :
                                                        field.name === "startDate" && formData.adminData.startDate ? 
                                                            (typeof formData.adminData.startDate === 'string' ? 
                                                                formData.adminData.startDate : 
                                                                formData.adminData.startDate.toISOString().split('T')[0]) :
                                                        field.name === "endDate" && formData.adminData.endDate ? 
                                                            (typeof formData.adminData.endDate === 'string' ? 
                                                                formData.adminData.endDate : 
                                                                formData.adminData.endDate.toISOString().split('T')[0]) :
                                                        String(formData[field.name] ?? "")
                                                    }
                                                    onChange={(e) =>
                                                        handleInputChange(field.name, e.target.value)
                                                    }
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