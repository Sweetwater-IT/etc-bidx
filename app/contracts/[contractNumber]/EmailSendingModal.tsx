// Updated EmailSendingModal component
'use client'
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { TagsInput } from '../../../components/ui/tags-input';
import { Customer } from '../../../types/Customer';
import { User } from '../../../types/User';
import { toast } from 'sonner';
import { FileMetadata } from '@/types/FileTypes';

interface EmailSendingModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    customer: Customer | null;
    contractNumber: string;
    files: FileMetadata[];
    sender: User;
    jobId?: number;
}

const EmailSendingModal: React.FC<EmailSendingModalProps> = ({
    isOpen,
    onOpenChange,
    customer,
    contractNumber,
    files,
    sender,
    jobId
}) => {
    // State for email fields
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
    const [subject, setSubject] = useState<string>('');
    const [body, setBody] = useState<string>('');
    const [selectedFileIds, setSelectedFileIds] = useState<Record<string, boolean>>({});
    const [isSending, setIsSending] = useState(false);

    // Initialize selected files (default all selected)
    useEffect(() => {
        if (files.length > 0) {
            const initialSelectedFiles: Record<string, boolean> = {};
            files.forEach((file) => {
                initialSelectedFiles[file.id.toString()] = true;
            });
            setSelectedFileIds(initialSelectedFiles);
        }
    }, [files]);

    // Reset form when customer changes
    useEffect(() => {
        setSelectedEmails([]);
    }, [customer]);

    // Handle file selection toggle
    const toggleFileSelection = (fileId: string) => {
        setSelectedFileIds(prev => ({
            ...prev,
            [fileId]: !prev[fileId]
        }));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Handle email submission
    const handleSubmit = async () => {
        if (selectedEmails.length === 0) {
            toast.error("Please select at least one recipient");
            return;
        }

        // Get selected files
        const selectedFiles = files.filter((file) => selectedFileIds[file.id.toString()]);

        if (selectedFiles.length === 0) {
            toast.error("Please select at least one file to attach");
            return;
        }

        setIsSending(true);

        try {
            // Create request body with file metadata instead of actual files
            const emailData = {
                subject,
                emailBody: body,
                htmlContent: body.replace(/\n/g, '<br>'),
                recipients: selectedEmails,
                fromEmail: sender.email,
                fromName: sender.name,
                contractNumber,
                jobId: jobId?.toString(),
                fileMetadata: selectedFiles.map(file => ({
                    id: file.id,
                    filename: file.filename,
                    file_url: file.file_url,
                    file_type: file.file_type,
                    file_size: file.file_size
                }))
            };
            
            // Send email with file metadata
            const response = await fetch('/api/jobs/contract-management/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(emailData),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to send email');
            }
            
            const result = await response.json();
            
            // Show success message
            toast.success("Email sent successfully!");
            onOpenChange(false);
        } catch (error) {
            console.error('Error sending email:', error);
            toast.error(`Failed to send email: ${error}`);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogTitle>Send Contract Files</DialogTitle>
                <div className="space-y-4 mt-4">
                    {/* Contractor Information */}
                    <div className="bg-muted/40 p-3 rounded-md">
                        <h3 className="text-sm font-semibold mb-2">{contractNumber} - {customer?.name}</h3>
                    </div>

                    {/* Email Recipients */}
                    <div>
                        <label className="text-sm font-medium mb-1 block">
                            Recipients
                        </label>
                        <TagsInput
                            value={selectedEmails}
                            onChange={setSelectedEmails}
                            options={customer?.emails.map((email, index) => ({
                                key: `email-${index}`, 
                                label: email, 
                                value: email
                            })) || []}
                            placeholder="Add email addresses..."
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                            Select from contractor emails or type to add new ones
                        </div>
                    </div>

                    {/* Subject Line */}
                    <div>
                        <label htmlFor="email-subject" className="text-sm font-medium mb-1 block">
                            Subject
                        </label>
                        <input
                            id="email-subject"
                            className="w-full border border-input rounded-md px-3 py-2 text-sm"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Email subject line"
                        />
                    </div>

                    {/* Email Body */}
                    <div>
                        <label htmlFor="email-body" className="text-sm font-medium mb-1 block">
                            Message
                        </label>
                        <textarea
                            id="email-body"
                            className="w-full border border-input rounded-md px-3 py-2 text-sm min-h-[120px]"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Your message"
                        />
                    </div>

                    {/* Files to Attach */}
                    <div>
                        <h3 className="text-sm font-medium mb-2">Attachments</h3>
                        {files.length === 0 ? (
                            <div className="text-center p-4 border border-dashed rounded-md">
                                <p className="text-muted-foreground">No files available</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-md p-2">
                                {files.map((file) => {
                                    const fileId = file.id.toString();
                                    return (
                                        <div key={fileId} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                                            <input
                                                type="checkbox"
                                                id={fileId}
                                                className="border border-input rounded w-4 h-4"
                                                checked={selectedFileIds[fileId] || false}
                                                onChange={() => toggleFileSelection(fileId)}
                                            />
                                            <label htmlFor={fileId} className="flex-grow text-sm cursor-pointer truncate">
                                                {file.filename}
                                            </label>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {formatFileSize(file.file_size)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Sender Information */}
                    <div className="bg-muted/40 p-3 rounded-md">
                        <h3 className="text-sm font-semibold mb-2">From email: {sender.email}</h3>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSending || selectedEmails.length === 0}
                        >
                            {isSending ? 'Sending...' : 'Send Email'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default EmailSendingModal;