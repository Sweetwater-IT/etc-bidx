import { FormData } from "@/app/active-bid/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchBranchShopRate, fetchCountyRates, fetchReferenceData } from "@/lib/api-client";
import React, { useEffect, useState, useCallback } from "react";
import { AlertCircle } from "lucide-react";

const step = {
    id: "step-1",
    name: "Admin Information",
    description: "Basic information about the bid",
    fields: [
        { name: "contractNumber", label: "Contract Number*", type: "text", placeholder: "Contract Number" },
        { name: "estimator", label: "Estimator*", type: "select", placeholder: "Ses Brunton" },
        { name: "owner", label: "Owner*", type: "select", placeholder: "Choose" },
        { name: "county", label: "County*", type: "select", placeholder: "Choose County" },
        { name: "township", label: "Township*", type: "text", placeholder: "Township" },
        { name: "division", label: "Division*", type: "select", placeholder: "Choose" },
        { name: "lettingDate", label: "Letting Date*", type: "date", placeholder: "Select date" },
        { name: "startDate", label: "Start Date*", type: "date", placeholder: "Select date" },
        { name: "endDate", label: "End Date*", type: "date", placeholder: "Select date" },
        { name: "srRoute", label: "SR Route*", type: "text", placeholder: "SR Route" },
        { name: "dbePercentage", label: "DBE %*", type: "text", placeholder: "DBE %" },
        { name: "workType", label: "Work Type", type: "select", placeholder: "Rated" },
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
        winterShutdown: false
    });
    
    // Function to check if all rates are acknowledged and have values
    const areAllRatesAcknowledged = () => {
        // All three checkboxes must be checked AND their corresponding inputs must have values
        return toggleStates.laborRate && toggleStates.fringeRate && toggleStates.shopRate &&
               !!formData.laborRate && !!formData.fringeRate && !!formData.shopRate;
    };
    
    // State for dropdown options
    const [counties, setCounties] = useState<{id: number, name: string}[]>([]);
    const [branches, setBranches] = useState<{id: number, name: string}[]>([]);
    const [estimators, setEstimators] = useState<{id: number, name: string}[]>([]);
    const [divisions, setDivisions] = useState<{id: string, name: string}[]>([]);
    const [owners, setOwners] = useState<{id: string, name: string}[]>([]);
    
    // State for loading status
    const [isLoading, setIsLoading] = useState({
        counties: false,
        branches: false,
        estimators: false,
        divisions: false,
        owners: false,
    });
    
    // Fetch reference data for dropdowns
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch counties
                setIsLoading(prev => ({ ...prev, counties: true }));
                const countiesData = await fetchReferenceData('counties');
                setCounties(countiesData);
                setIsLoading(prev => ({ ...prev, counties: false }));
                
                // Fetch branches
                setIsLoading(prev => ({ ...prev, branches: true }));
                const branchesData = await fetchReferenceData('branches');
                setBranches(branchesData);
                setIsLoading(prev => ({ ...prev, branches: false }));
                
                // Fetch estimators (users)
                setIsLoading(prev => ({ ...prev, estimators: true }));
                const estimatorsData = await fetchReferenceData('users');
                setEstimators(estimatorsData);
                setIsLoading(prev => ({ ...prev, estimators: false }));
                
                // Fetch divisions
                setIsLoading(prev => ({ ...prev, divisions: true }));
                const divisionsData = await fetchReferenceData('divisions');
                setDivisions(divisionsData);
                setIsLoading(prev => ({ ...prev, divisions: false }));
                
                // Fetch owners
                setIsLoading(prev => ({ ...prev, owners: true }));
                const ownersData = await fetchReferenceData('owners');
                setOwners(ownersData);
                setIsLoading(prev => ({ ...prev, owners: false }));
            } catch (error) {
                console.error('Error fetching reference data:', error);
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
    
    const updateFormData = useCallback((updates: Partial<FormData>) => {
        setFormData(prev => ({
            ...prev,
            ...updates
        }));
    }, [setFormData]);

    // Auto-fill rates and set branch when county changes
    useEffect(() => {
        const updateRatesAndBranch = async () => {
            if (formData.county) {
                try {
                    const rates = await fetchCountyRates(formData.county);
                    if (rates) {
                        const updates: Partial<FormData> = {};
                        
                        // Always set the branch value from county data
                        if (rates.branch_id) {
                            updates.branch = rates.branch_id.toString();
                        }
                        
                        // Only update rates if not manually set
                        if (!toggleStates.laborRate) {
                            updates.laborRate = rates.labor_rate?.toString() || '';
                        }
                        
                        if (!toggleStates.fringeRate) {
                            updates.fringeRate = rates.fringe_rate?.toString() || '';
                        }
                        
                        if (!toggleStates.shopRate && rates.branch_id) {
                            try {
                                const shopRate = await fetchBranchShopRate(rates.branch_id);
                                if (shopRate) {
                                    updates.shopRate = shopRate.toString();
                                }
                            } catch (error) {
                                console.error('Error fetching branch shop rate:', error);
                            }
                        }
                        
                        updateFormData(updates);
                    }
                } catch (error) {
                    console.error('Error fetching county rates:', error);
                }
            }
        };
        
        updateRatesAndBranch();
    }, [formData.county, toggleStates.laborRate, toggleStates.fringeRate, toggleStates.shopRate, updateFormData]);
    

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleToggleChange = (field: string) => {
        setToggleStates((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    const handleNext = () => {
        // Required fields for Step 1
        const requiredFields = [
            'contractNumber',
            'estimator',
            'owner',
            'county',
            'township',
            'branch',
            'division',
            'lettingDate',
            'startDate',
            'endDate',
            'srRoute',
            'dbePercentage',
            'oneWayTravelTime',
            'oneWayMileage',
            'dieselCost',
            'laborRate',
            'fringeRate',
            'shopRate'
        ];

        const missingFields = requiredFields.filter(field => {
            const value = formData[field as keyof FormData];
            return !value || value === '';
        });

        if (missingFields.length > 0) {
            // Show error message
            alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
            return;
        }

        // Validate rate acknowledgments
        if (!areAllRatesAcknowledged()) {
            alert('Please acknowledge all rates before proceeding');
            return;
        }

        setCurrentStep(2);
    };

    return (
        <div>
            <div className="relative">
                <button
                    onClick={() => setCurrentStep(1)}
                    className={`group flex w-full items-start gap-4 py-4 text-left ${currentStep === 1 ? "text-foreground" : "text-muted-foreground"}`}
                >
                    <div
                        className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm ${
                            1 <= currentStep ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground bg-background"
                        }`}
                    >
                        1
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="text-base font-medium">{step.name}</div>
                        <div className="text-sm text-muted-foreground">{step.description}</div>
                    </div>
                </button>

                {/* Collapsible Content */}
                {currentStep === 1 && (
                    <div className="mt-2 mb-6 ml-12 text-sm text-muted-foreground">
                        <div className="space-y-8">
                            <div className="max-w-xl grid grid-cols-2 gap-6">
                                {step.fields.map((field) => (
                                    <div key={field.name} className="space-y-2.5">
                                        <Label htmlFor={field.name} className="text-sm font-medium text-muted-foreground">
                                            {field.label}
                                        </Label>
                                        {field.type === "select" ? (
                                            <select
                                                id={field.name}
                                                value={String(formData[field.name] ?? "")}
                                                onChange={(e) => handleInputChange(field.name, e.target.value)}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                disabled={isLoading[field.name === 'county' ? 'counties' : field.name === 'branch' ? 'branches' : field.name === 'estimator' ? 'estimators' : field.name === 'division' ? 'divisions' : field.name === 'owner' ? 'owners' : ''] || false}
                                            >
                                                <option value="">{isLoading[field.name === 'county' ? 'counties' : field.name === 'branch' ? 'branches' : field.name === 'estimator' ? 'estimators' : field.name === 'division' ? 'divisions' : field.name === 'owner' ? 'owners' : ''] ? 'Loading...' : field.placeholder}</option>
                                                {field.name === 'county' && counties.map(county => (
                                                    <option key={county.id} value={county.id}>{county.name}</option>
                                                ))}
                                                {field.name === 'estimator' && estimators.map(estimator => (
                                                    <option key={estimator.id} value={estimator.id}>{estimator.name}</option>
                                                ))}
                                                {field.name === 'division' && divisions.map(division => (
                                                    <option key={division.id} value={division.id}>{division.name}</option>
                                                ))}
                                                {field.name === 'owner' && owners.map(owner => (
                                                    <option key={owner.id} value={owner.id}>{owner.name}</option>
                                                ))}
                                                {field.name === 'branch' && branches.map(branch => (
                                                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                                                ))}
                                                {field.name === 'workType' && [
                                                    { id: 'Rated', name: 'Rated' },
                                                    { id: 'Non-Rated', name: 'Non-Rated' },
                                                    { id: 'Mixed', name: 'Mixed' }
                                                ].map(type => (
                                                    <option key={type.id} value={type.id}>{type.name}</option>
                                                ))}
                                            </select>
                                        ) : field.type === "toggle" ? (
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={field.name}
                                                    checked={Boolean(formData[field.name])}
                                                    onChange={() => handleInputChange(field.name, (!formData[field.name]).toString())}
                                                    className="h-4 w-4"
                                                />
                                                <Label htmlFor={field.name}>{field.label}</Label>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Input
                                                    id={field.name}
                                                    type={field.type}
                                                    placeholder={field.placeholder}
                                                    value={String(formData[field.name] ?? "")}
                                                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                                                    className="h-10"
                                                />
                                                {field.hasToggle && (
                                                    <div className="flex items-center gap-2">
                                                        <Label htmlFor={`${field.name}-toggle`} className="text-sm text-muted-foreground">
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
                                        <span>Please ensure all rate fields have values and are acknowledged by checking the boxes before proceeding.</span>
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
