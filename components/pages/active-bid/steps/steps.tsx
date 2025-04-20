import { FormData } from "@/app/active-bid/page";
import { Dispatch, SetStateAction, useState } from "react";
import AdminInformationStep1 from "./admin-information-step1";
import BidItemsStep4 from "./bid-items-step4";
import BidSummaryStep5 from "./bid-summary-step5";
import MUTCDSignsStep2 from "./mutcd-signs-step2";
import TripAndLaborStep3 from "./trip-and-labor-step3";

// const steps = [
    // {
    //     id: "step-1",
    //     name: "Admin Information",
    //     description: "Basic information about the bid",
    //     fields: [
    //         { name: "contractNumber", label: "Contract Number*", type: "text", placeholder: "Contract Number" },
    //         { name: "estimator", label: "Estimator*", type: "select", placeholder: "Ses Brunton" },
    //         { name: "owner", label: "Owner*", type: "select", placeholder: "Choose" },
    //         { name: "county", label: "County*", type: "select", placeholder: "Choose County" },
    //         { name: "township", label: "Township*", type: "text", placeholder: "Township" },
    //         { name: "division", label: "Division*", type: "select", placeholder: "Choose" },
    //         { name: "lettingDate", label: "Letting Date*", type: "date", placeholder: "Select date" },
    //         { name: "startDate", label: "Start Date*", type: "date", placeholder: "Select date" },
    //         { name: "endDate", label: "End Date*", type: "date", placeholder: "Select date" },
    //         { name: "srRoute", label: "SR Route*", type: "text", placeholder: "SR Route" },
    //         { name: "dbePercentage", label: "DBE %*", type: "text", placeholder: "DBE %" },
    //         { name: "workType", label: "Work Type", type: "select", placeholder: "Rated" },
    //         { name: "oneWayTravelTime", label: "One Way Travel Time (Mins)*", type: "number", placeholder: "One Way Travel Time (Mins)" },
    //         { name: "oneWayMileage", label: "One Way Mileage*", type: "number", placeholder: "One Way Mileage" },
    //         { name: "dieselCost", label: "Diesel Cost Per Gallon*", type: "number", placeholder: "Diesel Cost Per Gallon" },
    //         { name: "laborRate", label: "Labor Rate*", type: "number", placeholder: "0", hasToggle: true },
    //         { name: "fringeRate", label: "Fringe Rate*", type: "number", placeholder: "0", hasToggle: true },
    //         { name: "shopRate", label: "Shop Rate*", type: "number", placeholder: "0", hasToggle: true },
    //         { name: "winterShutdown", label: "Winter Shutdown", type: "toggle" },
    //     ],
    // },
    // {
    //     id: "step-2",
    //     name: "MUTCD Signs",
    //     description: "Select and configure MUTCD signs",
    //     fields: [{ name: "items", label: "Items", type: "table" }],
    // },
    // {
    //     id: "step-3",
    //     name: "Trip and Labor",
    //     description: "Input trip and labor details",
    //     fields: [{ name: "numberOfDays", label: "Number of Days", type: "number", placeholder: "Number of Days" }],
    // },
    // {
    //     id: "step-4",
    //     name: "Bid Items",
    //     description: "Add and manage bid items",
    //     fields: [{ name: "items", label: "Items", type: "table" }],
    // },
//     {
//         id: "step-5",
//         name: "Bid Summary",
//         description: "Review bid details",
//         fields: [{ name: "summary", label: "Summary", type: "summary" }],
//     },
// ];

const Steps = ({ formData, setFormData }: { formData: FormData; setFormData: Dispatch<SetStateAction<FormData>> }) => {
    const [currentStep, setCurrentStep] = useState(1);
    // const [formData, setFormData] = useState<FormData>({});

    // const [toggleStates, setToggleStates] = useState({
    //     laborRate: false,
    //     fringeRate: false,
    //     shopRate: false,
    //     winterShutdown: false,
    // });
    // const router = useRouter();

    // const handleInputChange = (field: string, value: string) => {
    //     setFormData((prev) => ({
    //         ...prev,
    //         [field]: value,
    //     }));
    // };

    // const handleToggleChange = (field: string) => {
    //     setToggleStates((prev) => ({
    //         ...prev,
    //         [field]: !prev[field],
    //     }));
    // };

    // const handleNext = () => {
    //     if (currentStep < steps.length - 1) {
    //         setCurrentStep((prev) => prev + 1);
    //     }
    // };

    // const handleSubmit = () => {
    //     console.log("Form submitted:", formData);
    //     router.push("/jobs/active-bids");
    // };
    return (
        <div className="flex-1">
            <div className="relative flex flex-col">
                <div className="absolute left-4 top-[40px] bottom-8 w-[2px] bg-border" />

                <AdminInformationStep1 currentStep={currentStep} setCurrentStep={setCurrentStep} formData={formData} setFormData={setFormData} />
                <MUTCDSignsStep2 currentStep={currentStep} setCurrentStep={setCurrentStep} formData={formData} setFormData={setFormData} />
                <TripAndLaborStep3 currentStep={currentStep} setCurrentStep={setCurrentStep} formData={formData} setFormData={setFormData} />
                <BidItemsStep4 currentStep={currentStep} setCurrentStep={setCurrentStep} formData={formData} setFormData={setFormData} />
                <BidSummaryStep5 currentStep={currentStep} setCurrentStep={setCurrentStep} formData={formData} setFormData={setFormData} />

                {/* {steps.map((step, index) => (
                    <div key={step.id} className="relative">
                        <button
                            onClick={() => setCurrentStep(index)}
                            className={`group flex w-full items-start gap-4 py-4 text-left ${
                                currentStep === index ? "text-foreground" : "text-muted-foreground"
                            }`}
                        >
                            <div
                                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm ${
                                    index <= currentStep ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground bg-background"
                                }`}
                            >
                                {index + 1}
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="text-base font-medium">{step.name}</div>
                                <div className="text-sm text-muted-foreground">{step.description}</div>
                            </div>
                        </button> */}

                {/* Collapsible Content */}
                {/* {currentStep === index && (
                            <div className="mt-2 mb-6 ml-12 text-sm text-muted-foreground">
                                {(index === 0 || index === 1 || index === 2) && (
                                    <div className="space-y-8">
                                        <div className="max-w-xl grid grid-cols-2 gap-6">
                                            {steps[0].fields.map((field) => (
                                                <div key={field.name} className="space-y-2.5">
                                                    <Label htmlFor={field.name} className="text-sm font-medium text-muted-foreground">
                                                        {field.label}
                                                    </Label>
                                                    {field.type === "select" ? (
                                                        <select
                                                            id={field.name}
                                                            value={formData[field.name] || ""}
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
                                                                checked={toggleStates[field.name]}
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
                                                                value={formData[field.name] || ""}
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
                                                                        checked={toggleStates[field.name]}
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
                                        <div className="flex justify-end">
                                            <Button onClick={handleNext}>Next</Button>
                                        </div>
                                    </div>
                                )} */}

                {/* {index === 1 && (
                                    <div className="max-w-xl space-y-6">
                                        <p>Add and manage bid items</p>
                                        <div className="flex justify-between">
                                            <Button variant="outline" onClick={() => setCurrentStep(0)}>
                                                Back
                                            </Button>
                                            <Button onClick={handleNext}>Next</Button>
                                        </div>
                                    </div>
                                )} */}

                {/* {index === 2 && (
                                    <div className="max-w-xl space-y-6">
                                        <p>Bid summary information will be displayed here</p>
                                        <div className="flex justify-between">
                                            <Button variant="outline" onClick={() => setCurrentStep(1)}>
                                                Back
                                            </Button>
                                            <Button onClick={handleSubmit}>Create</Button>
                                        </div>
                                    </div>
                                )} */}
                {/* </div>
                        )}
                    </div>
                ))} */}
            </div>
        </div>
    );
};

export default Steps;
