import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import * as xlsx from 'xlsx'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { toast } from 'sonner'
import { IconFileUpload, IconX } from '@tabler/icons-react'
import { importJobs } from '@/lib/api-client'

interface ImportSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportSuccess?: () => void
}

export function ImportSheet({ open, onOpenChange, onImportSuccess }: ImportSheetProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<any[] | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    setFile(file)
    
    // Read the Excel file for preview
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = xlsx.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = xlsx.utils.sheet_to_json(worksheet)
        
        // Only show first 5 rows in preview
        setPreview(jsonData.slice(0, 5))
      } catch (error) {
        console.error('Error reading Excel file:', error)
        toast.error('Error reading Excel file. Please make sure it\'s a valid .xlsx file.')
        setFile(null)
      }
    }
    reader.readAsBinaryString(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1
  })

  const handleImport = async () => {
    if (!file) return

    setIsUploading(true)
    
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const data = e.target?.result
          const workbook = xlsx.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = xlsx.utils.sheet_to_json(worksheet, { defval: '' })
          
          // Log the data for debugging
          console.log('Excel data to import:', jsonData)
          
          // Send data to API
          const result = await importJobs(jsonData)
          
          if (result.count > 0) {
            toast.success(`Successfully imported ${result.count} jobs`)
            setFile(null)
            setPreview(null)
            onOpenChange(false)
            if (onImportSuccess) {
              onImportSuccess()
            }
          } else if (result.errors && result.errors.length > 0) {
            // Show error toast with details
            toast.error(
              <div className="space-y-2">
                <p>Failed to import jobs. Please check the following issues:</p>
                <ul className="text-xs max-h-40 overflow-y-auto list-disc pl-4">
                  {result.errors.slice(0, 5).map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                  {result.errors.length > 5 && (
                    <li>...and {result.errors.length - 5} more errors</li>
                  )}
                </ul>
              </div>
            )
          } else {
            toast.error('Failed to import jobs. Please check the file format.')
          }
        } catch (error: any) {
          console.error('Error processing Excel file:', error)
          toast.error(`Error processing Excel file: ${error.message || 'Unknown error'}`)
        }
      }
      reader.readAsBinaryString(file)
    } catch (error: any) {
      console.error('Error importing jobs:', error)
      toast.error(`Error importing jobs: ${error.message || 'Please try again'}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    setFile(null)
    setPreview(null)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Import Jobs</SheetTitle>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              Upload an Excel file (.xlsx) with job data to import. The file should have columns matching the job fields.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-md p-2 text-amber-800 text-xs">
              <p className="font-medium">Required columns:</p>
              <ul className="list-disc pl-4 mt-1">
                <li>Contract Number (e.g., &ldquo;2024-001&rdquo;)</li>
              </ul>
              <p className="font-medium mt-2">Recommended columns:</p>
              <ul className="list-disc pl-4 mt-1">
                <li>Status (e.g., &ldquo;Bid&rdquo;, &ldquo;No Bid&rdquo;, &ldquo;Unset&rdquo;)</li>
                <li>Requestor (e.g., &ldquo;John Smith&rdquo;)</li>
                <li>Owner (e.g., &ldquo;Department of Transportation&rdquo;)</li>
                <li>Letting Date (e.g., &ldquo;2024-04-15&rdquo;)</li>
                <li>Due Date (e.g., &ldquo;2024-04-01&rdquo;)</li>
                <li>County (e.g., &ldquo;Miami-Dade&rdquo;)</li>
                <li>Branch (e.g., &ldquo;South Florida&rdquo;)</li>
              </ul>
            </div>
          </div>
        </SheetHeader>

        {!file ? (
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <IconFileUpload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600">
              {isDragActive ? 'Drop the Excel file here' : 'Drag & drop an Excel file here, or click to select'}
            </p>
            <p className="text-xs text-gray-500 mt-2">Only .xlsx files are supported</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <IconFileUpload className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{file.name}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setFile(null)}
                className="h-8 w-8 p-0"
              >
                <IconX className="h-4 w-4" />
              </Button>
            </div>
            
            {preview && preview.length > 0 && (
              <div className="border rounded-md overflow-hidden">
                <div className="text-sm font-medium p-2 bg-gray-100">Preview (first 5 rows)</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(preview[0]).map((key) => (
                          <th key={key} className="px-2 py-1 text-left font-medium text-gray-500">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-t">
                          {Object.values(row).map((value: any, j) => (
                            <td key={j} className="px-2 py-1 text-gray-700">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <SheetFooter className="mt-4">
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!file || isUploading}
              className={isUploading ? 'opacity-70 cursor-not-allowed' : ''}
            >
              {isUploading ? 'Importing...' : 'Import'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
