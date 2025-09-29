'use client'

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StraightSaleQuote } from "../types";
import React, { useEffect } from "react";
import RenderEtcSection from "./RenderEtcSection";
import { useCustomerSelection } from "@/hooks/use-csutomers-selection";

interface IRenderSaleQuoteFields {
    data: Partial<StraightSaleQuote>;
    setData: (data: Partial<StraightSaleQuote>) => void;
    editAll?: boolean;
}

const SectionBox = ({
    title,
    children,
    isEditing,
}: {
    title: string;
    children: React.ReactNode;
    isEditing: boolean;
}) => (
    <div className="rounded-lg p-4 mb-6 text-[12px]">
        <div className="flex justify-between items-start h-[40px]">
            <p className="font-bold">{title}</p>
        </div>
        {children}
    </div>
);

const RenderSaleQuoteFields = ({ data, setData, editAll = false }: IRenderSaleQuoteFields) => {
    const renderField = (
        field: keyof StraightSaleQuote,
        label: string,
        type: string = "text",
        readOnly: boolean = false
    ) => (
        <div className="mb-4">
            <label className="font-semibold block mb-1">{label}</label>
            {editAll ? (
                <Input
                    type={type}
                    value={data[field] ?? ""}
                    onChange={(e) => setData({ ...data, [field]: e.target.value })}
                    className="w-full"
                    readOnly={readOnly}
                />
            ) : (
                <p className="text-sm text-gray-700">
                    {data[field]
                        ? type === "date"
                            ? new Date(data[field] as string).toISOString().slice(0, 10)
                            : String(data[field])
                        : "-"}
                </p>
            )}
        </div>
    );

    return (
        <div className="flex flex-col w-full text-[12px]">
            <div className="grid grid-cols-2 w-full gap-4">
                {/* Customer info */}
                <SectionBox title="Customer Information" isEditing={editAll}>
                    <div className="grid grid-cols-1 gap-2">
                        {renderField("customer_name", "Customer Name", "text", true)}
                        {renderField("customer_contact", "Customer Point Of Contact", "text", true)}
                        {renderField("customer_email", "Customer Email", "text", true)}
                        {renderField("customer_phone", "Customer Phone", "text", true)}
                        {renderField("customer_address", "Customer Address", "text", true)}
                        {renderField("purchase_order", "Purchase Order")}
                    </div>
                </SectionBox>

                <RenderEtcSection
                    data={data}
                    setData={setData}
                    editAll={editAll}
                    onSaveData={(updatedData) => {
                        setData({
                            ...data,
                            etc_point_of_contact: updatedData.etc_point_of_contact,
                            etc_poc_email: updatedData.etc_poc_email,
                            etc_poc_phone_number: updatedData.etc_poc_phone_number,
                            etc_branch: updatedData.etc_branch,
                        });
                    }}
                />
            </div>
        </div>
    );
};

export default RenderSaleQuoteFields;
