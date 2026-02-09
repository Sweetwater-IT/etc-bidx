export interface FileUploadResult {
    filename?: string;
    success: boolean;
    fileId?: number;
    fileUrl?: string;
    error?: string;
}

export interface FileWithPreview extends File {
    preview: string
    errors: { code: string; message: string }[]
}

export interface ExtendedFile extends File {
    id: number;
    associatedId?: number;
    fileUrl?: string;
    filePath?: string;
  }  

export interface FileMetadata {
    id: number;
    filename: string;
    file_type: string;
    file_size: number;
    file_url: string;
    file_path: string;
    upload_date: string;
    associatedId: number;
}