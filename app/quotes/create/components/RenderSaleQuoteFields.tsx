'use client'

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StraightSaleQuote } from "../types";
import React, { useEffect, useState } from "react";
import RenderEtcSection from "./RenderEtcSection";
import { Edit } from "lucide-react";

interface IRenderSaleQuoteFields {
    data: Partial<StraightSaleQuote>;
    setData: (data: Partial<StraightSaleQuote>) => void;
    selectedCustomer: any;
    selectedContact: any
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
    <div className="rounded-lg p-4 mb-6 text-[12px]">
        <div className="flex justify-between items-start h-[50px]">
            <h4 className="font-bold ">{title}</h4>
            {!isEditing ? (
                <span
                    className="text-gray-600 underline cursor-pointer hover:text-blue-800 text-[12px]"
                    onClick={onEdit}
                >
                    Edit
                </span>
            ) : (
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={onCancel}>
                        <p className="text-[12px]">Cancel</p>
                    </Button>
                    <Button size="sm" onClick={onSave}>
                        <p className="text-[12px]">Save</p>
                    </Button>
                </div>
            )}
        </div>
        {children}
    </div>
);


const RenderSaleQuoteFields = ({ data, setData, selectedCustomer, selectedContact }: IRenderSaleQuoteFields) => {
    const [editingSection, setEditingSection] = useState<string | null>(null);

    useEffect(() => {
        if (!selectedCustomer) return;

        setData({
            ...data,
            customer: selectedCustomer.id || "",
            customer_name: selectedCustomer.name || "",
            customer_email: selectedCustomer.email || "",
            customer_phone: selectedCustomer.main_phone || "",
            customer_address: `${selectedCustomer.address || ""} ${selectedCustomer.city || ""}, ${selectedCustomer.state || ""} ${selectedCustomer.zip || ""}`,
            customer_contact: selectedContact?.id || "",
        });
    }, [selectedCustomer, selectedContact]);

    const renderField = (
        field: keyof StraightSaleQuote,
        label: string,
        type: string = "text",
        readOnly: boolean = false
    ) => (
        <div className="mb-4">
            <label className="font-semibold block mb-1">{label}</label>
            {editingSection === "customer" ? (
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
                </p>)}
        </div>
    );

    return (
        <div className="flex flex-col w-full text-[12px]">
            {/* Customer selection */}
            <div className="grid grid-cols-2 w-full gap-4">
                {/* Customer info */}
                <SectionBox
                    title="Customer Information"
                    isEditing={editingSection === "customer"}
                    onEdit={() => setEditingSection("customer")}
                    onCancel={() => setEditingSection(null)}
                    onSave={() => setEditingSection(null)}
                >
                    <div className="grid grid-cols-1 gap-2">
                        {renderField("customer_name", "Customer Name")}
                        {renderField("customer_contact", "Customer Contact", "text", true)}
                        {renderField("customer_email", "Customer Email")}
                        {renderField("customer_phone", "Customer Phone")}
                        {renderField("customer_address", "Customer Address")}
                        {renderField("customer_job_number", "Customer Job Number")}
                        {renderField("purchase_order", "Purchase Order")}
                    </div>
                </SectionBox>

                {/* ETC Section */}
                <RenderEtcSection
                    data={data}
                    setData={setData}
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
