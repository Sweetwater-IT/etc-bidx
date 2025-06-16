"use client";

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AttachmentNames, useQuoteForm } from "@/app/quotes/create/QuoteFormProvider";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/ui/dropzone";
import { useFileUpload } from "@/hooks/use-file-upload";

export function QuoteAdditionalFiles() {
  const { includeFiles, setIncludeFiles, quoteId } = useQuoteForm();

  const handleFileToggle = (fileId: AttachmentNames, checked: boolean) => {
    setIncludeFiles(prev => ({ ...prev, [fileId as AttachmentNames]: checked }));
  };

  const fileUploadProps = useFileUpload({
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 10, // Allow multiple files to be uploaded
    uniqueIdentifier: quoteId,
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

// Destructure needed properties
const { files, successes, isSuccess } = fileUploadProps;

  return (
    <div className="rounded-lg border p-6">
      <h2 className="mb-4 text-lg font-semibold">Additional Files</h2>
      <Dropzone {...fileUploadProps} className="p-4 mb-4 cursor-pointer">
        <DropzoneContent />
        <DropzoneEmptyState />
      </Dropzone>
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