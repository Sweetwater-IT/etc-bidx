"use client";

import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AttachmentNames, useQuoteForm } from "@/app/quotes/create/QuoteFormProvider";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/ui/dropzone";
import { useFileUpload } from "@/hooks/use-file-upload";
import { toast } from "sonner";
import { FileMetadata } from "@/types/FileTypes";
import FileViewingContainer from "@/components/file-viewing-container";
import { fetchAssociatedFiles } from "@/lib/api-client";
import { PdfPreviewDialog } from "@/app/quotes/create/components/ModalPreviewPdf";

export function QuoteAdditionalFiles({ setFiles, files, quoteData, handleFileSelect, setQuoteData }: { setFiles: any, files: any[], quoteData?: any, handleFileSelect: (field: any) => void; setQuoteData: (prev: any) => void; }) {
  const { includeFiles, setIncludeFiles, quoteId } = useQuoteForm();
  const [localFiles, setLocalFiles] = useState<FileMetadata[]>([]);
  const [previewFile, setPreviewFile] = useState<any | null>(null);

  const handleFileToggle = (fileId: AttachmentNames, checked: boolean) => {
    setIncludeFiles(prev => ({ ...prev, [fileId as AttachmentNames]: checked }));
  };

  const fileUploadProps = useFileUpload({
    maxFileSize: 50 * 1024 * 1024,
    maxFiles: 10,
    uniqueIdentifier: quoteId ?? '',
    accept: {
      'application/pdf': ['.pdf'],
    },
    folder: 'quotes'
  });
  const { files: filesUp, successes, isSuccess, errors: fileErrors } = fileUploadProps || {};

  useEffect(() => {
    setFiles(localFiles || []);
  }, [localFiles, setFiles]);

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
    fetchAssociatedFiles(quoteId, 'quotes', setLocalFiles);
  };

  useEffect(() => {
    fetchFiles();
  }, [quoteId]);

  useEffect(() => {
    if (isSuccess && filesUp && filesUp.length > 0) {
      fetchFiles();
    }
  }, [isSuccess, filesUp]);


  return (
    <div className="rounded-lg p-6">
      <h2 className="mb-4 text-lg font-semibold">Additional Files</h2>
      <Dropzone {...fileUploadProps} files={fileUploadProps?.files || []} className="p-4 mb-4 cursor-pointer">
        <DropzoneContent />
        <DropzoneEmptyState />
      </Dropzone>
      <FileViewingContainer files={localFiles} onFilesChange={setLocalFiles} />
      {files.length > 0 && (
        <div className="grid grid-cols-1 gap-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 rounded hover:bg-gray-50 transition"
            >
              <Checkbox
                id={`file-${file.id}`}
                checked={quoteData?.selectedfilesids?.includes(file.id)}
                onCheckedChange={() => {
                  setPreviewFile(file);
                }}
              />
              <Label htmlFor={`file-${file.id}`} className="truncate">
                {file.filename}
              </Label>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-row gap-6 mt-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="terms"
            checked={quoteData?.aditionalTerms || false}
            onCheckedChange={(checked) =>
              setQuoteData(prev => ({ ...prev, aditionalTerms: !!checked }))
            }
          />
          <Label htmlFor="terms">Terms and Conditions</Label>
        </div>
      </div>
      <PdfPreviewDialog
        file={
          previewFile
            ? {
              id: previewFile.id,
              url: previewFile.file_url, 
              filename: previewFile.filename,
            }
            : null
        }
        onClose={() => setPreviewFile(null)}
        onConfirm={(fileId) => handleFileSelect(fileId)}
      />
    </div>
  );
}