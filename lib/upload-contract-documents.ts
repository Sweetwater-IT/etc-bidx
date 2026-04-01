import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

export type ContractDocumentCategory =
  | 'contract'
  | 'addendum'
  | 'permit'
  | 'insurance'
  | 'change_order'
  | 'plan'
  | 'specification'
  | 'correspondence'
  | 'photo'
  | 'other'

interface UploadContractDocumentsParams {
  contractId: string
  files: File[]
  category: ContractDocumentCategory
  associatedItemId?: string
}

interface UploadedContractDocument {
  id: string
  name: string
  size: number
  type: string
  category: ContractDocumentCategory
  associatedItemId?: string
  uploadedAt: string
  filePath: string
}

interface UploadContractDocumentsResult {
  documents: UploadedContractDocument[]
  errors: Array<{ fileName: string; error: string }>
}

interface SignedUploadResponse {
  path: string
  token: string
}

export async function uploadContractDocuments({
  contractId,
  files,
  category,
  associatedItemId,
}: UploadContractDocumentsParams): Promise<UploadContractDocumentsResult> {
  const supabase = getSupabaseBrowserClient()
  const uploadedFiles: Array<{
    fileName: string
    filePath: string
    fileSize: number
    mimeType: string
  }> = []
  const errors: Array<{ fileName: string; error: string }> = []

  for (const file of files) {
    try {
      const signedUploadResponse = await fetch(`/api/l/contracts/${contractId}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'createSignedUploadUrl',
          fileName: file.name,
          category,
        }),
      })

      const signedUploadData = await signedUploadResponse.json()
      if (!signedUploadResponse.ok) {
        throw new Error(signedUploadData.error || 'Failed to prepare upload')
      }

      const { path, token } = signedUploadData as SignedUploadResponse
      const { error: uploadError } = await supabase.storage
        .from('files')
        .uploadToSignedUrl(path, token, file)

      if (uploadError) {
        throw new Error(uploadError.message || 'Storage upload failed')
      }

      uploadedFiles.push({
        fileName: file.name,
        filePath: path,
        fileSize: file.size,
        mimeType: file.type,
      })
    } catch (error) {
      errors.push({
        fileName: file.name,
        error: error instanceof Error ? error.message : 'Upload failed',
      })
    }
  }

  if (uploadedFiles.length === 0) {
    return {
      documents: [],
      errors,
    }
  }

  const metadataResponse = await fetch(`/api/l/contracts/${contractId}/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'saveMetadata',
      category,
      associatedItemId: associatedItemId || '',
      uploads: uploadedFiles,
    }),
  })

  const metadataResult = await metadataResponse.json()
  if (!metadataResponse.ok) {
    throw new Error(metadataResult.error || 'Failed to save document metadata')
  }

  return {
    documents: metadataResult.documents || [],
    errors: [...errors, ...(metadataResult.errors || [])],
  }
}
