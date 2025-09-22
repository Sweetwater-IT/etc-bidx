'use client'

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StraightSaleQuote } from "../types";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useCustomerSelection } from "@/hooks/use-csutomers-selection";
import RenderEtcSection from "./RenderEtcSection";

interface IRenderSaleQuoteFields {
    data: Partial<StraightSaleQuote>;
    setData: (data: Partial<StraightSaleQuote>) => void;
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

const RenderSaleQuoteFields = ({ data, setData }: IRenderSaleQuoteFields) => {
    const { user } = useAuth();
    const inputClass = "flex-1";
    const { customers, selectedCustomer, selectedContact, selectCustomer, selectContact } = useCustomerSelection();
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
                <p className="text-sm text-gray-700">{data[field] ?? "-"}</p>
            )}
        </div>
    );

    return (
        <div className="flex flex-col w-full">
            {/* Customer selection */}
            <div className="mb-8">
                <p className="font-bold mb-2">Job Selection</p>
                <div className="flex flex-row justify-between gap-4 mb-4">
                    <div className="w-full">
                        <Select onValueChange={selectCustomer} value={selectedCustomer?.id?.toString() || ""}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Customer" />
                            </SelectTrigger>
                            <SelectContent>
                                {customers.map(c => (
                                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-full">
                        <Select
                            onValueChange={selectContact}
                            value={selectedContact?.id?.toString() || ""}
                            disabled={!selectedCustomer}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Contact" />
                            </SelectTrigger>
                            <SelectContent>
                                {selectedCustomer?.customer_contacts?.length
                                    ? selectedCustomer.customer_contacts.map(cc => (
                                        <SelectItem key={cc.id} value={cc.id.toString()}>
                                            {cc.name} ({cc.email})
                                        </SelectItem>
                                    ))
                                    : <p className="text-center text-gray-400 text-sm py-4">There are no contacts</p>
                                }
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Customer info */}
            <SectionBox
                title="Customer Information"
                isEditing={editingSection === "customer"}
                onEdit={() => setEditingSection("customer")}
                onCancel={() => setEditingSection(null)}
                onSave={() => setEditingSection(null)}
            >
                <div className="grid grid-cols-2 gap-4">
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
    );
};

export default RenderSaleQuoteFields;
