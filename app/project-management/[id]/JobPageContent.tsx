'use client'
import AdminInformationSection from '@/app/contracts/[contractNumber]/ContractAdminInfo'
import { SignOrderList } from '@/app/takeoffs/new/SignOrderList'
import { CardActions } from '@/components/card-actions'
import FileViewingContainer from '@/components/file-viewing-container'
import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { Dropzone } from '@/components/ui/dropzone'
import { Textarea } from '@/components/ui/textarea'
import { useFileUpload } from '@/hooks/use-file-upload'
import { defaultAdminObject } from '@/types/default-objects/defaultAdminData'
import { FileMetadata } from '@/types/FileTypes'
import React, { useState } from 'react'
import PhaseQuantitiesTable from './PhaseQuantitiesTable'

interface Props {
    id: number
}

const JobPageContent = ({ id }: Props) => {

    const [files, setFiles] = useState<FileMetadata[]>([])

    const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false)
    const [savedNotes, setSavedNotes] = useState<string>('')
    const [localNotes, setLocalNotes] = useState<string>('')
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false)

    const handleSaveNotes = () => { }

    const fileUploadProps = useFileUpload({
        maxFileSize: 50 * 1024 * 1024, // 50MB
        maxFiles: 5, // Allow multiple files to be uploaded
        uniqueIdentifier: 1000000,
        folder: 'bid_estimates',
        apiEndpoint: '/api/files',
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
        // onSuccess: getFiles
    });

    return (
        <>
            <div className='grid grid-cols-3 px-6 gap-x-6'>
                <div className='grid-span-2 col-span-2'>
                    <PhaseQuantitiesTable/>
                </div>
                <div className='flex flex-col gap-y-6'>
                    <AdminInformationSection adminData={defaultAdminObject} />
                    <div className="rounded-lg border p-6">
                        <h2 className="mb-4 text-lg font-semibold">Notes</h2>
                        <div className="space-y-4">
                            <div className="text-sm text-wrap wrap-break-word text-muted-foreground">
                                {savedNotes === '' ? 'No notes for this bid' : 'Current notes:'}
                            </div>
                            {savedNotes && (
                                <div className="text-sm p-3 bg-muted rounded border">
                                    {savedNotes}
                                </div>
                            )}
                            <Textarea
                                placeholder="Add notes here..."
                                rows={5}
                                value={localNotes}
                                onChange={(e) => setLocalNotes(e.target.value)}
                            />
                            <Button
                                className="w-full"
                                onClick={handleSaveNotes}
                                disabled={isSavingNotes || !hasUnsavedChanges}
                            >
                                {isSavingNotes ? 'Saving...' : hasUnsavedChanges ? 'Save Notes' : 'No Changes'}
                            </Button>
                        </div>
                    </div>
                    <FileViewingContainer files={files} onFilesChange={setFiles} />
                    <Dropzone {...fileUploadProps} />
                </div>
            </div>
        </>
    )
}

export default JobPageContent
