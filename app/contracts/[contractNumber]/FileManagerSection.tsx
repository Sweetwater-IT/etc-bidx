'use client'

import React, { Dispatch, SetStateAction, useRef, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { FileIcon, Download, Trash2, FileUp, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '../../../components/ui/checkbox';
import { Label } from '../../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { PDFDocument } from 'pdf-lib';
import { FileMetadata } from '@/types/FileTypes';

interface FileManagerSectionProps {
    files: FileMetadata[];
    onFilesChange: (files: FileMetadata[]) => void;
    jobId?: number;
    open: Dispatch<SetStateAction<boolean>>
}

const FileManagerSection: React.FC<FileManagerSectionProps> = ({
    files,
    onFilesChange,
    jobId,
    open
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isCombining, setIsCombining] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
    const [mergedPdfFile, setMergedPdfFile] = useState<File | null>(null);

    // Clean up when unmounting
    React.useEffect(() => {
        return () => {
            if (mergedPdfUrl) {
                URL.revokeObjectURL(mergedPdfUrl);
            }
        };
    }, [mergedPdfUrl]);

    const refreshFileList = async () => {
        if (!jobId) return;
        
        try {
            const response = await fetch(`/api/files/contract-management?job_id=${jobId}`);
            if (response.ok) {
                const result = await response.json();
                onFilesChange(result.data || []);
            }
        } catch (error) {
            console.error('Error refreshing file list:', error);
        }
    };
    
    const handleDeleteFile = async (index: number, fileId: number, filename: string) => {
        try {
            // Delete from server using the general files API
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
                
                // Update selected files if in combining mode
                if (isCombining) {
                    setSelectedFiles(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i));
                }
            } else {
                toast.error(`Failed to delete ${filename}: ${result.error}`);
            }
        } catch (error) {
            console.error('Failed to delete file:', error);
            toast.error(`Failed to delete ${filename}`);
        }
    };

    const handleDownloadFile = (fileMetadata: FileMetadata) => {
        // Use the file_url from metadata for direct download
        const a = document.createElement('a');
        a.href = fileMetadata.file_url;
        a.download = fileMetadata.filename;
        a.target = '_blank'; // Fallback to open in new tab
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const toggleFileSelection = (index: number) => {
        // Only allow PDF files to be selected for combining
        if (!files[index].file_type.includes('pdf')) {
            toast.warning('Only PDF files can be combined');
            return;
        }
        
        setSelectedFiles(prev => {
            if (prev.includes(index)) {
                // Remove from selection
                return prev.filter(i => i !== index);
            } else {
                // Add to selection
                return [...prev, index];
            }
        });
    };

    const resetCombiningMode = () => {
        setIsCombining(false);
        setSelectedFiles([]);
        if (mergedPdfUrl) {
            URL.revokeObjectURL(mergedPdfUrl);
            setMergedPdfUrl(null);
        }
        setMergedPdfFile(null);
    };

    // Convert FileMetadata to File object for PDF operations
    const fetchFileAsFile = async (fileMetadata: FileMetadata): Promise<File | null> => {
        try {
            const response = await fetch(fileMetadata.file_url);
            if (!response.ok) return null;
            
            const blob = await response.blob();
            return new File([blob], fileMetadata.filename, { type: fileMetadata.file_type });
        } catch (error) {
            console.error(`Error fetching file ${fileMetadata.filename}:`, error);
            return null;
        }
    };

    const createMergedPDF = async () => {
        if (selectedFiles.length === 0) {
            toast.warning('Please select PDF files to merge');
            return null;
        }

        try {
            // Create a new PDF document
            const mergedPdf = await PDFDocument.create();
            
            // Sort selected files by their order in the selectedFiles array
            const sortedFileMetadata = [...selectedFiles].sort((a, b) => selectedFiles.indexOf(a) - selectedFiles.indexOf(b))
                .map(index => files[index]);
            
            // Process each selected PDF file
            for (const fileMetadata of sortedFileMetadata) {
                try {
                    // Fetch the file content from URL
                    const file = await fetchFileAsFile(fileMetadata);
                    if (!file) {
                        toast.error(`Could not fetch file: ${fileMetadata.filename}`);
                        continue;
                    }
                    
                    // Convert File to ArrayBuffer
                    const fileArrayBuffer = await file.arrayBuffer();
                    
                    // Load the PDF document
                    const pdfDoc = await PDFDocument.load(fileArrayBuffer);
                    
                    // Copy all pages from the current document
                    const pageIndices = Array.from({ length: pdfDoc.getPageCount() }, (_, i) => i);
                    const copiedPages = await mergedPdf.copyPages(pdfDoc, pageIndices);
                    
                    // Add each copied page to the merged document
                    copiedPages.forEach(page => {
                        mergedPdf.addPage(page);
                    });
                } catch (fileError) {
                    console.error(`Error processing file ${fileMetadata.filename}:`, fileError);
                    toast.error(`Could not process file: ${fileMetadata.filename}`);
                }
            }
            
            // Save the merged document as bytes
            const mergedPdfBytes = await mergedPdf.save();
            
            // Create merged file name using date
            const mergedFileName = `combined_${new Date().toISOString().split('T')[0]}.pdf`;
            
            // Create a new Blob from the Uint8Array
            const uint8Array = new Uint8Array(mergedPdfBytes);
            const blob = new Blob([uint8Array], { type: 'application/pdf' });
            
            // Create a File object
            const file = new File([blob], mergedFileName, { type: 'application/pdf' });
            
            return file;
        } catch (error) {
            console.error("Error creating merged PDF:", error);
            return null;
        }
    };

    const handlePreviewMergedPDF = async () => {
        setIsProcessing(true);
        
        try {
            const mergedFile = await createMergedPDF();
            
            if (!mergedFile) {
                setIsProcessing(false);
                return;
            }
            
            // Create a URL for the file for preview
            const url = URL.createObjectURL(mergedFile);
            
            // Clean up previous URL if it exists
            if (mergedPdfUrl) {
                URL.revokeObjectURL(mergedPdfUrl);
            }
            
            // Set the new URL for preview and store the file for later use
            setMergedPdfUrl(url);
            setMergedPdfFile(mergedFile);
            
            // Open the preview dialog
            setPreviewOpen(true);
        } catch (error) {
            console.error("Error generating PDF preview:", error);
            toast.error("Failed to generate PDF preview");
        } finally {
            setIsProcessing(false);
        }
    };

    // Function to upload a file to the server
    const uploadFileToServer = async (file: File) => {
        if (!jobId) {
            toast.error('Job ID is required to upload files');
            return false;
        }

        try {
            // Create FormData
            const formData = new FormData();
            formData.append('file', file);
            formData.append('uniqueIdentifier', jobId.toString());
            
            // Upload to server
            const response = await fetch('/api/files/contract-management', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to upload file');
            }
            
            const result = await response.json();
            toast.success(`Successfully uploaded ${file.name}`);
            return true;
        } catch (error) {
            console.error('Error uploading file:', error);
            toast.error(`Failed to upload file: ${error}`);
            return false;
        }
    };

    const handleSaveMergedPDF = async () => {
        // Use existing preview file or create a new one
        const fileToSave = mergedPdfFile || await createMergedPDF();
        
        if (!fileToSave) {
            toast.error('Failed to create merged PDF');
            return;
        }
        
        setIsProcessing(true);
        
        try {
            if (jobId) {
                // Upload the file to the server if we have a jobId
                const success = await uploadFileToServer(fileToSave);
                
                if (success) {
                    // Refresh the file list to show the new file
                    await refreshFileList();
                    toast.success('Merged PDF uploaded and saved successfully');
                    
                    // Reset the UI state
                    resetCombiningMode();
                } else {
                    toast.error('Failed to upload merged PDF to server');
                }
            } else {
                toast.error('Job ID is required to save files');
            }
        } catch (error) {
            console.error("Error saving merged PDF:", error);
            toast.error(`Failed to save merged PDF: ${error}`);
        } finally {
            setIsProcessing(false);
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
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>File Manager</CardTitle>
                        <div className="flex gap-2">
                            <Button
                                variant={isCombining ? "default" : "outline"}
                                onClick={() => setIsCombining(!isCombining)}
                                disabled={isProcessing}
                            >
                                {isCombining ? "Exit Combining" : "Combine Files"}
                            </Button>
                            <Button 
                                variant="outline"
                                onClick={() => open(prevState => !prevState)}
                            >
                                Send Email
                            </Button>
                        </div>
                    </div>
                    {isCombining && (
                        <CardDescription>
                            Select PDF files to combine. Files will be arranged in the order they are selected.
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent>
                    {/* File List */}
                    {files.length > 0 ? (
                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                            {files.map((file, index) => (
                                <div 
                                    key={`${file.filename}-${file.id}`} 
                                    className="flex items-center gap-4 p-3 border rounded-md hover:bg-muted/50"
                                >
                                    {isCombining && (
                                        <div className="flex flex-col items-center gap-1">
                                            <Checkbox
                                                id={`select-${index}`}
                                                checked={selectedFiles.includes(index)}
                                                onCheckedChange={() => toggleFileSelection(index)}
                                                disabled={!file.file_type.includes('pdf')}
                                            />
                                            {selectedFiles.includes(index) && (
                                                <span className="text-xs font-medium">
                                                    {selectedFiles.indexOf(index) + 1}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    
                                    <div className="h-10 w-10 bg-muted rounded flex items-center justify-center shrink-0">
                                        <FileIcon size={18} />
                                    </div>
                                    
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
                                            onClick={() => handleDownloadFile(file)}
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
                    
                    {/* Combining Actions */}
                    {isCombining && selectedFiles.length > 0 && (
                        <div className="mt-4 flex gap-2">
                            <Button
                                className="flex-1"
                                variant="outline"
                                onClick={handlePreviewMergedPDF}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    "Preview"
                                )}
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handleSaveMergedPDF}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Merge and Save"
                                )}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            {/* Preview Dialog */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-4xl max-h-screen">
                    <DialogHeader>
                        <DialogTitle>PDF Preview</DialogTitle>
                        <DialogDescription>
                            Preview of the combined PDF file
                        </DialogDescription>
                    </DialogHeader>
                    <div className="w-full h-[70vh]">
                        {mergedPdfUrl ? (
                            <iframe
                                src={mergedPdfUrl}
                                width="100%"
                                height="100%"
                                style={{ border: 'none' }}
                                title="PDF Preview"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-8 w-8 animate-spin" />
                                <span className="ml-2">Loading preview...</span>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setPreviewOpen(false)}
                        >
                            Close
                        </Button>
                        <Button
                            onClick={handleSaveMergedPDF}
                            disabled={isProcessing || !mergedPdfFile}
                        >
                            Save
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default FileManagerSection;