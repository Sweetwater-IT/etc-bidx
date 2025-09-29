'use client'

import { Input } from "@/components/ui/input";
import { ToProjectQuote } from "../types";
import React, { useEffect } from "react";
import RenderEtcSection from "./RenderEtcSection";

interface IRenderProjectQuoteFields {
    data: Partial<ToProjectQuote>;
    setData: (data: Partial<any>) => void;
    onSaveData: (data: Partial<ToProjectQuote>) => void;
    selectedJob?: any;
    editAll?: boolean;
}

const SectionBox = ({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) => (
    <div className="rounded-lg p-4 mb-6 text-[12px]">
        <div className="flex justify-between items-start h-[40px]">
            <p className="font-bold">{title}</p>
        </div>
        {children}
    </div>
);

const RenderProjectQuoteFields = ({ data, setData, onSaveData, selectedJob, editAll = false }: IRenderProjectQuoteFields) => {

    useEffect(() => {
        if (!selectedJob) return;
        const job = selectedJob;

        const today = new Date();
        const start = job.admin_data?.startDate ? new Date(job.admin_data.startDate) : today;
        const end = job.admin_data?.endDate ? new Date(job.admin_data.endDate) : today;

        const duration = start && end ? Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) : 0;

        setData((prev) => ({
            ...prev,
            customer: job?.customer || "",
            customer_name: job?.customer_name || "",
            customer_email: job?.customer_email || "",
            customer_phone: job?.customer_phone || "",
            customer_address: job?.customer_address || "",
            customer_job_number: job.admin_data.contractNumber || "",
            etc_job_number: job.job_number ?? "",
            purchase_order: "",
            township: job.admin_data?.location || "",
            county: job.admin_data?.county?.name || "",
            sr_route: job.admin_data?.srRoute || "",
            job_address: job.admin_data?.location || "",
            ecsm_contract_number: job.admin_data?.contractNumber || "",
            bid_date: job.admin_data?.lettingDate ? new Date(job.admin_data.lettingDate).toISOString().slice(0, 10) : "",
            start_date: start ? start.toISOString().slice(0, 10) : "",
            end_date: end ? end.toISOString().slice(0, 10) : "",
            duration,
            project_title: "",
            description: "",
            job_id: selectedJob.id,
        }));
    }, [selectedJob, setData]);

    const renderField = (
        field: keyof ToProjectQuote,
        label: string,
        type: "text" | "date" | "number" = "text",
        disabled?: boolean
    ) => (
        <div className="mb-4">
            <label className="font-semibold block mb-1">{label}</label>
            {editAll ? (
                <Input
                    type={type === "date" ? "date" : type}
                    value={data[field] ? String(data[field]) : ""}
                    onChange={(e) => setData({ ...data, [field]: e.target.value })}
                    className="w-full"
                    disabled={disabled}
                />
            ) : (
                <p className="text-sm text-gray-700">{data[field] ? String(data[field]) : "-"}</p>
            )}
        </div>
    );

    return (
        <div className="grid grid-cols-4 w-full gap-4 text-[12px]">
            <SectionBox title="Customer & Contact Information">
                <div className="grid grid-cols-1 gap-2">
                    {renderField("customer_name", "Customer", "text", true)}
                    {renderField("customer_contact", "Customer Point Of Contact", 'text', true)}
                    {renderField("customer_phone", "Customer Phone", "text", true)}
                    {renderField("customer_email", "Customer Email", "text", true)}
                    {renderField("customer_address", "Customer Address", "text", true)}
                    {renderField("customer_job_number", "Customer Job Number", 'text', true)}
                    {renderField("purchase_order", "Purchase Order #")}
                </div>
            </SectionBox>

            <SectionBox title="Job / Location">
                <div className="grid grid-cols-1 gap-2">
                    {renderField("township", "Township")}
                    {renderField("county", "County")}
                    {renderField("sr_route", "SR Route")}
                    {renderField("job_address", "Job Address")}
                    {renderField("ecsm_contract_number", "ECSM Contract Number")}
                </div>
            </SectionBox>

            <SectionBox title="Project Details">
                <div className="grid grid-cols-1 gap-2">
                    {renderField("bid_date", "Bid Date", "date")}
                    {renderField("start_date", "Start Date", "date")}
                    {renderField("end_date", "End Date", "date")}
                    {renderField("duration", "Duration (days)", "number", true)}
                    {renderField("project_title", "Project Title")}
                    {renderField("description", "Description")}
                </div>
            </SectionBox>

            <RenderEtcSection
                showldJobNumber={true}
                data={data}
                setData={setData}
                onSaveData={onSaveData}
                editAll={editAll}
            />
        </div>
    );
};

export default RenderProjectQuoteFields;


