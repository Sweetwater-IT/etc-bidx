import { FormData, SignData } from "@/app/active-bid/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createActiveBid } from "@/lib/api-client";
import { Database } from "@/types/database.types";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const step = {
    id: "step-5",
    name: "Bid Summary",
    description: "Review bid details",
    fields: [{ name: "summary", label: "Summary", type: "summary", placeholder: "Summary", hasToggle: false }],
};

interface BidItemData {
    bid_estimate_id: number;
    category: string;
    subcategory: string;
    item_key: string;
    value: number;
}

const BidSummaryStep5 = ({
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
    const router = useRouter();

    const [toggleStates, setToggleStates] = useState({
        laborRate: false,
        fringeRate: false,
        shopRate: false,
        winterShutdown: false,
    });

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

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        try {
          setIsSubmitting(true);
          setError(null);
          
          // Update required fields to match database schema
          const requiredFields = [
            'contractNumber', 'owner', 'county', 'branch',
            'estimator', 'startDate', 'endDate', 'division',
            'project_days', 'base_rate', 'fringe_rate',
            'rt_miles', 'rt_travel', 'rated_hours',
            'nonrated_hours', 'total_hours', 'phases'
          ];
          
          const missingFields = requiredFields.filter(field => {
            const value = formData[field as keyof FormData];
            return value === undefined || value === null || value === '';
          });

          if (missingFields.length > 0) {
            setError(`Missing required fields: ${missingFields.join(', ')}`);
            setIsSubmitting(false);
            return;
          }
          
          // Map form data to bid_estimates schema
          const bidData: Database['public']['Tables']['bid_estimates']['Insert'] = {
            status: "Pending",
            contract_number: formData.contractNumber || "",
            owner: formData.owner || "",
            county: formData.county || "",
            branch: formData.branch || "",
            division: formData.division || "",
            estimator: formData.estimator || "",
            summary: formData.summary || null,
            
            // Handle dates properly, ensuring letting_date is nullable
            start_date: formData.startDate ? new Date(formData.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            end_date: formData.endDate ? new Date(formData.endDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            letting_date: formData.lettingDate ? new Date(formData.lettingDate).toISOString().split('T')[0] : null,
            
            contractor: formData.contractor || null,
            subcontractor: formData.subcontractor || null,
            
            // Ensure all numeric fields are properly typed and constrained
            project_days: Math.max(0, parseInt(String(formData.project_days)) || 0),
            base_rate: Math.max(0, parseFloat(String(formData.base_rate)) || 0),
            fringe_rate: Math.max(0, parseFloat(String(formData.fringe_rate)) || 0),
            rt_miles: Math.max(0, parseInt(String(formData.rt_miles)) || 0),
            rt_travel: Math.max(0, parseInt(String(formData.rt_travel)) || 0),
            emergency_job: toggleStates.winterShutdown || false,
            rated_hours: Math.max(0, parseFloat(String(formData.rated_hours)) || 0),
            nonrated_hours: Math.max(0, parseFloat(String(formData.nonrated_hours)) || 0),
            total_hours: Math.max(0, parseFloat(String(formData.total_hours)) || 0),
            phases: Math.max(0, parseInt(String(formData.phases)) || 0),
            
            // Trip and Labor fields
            number_of_personnel: formData.numberOfPersonnel ? parseInt(formData.numberOfPersonnel) : null,
            number_of_trucks: formData.numberOfTrucks ? parseInt(formData.numberOfTrucks) : null,
            trips: formData.trips ? parseInt(formData.trips) : null,
            additional_trips: formData.additionalTrips ? parseInt(formData.additionalTrips) : null,
            total_trips: formData.totalTrips ? parseInt(formData.totalTrips) : null,
            additional_rated_hours: formData.additionalRatedHours ? parseFloat(formData.additionalRatedHours) : null,
            total_rated_hours: formData.totalRatedHours ? parseFloat(formData.totalRatedHours) : null,
            additional_nonrated_hours: formData.additionalNonRatedHours ? parseFloat(formData.additionalNonRatedHours) : null,
            total_nonrated_hours: formData.totalNonRatedHours ? parseFloat(formData.totalNonRatedHours) : null,
            
            // Mobilization fields
            mobilization: formData.mobilization ? parseFloat(formData.mobilization) : null,
            fuel_cost: formData.fuelCost ? parseFloat(formData.fuelCost) : null,
            truck_and_fuel_cost: formData.truckAndFuelCost ? parseFloat(formData.truckAndFuelCost) : null,
            
            // Default values for equipment quantities with constraint validation
            type_iii_4ft: Math.max(0, parseInt(formData.typeIii4ft || "0")),
            wings_6ft: Math.max(0, parseInt(formData.wings6ft || "0")),
            h_stands: Math.max(0, parseInt(formData.hStands || "0")),
            posts: Math.max(0, parseInt(formData.posts || "0")),
            sand_bags: Math.max(0, parseInt(formData.sandBags || "0")),
            covers: Math.max(0, parseInt(formData.covers || "0")),
            spring_loaded_metal_stands: Math.max(0, parseInt(formData.springLoadedMetalStands || "0")),
            hi_vertical_panels: Math.max(0, parseInt(formData.hiVerticalPanels || "0")),
            type_xi_vertical_panels: Math.max(0, parseInt(formData.typeXiVerticalPanels || "0")),
            b_lites: Math.max(0, parseInt(formData.bLites || "0")),
            ac_lites: Math.max(0, parseInt(formData.acLites || "0")),
            
            // Square footage fields as numeric(10,2)
            hi_signs_sq_ft: Math.max(0, parseFloat(formData.hiSignsSqFt || "0")),
            dg_signs_sq_ft: Math.max(0, parseFloat(formData.dgSignsSqFt || "0")),
            special_signs_sq_ft: Math.max(0, parseFloat(formData.specialSignsSqFt || "0")),
            
            tma: Math.max(0, parseInt(formData.tma || "0")),
            arrow_board: Math.max(0, parseInt(formData.arrowBoard || "0")),
            message_board: Math.max(0, parseInt(formData.messageBoard || "0")),
            speed_trailer: Math.max(0, parseInt(formData.speedTrailer || "0")),
            pts: Math.max(0, parseInt(formData.pts || "0")),
            
            // Financial calculations with constraint validation
            mpt_value: Math.max(0, parseFloat(formData.mptValue || "0")),
            mpt_gross_profit: Math.max(0, parseFloat(formData.mptGrossProfit || "0")),
            mpt_gm_percent: Math.max(0, parseFloat(formData.mptGmPercent || "0")),
            perm_sign_value: Math.max(0, parseFloat(formData.permSignValue || "0")),
            perm_sign_gross_profit: Math.max(0, parseFloat(formData.permSignGrossProfit || "0")),
            perm_sign_gm_percent: Math.max(0, parseFloat(formData.permSignGmPercent || "0")),
            rental_value: Math.max(0, parseFloat(formData.rentalValue || "0")),
            rental_gross_profit: Math.max(0, parseFloat(formData.rentalGrossProfit || "0")),
            rental_gm_percent: Math.max(0, parseFloat(formData.rentalGmPercent || "0")),
          };
          
          // Save bid estimate to database
          const result = await createActiveBid(bidData);
          
          // If result has an ID, save related data
          if (result && result.id) {
            // Save MUTCD signs if available
            if (formData.signs && formData.signs.length > 0) {
              try {
                // Prepare signs data for insertion
                const signsData = formData.signs.map(sign => ({
                  bid_estimate_id: result.id,
                  designation: sign.designation,
                  dimensions: sign.dimensions,
                  sheeting: sign.sheeting,
                  quantity: sign.quantity
                }));
                
                // Create API endpoint to save signs data
                await fetch('/api/bid-signs', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    bidEstimateId: result.id,
                    signs: signsData
                  }),
                });
              } catch (signsError) {
                console.error('Error saving signs data:', signsError);
                // Continue with the flow even if signs data fails
              }
            }
            
            // Save complex bid items if available
            if (formData.mptData || formData.equipmentRental || formData.permanentSigns || 
                formData.flagging || formData.saleItems || formData.patterns) {
              try {
                // Prepare items data for insertion
                const itemsData: Array<{
                  bid_estimate_id: number;
                  category: string;
                  subcategory: string;
                  item_key: string;
                  value: number;
                }> = [];
                
                // Process mptData
                if (formData.mptData) {
                  // Process mptEquipment
                  Object.entries(formData.mptData.mptEquipment || {}).forEach(([key, value]) => {
                    itemsData.push({
                      bid_estimate_id: result.id,
                      category: 'mptData',
                      subcategory: 'mptEquipment',
                      item_key: key,
                      value: Number(value)
                    });
                  });
                  
                  // Process lightAndDrum
                  Object.entries(formData.mptData.lightAndDrum || {}).forEach(([key, value]) => {
                    itemsData.push({
                      bid_estimate_id: result.id,
                      category: 'mptData',
                      subcategory: 'lightAndDrum',
                      item_key: key,
                      value: Number(value)
                    });
                  });
                }
                
                // Process equipmentRental
                if (formData.equipmentRental) {
                  Object.entries(formData.equipmentRental).forEach(([subcategory, items]) => {
                    Object.entries(items as Record<string, number>).forEach(([key, value]) => {
                      itemsData.push({
                        bid_estimate_id: result.id,
                        category: 'equipmentRental',
                        subcategory,
                        item_key: key,
                        value: Number(value)
                      });
                    });
                  });
                }
                
                // Process permanentSigns
                if (formData.permanentSigns) {
                  Object.entries(formData.permanentSigns).forEach(([subcategory, items]) => {
                    Object.entries(items as Record<string, number>).forEach(([key, value]) => {
                      itemsData.push({
                        bid_estimate_id: result.id,
                        category: 'permanentSigns',
                        subcategory,
                        item_key: key,
                        value: Number(value)
                      });
                    });
                  });
                }
                
                // Process flagging
                if (formData.flagging) {
                  Object.entries(formData.flagging).forEach(([subcategory, items]) => {
                    Object.entries(items as Record<string, number>).forEach(([key, value]) => {
                      itemsData.push({
                        bid_estimate_id: result.id,
                        category: 'flagging',
                        subcategory,
                        item_key: key,
                        value: Number(value)
                      });
                    });
                  });
                }
                
                // Process saleItems
                if (formData.saleItems) {
                  Object.entries(formData.saleItems).forEach(([subcategory, items]) => {
                    Object.entries(items as Record<string, number>).forEach(([key, value]) => {
                      itemsData.push({
                        bid_estimate_id: result.id,
                        category: 'saleItems',
                        subcategory,
                        item_key: key,
                        value: Number(value)
                      });
                    });
                  });
                }
                
                // Process patterns
                if (formData.patterns) {
                  Object.entries(formData.patterns).forEach(([subcategory, items]) => {
                    Object.entries(items as Record<string, number>).forEach(([key, value]) => {
                      itemsData.push({
                        bid_estimate_id: result.id,
                        category: 'patterns',
                        subcategory,
                        item_key: key,
                        value: Number(value)
                      });
                    });
                  });
                }
                
                // Save items data if there are any items
                if (itemsData.length > 0) {
                  await fetch('/api/bid-items', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      bidEstimateId: result.id,
                      items: itemsData
                    }),
                  });
                }
              } catch (itemsError) {
                console.error('Error saving bid items data:', itemsError);
                // Continue with the flow even if items data fails
              }
            }
            
            // If MPT rental data is available, create the related record
            if (formData.mptRental) {
              try {
                // Prepare MPT rental data
                const mptRentalData = {
                  estimate_id: result.id,
                  target_moic: parseInt(formData.targetMoic || "0"),
                  payback_period: parseInt(formData.paybackPeriod || "0"),
                  annual_utilization: parseFloat(formData.annualUtilization || "0"),
                  dispatch_fee: parseFloat(formData.dispatchFee || "0"),
                  mpg_per_truck: parseFloat(formData.mpgPerTruck || "0"),
                  revenue: parseFloat(formData.rentalRevenue || "0"),
                  cost: parseFloat(formData.rentalCost || "0"),
                  gross_profit: parseFloat(formData.rentalGrossProfit || "0"),
                  hours: parseFloat(formData.rentalHours || "0"),
                  static_equipment_info: formData.staticEquipmentInfo || null
                };
                
                // Create MPT rental record
                await fetch('/api/estimate-mpt-rental', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(mptRentalData),
                });
              } catch (mptError) {
                console.error("Error saving MPT rental data:", mptError);
                // Continue with the flow even if MPT rental data fails
              }
            }
          }
          
          console.log("Bid created successfully:", result);
          
          // Redirect to active bids page
          router.push("/jobs/active-bids");
          
        } catch (error) {
          console.error("Error creating bid:", error);
          setError(error instanceof Error ? error.message : "An unknown error occurred");
        } finally {
          setIsSubmitting(false);
        }
    };

    return (
        <div>
            <div className="relative">
                <button
                    onClick={() => setCurrentStep(5)}
                    className={`group flex w-full items-start gap-4 py-4 text-left ${currentStep === 5 ? "text-foreground" : "text-muted-foreground"}`}
                >
                    <div
                        className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm ${
                            5 <= currentStep ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground bg-background"
                        }`}
                    >
                        5
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="text-base font-medium">{step.name}</div>
                        <div className="text-sm text-muted-foreground">{step.description}</div>
                    </div>
                </button>

                {/* Collapsible Content */}
                {currentStep === 5 && (
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
                                                value={String(formData[field.name] || "")}
                                                onChange={(e) => handleInputChange(field.name, e.target.value)}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="">{field.placeholder}</option>
                                            </select>
                                        ) : field.type === "toggle" ? (
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={field.name}
                                                    checked={!!formData[field.name]}
                                                    onChange={() => handleToggleChange(field.name)}
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
                                                    value={String(formData[field.name] || "")}
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
                            <div className="space-y-4">
                                {error && (
                                    <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded-md">
                                        {error}
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <Button variant="outline" onClick={() => setCurrentStep(4)}>
                                        Back
                                    </Button>
                                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                                        {isSubmitting ? "Creating..." : "Create"}
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

export default BidSummaryStep5;
