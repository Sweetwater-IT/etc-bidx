// components/pages/quote-form/AdminInformationTable.tsx
"use client";
import { AdminData } from "@/types/TAdminData";

export function AdminInformationTable({ adminData }: { adminData: AdminData }) {
    if (!adminData) return null;

    return (
        <div className="rounded-lg border p-6 bg-white shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Admin Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="font-medium">Contract Number</p>
                    <p>{adminData.contractNumber || "-"}</p>
                </div>
                <div>
                    <p className="font-medium">Estimator</p>
                    <p>{adminData.estimator || "-"}</p>
                </div>
                <div>
                    <p className="font-medium">Division</p>
                    <p>{adminData.division || "-"}</p>
                </div>
                <div>
                    <p className="font-medium">County</p>
                    <p>{adminData.county?.country || "-"}</p>
                </div>
                <div>
                    <p className="font-medium">Start Date</p>
                    <p>
                        {adminData.startDate
                            ? new Date(adminData.startDate).toLocaleDateString()
                            : "-"}
                    </p>
                </div>
                <div>
                    <p className="font-medium">End Date</p>
                    <p>
                        {adminData.endDate
                            ? new Date(adminData.endDate).toLocaleDateString()
                            : "-"}
                    </p>
                </div>
                {/* Agregás todos los campos que necesites */}
            </div>
        </div>
    );
}
