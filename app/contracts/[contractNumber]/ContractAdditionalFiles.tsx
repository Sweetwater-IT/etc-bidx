import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface AdditionalFiles {
    'W-9': boolean;
    'EEO-SHARP Policy': boolean;
    'Safety Program': boolean;
    'Sexual Harassment Policy': boolean;
    'Avenue of Appeals': boolean;
}

interface AdditionalFilesSectionProps {
    addedFiles: AdditionalFiles;
    onAddedFilesChange: (files: AdditionalFiles) => void;
}

const AdditionalFilesSection: React.FC<AdditionalFilesSectionProps> = ({
    addedFiles,
    onAddedFilesChange
}) => {
    const fileOptions = [
        { id: 'W-9', label: 'W-9' },
        { id: 'EEO-SHARP Policy', label: 'EEO-SHARP Policy' },
        { id: 'Safety Program', label: 'Safety Program' },
        { id: 'Sexual Harassment Policy', label: 'Sexual Harassment Policy' },
        { id: 'Avenue of Appeals', label: 'Avenue of Appeals' }
    ] as const;

    const handleFileToggle = (fileId: keyof AdditionalFiles) => {
        onAddedFilesChange({
            ...addedFiles,
            [fileId]: !addedFiles[fileId]
        });
    };

    const selectedCount = Object.values(addedFiles).filter(Boolean).length;

    return (
        <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Additional Files</h3>
                <Button variant="outline" size="sm" className="bg-muted/50">
                    Add selected files ({selectedCount})
                </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                {fileOptions.map((option) => (
                    <div key={option.id} className="flex items-center gap-2">
                        <Checkbox
                            id={option.id}
                            checked={addedFiles[option.id]}
                            onCheckedChange={() => handleFileToggle(option.id)}
                        />
                        <Label htmlFor={option.id} className="text-sm font-normal cursor-pointer">
                            {option.label}
                        </Label>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdditionalFilesSection;