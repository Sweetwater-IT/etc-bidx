"use client";

import { FormData } from "@/app/active-bid/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import React from "react";

const step = {
  id: "step-3",
  name: "Trip and Labor",
  description: "Input trip and labor details",
};

const TripAndLaborStep3 = ({
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
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getInputValue = (field: keyof FormData): string => {
    const value = formData[field];
    if (value === undefined || value === null) return "";
    return String(value);
  };

  const handleNext = () => {
    // Required fields for Step 3
    const requiredFields = [
      'project_days',
      'nonrated_hours',
      'total_hours',
      'phases'
    ];

    const missingFields = requiredFields.filter(field => {
      const value = formData[field as keyof FormData];
      return !value || value === '' || value === '0';
    });

    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    setCurrentStep(4);
  };

  return (
    <div>
      <div className="relative">
        <button
          onClick={() => setCurrentStep(3)}
          className={`group flex w-full items-start gap-4 py-4 text-left ${currentStep === 3 ? "text-foreground" : "text-muted-foreground"}`}
        >
          <div
            className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm ${
              3 <= currentStep ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground bg-background"
            }`}
          >
            3
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-base font-medium">{step.name}</div>
            <div className="text-sm text-muted-foreground">{step.description}</div>
          </div>
        </button>

        {/* Collapsible Content */}
        {currentStep === 3 && (
          <div className="mt-2 mb-6 ml-12 text-sm text-muted-foreground">
            <div className="space-y-8">
              {/* Personnel Section */}
              <div className="space-y-4">
                <h3 className="font-semibold">Personnel</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2.5">
                    <Label htmlFor="numberOfDays" className="text-sm font-medium">
                      Number of Days
                    </Label>
                    <Input
                      id="numberOfDays"
                      type="number"
                      placeholder="Number of Days"
                      value={getInputValue("numberOfDays")}
                      onChange={(e) => handleInputChange("numberOfDays", e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label
                      htmlFor="numberOfPersonnel"
                      className="text-sm font-medium"
                    >
                      Number of Personnel
                    </Label>
                    <Input
                      id="numberOfPersonnel"
                      type="number"
                      placeholder="Number of Personnel"
                      value={getInputValue("numberOfPersonnel")}
                      onChange={(e) =>
                        handleInputChange("numberOfPersonnel", e.target.value)
                      }
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label
                      htmlFor="numberOfTrucks"
                      className="text-sm font-medium"
                    >
                      Number of Trucks
                    </Label>
                    <Input
                      id="numberOfTrucks"
                      type="number"
                      placeholder="Number of Trucks"
                      value={getInputValue("numberOfTrucks")}
                      onChange={(e) =>
                        handleInputChange("numberOfTrucks", e.target.value)
                      }
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Trips Section */}
              <div className="space-y-4">
                <h3 className="font-semibold">Trips</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2.5">
                    <Label htmlFor="trips" className="text-sm font-medium">
                      Trips
                    </Label>
                    <Input
                      id="trips"
                      type="number"
                      placeholder="Trips"
                      value={getInputValue("trips")}
                      onChange={(e) =>
                        handleInputChange("trips", e.target.value)
                      }
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label
                      htmlFor="additionalTrips"
                      className="text-sm font-medium"
                    >
                      Additional Trips
                    </Label>
                    <Input
                      id="additionalTrips"
                      type="number"
                      placeholder="Additional Trips"
                      value={getInputValue("additionalTrips")}
                      onChange={(e) =>
                        handleInputChange("additionalTrips", e.target.value)
                      }
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="totalTrips" className="text-sm font-medium">
                      Total Trips
                    </Label>
                    <Input
                      id="totalTrips"
                      type="number"
                      placeholder="Total Trips"
                      value={getInputValue("totalTrips")}
                      onChange={(e) =>
                        handleInputChange("totalTrips", e.target.value)
                      }
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Hours Section */}
              <div className="space-y-4">
                <h3 className="font-semibold">Hours</h3>
                <div className="space-y-6">
                  {/* Rated Hours */}
                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2.5">
                      <Label
                        htmlFor="ratedHours"
                        className="text-sm font-medium"
                      >
                        Rated Hours
                      </Label>
                      <Input
                        id="ratedHours"
                        type="number"
                        placeholder="Rated Hours"
                        value={getInputValue("ratedHours")}
                        onChange={(e) =>
                          handleInputChange("ratedHours", e.target.value)
                        }
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label
                        htmlFor="additionalRatedHours"
                        className="text-sm font-medium"
                      >
                        Additional Rated Hours
                      </Label>
                      <Input
                        id="additionalRatedHours"
                        type="number"
                        placeholder="Additional Rated Hours"
                        value={getInputValue("additionalRatedHours")}
                        onChange={(e) =>
                          handleInputChange(
                            "additionalRatedHours",
                            e.target.value
                          )
                        }
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label
                        htmlFor="totalRatedHours"
                        className="text-sm font-medium"
                      >
                        Total Rated Hours
                      </Label>
                      <Input
                        id="totalRatedHours"
                        type="number"
                        placeholder="Total Rated Hours"
                        value={getInputValue("totalRatedHours")}
                        onChange={(e) =>
                          handleInputChange("totalRatedHours", e.target.value)
                        }
                        className="h-10"
                      />
                    </div>
                  </div>

                  {/* Non-Rated Hours */}
                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2.5">
                      <Label
                        htmlFor="nonRatedHours"
                        className="text-sm font-medium"
                      >
                        Non-Rated Hours
                      </Label>
                      <Input
                        id="nonRatedHours"
                        type="number"
                        placeholder="Non-Rated Hours"
                        value={getInputValue("nonRatedHours")}
                        onChange={(e) =>
                          handleInputChange("nonRatedHours", e.target.value)
                        }
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label
                        htmlFor="additionalNonRatedHours"
                        className="text-sm font-medium"
                      >
                        Additional Non-Rated Hours
                      </Label>
                      <Input
                        id="additionalNonRatedHours"
                        type="number"
                        placeholder="Additional Non-Rated Hours"
                        value={getInputValue("additionalNonRatedHours")}
                        onChange={(e) =>
                          handleInputChange(
                            "additionalNonRatedHours",
                            e.target.value
                          )
                        }
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label
                        htmlFor="totalNonRatedHours"
                        className="text-sm font-medium"
                      >
                        Total Non-Rated Hours
                      </Label>
                      <Input
                        id="totalNonRatedHours"
                        type="number"
                        placeholder="Total Non-Rated Hours"
                        value={getInputValue("totalNonRatedHours")}
                        onChange={(e) =>
                          handleInputChange(
                            "totalNonRatedHours",
                            e.target.value
                          )
                        }
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Mobilization Section */}
              <div className="space-y-4">
                <h3 className="font-semibold">Mobilization</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2.5">
                    <Label
                      htmlFor="mobilization"
                      className="text-sm font-medium"
                    >
                      Mobilization
                    </Label>
                    <Input
                      id="mobilization"
                      type="number"
                      placeholder="Mobilization"
                      value={getInputValue("mobilization")}
                      onChange={(e) =>
                        handleInputChange("mobilization", e.target.value)
                      }
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="fuelCost" className="text-sm font-medium">
                      Fuel Cost
                    </Label>
                    <Input
                      id="fuelCost"
                      type="number"
                      placeholder="Fuel Cost"
                      value={getInputValue("fuelCost")}
                      onChange={(e) =>
                        handleInputChange("fuelCost", e.target.value)
                      }
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label
                      htmlFor="truckAndFuelCost"
                      className="text-sm font-medium"
                    >
                      Truck & Fuel Cost
                    </Label>
                    <Input
                      id="truckAndFuelCost"
                      type="number"
                      placeholder="Truck & Fuel Cost"
                      value={getInputValue("truckAndFuelCost")}
                      onChange={(e) =>
                        handleInputChange("truckAndFuelCost", e.target.value)
                      }
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Back
                </Button>
                <Button onClick={handleNext}>Next</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripAndLaborStep3;
