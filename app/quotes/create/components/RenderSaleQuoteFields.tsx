'use client'

import { Input } from "@/components/ui/input";
import { useState } from "react";
import { StraightSaleQuote } from "../types";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface IRenderSaleQuoteFields {
    data: Partial<StraightSaleQuote>;
    setData: (data: Partial<StraightSaleQuote>) => void;
    onSaveInformation: () => void;
}

const RenderSaleQuoteFields = ({
    data,
    setData,
    onSaveInformation,
}: IRenderSaleQuoteFields) => {
    const [isEditing, setIsEditing] = useState(false);
    const [backup, setBackup] = useState<Partial<StraightSaleQuote>>(data);

    const toggleEditMode = (edit: boolean) => {
        if (edit) setBackup(data);
        setIsEditing(edit);
    };

    const handleSave = () => {
        onSaveInformation();
        setIsEditing(false);
    };

    const handleCancel = () => {
        setData(backup);
        setIsEditing(false);
    };

    const inputClass = "flex-1";

    return (
        <div className="">
            <div className="flex flex-row justify-between">
                <h2 className="font-bold">Straight Sale Quote</h2>
                <div className="flex justify-end mb-4 gap-2">
                    {isEditing ? (
                        <>
                            <Button
                                size="sm"
                                variant="default"
                                className="h-8"
                                onClick={handleSave}
                            >
                                Save
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8"
                                onClick={handleCancel}
                            >
                                Cancel
                            </Button>
                        </>
                    ) : (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={() => toggleEditMode(true)}
                        >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                        </Button>
                    )}
                </div>
            </div>

            <h4 className="mt-4 mb-2 font-semibold">Customer Information</h4>
            <div className="flex gap-4 mb-4">
                <div className={inputClass}>
                    <label>Customer Name</label>
                    {isEditing ? (
                        <Input
                            value={data.customer_contact?.name || ""}
                            onChange={(e) =>
                                setData({
                                    ...data,
                                    customer_contact: {
                                        ...data.customer_contact,
                                        name: e.target.value,
                                    },
                                })
                            }
                        />
                    ) : (
                        <p>{data.customer_contact?.name || "-"}</p>
                    )}
                </div>

                <div className={inputClass}>
                    <label>Customer Email</label>
                    {isEditing ? (
                        <Input
                            value={data.customer_email || ""}
                            onChange={(e) =>
                                setData({ ...data, customer_email: e.target.value })
                            }
                        />
                    ) : (
                        <p>{data.customer_email || "-"}</p>
                    )}
                </div>
            </div>

            <div className="flex gap-4 mb-4">
                <div className={inputClass}>
                    <label>Customer Phone</label>
                    {isEditing ? (
                        <Input
                            value={data.customer_phone || ""}
                            onChange={(e) =>
                                setData({ ...data, customer_phone: e.target.value })
                            }
                        />
                    ) : (
                        <p>{data.customer_phone || "-"}</p>
                    )}
                </div>

                <div className={inputClass}>
                    <label>Customer Address</label>
                    {isEditing ? (
                        <Input
                            value={data.customer_address || ""}
                            onChange={(e) =>
                                setData({ ...data, customer_address: e.target.value })
                            }
                        />
                    ) : (
                        <p>{data.customer_address || "-"}</p>
                    )}
                </div>
            </div>

            <div className="flex gap-4 mb-4">
                <div className={inputClass}>
                    <label>Customer Job Number</label>
                    {isEditing ? (
                        <Input
                            value={data.customer_job_number || ""}
                            onChange={(e) =>
                                setData({ ...data, customer_job_number: e.target.value })
                            }
                        />
                    ) : (
                        <p>{data.customer_job_number || "-"}</p>
                    )}
                </div>

                <div className={inputClass}>
                    <label>Purchase Order</label>
                    {isEditing ? (
                        <Input
                            value={data.purchase_order || ""}
                            onChange={(e) =>
                                setData({ ...data, purchase_order: e.target.value })
                            }
                        />
                    ) : (
                        <p>{data.purchase_order || "-"}</p>
                    )}
                </div>
            </div>

            {/* ETC Section */}
            <h4 className="mt-6 font-semibold mb-4">ETC Contact</h4>
            <div className="flex gap-4 mb-4">
                <div className={inputClass}>
                    <label>ETC Point of Contact</label>
                    {isEditing ? (
                        <Input
                            value={data.etc_point_of_contact || ""}
                            onChange={(e) =>
                                setData({ ...data, etc_point_of_contact: e.target.value })
                            }
                        />
                    ) : (
                        <p>{data.etc_point_of_contact || "-"}</p>
                    )}
                </div>

                <div className={inputClass}>
                    <label>ETC POC Email</label>
                    {isEditing ? (
                        <Input
                            value={data.etc_poc_email || ""}
                            onChange={(e) =>
                                setData({ ...data, etc_poc_email: e.target.value })
                            }
                        />
                    ) : (
                        <p>{data.etc_poc_email || "-"}</p>
                    )}
                </div>
            </div>

            <div className="flex gap-4 mb-4">
                <div className={inputClass}>
                    <label>ETC POC Phone</label>
                    {isEditing ? (
                        <Input
                            value={data.etc_poc_phone_number || ""}
                            onChange={(e) =>
                                setData({ ...data, etc_poc_phone_number: e.target.value })
                            }
                        />
                    ) : (
                        <p>{data.etc_poc_phone_number || "-"}</p>
                    )}
                </div>

                <div className={inputClass}>
                    <label>ETC Branch</label>
                    {isEditing ? (
                        <Input
                            value={data.etc_branch || ""}
                            onChange={(e) => setData({ ...data, etc_branch: e.target.value })}
                        />
                    ) : (
                        <p>{data.etc_branch || "-"}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RenderSaleQuoteFields;
