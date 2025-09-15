'use client'

import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Quote, StraightSaleQuote } from "../types";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

const RenderSaleQuoteFields = () => {
    const [straightSale, setStraightSale] = useState<StraightSaleQuote>({
        quoteCategory: "Straight Sale",
        customer: {},
        customer_contact: {},
        customer_email: "",
        customer_phone: "",
        customer_address: "",
        customer_job_number: "",
        purchase_order: "",
        etc_point_of_contact: "",
        etc_poc_email: "",
        etc_poc_phone_number: "",
        etc_branch: "",
    });
    const [isEditing, setIsEditing] = useState(false);


    const toggleEditMode = (edit: boolean) => {
        setIsEditing(edit);
    };

    const handleSave = () => {
        console.log("Guardado:", straightSale);
        setIsEditing(false);
    };

    const inputClass = "flex-1";

    return (
        <div className="p-[20px] border-[1px] border-gray-300 rounded-md">
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
                                onClick={() => toggleEditMode(false)}
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

            {/* Customer Section */}
            <h4 className="mt-4 mb-2 font-semibold">Customer Information</h4>
            <div className="flex gap-4 mb-4">
                <div className={inputClass}>
                    <label>Customer Name</label>
                    {isEditing ? (
                        <Input
                            value={straightSale.customer_contact?.name || ""}
                            onChange={(e) =>
                                setStraightSale({
                                    ...straightSale,
                                    customer_contact: {
                                        ...straightSale.customer_contact,
                                        name: e.target.value,
                                    },
                                })
                            }
                        />
                    ) : (
                        <p>{straightSale.customer_contact?.name || "-"}</p>
                    )}
                </div>

                <div className={inputClass}>
                    <label>Customer Email</label>
                    {isEditing ? (
                        <Input
                            value={straightSale.customer_email}
                            onChange={(e) =>
                                setStraightSale({ ...straightSale, customer_email: e.target.value })
                            }
                        />
                    ) : (
                        <p>{straightSale.customer_email || "-"}</p>
                    )}
                </div>
            </div>

            <div className="flex gap-4 mb-4">
                <div className={inputClass}>
                    <label>Customer Phone</label>
                    {isEditing ? (
                        <Input
                            value={straightSale.customer_phone}
                            onChange={(e) =>
                                setStraightSale({ ...straightSale, customer_phone: e.target.value })
                            }
                        />
                    ) : (
                        <p>{straightSale.customer_phone || "-"}</p>
                    )}
                </div>

                <div className={inputClass}>
                    <label>Customer Address</label>
                    {isEditing ? (
                        <Input
                            value={straightSale.customer_address}
                            onChange={(e) =>
                                setStraightSale({
                                    ...straightSale,
                                    customer_address: e.target.value,
                                })
                            }
                        />
                    ) : (
                        <p>{straightSale.customer_address || "-"}</p>
                    )}
                </div>
            </div>

            <div className="flex gap-4 mb-4">
                <div className={inputClass}>
                    <label>Customer Job Number</label>
                    {isEditing ? (
                        <Input
                            value={straightSale.customer_job_number}
                            onChange={(e) =>
                                setStraightSale({
                                    ...straightSale,
                                    customer_job_number: e.target.value,
                                })
                            }
                        />
                    ) : (
                        <p>{straightSale.customer_job_number || "-"}</p>
                    )}
                </div>

                <div className={inputClass}>
                    <label>Purchase Order</label>
                    {isEditing ? (
                        <Input
                            value={straightSale.purchase_order}
                            onChange={(e) =>
                                setStraightSale({
                                    ...straightSale,
                                    purchase_order: e.target.value,
                                })
                            }
                        />
                    ) : (
                        <p>{straightSale.purchase_order || "-"}</p>
                    )}
                </div>
            </div>

            {/* ETC Section */}
            <h4 className="mt-6  font-semibold mb-4">ETC Contact</h4>
            <div className="flex gap-4 mb-4">
                <div className={inputClass}>
                    <label>ETC Point of Contact</label>
                    {isEditing ? (
                        <Input
                            value={straightSale.etc_point_of_contact}
                            onChange={(e) =>
                                setStraightSale({
                                    ...straightSale,
                                    etc_point_of_contact: e.target.value,
                                })
                            }
                        />
                    ) : (
                        <p>{straightSale.etc_point_of_contact || "-"}</p>
                    )}
                </div>

                <div className={inputClass}>
                    <label>ETC POC Email</label>
                    {isEditing ? (
                        <Input
                            value={straightSale.etc_poc_email}
                            onChange={(e) =>
                                setStraightSale({ ...straightSale, etc_poc_email: e.target.value })
                            }
                        />
                    ) : (
                        <p>{straightSale.etc_poc_email || "-"}</p>
                    )}
                </div>
            </div>

            <div className="flex gap-4 mb-4">
                <div className={inputClass}>
                    <label>ETC POC Phone</label>
                    {isEditing ? (
                        <Input
                            value={straightSale.etc_poc_phone_number}
                            onChange={(e) =>
                                setStraightSale({
                                    ...straightSale,
                                    etc_poc_phone_number: e.target.value,
                                })
                            }
                        />
                    ) : (
                        <p>{straightSale.etc_poc_phone_number || "-"}</p>
                    )}
                </div>

                <div className={inputClass}>
                    <label>ETC Branch</label>
                    {isEditing ? (
                        <Input
                            value={straightSale.etc_branch}
                            onChange={(e) =>
                                setStraightSale({ ...straightSale, etc_branch: e.target.value })
                            }
                        />
                    ) : (
                        <p>{straightSale.etc_branch || "-"}</p>
                    )}
                </div>
            </div>

        </div>
    );
};

export default RenderSaleQuoteFields;
