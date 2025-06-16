import React, { Dispatch, SetStateAction, useEffect } from 'react';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '../../../components/ui/dropzone';
import { useFileUpload } from '../../../hooks/use-file-upload';

interface Props {
    onSuccess: () => void
    jobId: number | undefined;
    maxFiles?: number;
}

const ContractUploadSection: React.FC<Props> = ({ onSuccess, jobId, maxFiles = 10 }) => {
    // Initialize the file upload hook with specific settings for contract documents
    const fileUploadProps = useFileUpload({
        maxFileSize: 50 * 1024 * 1024, // 50MB
        maxFiles, // Allow multiple files to be uploaded
        uniqueIdentifier : jobId,
        apiEndpoint: '/api/files/contract-management',
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/gif': ['.gif'],
            'application/zip': ['.zip'],
            'text/plain': ['.txt'],
            'text/csv': ['.csv']
        },
        onSuccess
    });

    return (
        <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-6 text-lg font-semibold">Contract Documents</h3>
            <Dropzone {...fileUploadProps} className="p-8 cursor-pointer">
                <DropzoneContent />
                <DropzoneEmptyState />
            </Dropzone>
            
            {!jobId && (
                <p className="text-sm text-muted-foreground mt-4">
                    Please create a job first before uploading documents.
                </p>
            )}
        </div>
    );
};

export default ContractUploadSection;