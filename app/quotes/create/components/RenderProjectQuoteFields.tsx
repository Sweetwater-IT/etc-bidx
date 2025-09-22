'use client'

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToProjectQuote } from "../types";
import SelectJob from "@/components/SelectJob";
import React, { useState } from "react";
import RenderEtcSection from "./RenderEtcSection";

interface IRenderProjectQuoteFields {
    data: Partial<ToProjectQuote>;
    setData: (data: Partial<any>) => void;
    onSaveData: (data: Partial<ToProjectQuote>) => void;
}

const SectionBox = ({
    title,
    children,
    isEditing,
    onEdit,
    onCancel,
    onSave,
}: {
    title: string;
    children: React.ReactNode;
    isEditing: boolean;
    onEdit: () => void;
    onCancel: () => void;
    onSave: () => void;
}) => (
    <div className="border rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold">{title}</h4>
            {!isEditing ? (
                <Button size="sm" onClick={onEdit}>Edit</Button>
            ) : (
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button size="sm" onClick={onSave}>Save</Button>
                </div>
            )}
        </div>
        {children}
    </div>
);

const RenderProjectQuoteFields = ({ data, setData, onSaveData }: IRenderProjectQuoteFields) => {
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [editingSection, setEditingSection] = useState<string | null>(null);

    React.useEffect(() => {
        if (!selectedJob) return;
        const job = selectedJob;
        const start = job.admin_data?.startDate ? new Date(job.admin_data.startDate) : null;
        const end = job.admin_data?.endDate ? new Date(job.admin_data.endDate) : null;
        const duration = start && end ? Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                
        setData((prev) => (
            {
            ...prev,
            customer: job?.customer || "",
            customer_name: job?.customer_name || "",
            customer_email: job?.customer_email || "",
            customer_phone: job?.customer_phone || "",
            customer_address: job?.customer_address || "",
            customer_job_number: job.job_number || "",
            purchase_order: "",
            township: job.admin_data?.location || "",
            county: job.admin_data?.county?.name || "",
            sr_route: job.admin_data?.srRoute || "",
            job_address: job.admin_data?.location || "",
            ecsm_contract_number: job.admin_data?.contractNumber || "",
            bid_date: job.admin_data?.lettingDate ? new Date(job.admin_data.lettingDate).toISOString().slice(0, 16) : "",
            start_date: start ? start.toISOString().slice(0, 16) : "",
            end_date: end ? end.toISOString().slice(0, 16) : "",
            duration,
            project_title: "",
            description: "",
        }));

    }, [selectedJob, setData]);

    const renderField = (
        field: keyof ToProjectQuote,
        label: string,
        type: string = "text",
        disabled?: boolean
    ) => {
        const isEditing = editingSection !== null;
        const isDateField = type === "date";

        return (
            <div className="mb-4">
                <label className="font-semibold block mb-1">{label}</label>
                {isEditing ? (
                    <Input
                        type={isDateField ? "datetime-local" : type}
                        value={data[field] ?? ""}
                        onChange={(e) => setData({ ...data, [field]: e.target.value })}
                        className="w-full"
                        readOnly={disabled}
                    />
                ) : (
                    <p className="text-sm text-gray-700">
                        {data[field] ? String(data[field]) : "-"}
                    </p>
                )}
            </div>
        );
    };

    React.useEffect(() => {
        if (selectedJob?.id) {
            setData((prev)=> ({
                ...prev,
                job_id: selectedJob.id
            }))
        }
    }, [selectedJob])

    return (
        <div>
            <div className="mb-8">
                <p className="font-bold mb-2">Job Selection</p>
                <SelectJob quoteData={data} onChangeQuote={setData} selectedJob={selectedJob} onChange={setSelectedJob} />
            </div>

            <SectionBox
                title="Customer & Contact Information"
                isEditing={editingSection === "customer"}
                onEdit={() => setEditingSection("customer")}
                onCancel={() => setEditingSection(null)}
                onSave={() => {
                    onSaveData(data);
                    setEditingSection(null);
                }}
            >
                <div className="grid grid-cols-2 gap-4">
                    {renderField("customer_name", "Customer")}
                    {renderField("customer_contact", "Customer Contact")}
                    {renderField("customer_phone", "Customer Phone")}
                    {renderField("customer_email", "Customer Email")}
                    {renderField("customer_address", "Customer Address")}
                    {renderField("customer_job_number", "Customer Job Number")}
                    {renderField("purchase_order", "Purchase Order #")}
                </div>
            </SectionBox>

            <SectionBox
                title="Job / Location"
                isEditing={editingSection === "jobLocation"}
                onEdit={() => setEditingSection("jobLocation")}
                onCancel={() => setEditingSection(null)}
                onSave={() => {
                    onSaveData(data);
                    setEditingSection(null);
                }}
            >
                <div className="grid grid-cols-2 gap-4">
                    {renderField("township", "Township")}
                    {renderField("county", "County")}
                    {renderField("sr_route", "SR Route")}
                    {renderField("job_address", "Job Address")}
                    {renderField("ecsm_contract_number", "ECSM Contract Number")}
                </div>
            </SectionBox>

            <SectionBox
                title="Project Details"
                isEditing={editingSection === "project"}
                onEdit={() => setEditingSection("project")}
                onCancel={() => setEditingSection(null)}
                onSave={() => {
                    onSaveData(data);
                    setEditingSection(null);
                }}
            >
                <div className="grid grid-cols-2 gap-4">
                    {renderField("bid_date", "Bid Date", "date")}
                    {renderField("start_date", "Start Date", "date")}
                    {renderField("end_date", "End Date", "date")}
                    {renderField("duration", "Duration (days)", "number", true)}
                </div>
                <div>
                    {renderField("project_title", "Project Title")}
                    {renderField("description", "Description")}
                </div>
            </SectionBox>


            <RenderEtcSection
                data={data}
                setData={setData}
                onSaveData={onSaveData}
            />
        </div>
    );
};

export default RenderProjectQuoteFields;
