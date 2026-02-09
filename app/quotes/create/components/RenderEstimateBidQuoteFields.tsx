'use client'

import { Input } from "@/components/ui/input";
import { EstimateBidQuote } from "../types";
import React, { useEffect } from "react";
import RenderEtcSection from "./RenderEtcSection";
import { QuoteItem } from "@/types/IQuoteItem";
import { useQuoteForm } from "../QuoteFormProvider";
import CustomerSelect from "./CustomerSelector";

interface IRenderEstimateBidQuoteFields {
    data: Partial<EstimateBidQuote>;
    setData: React.Dispatch<any>;
    setQuoteItems: React.Dispatch<any>;
    onSaveData: (data: Partial<EstimateBidQuote>) => void;
    selectedBid?: any;
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
        <div className="break-words">
            {children}
        </div>
    </div>
);

const RenderEstimateBidQuoteFields = ({ data, setData, onSaveData, selectedBid, editAll = false, setQuoteItems }: IRenderEstimateBidQuoteFields) => {

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

    const renderField = React.useCallback((
        field: keyof EstimateBidQuote,
        label: string,
        type: string = "text",
        disabled?: boolean
    ) => (
        <div className="mb-4">
            <label className="font-semibold block mb-1">{label}</label>
            {editAll ? (
                <Input
                    type={type === "date" ? "date" : type}
                    value={data[field] ?? ""}
                    onChange={(e) => setData({ ...data, [field]: e.target.value })}
                    className="w-full"
                    readOnly={disabled}
                />
            ) : (
                <p className="text-sm text-gray-700">
                    {data[field] ? (type === "date" ? new Date(data[field] as string).toISOString().slice(0, 10) : String(data[field])) : (type === 'number' ? 0 : "-")}
                </p>
            )}
        </div>
    ), [data, editAll, setData]);

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
                    {renderField("customer_phone", "Customer Phone", 'text', true)}
                    {renderField("customer_email", "Customer Email", 'text', true)}
                    {renderField("customer_address", "Customer Address", 'text', true)}
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
                data={data}
                setData={setData}
                onSaveData={() => onSaveData(data)}
                editAll={editAll}
            />
        </div>
    );
};

export default RenderEstimateBidQuoteFields;
