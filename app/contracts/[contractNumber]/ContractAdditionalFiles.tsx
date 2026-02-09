import React, { Dispatch, SetStateAction, useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Checkbox } from '../../../components/ui/checkbox';
import { Label } from '../../../components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { FileMetadata } from '@/types/FileTypes';

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

// Static file sizes in bytes
const fileSizes = {
    'W-9': 1185792, // 1157kb
    'EEO-SHARP Policy': 153600, // 150kb
    'Safety Program': 91136, // 89kb
    'Sexual Harassment Policy': 77824, // 76kb
    'Avenue of Appeals': 164864 // 161kb
};

interface AdditionalFilesSectionProps {
    addedFiles: AdditionalFiles;
    onAddedFilesChange: (files: AdditionalFiles) => void;
    setFiles: Dispatch<SetStateAction<FileMetadata[]>>;
    jobId?: number;
}

const AdditionalFilesSection: React.FC<AdditionalFilesSectionProps> = ({
    addedFiles,
    onAddedFilesChange,
    setFiles,
    jobId
}) => {
    const [loading, setLoading] = useState(false);

    const fileOptions = [
        { id: 'W-9', label: 'W-9' },
        { id: 'EEO-SHARP Policy', label: 'EEO-SHARP Policy' },
        { id: 'Safety Program', label: 'Safety Program' },
        { id: 'Sexual Harassment Policy', label: 'Sexual Harassment Policy' },
        { id: 'Avenue of Appeals', label: 'Avenue of Appeals' }
    ] as const;

    // Load already added files when component mounts or jobId changes
    useEffect(() => {
        const loadAddedFiles = async () => {
            if (!jobId) return;

            // Get the files that are marked as added
            const alreadyAddedFiles = Object.entries(addedFiles)
                .filter(([_, isAdded]) => isAdded)
                .map(([fileName]) => fileName as keyof AdditionalFiles);

            if (alreadyAddedFiles.length === 0) return;

            try {
                // Fetch metadata for all added files
                const fileMetadataPromises = alreadyAddedFiles.map(fileName => fetchFileMetadata(fileName));
                const fileMetadataResults = await Promise.all(fileMetadataPromises);
                
                const validFileMetadata = fileMetadataResults.filter((metadata): metadata is FileMetadata => metadata !== null);

                if (validFileMetadata.length > 0) {
                    setFiles(prevFiles => {
                        // Remove any existing files with the same names to avoid duplicates
                        const filteredPrevFiles = prevFiles.filter(
                            prevFile => !validFileMetadata.some(newFile => newFile.filename === prevFile.filename)
                        );

                        // Add the loaded file metadata
                        return [...filteredPrevFiles, ...validFileMetadata];
                    });
                }
            } catch (error) {
                console.error('Error loading added files:', error);
            }
        };

        loadAddedFiles();
    }, [jobId, addedFiles]); // Dependencies: jobId and addedFiles

    const handleFileToggle = (fileId: keyof AdditionalFiles) => {
        onAddedFilesChange({
            ...addedFiles,
            [fileId]: !addedFiles[fileId]
        });
    };

    const selectedCount = Object.values(addedFiles).filter(Boolean).length;

    // Function to fetch file details and create proper metadata
    const fetchFileMetadata = async (fileName: keyof AdditionalFiles): Promise<FileMetadata | null> => {
        try {
            const apiFileName = fileTypeMapping[fileName];

            return {
                id: -(Object.keys(fileTypeMapping).indexOf(fileName) + 1), // Negative ID for static files
                filename: `${fileName}.pdf`,
                file_type: 'application/pdf',
                file_size: fileSizes[fileName], // Use hardcoded file size
                file_url: `/api/files/contract-management/documents?file=${apiFileName}`,
                file_path: '',
                upload_date: new Date().toISOString(),
                associatedId: jobId || 0
            };
        } catch (error) {
            console.error(`Error fetching metadata for ${fileName}:`, error);
            return null;
        }
    };

    // Function to fetch and add selected files
    const handleAddSelectedFiles = async () => {
        const selectedFiles = Object.entries(addedFiles)
            .filter(([_, isSelected]) => isSelected)
            .map(([fileName]) => fileName as keyof AdditionalFiles);

        if (selectedFiles.length === 0) {
            toast.warning('No files selected');
            return;
        }

        if (!jobId) {
            toast.error('Job ID is required to add files');
            return;
        }

        setLoading(true);

        try {
            // Process files one by one to get metadata
            const newFileMetadata: FileMetadata[] = [];

            for (const fileName of selectedFiles) {
                const metadata = await fetchFileMetadata(fileName);
                if (metadata) {
                    newFileMetadata.push(metadata);
                }
            }

            // Update the files state with the new file metadata
            if (newFileMetadata.length > 0) {
                setFiles(prevFiles => {
                    // Remove any files with the same names (avoid duplicates)
                    const filteredPrevFiles = prevFiles.filter(
                        prevFile => !newFileMetadata.some(newFile => newFile.filename === prevFile.filename)
                    );

                    // Add the new file metadata
                    return [...filteredPrevFiles, ...newFileMetadata];
                });

                // Update the job's document status in the database
                try {
                    const response = await fetch('/api/files/contract-management/documents', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            jobId: jobId,
                            addedDocuments: selectedFiles
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        console.error('Failed to update job document status:', errorData);
                        // Don't fail the whole operation if this fails, just log it
                        toast.warning('Files added but status update failed');
                    } else {
                        const result = await response.json();
                        console.log('Job document status updated:', result);
                    }
                } catch (dbError) {
                    console.error('Error updating job document status:', dbError);
                    // Don't fail the whole operation if this fails
                    toast.warning('Files added but status update failed');
                }

                toast.success(`Added ${newFileMetadata.length} file${newFileMetadata.length !== 1 ? 's' : ''}`);
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