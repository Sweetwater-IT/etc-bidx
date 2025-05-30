import React from "react";
import { AdminData } from "@/types/TAdminData";

interface AdminInfoItemProps {
  label: string;
  value: string;
}

function AdminInfoItem({ label, value }: AdminInfoItemProps) {
  return (
    <div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

interface AdminInformationSectionProps {
  adminData: AdminData;
}

const AdminInformationSection: React.FC<AdminInformationSectionProps> = ({
  adminData,
}) => {
  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  const calculateTotalDays = (startDate: Date | null, endDate: Date | null) => {
    if (!startDate || !endDate) return "N/A";
    const diffTime = Math.abs(
      new Date(endDate).getTime() - new Date(startDate).getTime()
    );
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays.toString();
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold">Admin Information</h3>
      <div className="grid grid-cols-2 gap-4">
        <AdminInfoItem label="Contract #" value={adminData.contractNumber} />
        <AdminInfoItem label="Owner" value={adminData.owner || "N/A"} />
        <AdminInfoItem label="County" value={adminData.county.name} />
        <AdminInfoItem label="Branch" value={adminData.county.branch} />
        <AdminInfoItem label="Township" value={adminData.location || "-"} />
        <AdminInfoItem label="Division" value={adminData.division || "N/A"} />
        <AdminInfoItem
          label="Start Date"
          value={formatDate(adminData.startDate)}
        />
        <AdminInfoItem label="End Date" value={formatDate(adminData.endDate)} />
        <AdminInfoItem
          label="Total Days"
          value={calculateTotalDays(adminData.startDate, adminData.endDate)}
        />
        <AdminInfoItem
          label="Bid Date"
          value={formatDate(adminData.lettingDate)}
        />
        <AdminInfoItem label="SR Route" value={adminData.srRoute} />
        <AdminInfoItem label="DBE %" value={`${adminData.dbe}%`} />
      </div>
    </div>
  );
};

export default AdminInformationSection;
