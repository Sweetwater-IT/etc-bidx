'use client'

import { Input } from "@/components/ui/input";
import { ToProjectQuote } from "../types";
import React, { useEffect } from "react";
import RenderEtcSection from "./RenderEtcSection";
import CustomerSelect from "./CustomerSelector";

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
        <div className="break-words">{children}</div>
    </div>
);

const RenderProjectQuoteFields = ({ data, setData, onSaveData, selectedJob, editAll = false }: IRenderProjectQuoteFields) => {

    useEffect(() => {
        if (!data.start_date || !data.end_date) return;

        const start = new Date(data.start_date);
        const end = new Date(data.end_date);

        const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        setData(prev => ({
            ...prev,
            duration,
        }));
    }, [data.start_date, data.end_date, setData]);

    const renderField = React.useCallback(
        (
            field: keyof ToProjectQuote,
            label: string,
            type: "text" | "date" | "number" = "text",
            disabled?: boolean
        ) => {                        
            return (
            <div className="mb-4">
                <label className="font-semibold block mb-1">{label}</label>
                {editAll ? (
                    <Input
                        type={type === "date" ? "date" : type}
                        value={data[field] ?? ""}
                        onChange={(e) => setData({ ...data, [field]: e.target.value })}
                        className="w-full"
                        disabled={disabled}
                    />
                ) : (
                    <p className="text-sm text-gray-700">
                        {data[field]
                            ? type === "date"
                                ? new Date(data[field] as string).toISOString().slice(0, 10)
                                : String(data[field])
                            : type === "number"
                                ? 0
                                : "-"}
                    </p>
                )}
            </div>
        )},
        [data, editAll, setData]
    );


    return (
        <div className="grid grid-cols-4 w-full gap-4 text-[12px]">
            <SectionBox title="Customer & Contact Information">
                <div className="grid grid-cols-1 gap-2">
                    {
                        editAll ?
                            <CustomerSelect
                                data={data as any}
                                setData={setData}
                                direction="column"
                                columnCustomerTitle={"Customer"}
                                columnContactTitle={"Customer Point Of Contact"}
                            />
                            :
                            <div className="grid grid-cols-1 gap-2">
                                {renderField("customer_name", "Customer", "text", false)}
                                {renderField("customer_contact", "Customer Point Of Contact", 'text', false)}
                            </div>
                    }
                    {renderField("customer_phone", "Customer Phone", "text", true)}
                    {renderField("customer_email", "Customer Email", "text", true)}
                    {renderField("customer_address", "Customer Address", "text", true)}
                    {renderField("customer_job_number", "Customer Job Number", 'text', false)}
                    {renderField("purchase_order", "Purchase Order #")}
                </div>
            </SectionBox>

            <SectionBox title="Job / Location">
                <div className="grid grid-cols-1 gap-2">
                    {renderField("township", "Township")}
                    {renderField("county", "County")}
                    {renderField("sr_route", "SR Route")}
                    {renderField("job_address", "Job Address")}
                    {renderField("ecsm_contract_number", "ECMS / Contract Number")}
                </div>
            </SectionBox>

            <SectionBox title="Project Details">
                <div className="grid grid-cols-1 gap-2">
                    {renderField("bid_date", "Bid Date", "date")}
                    {renderField("start_date", "Start Date", "date")}
                    {renderField("end_date", "End Date", "date")}
                    {renderField("duration", "Duration (days)", "number", true)}
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

