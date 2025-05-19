import React, { Dispatch, SetStateAction, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export interface AdditionalFiles {
    'W-9': boolean;
    'EEO-SHARP Policy': boolean;
    'Safety Program': boolean;
    'Sexual Harassment Policy': boolean;
    'Avenue of Appeals': boolean;
}

// Define a mapping between UI labels and API file names
const fileTypeMapping = {
    'W-9': 'w9',
    'EEO-SHARP Policy': 'eeo-sharp',
    'Safety Program': 'safety-program',
    'Sexual Harassment Policy': 'sexual-harassment',
    'Avenue of Appeals': 'avenue-appeals'
};

interface AdditionalFilesSectionProps {
    addedFiles: AdditionalFiles;
    onAddedFilesChange: (files: AdditionalFiles) => void;
    setFiles: Dispatch<SetStateAction<File[]>>;
}

const AdditionalFilesSection: React.FC<AdditionalFilesSectionProps> = ({
    addedFiles,
    onAddedFilesChange,
    setFiles
}) => {
    const [loading, setLoading] = useState(false);
    
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
    
    // Function to fetch and add selected files
    const handleAddSelectedFiles = async () => {
        const selectedFiles = Object.entries(addedFiles)
            .filter(([_, isSelected]) => isSelected)
            .map(([fileName]) => fileName as keyof AdditionalFiles);
            
        if (selectedFiles.length === 0) {
            toast.warning('No files selected');
            return;
        }
        
        setLoading(true);
        
        try {
            // Process files one by one
            const newFiles: File[] = [];
            
            for (const fileName of selectedFiles) {
                const apiFileName = fileTypeMapping[fileName];
                
                // Fetch the file from our API
                const response = await fetch(`/api/files/contract-management/documents?file=${apiFileName}`);
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${fileName}: ${response.statusText}`);
                }
                
                // Get the file name from headers if available, otherwise use a default
                const contentDisposition = response.headers.get('Content-Disposition');
                const headerFileName = response.headers.get('X-File-Name');
                
                let actualFileName = `${fileName}.pdf`;
                
                if (headerFileName) {
                    actualFileName = headerFileName;
                } else if (contentDisposition) {
                    const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                    if (fileNameMatch && fileNameMatch[1]) {
                        actualFileName = fileNameMatch[1];
                    }
                }
                
                // Convert response to blob
                const blob = await response.blob();
                
                // Create a File object
                const file = new File([blob], actualFileName, { type: 'application/pdf' });
                
                newFiles.push(file);
            }
            
            // Update the files state with the new files
            if (newFiles.length > 0) {
                setFiles(prevFiles => {
                    // Remove any files with the same names
                    const filteredPrevFiles = prevFiles.filter(
                        prevFile => !newFiles.some(newFile => newFile.name === prevFile.name)
                    );
                    
                    // Add the new files
                    return [...filteredPrevFiles, ...newFiles];
                });
                
                toast.success(`Added ${newFiles.length} file${newFiles.length !== 1 ? 's' : ''}`);
            }
        } catch (error) {
            console.error('Error fetching files:', error);
            toast.error(`Failed to add files: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Additional Files</h3>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-muted/50"
                    onClick={handleAddSelectedFiles}
                    disabled={selectedCount === 0 || loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                        </>
                    ) : (
                        <>Add selected files ({selectedCount})</>
                    )}
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