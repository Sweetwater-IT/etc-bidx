import React from 'react'
import { Button } from './ui/button'
import { Download, FileUp, Trash2 } from 'lucide-react'
import { FileMetadata } from '@/types/FileTypes';
import { toast } from 'sonner'

interface Props {
    files: FileMetadata[];
    onFilesChange: (files: FileMetadata[]) => void;
}

const FileViewingContainer = ({ files, onFilesChange }: Props) => {

    const handleDownloadFile = (fileUrl: string, filename: string) => {
        // Direct download using the Supabase Storage URL
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = filename;
        a.target = '_blank'; // Fallback to open in new tab
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleDeleteFile = async (index: number, fileId: number, filename: string) => {
        try {
            const response = await fetch(`/api/files?fileId=${fileId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                toast.error(`Failed to delete ${filename}: ${errorData.error}`);
                return;
            }

            const result = await response.json();
            
            if (result.success) {
                // Remove from local state after successful deletion
                const newFiles = [...files];
                newFiles.splice(index, 1);
                onFilesChange(newFiles);
                toast.success(`Successfully deleted ${filename}`);
            } else {
                toast.error(`Failed to delete ${filename}: ${result.error}`);
            }
        } catch (error) {
            console.error('Failed to delete file:', error);
            toast.error(`Failed to delete ${filename}`);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div className='mb-4'>
            {/* File List */}
            {files.length > 0 ? (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {files.map((file, index) => (
                        <div
                            key={`${file.filename}-${file.id}`}
                            className="flex items-center gap-4 p-3 border rounded-md hover:bg-muted/50"
                        >
                            <div className="grow overflow-hidden">
                                <p className="text-sm font-medium truncate" title={file.filename}>
                                    {file.filename}
                                </p>
                                <div className="flex gap-2 text-xs text-muted-foreground">
                                    <span>{formatFileSize(file.file_size)}</span>
                                    <span>•</span>
                                    <span>{formatDate(file.upload_date)}</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDownloadFile(file.file_url, file.filename)}
                                    title="Download file"
                                >
                                    <Download size={16} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteFile(index, file.id, file.filename)}
                                    title="Delete file"
                                    className="text-destructive hover:text-destructive"
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center p-6 border border-dashed rounded-md">
                    <FileUp className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No files uploaded yet</p>
                </div>
            )}
        </div>
    )
}

export default FileViewingContainer