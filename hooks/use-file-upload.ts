'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useDropzone, type Accept, type FileRejection } from 'react-dropzone'
import { FileWithPreview } from '@/types/FileTypes'

interface UseFileUploadOptions {
  /**
   * Maximum upload size of each file allowed in bytes.
   */
  maxFileSize?: number
  /**
   * Maximum number of files allowed per upload.
   */
  maxFiles?: number
  /**
   * Accepted file types
   */
  accept?: Accept
  /**
   * The job ID to associate the files with
   */
  uniqueIdentifier?: number | string
  folder?: string
  /**
   * The API endpoint to upload files to
   */
  apiEndpoint?: string
  onSuccess?: () => void
}

export function useFileUpload({
  maxFileSize = Number.POSITIVE_INFINITY,
  maxFiles = Number.POSITIVE_INFINITY,
  accept = undefined,
  uniqueIdentifier,
  folder,
  apiEndpoint = '/api/files',
  onSuccess
}: UseFileUploadOptions = {}) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [errors, setErrors] = useState<{ name: string; message: string }[]>([])
  const [successes, setSuccesses] = useState<string[]>([])
  const [isSuccess, setIsSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Clean up previews when component unmounts
  useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview)
        }
      })
    }
  }, [files])

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      // Reset states when new files are added
      setErrors([])
      setSuccesses([])
      setIsSuccess(false)

      // Process accepted files
      const validFiles = acceptedFiles
        .filter((file) => !files.find((x) => x.name === file.name))
        .map((file) => {
          return Object.assign(file, {
            preview: URL.createObjectURL(file),
            errors: []
          }) as FileWithPreview
        })

      // Process rejected files
      const invalidFiles = fileRejections.map(({ file, errors }) => {
        return Object.assign(file, {
          preview: URL.createObjectURL(file),
          errors: errors.map(err => ({ code: err.code, message: err.message }))
        }) as FileWithPreview
      })

      // Combine all files
      const newFiles = [...files, ...validFiles, ...invalidFiles]

      // Update state with merged files
      setFiles(prevFiles => {
        // Filter out duplicates by name
        const uniqueNewFiles = newFiles.filter(
          (newFile) => !prevFiles.some((prevFile) => prevFile.name === newFile.name)
        )
        return [...prevFiles, ...uniqueNewFiles].slice(0, maxFiles)
      })
    },
    [files, maxFiles, setFiles]
  )

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    maxSize: maxFileSize,
    maxFiles: maxFiles,
    accept,
  })

  const onUpload = useCallback(async () => {
    if (!uniqueIdentifier) {
      setErrors([{ name: 'identifier', message: 'Unique identifier needs to be present to save files' }])
      return
    }

    if (files.length === 0) {
      return
    }

    const filesWithErrors = files.filter(file => file.errors.length > 0)
    if (filesWithErrors.length > 0) {
      return
    }

    setLoading(true)
    setErrors([])

    try {
      // Files that haven't been successfully uploaded yet
      const filesToUpload = files.filter(file => !successes.includes(file.name))
      
      const formData = new FormData()
      
      // Add each file to the FormData
      filesToUpload.forEach(file => {
        formData.append('file', file)
      })
      
      formData.append('uniqueIdentifier', typeof uniqueIdentifier === 'number' ? uniqueIdentifier.toString() : uniqueIdentifier)
      formData.append('folder', folder ?? 'jobs');
      // Make API request
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload files')
      }
      
      const result = await response.json()
      
      // Process results
      if (result.results) {
        // Add successful uploads to the successes array
        const newSuccesses = result.results
          .filter(r => r.success)
          .map(r => r.filename)
        
        // Add errors for failed uploads
        const newErrors = result.results
          .filter(r => !r.success)
          .map(r => ({
            name: r.filename,
            message: r.error || 'Upload failed'
          }))
        
        setSuccesses(prev => [...prev, ...newSuccesses])
        setErrors(newErrors)
        
        // Set overall success if all files were uploaded
        if (newSuccesses.length === filesToUpload.length) {
          setIsSuccess(true)
          onSuccess?.();
        }
      } else {
        // Handle older API response format
        setSuccesses(files.map(file => file.name))
        setIsSuccess(true)
        onSuccess?.();
      }
    } catch (error) {
      console.error('Upload error:', error)
      setErrors([{ name: 'upload', message: error as string || 'Failed to upload files' }])
    } finally {
      setLoading(false)
    }
  }, [files, uniqueIdentifier, successes, apiEndpoint])

  // Remove "too many files" errors when files are removed
  useEffect(() => {
    if (files.length === 0) {
      setErrors([])
    }

    // If the number of files doesn't exceed the maxFiles parameter, remove the error 'Too many files' from each file
    if (files.length <= maxFiles) {
      let changed = false
      const newFiles = files.map((file) => {
        if (file.errors.some((e) => e.code === 'too-many-files')) {
          file.errors = file.errors.filter((e) => e.code !== 'too-many-files')
          changed = true
        }
        return file
      })
      if (changed) {
        setFiles(newFiles)
      }
    }
  }, [files, maxFiles, setFiles])

  return {
    files,
    setFiles,
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    loading,
    setLoading,
    successes,
    setSuccesses,
    errors,
    setErrors,
    isSuccess,
    setIsSuccess,
    onUpload,
    inputRef,
    maxFileSize,
    maxFiles,
  }
}

export type UseFileUploadReturn = ReturnType<typeof useFileUpload>