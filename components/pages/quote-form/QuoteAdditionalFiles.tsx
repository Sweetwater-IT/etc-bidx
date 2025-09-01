"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AttachmentNames, useQuoteForm } from "@/app/quotes/create/QuoteFormProvider";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/ui/dropzone";
import { useFileUpload } from "@/hooks/use-file-upload";
import { toast } from "sonner";
import { FileMetadata } from "@/types/FileTypes";
import FileViewingContainer from "@/components/file-viewing-container";
import { fetchAssociatedFiles } from "@/lib/api-client";

export function QuoteAdditionalFiles() {
  const { includeFiles, setIncludeFiles, quoteId } = useQuoteForm();
  const [localFiles, setLocalFiles] = useState<FileMetadata[]>([]);

  const handleFileToggle = (fileId: AttachmentNames, checked: boolean) => {
    setIncludeFiles(prev => ({ ...prev, [fileId as AttachmentNames]: checked }));
  };

  const fileUploadProps = useFileUpload({
    maxFileSize: 50 * 1024 * 1024, 
    maxFiles: 10, 
    uniqueIdentifier: quoteId ?? '',
    apiEndpoint: '/api/files/quotes',
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
    }
  });


  const { files, successes, isSuccess, errors: fileErrors } = fileUploadProps || {};

  useEffect(() => {
    if (!fileErrors || fileErrors.length === 0) return;
    const errorMessage = fileErrors[0] instanceof Error ? fileErrors[0].message : String(fileErrors[0]);
    const isIdentifierError = errorMessage.includes("identifier") || (fileErrors[0] as any)?.name === 'identifier';

    if (isIdentifierError) {
      toast.error('Quote needs to be saved as a draft before files can be associated. Please fill out some admin data, then try uploading again.');
    } else {
      toast.error(errorMessage);
    }
  }, [fileErrors]);

  const fetchFiles = () => {
    if (!quoteId) return;
    fetchAssociatedFiles(quoteId, 'quotes?quote_id', setLocalFiles);
  };

  useEffect(() => {
    fetchFiles();
  }, [quoteId]);

  useEffect(() => {
    if (isSuccess && files && files.length > 0) {
      fetchFiles();
    }
  }, [isSuccess, files]);

  return (
    <div className="rounded-lg border p-6">
      <h2 className="mb-4 text-lg font-semibold">Additional Files</h2>
      <Dropzone {...fileUploadProps} files={fileUploadProps?.files || []} className="p-4 mb-4 cursor-pointer">
        <DropzoneContent />
        <DropzoneEmptyState />
      </Dropzone>
      <FileViewingContainer files={localFiles} onFilesChange={setLocalFiles} />

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="flagging-price-list"
            checked={includeFiles["flagging-price-list"]}
            onCheckedChange={(checked) => handleFileToggle("flagging-price-list", !!checked)}
          />
          <Label htmlFor="flagging-price-list">Flagging Price List</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="flagging-service-area"
            checked={includeFiles["flagging-service-area"]}
            onCheckedChange={(checked) => handleFileToggle("flagging-service-area", !!checked)}
          />
          <Label htmlFor="flagging-service-area">Flagging Service Area</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="bedford-branch"
            checked={includeFiles["bedford-branch"]}
            onCheckedChange={(checked) => handleFileToggle("bedford-branch", !!checked)}
          />
          <Label htmlFor="bedford-branch">Bedford Branch Sell Sheet</Label>
        </div>
      </div>
    </div>
  );
}