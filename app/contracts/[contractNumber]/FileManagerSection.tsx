import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';

interface FileManagerSectionProps {
    files: File[];
    onFilesChange: (files: File[]) => void;
}

const FileManagerSection: React.FC<FileManagerSectionProps> = ({
    files,
    onFilesChange
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = event.target.files;
        if (newFiles) {
            onFilesChange([...files, ...Array.from(newFiles)]);
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const droppedFiles = event.dataTransfer.files;
        if (droppedFiles) {
            onFilesChange([...files, ...Array.from(droppedFiles)]);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold">File Manager</h3>
            <div className="mb-4 flex items-center gap-2">
                <Button variant="outline" className="flex-1">
                    Combine Files
                </Button>
                <Button className="flex-1">Send</Button>
            </div>
            <div
                className="rounded-lg border-2 border-dashed p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={handleClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                <div className="text-sm text-muted-foreground">
                    Drop a file here or click to browse
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                    File should not exceed 5MB in size
                </div>
            </div>
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                multiple
            />
            {files.length > 0 && (
                <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Selected Files:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                        {files.map((file, index) => (
                            <li key={index}>{file.name}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default FileManagerSection;