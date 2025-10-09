"use client";

import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuoteForm } from "@/app/quotes/create/QuoteFormProvider";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/ui/dropzone";
import { useFileUpload } from "@/hooks/use-file-upload";
import { toast } from "sonner";
import { FileMetadata } from "@/types/FileTypes";
import FileViewingContainer from "@/components/file-viewing-container";
import { fetchAssociatedFiles } from "@/lib/api-client";
import { PdfPreviewDialog } from "@/app/quotes/create/components/ModalPreviewPdf";

export function QuoteAdditionalFiles({ useButton, setFiles, files, quoteData, handleFileSelect, setQuoteData }: { setFiles: any, files: any[], quoteData?: any, handleFileSelect: (field: any) => void; setQuoteData: (prev: any) => void; useButton: boolean; }) {
  const { quoteId } = useQuoteForm();
  const [localFiles, setLocalFiles] = useState<FileMetadata[]>([]);
  const [previewFile, setPreviewFile] = useState<any | null>(null);

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
    if (!quoteId && filesUp.length > 0) {
      setFiles(filesUp || []);
    }
  }, [filesUp, setFiles]);


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
      <div className="grid grid-cols-1 mb-4 gap-2">
        <div className="flex flex-col gap-6">
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
        {files.length > 0 && files.map((file: any) => (
          <div key={file.id} className="flex items-center gap-2 rounded hover:bg-gray-50 transition">
            <Checkbox
              id={`file-${file.id}`}
              checked={quoteData?.selectedfilesids?.includes(file.id)}
              onCheckedChange={(checked: boolean) => {
                const isAlreadySelected = quoteData?.selectedfilesids?.includes(file.id);
                if (checked && !isAlreadySelected) {
                  setPreviewFile(file);
                } else if (!checked && isAlreadySelected) {
                  handleFileSelect(file.id);
                }
              }}
            />
            <Label htmlFor={`file-${file.id}`} className="truncate">
              {file.filename}
            </Label>
          </div>
        ))}

        {!quoteId && filesUp.length > 0 && filesUp.map((file: any, idx) => {
          const tempId = `up-${idx}-${file.name}`; // id temporal único
          const isSelected = quoteData?.selectedfilesids?.includes(tempId);

          return (
            <div key={tempId} className="flex items-center gap-2 rounded hover:bg-gray-50 transition">
              <Checkbox
                id={`file-${tempId}`}
                checked={isSelected}
                onCheckedChange={(checked: boolean) => {
                  if (checked && !isSelected) {
                    setPreviewFile(file);
                  }
                  handleFileSelect(tempId);
                }}
              />
              <Label htmlFor={`file-${tempId}`} className="truncate">
                {file.name}
              </Label>
            </div>
          )
        })}
      </div>
      <Dropzone useButton={useButton}  {...fileUploadProps} files={fileUploadProps?.files || []} className="p-4 mb-4 cursor-pointer">
        <DropzoneContent hideUploadButton={!quoteId} />
        <DropzoneEmptyState />
      </Dropzone>
      <FileViewingContainer files={localFiles} onFilesChange={setLocalFiles} />

      <PdfPreviewDialog
        file={
          previewFile
            ? {
              id: previewFile.id ?? previewFile.name,
              url: previewFile.file_url ?? previewFile.preview,
              filename: previewFile.filename ?? previewFile.name,
            }
            : null
        }
        onClose={() => setPreviewFile(null)}
        onConfirm={(fileId) => handleFileSelect(fileId)}
      />
    </div>
  );
}