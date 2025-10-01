'use client'

import { Input } from "@/components/ui/input";
import { EstimateBidQuote } from "../types";
import React, { useEffect } from "react";
import RenderEtcSection from "./RenderEtcSection";
import { QuoteItem } from "@/types/IQuoteItem";
import { useQuoteForm } from "../QuoteFormProvider";

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

async function createQuoteItem(item: QuoteItem) {
    const res = await fetch("/api/quotes/quoteItems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
    });
    return res.json();
}

const RenderEstimateBidQuoteFields = ({ data, setData, onSaveData, selectedBid, editAll = false, setQuoteItems }: IRenderEstimateBidQuoteFields) => {
    const { quoteId } = useQuoteForm()

    useEffect(() => {
        if (!selectedBid) return;

        const admin = selectedBid.admin_data || {};
        const start = admin.startDate ? new Date(admin.startDate) : null;
        const end = admin.endDate ? new Date(admin.endDate) : null;
        const duration = start && end ? Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) : 0;

        setData((prev: any) => ({
            ...prev,
            customer: selectedBid?.customer || "",
            customer_name: selectedBid?.customer_name || "",
            customer_email: selectedBid?.customer_email || "",
            customer_phone: selectedBid?.customer_phone || "",
            customer_address: selectedBid?.customer_address || "",
            customer_job_number: admin.contractNumber || "",
            township: admin.location || "",
            county: admin.county?.name || "",
            sr_route: admin.srRoute || "",
            job_address: admin.location || "",
            ecsm_contract_number: admin.contractNumber || "",
            bid_date: admin.lettingDate ? new Date(admin.lettingDate).toISOString().slice(0, 10) : "",
            start_date: start ? start.toISOString().slice(0, 10) : "",
            end_date: end ? end.toISOString().slice(0, 10) : "",
            duration,
            project_title: "",
            description: "",
            estimate_id: selectedBid?.id,
        }));
    }, [selectedBid, setData]);

    useEffect(() => {
        if (!selectedBid || !quoteId) return;

        const importItems = async () => {
            const rentalItems: QuoteItem[] = (selectedBid.equipment_rental || []).map((item: any) => ({
                itemNumber: item.name,
                description: item.name,
                uom: 'ea',
                notes: "",
                quantity: item.quantity,
                unitPrice: item.revenue / item.quantity,
                discount: 0,
                discountType: 'dollar',
                associatedItems: [],
                isCustom: false,
                tax: 0,
                is_tax_percentage: false,
                quote_id: quoteId
            }));

            const saleItems: QuoteItem[] = (selectedBid.sale_items || []).map((item: any) => ({
                itemNumber: item.itemNumber,
                description: item.name,
                uom: 'ea',
                notes: "",
                quantity: item.quantity,
                unitPrice: item.quotePrice / item.quantity,
                discount: 0,
                discountType: 'dollar',
                associatedItems: [],
                isCustom: false,
                tax: 0,
                is_tax_percentage: false,
                quote_id: quoteId,
            }));

            if (rentalItems.length > 0 || saleItems.length > 0) {
                const allItems = [...rentalItems, ...saleItems];
                const finalList = await Promise.all(allItems.map(async item => {
                    const result = await createQuoteItem(item);
                    return result.item;
                }));
                setQuoteItems(finalList);
            }
        }

        importItems();
    }, [quoteId]);


    const renderField = (
        field: keyof EstimateBidQuote,
        label: string,
        type: string = "text",
        disabled?: boolean
    ) => (
        <div className="mb-4">
            <label className="font-semibold block mb-1">{label}</label>
            {editAll ? (
                <Input
                    type={type === "date" ? "datetime-local" : type}
                    value={data[field] ?? ""}
                    onChange={(e) => setData({ ...data, [field]: e.target.value })}
                    className="w-full"
                    readOnly={disabled}
                />
            ) : (
                <p className="text-sm text-gray-700">
                    {data[field] ? (type === "date" ? new Date(data[field] as string).toISOString().slice(0, 10) : String(data[field])) : "-"}
                </p>
            )}
        </div>
    );

    return (
        <div className="grid grid-cols-4 w-full gap-4 text-[12px]">
            <SectionBox title="Customer & Contact Information">
                <div className="grid grid-cols-1 gap-2">
                    {renderField("customer_name", "Customer", 'text', true)}
                    {renderField("customer_contact", "Customer Point Of Contact", 'text', true)}
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
                    {renderField("ecsm_contract_number", "ECSM Contract Number")}
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
