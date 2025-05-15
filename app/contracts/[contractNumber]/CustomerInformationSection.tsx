import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Customer } from '@/types/Customer';

interface FormInputProps {
    label: string;
    value?: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    prefix?: string;
    onChange?: (value: string) => void;
}

function FormInput({
    label,
    value,
    placeholder,
    disabled,
    className,
    prefix,
    onChange
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
                    onChange={(e) => onChange?.(e.target.value)}
                />
            </div>
        </div>
    );
}

interface CustomerInformationSectionProps {
    customer: Customer | null;
    customerContractNumber: string;
    projectManager: string;
    pmEmail: string;
    pmPhone: string;
    onCustomerChange: (customer: Customer | null) => void;
    onCustomerContractNumberChange: (value: string) => void;
    onProjectManagerChange: (value: string) => void;
    onPmEmailChange: (value: string) => void;
    onPmPhoneChange: (value: string) => void;
}

const CustomerInformationSection: React.FC<CustomerInformationSectionProps> = ({
    customer,
    customerContractNumber,
    projectManager,
    pmEmail,
    pmPhone,
    onCustomerChange,
    onCustomerContractNumberChange,
    onProjectManagerChange,
    onPmEmailChange,
    onPmPhoneChange
}) => {
    return (
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
                <FormInput
                    label="Customer"
                    value={customer?.name || ''}
                    onChange={(value) => {
                        // In a real app, this would likely trigger a search or selection
                        // For now, we'll just create a simple customer object
                        onCustomerChange({ name: value } as Customer);
                    }}
                />
                <FormInput
                    label="Customer Contract Number"
                    value={customerContractNumber}
                    onChange={onCustomerContractNumberChange}
                />
                <FormInput
                    label="Project Manager"
                    value={projectManager}
                    onChange={onProjectManagerChange}
                />
                <FormInput
                    label="PM Email"
                    value={pmEmail}
                    onChange={onPmEmailChange}
                />
                <FormInput
                    label="PM Phone"
                    value={pmPhone}
                    onChange={onPmPhoneChange}
                />
            </div>
        </div>
    );
};

export default CustomerInformationSection;