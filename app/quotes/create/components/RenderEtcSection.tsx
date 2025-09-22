'use client'
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import React from "react";

interface IRenderEtcSection {
    data: any;
    setData: (data: any) => void;
    onSaveData: (data: any) => void;
}

const RenderEtcSection = ({ data, setData, onSaveData }: IRenderEtcSection) => {
    const { user } = useAuth();
    const [userBranch, setUserBranch] = React.useState<any>(null);
    const [isEditing, setIsEditing] = React.useState(false);

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
        <div className="flex-1">
            <label className="block font-semibold mb-1">{label}</label>
            {isEditing ? (
                <Input
                    value={data[field] ?? fallbackValue}
                    onChange={(e) => setData({ ...data, [field]: e.target.value })}
                />
            ) : (
                <p className="text-sm text-gray-700">
                    {data[field] ?? fallbackValue ?? "-"}
                </p>
            )}
        </div>
    );

    return (
        <div className="border rounded-lg p-4 mb-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold">ETC Contact</h4>
                {!isEditing ? (
                    <Button size="sm" onClick={() => setIsEditing(true)}>Edit</Button>
                ) : (
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button
                            size="sm"
                            onClick={() => {
                                onSaveData(data);
                                setIsEditing(false);
                            }}
                        >
                            Save
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex gap-4 mb-4">
                {renderField("etc_point_of_contact", "ETC Point of Contact", user?.user_metadata?.name)}
                {renderField("etc_poc_email", "ETC POC Email", user?.email)}
            </div>

            <div className="flex gap-4 mb-4">
                {renderField("etc_poc_phone_number", "ETC POC Phone", userBranch?.address)}
                {renderField("etc_branch", "ETC Branch", userBranch?.name)}
            </div>
        </div>
    );
};

export default RenderEtcSection;
