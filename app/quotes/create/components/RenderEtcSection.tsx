'use client'
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import React from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface IRenderEtcSection {
    data: any;
    setData: (data: any) => void;
    onSaveData: (data: any) => void;
    editAll?: boolean;
    showldJobNumber?: boolean;

}

const BRANCHES = [{ value: 'Turbotville', label: 'Turbotville' }, { value: 'Hatfield', label: 'Hatfield' }, { value: 'Bedford', label: 'Bedford' }]


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
                <p className="text-sm text-gray-700">
                    {data[field] ? data[field] : fallbackValue ? fallbackValue : "-"}
                </p>)}
        </div>
        
    );

    return (
        <div className="rounded-lg p-4 flex flex-col text-[12px] break-words">
            <div className="h-[40px]">
                <h4 className="font-bold">ETC Contact</h4>
            </div>

            <div className="flex flex-col gap-2 ">
                {renderField("etc_point_of_contact", "ETC Point of Contact", user?.user_metadata?.name)}
                {renderField("etc_poc_email", "ETC POC Email", user?.email)}
                {renderField("etc_poc_phone_number", "ETC POC Phone", "(215) 997-8801")}
                <div className="flex-1 mb-4">
                    <label className="block font-semibold mb-1">ETC Branch</label>
                    {editAll ? (
                        <Select
                            value={data.etc_branch ?? userBranch?.name}
                            onValueChange={(val) => setData({ ...data, etc_branch: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a branch" />
                            </SelectTrigger>
                            <SelectContent>
                                {BRANCHES.map((branch) => (
                                    <SelectItem key={branch.value} value={branch.value}>
                                        {branch.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <p className="text-sm text-gray-700">{data.etc_branch ?? userBranch?.name ?? "-"}</p>
                    )}
                </div>
                {
                    showldJobNumber &&
                    <div className="flex flex-col gap-2">
                        {renderField("etc_job_number", "ETC Job Number", data.etc_job_number)}
                    </div>
                }
            </div>



        </div>
    );
};

export default RenderEtcSection;
