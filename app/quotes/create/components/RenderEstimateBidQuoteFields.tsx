'use client'

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { useState } from "react";
import { EstimateBidQuote } from "../types";

interface IRenderEstimateBidQuoteFields {
    data: Partial<EstimateBidQuote>;
    setData: (data: Partial<EstimateBidQuote>) => void;
    onSaveInformation: () => void;
}

const RenderEstimateBidQuoteFields = ({
    data,
    setData,
    onSaveInformation,
}: IRenderEstimateBidQuoteFields) => {
    const [editMode, setEditMode] = useState(false);
    const [backup, setBackup] = useState<Partial<EstimateBidQuote>>(data);

    const toggleEditMode = (value: boolean) => {
        if (value) setBackup(data);
        setEditMode(value);
    };

    const handleSave = () => {
        onSaveInformation();
        setEditMode(false);
    };

    const handleCancel = () => {
        setData(backup);
        setEditMode(false);
    };

    const renderInput = (
        field: keyof EstimateBidQuote,
        label: string,
        type: string = "text"
    ) => (
        <div className="mb-4">
            <label className="font-semibold block mb-1">{label}</label>
            {editMode ? (
                <Input
                    type={type}
                    value={data?.[field] ?? ""}
                    onChange={(e) =>
                        setData({
                            ...data,
                            [field]:
                                type === "number"
                                    ? Number(e.target.value)
                                    : e.target.value,
                        })
                    }
                    className="w-full"
                />
            ) : (
                <span>{data?.[field] || "-"}</span>
            )}
        </div>
    );

    return (
        <div className="">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Estimate / Bid Quote</h3>
                {editMode ? (
                    <div className="flex gap-2">
                        <Button size="sm" variant="default" onClick={handleSave}>
                            Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                    </div>
                ) : (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleEditMode(true)}
                    >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                    </Button>
                )}
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4">
                {renderInput("customer_email", "Customer Email")}
                {renderInput("customer_phone", "Customer Phone")}
                {renderInput("customer_address", "Customer Address")}
                {renderInput("customer_job_number", "Customer Job Number")}
            </div>

            {/* ETC Info */}
            <h4 className="font-bold text-lg mt-6 mb-2">ETC Info</h4>
            <div className="grid grid-cols-2 gap-4">
                {renderInput("etc_point_of_contact", "ETC Point of Contact")}
                {renderInput("etc_poc_email", "ETC POC Email")}
                {renderInput("etc_poc_phone_number", "ETC POC Phone")}
                {renderInput("etc_branch", "ETC Branch")}
            </div>

            {/* Job / Location */}
            <h4 className="font-bold text-lg mt-6 mb-2">Job / Location</h4>
            <div className="grid grid-cols-2 gap-4">
                {renderInput("township", "Township")}
                {renderInput("county", "County")}
                {renderInput("sr_route", "SR Route")}
                {renderInput("job_address", "Job Address")}
                {renderInput("ecsm_contract_number", "ECSM Contract Number")}
            </div>

            {/* Project Details */}
            <h4 className="font-bold text-lg mt-6 mb-2">Project Details</h4>
            <div className="grid grid-cols-2 gap-4">
                {renderInput("bid_date", "Bid Date", "date")}
                {renderInput("start_date", "Start Date", "date")}
                {renderInput("end_date", "End Date", "date")}
                {renderInput("duration", "Duration (days)", "number")}
            </div>

            <div>
                {renderInput("project_title", "Project Title", "text")}
                {renderInput("description", "Description", "text")}
            </div>
        </div>
    );
};

export default RenderEstimateBidQuoteFields;
