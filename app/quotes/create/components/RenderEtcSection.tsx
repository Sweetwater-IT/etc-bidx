'use client'
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import React from "react";

interface IRenderEtcSection {
    data: any;
    setData: (data: any) => void;
    onSaveData: (data: any) => void;
    editAll?: boolean;
    showldJobNumber?: boolean;

}

const RenderEtcSection = ({ data, setData, editAll = false, showldJobNumber }: IRenderEtcSection) => {
    const { user } = useAuth();
    const [userBranch, setUserBranch] = React.useState<any>(null);

    React.useEffect(() => {
        const getUserBranchByEmail = async () => {
            try {
                const response = await fetch(`/api/users?email=${user.email}`);
                const result = await response.json();
                if (result.success) setUserBranch(result.branchData[0]);
            } catch (error) {
                console.error("Fetch error:", error);
            }
        };
        getUserBranchByEmail();
    }, [user.email]);

    const renderField = (
        field: keyof typeof data,
        label: string,
        fallbackValue: string = ""
    ) => (
        <div className="flex-1 mb-4">
            <label className="block font-semibold mb-1">{label}</label>
            {editAll ? (
                <Input
                    value={data[field] ?? fallbackValue}
                    onChange={(e) => setData({ ...data, [field]: e.target.value })}
                />
            ) : (
                <p className="text-sm text-gray-700">{data[field] ?? fallbackValue ?? "-"}</p>
            )}
        </div>
    );

    return (
        <div className="rounded-lg p-4 mb-6 text-[12px]">
            <div className="h-[50px]">
                <h4 className="font-bold mb-4">ETC Contact</h4>
            </div>

            <div className="flex flex-col gap-2 mb-4">
                {renderField("etc_point_of_contact", "ETC Point of Contact", user?.user_metadata?.name)}
                {renderField("etc_poc_email", "ETC POC Email", user?.email)}
            </div>

            <div className="flex flex-col gap-2 mb-4">
                {renderField("etc_poc_phone_number", "ETC POC Phone", userBranch?.address)}
                {renderField("etc_branch", "ETC Branch", userBranch?.name)}
            </div>

            {
                showldJobNumber &&
                <div className="flex flex-col gap-2 mb-4">
                    {renderField("etc_job_number", "ETC Job Number", data.etc_job_number)}
                </div>
            }

        </div>
    );
};

export default RenderEtcSection;
