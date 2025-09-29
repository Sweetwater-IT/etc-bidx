import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import React from "react";
import { Input } from "@/components/ui/input";
import { SelectItem, SelectTrigger, SelectContent, SelectValue, Select } from "@/components/ui/select";

interface Field {
    name: string;
    label: string;
    type?: string;
    placeholder?: string;
}

interface CreateModalProps {
    open: boolean;
    title: string;
    fields: Field[];
    onClose: () => void;
    onConfirm: (data: Record<string, string>) => void;
}

interface Field {
    name: string;
    label: string;
    type?: string;
    placeholder?: string;
    options?: string[];
}

const CreateModal: React.FC<CreateModalProps> = ({ open, title, fields, onClose, onConfirm }) => {
    const [formData, setFormData] = React.useState<Record<string, string>>({});

    const handleChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const renderField = (f: any) => (
        <div key={f.name} className="flex flex-col">
            <label className="block text-sm font-medium mb-2">{f.label}</label>
            {f.type === 'select' && f.options ? (
                <Select
                    value={formData[f.name] || ''}
                    onValueChange={(value) => handleChange(f.name, value)}
                >
                    <SelectTrigger className="w-full border rounded px-2 py-1">
                        <SelectValue placeholder={f.placeholder || `Select ${f.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                        {f.options.map(opt => (
                            <SelectItem key={opt} value={opt}>
                                {opt}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ) : (
                <Input
                    type={f.type || "text"}
                    value={formData[f.name] || ""}
                    placeholder={f.placeholder || `Enter ${f.label}`}
                    onChange={(e) => handleChange(f.name, e.target.value)}
                    className="w-full border rounded px-2 py-1"
                />
            )}
        </div>
    )

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">

                    <div className="grid grid-cols-1 gap-4">
                        {fields.slice(0, 1).map(f => renderField(f))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {fields.slice(1, 3).map(f => renderField(f))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {fields.slice(3, 5).map(f => renderField(f))}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {fields.slice(5).map(f => renderField(f))}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => onConfirm(formData)}>Confirm</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreateModal;
