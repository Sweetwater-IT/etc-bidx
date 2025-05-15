'use client'
import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Upload } from 'lucide-react';
import FringeBenefitsStatement from './EmploymentBenefits';
import WorkerProtectionCertification from './WorkersProtection';
import { GenerateEmployeeVerificationForm } from './EmploymentVerification';
import { PDFViewer } from '@react-pdf/renderer';
import { defaultAdminObject } from '@/types/default-objects/defaultAdminData';

interface Props {
    contractNumber: string;
}

interface FormInputProps {
    label: string;
    value?: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    prefix?: string;
}

function FormInput({
    label,
    value,
    placeholder,
    disabled,
    className,
    prefix,
}: FormInputProps) {
    return (
        <div className={className}>
            <Label>{label}</Label>
            <div className="mt-1 flex">
                {prefix && (
                    <div className="pointer-events-none flex h-10 w-10 items-center justify-center rounded-l-md border border-r-0 bg-muted text-sm text-muted-foreground">
                        {prefix}
                    </div>
                )}
                <Input
                    value={value}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="rounded-l-none bg-muted/50"
                />
            </div>
        </div>
    );
}

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

interface FormSelectProps {
    label: string;
    value?: string;
    placeholder?: string;
    options?: { value: string; label: string }[];
    className?: string;
    prefix?: string;
    disabled?: boolean;
}

function FormSelect({
    label,
    value,
    placeholder,
    options,
    className,
    prefix,
    disabled,
}: FormSelectProps) {
    return (
        <div className={className}>
            <Label>{label}</Label>
            <div className="mt-1 flex">
                {prefix && (
                    <div className="pointer-events-none flex h-10 w-10 items-center justify-center rounded-l-md border border-r-0 bg-muted text-sm text-muted-foreground">
                        {prefix}
                    </div>
                )}
                <Select disabled={disabled}>
                    <SelectTrigger
                        className={cn("w-full bg-muted/50", prefix && "rounded-l-none")}
                    >
                        <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                        {options?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

const ContractManagementContent = ({ contractNumber }: Props) => {
    // State for modals
    const [isOpenFringeBenefits, setIsOpenFringeBenefits] = useState(false);
    const [isOpenWorkersProtection, setIsOpenWorkersProtection] = useState(false);
    const [isOpenEmploymentVerification, setIsOpenEmploymentVerification] = useState(false);

    return (
        <div className="flex gap-6 p-6">
            {/* PDF Modals */}
            <Dialog open={isOpenFringeBenefits} onOpenChange={setIsOpenFringeBenefits}>
                <DialogContent className="max-w-4xl h-[600px] p-0">
                    <PDFViewer>
                        <FringeBenefitsStatement jobData={null} adminData={defaultAdminObject}/>
                    </PDFViewer>
                </DialogContent>
            </Dialog>

            <Dialog open={isOpenWorkersProtection} onOpenChange={setIsOpenWorkersProtection}>
                <DialogContent className="max-w-4xl h-[600px] p-0">
                    <PDFViewer>
                        <WorkerProtectionCertification/>
                    </PDFViewer>
                </DialogContent>
            </Dialog>

            <Dialog open={isOpenEmploymentVerification} onOpenChange={setIsOpenEmploymentVerification}>
                <DialogContent className="max-w-4xl h-[600px] p-0">
                    <PDFViewer>
                        <GenerateEmployeeVerificationForm description='' adminData={defaultAdminObject}/>
                    </PDFViewer>
                </DialogContent>
            </Dialog>

            {/* Main Content (2/3) */}
            <div className="flex-[2] space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                        Contract #{contractNumber}
                    </h2>
                    <Button>Create Job</Button>
                </div>

                {/* Customer Information */}
                <div className="rounded-lg border bg-card p-6">
                    <div className="mb-6 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">
                            Customer Information
                        </h3>
                        <Button variant="outline" size="sm">
                            Edit
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormInput label="Customer" />
                        <FormInput label="Customer Contract Number" />
                        <FormInput label="Project Manager" />
                        <FormInput label="PM Email" />
                        <FormInput label="PM Phone" />
                    </div>
                </div>

                {/* Contract Upload */}
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="mb-6 text-lg font-semibold">Contract</h3>
                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12">
                        <Upload className="mb-4 h-8 w-8 text-muted-foreground" />
                        <div className="text-center text-muted-foreground">
                            Upload contract here
                        </div>
                    </div>
                </div>

                {/* Prevailing Wages */}
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="mb-6 text-lg font-semibold">Prevailing Wages</h3>
                    <div className="mb-6 flex items-center space-x-2">
                        <Switch id="use-shop-rates" />
                        <Label htmlFor="use-shop-rates">Use shop rates</Label>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Labor Rate</Label>
                            <div className="flex items-center">
                                <div className="pointer-events-none flex h-10 w-10 items-center justify-center rounded-l-md border border-r-0 bg-muted text-sm text-muted-foreground">
                                    $
                                </div>
                                <Input
                                    type="number"
                                    className="rounded-l-none bg-muted/50"
                                    defaultValue="32.75"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Fringe Rate</Label>
                            <div className="flex items-center">
                                <div className="pointer-events-none flex h-10 w-10 items-center justify-center rounded-l-md border border-r-0 bg-muted text-sm text-muted-foreground">
                                    $
                                </div>
                                <Input
                                    type="number"
                                    className="rounded-l-none bg-muted/50"
                                    defaultValue="25.5"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Certified Payroll</Label>
                            <Input value="State" className="bg-muted/50" />
                        </div>
                    </div>
                </div>

                {/* Fringe Benefit Letter */}
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="text-lg font-semibold">Fringe Benefit Letter</h3>
                    <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <FormInput
                                label="Contract Number"
                                value={contractNumber}
                                disabled
                                prefix="#"
                            />
                            <FormInput
                                label="SR Route"
                                value="10"
                                disabled
                                prefix="/"
                            />
                            <FormSelect
                                label="Contractor"
                                placeholder="Select contractor"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <FormSelect label="County" value="Armstrong" disabled />
                            <FormInput label="Labor Rate" value="32.75" prefix="$" />
                            <FormInput label="Fringe Rate" value="25.5" prefix="$" />
                        </div>

                        <FormSelect
                            label="Sender"
                            placeholder="Select sender"
                            options={[{ value: "garret", label: "Garret Brunton" }]}
                        />

                        <div className="space-y-2">
                            <Label>Labor Group</Label>
                            <RadioGroup
                                defaultValue="labor-group-3"
                                className="flex gap-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                        value="labor-group-1"
                                        id="labor-group-1"
                                    />
                                    <Label htmlFor="labor-group-1">Labor Group 1</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                        value="labor-group-3"
                                        id="labor-group-3"
                                    />
                                    <Label htmlFor="labor-group-3">Labor Group 3</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="custom" id="custom" />
                                    <Label htmlFor="custom">Custom Labor Group</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button 
                                variant="outline" 
                                onClick={() => setIsOpenFringeBenefits(true)}
                            >
                                Preview
                            </Button>
                            <Button>Generate Document</Button>
                        </div>
                    </div>
                </div>

                {/* Worker's Protection Form */}
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="text-lg font-semibold">
                        Worker&apos;s Protection Form
                    </h3>
                    <div className="mt-4 space-y-4">
                        <FormSelect
                            label="Signer"
                            placeholder="Select signer"
                            options={[{ value: "garret", label: "Garret Brunton" }]}
                        />
                        <div className="flex justify-end gap-2">
                            <Button 
                                variant="outline"
                                onClick={() => setIsOpenWorkersProtection(true)}
                            >
                                Preview
                            </Button>
                            <Button>Generate Document</Button>
                        </div>
                    </div>
                </div>

                {/* Employment Verification */}
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="text-lg font-semibold">
                        Employment Verification
                    </h3>
                    <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FormInput
                                label="Contract Number"
                                value={contractNumber}
                                disabled
                            />
                            <FormInput label="County" value="Armstrong" disabled />
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FormSelect
                                label="Signer"
                                placeholder="Select signer"
                                options={[{ value: "garret", label: "Garret Brunton" }]}
                            />
                            <FormSelect label="Owner" value="TURNPIKE" disabled />
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input className="h-24" />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button 
                                variant="outline"
                                onClick={() => setIsOpenEmploymentVerification(true)}
                            >
                                Preview
                            </Button>
                            <Button>Generate Document</Button>
                        </div>
                    </div>
                </div>

                {/* Additional Files */}
                <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold">Additional Files</h3>
                        <Button variant="outline" size="sm" className="bg-muted/50">
                            Add selected files (0)
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="w9"
                                className="h-4 w-4 rounded border-input"
                            />
                            <Label htmlFor="w9" className="text-sm font-normal">
                                W-9
                            </Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="eeo"
                                className="h-4 w-4 rounded border-input"
                            />
                            <Label htmlFor="eeo" className="text-sm font-normal">
                                EEO-SHARP Policy
                            </Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="safety"
                                className="h-4 w-4 rounded border-input"
                            />
                            <Label htmlFor="safety" className="text-sm font-normal">
                                Safety Program
                            </Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="harassment"
                                className="h-4 w-4 rounded border-input"
                            />
                            <Label htmlFor="harassment" className="text-sm font-normal">
                                Sexual Harassment Policy
                            </Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="appeals"
                                className="h-4 w-4 rounded border-input"
                            />
                            <Label htmlFor="appeals" className="text-sm font-normal">
                                Avenue of Appeals
                            </Label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column (1/3) */}
            <div className="flex-1 space-y-6">
                {/* File Manager */}
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="mb-4 text-lg font-semibold">File Manager</h3>
                    <div className="mb-4 flex items-center gap-2">
                        <Button variant="outline" className="flex-1">
                            Combine Files
                        </Button>
                        <Button className="flex-1">Send</Button>
                    </div>
                    <div className="rounded-lg border-2 border-dashed p-8 text-center">
                        <div className="text-sm text-muted-foreground">
                            Drop a file here or click to browse
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                            File should not exceed 5MB in size
                        </div>
                    </div>
                </div>

                {/* Admin Information */}
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="mb-4 text-lg font-semibold">
                        Admin Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <AdminInfoItem label="Contract #" value="1209181" />
                        <AdminInfoItem label="Owner" value="TURNPIKE" />
                        <AdminInfoItem label="County" value="Armstrong" />
                        <AdminInfoItem label="Branch" value="WEST" />
                        <AdminInfoItem label="Township" value="Philadelphia" />
                        <AdminInfoItem label="Division" value="PRIVATE" />
                        <AdminInfoItem label="Start Date" value="4/25/2025" />
                        <AdminInfoItem label="End Date" value="8/3/2025" />
                        <AdminInfoItem label="Total Days" value="100" />
                        <AdminInfoItem label="Bid Date" value="4/24/2025" />
                        <AdminInfoItem label="SR Route" value="10" />
                        <AdminInfoItem label="DBE %" value="10%" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ContractManagementContent