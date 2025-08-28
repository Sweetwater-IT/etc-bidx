import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Customer } from '../../../types/Customer';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '../../../components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { Check, ChevronsUpDown, AlertCircle, Edit } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useCustomers } from '../../../hooks/use-customers';
import { validateEmail } from '@/lib/emailValidation';
import { handlePhoneInput } from '@/lib/phone-number-functions';
import { ContactSelector } from '@/components/SelectContacts';
import { toast } from 'sonner';

interface FormInputProps {
    label: string;
    value?: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    prefix?: string;
    type?: 'text' | 'email' | 'phone';
    error?: string;
    onChange?: (value: string) => void;
    isReadOnly?: boolean;
}

function FormInput({
    label,
    value,
    placeholder,
    disabled,
    className,
    prefix,
    type = 'text',
    error,
    onChange,
    isReadOnly = false,
    modeEdit,
}: FormInputProps & { modeEdit: boolean }) {

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (type === 'phone') {
            const ev = e.nativeEvent as InputEvent;
            const { inputType } = ev;
            const data = ev.data || '';
            const newValue = handlePhoneInput(inputType, data, value || '');
            onChange?.(newValue);
        } else {
            onChange?.(e.target.value);
        }
    };

    if (!modeEdit) {
        return (
            <div className={className}>
                <Label>{label}</Label>
                <p className="mt-1 text-muted-foreground">{value || '-'}</p>
            </div>
        );
    }

    return (
        <div className={className}>
            <Label className={error ? 'text-red-600' : ''}>{label}</Label>
            <div className="mt-1 flex">
                {prefix && (
                    <div className="pointer-events-none flex h-10 w-10 items-center justify-center rounded-l-md border border-r-0 bg-muted text-sm text-muted-foreground">
                        {prefix}
                    </div>
                )}
                <Input
                    readOnly={isReadOnly}
                    value={value}
                    placeholder={placeholder}
                    disabled={disabled}
                    type={type === 'phone' ? 'text' : type}
                    inputMode={type === 'phone' ? 'tel' : type === 'email' ? 'email' : 'text'}
                    className={cn(
                        prefix && 'rounded-l-none',
                        'bg-muted/50',
                        error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    )}
                    onChange={handleChange}
                />
                {error && (
                    <div className="ml-2 flex items-center">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </div>
                )}
            </div>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
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
    contractNumber?: any;
    jobId?: number;
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
    onPmPhoneChange,
    contractNumber,
    jobId
}) => {

    const { customers = [] } = useCustomers();
    const [localContact, setLocalContact] = useState<any | null>(null);
    const [modeEdit, setModeEdit] = useState(false);
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [openCustomer, setOpenCustomer] = useState(false);
    const [emailError, setEmailError] = useState<string>();

    const [localValues, setLocalValues] = useState({
        customerContractNumber,
        projectManager,
        pmEmail,
        pmPhone,
    });

    useEffect(() => {
        setLocalValues({
            customerContractNumber,
            projectManager,
            pmEmail,
            pmPhone,
        });
    }, [customerContractNumber, projectManager, pmEmail, pmPhone]);

    const handleLocalChange = (field: string, value: string) => {
        setLocalValues((prev) => ({ ...prev, [field]: value }));
    };

        useEffect(() => {
        if (customer && localValues.pmEmail) {
            const matchingIndex = customer.emails.findIndex(email => email === localValues.pmEmail);
            if (matchingIndex !== -1) {
                setLocalContact({
                    id: customer.contactIds[matchingIndex],
                    name: customer.names[matchingIndex],
                    email: customer.emails[matchingIndex],
                    phone: customer.phones[matchingIndex],
                    role: customer.roles[matchingIndex],
                });
            } else {
                setLocalContact(null);
            }
        } else {
            setLocalContact(null);
        }
    }, [customer, localValues.pmEmail]);

    const handleSave = async () => {
        if (!jobId) return;

        if (!localValues.projectManager) {
            toast.error("Project Manager is required.");
            return;
        }
        try {
            const res = await fetch('/api/project-metadata', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobId,
                    customerContractNumber: localValues.customerContractNumber,
                    projectManager: localValues.projectManager,
                    pmEmail: localValues.pmEmail,
                    pmPhone: localValues.pmPhone,
                    contractorId: customer?.id,
                }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                toast.success("Project metadata updated!");
                setModeEdit(false);
            } else {
                toast.error("Failed to update project metadata: " + data.error);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to update project metadata.");
        }
    };

    const handleCancel = () => {
        setLocalValues({
            customerContractNumber,
            projectManager,
            pmEmail,
            pmPhone,
        });
        setModeEdit(false);
    };

    const handleEmailChange = (value: string) => {
        handleLocalChange('pmEmail', value);
        const validation = validateEmail(value);
        setEmailError(validation.isValid ? undefined : validation.message);
    };

    const handlePhoneChange = (formattedValue: string) => {
        handleLocalChange('pmPhone', formattedValue);
    };

    useEffect(() => {
        if (localContact && localContact?.id) {
            handleLocalChange('projectManager', localContact.name);
            handleLocalChange('pmEmail', localContact.email);
            handleLocalChange('pmPhone', localContact.phone);
        }
    }, [localContact]);

    return (
        <div className="rounded-lg border bg-card p-6">
            <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Customer Information</h3>
                <div className="flex flex-row items-center mb-4 justify-end">
                    {modeEdit ? (
                        <div className="flex gap-2">
                            <Button size="sm" variant="default" className="h-8" onClick={handleSave}>
                                Save
                            </Button>
                            <Button size="sm" variant="outline" className="h-8" onClick={handleCancel}>
                                Cancel
                            </Button>
                        </div>
                    ) : (
                        <div>
                            <Button size="sm" variant="outline" className="h-8" onClick={() => setModeEdit(true)}>
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    {!modeEdit ? (
                        <>
                            <Label>Contractor</Label>
                            <p className="mt-1 text-muted-foreground">{customer ? customer.name : '-'}</p>
                        </>
                    ) : (
                        <>
                            <Label>Contractor</Label>
                            <Popover open={openCustomer} onOpenChange={setOpenCustomer}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openCustomer}
                                        className="w-full justify-between bg-muted/50"
                                    >
                                        {customer ? customer.name : 'Select contractor...'}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search contractor..." />
                                        <CommandEmpty>No contractor found.</CommandEmpty>
                                        <CommandGroup className="max-h-[200px] overflow-y-auto">
                                            {customers.map((c) => (
                                                <CommandItem
                                                    key={c.id}
                                                    value={c.name}
                                                    onSelect={() => {
                                                        onCustomerChange(c);
                                                        setOpenCustomer(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            'mr-2 h-4 w-4',
                                                            customer && customer.id === c.id ? 'opacity-100' : 'opacity-0'
                                                        )}
                                                    />
                                                    {c.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </>
                    )}
                </div>

                <div className="space-y-2">
                    {!modeEdit ? (
                        <>
                            <Label>Contact Name</Label>
                            <p className="mt-1 text-muted-foreground">
                                {localContact ? localContact.name : '-'}
                            </p>
                        </>
                    ) : (
                        <>
                            <Label>Contact Name</Label>
                            <ContactSelector
                                localCustomer={customer}
                                setLocalCustomer={(customer: any) => onCustomerChange(customer)}
                                localContact={localContact}
                                setLocalContact={setLocalContact}
                                contactModalOpen={contactModalOpen}
                                setContactModalOpen={setContactModalOpen}
                            />
                        </>
                    )}
                </div>

                <FormInput
                    modeEdit={modeEdit}
                    label="Customer Contract Number"
                    value={localValues.customerContractNumber}
                    onChange={(value) => handleLocalChange('customerContractNumber', value.toUpperCase())}
                    placeholder="Contract number"
                    isReadOnly={!modeEdit}
                />

                <FormInput
                    isReadOnly
                    modeEdit={modeEdit}
                    label="Project Manager"
                    value={localValues.projectManager}
                    onChange={(value) => handleLocalChange('projectManager', value)}
                    placeholder="Manager name"
                />

                <FormInput
                    isReadOnly
                    modeEdit={modeEdit}
                    label="PM Email"
                    type="email"
                    value={localValues.pmEmail}
                    onChange={handleEmailChange}
                    placeholder="Project manager email"
                    error={emailError}
                />

                <FormInput
                    isReadOnly
                    modeEdit={modeEdit}
                    label="PM Phone"
                    type="phone"
                    value={localValues.pmPhone}
                    onChange={handlePhoneChange}
                    placeholder="Phone number"
                />
            </div>
        </div>
    );
};

export default CustomerInformationSection;
