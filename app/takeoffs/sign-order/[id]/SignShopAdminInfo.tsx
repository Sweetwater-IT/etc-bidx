import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/dropzone'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectItem, SelectContent } from '@/components/ui/select'
import { useFileUpload } from '@/hooks/use-file-upload'
import { formatDate } from '@/lib/formatUTCDate'
import { SignOrder } from '@/types/TSignOrder'
import { MoreVertical } from 'lucide-react'
import React, { Dispatch, SetStateAction, useState } from 'react'
import SignShopAdminInfoSheet from './SignShopAdminInfoSheet' // Import the sheet component

interface Props {
    signOrder: SignOrder
    setSignOrder: Dispatch<SetStateAction<SignOrder | undefined>>
    id: number
}

const SignShopAdminInfo = ({ signOrder, setSignOrder, id }: Props) => {

    const [open, setOpen] = useState<boolean>(false)

    const fileUploadProps = useFileUpload({
        maxFileSize: 50 * 1024 * 1024, // 50MB
        maxFiles: 5, // Allow multiple files to be uploaded
        uniqueIdentifier: id,
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
    });

    const handleOpenChange = () => {
        setOpen(!open);
    };

    return (
        <>
            <div className='flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6'>
                {/* Customer Info and Upload Files in same row */}
                <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8'>
                    {/* Customer Information - Takes 2/3 of the row */}
                    <div className='lg:col-span-2 bg-white p-8 rounded-md shadow-sm border border-gray-100'>
                        <div className='flex justify-between'>
                            <h2 className='text-xl font-semibold mb-4'>
                                Customer Information
                            </h2>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-2 rounded hover:bg-muted focus:outline-none">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setOpen(true)}>Edit</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
                            <div>
                                <div className='text-sm text-muted-foreground'>
                                    Job Number
                                </div>
                                <div className='text-base mt-1'>
                                    {signOrder.job_number || '-'}
                                </div>
                            </div>

                            <div>
                                <div className='text-sm text-muted-foreground'>
                                    Contract Number
                                </div>
                                <div className='text-base mt-1'>
                                    {signOrder.contract_number || '-'}
                                </div>
                            </div>

                            <div>
                                <div className='text-sm text-muted-foreground'>
                                    Requestor
                                </div>
                                <div className='text-base mt-1'>
                                    {signOrder.requestor || '-'}
                                </div>
                            </div>

                            <div>
                                <div className='text-sm text-muted-foreground'>
                                    Branch
                                </div>
                                <div className='text-base mt-1'>
                                    {signOrder.branch || '-'}
                                </div>
                            </div>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            <div>
                                <div className='text-sm text-muted-foreground'>
                                    Customer
                                </div>
                                <div className='text-base mt-1'>
                                    {signOrder.contractors?.name || '-'}
                                </div>
                            </div>

                            <div>
                                <div className='text-sm text-muted-foreground'>
                                    Need Date
                                </div>
                                <div className='text-base mt-1'>
                                    {signOrder.need_date ? formatDate(signOrder.need_date) : '-'}
                                </div>
                            </div>

                            <div>
                                <div className='text-sm text-muted-foreground'>
                                    Order Date
                                </div>
                                <div className='text-base mt-1'>
                                    {signOrder.order_date ? formatDate(signOrder.order_date) : '-'}
                                </div>
                            </div>

                            <div>
                                <div className='text-sm text-muted-foreground'>
                                    Order Type
                                </div>
                                <div className='text-base mt-1'>
                                    {[signOrder.sale && 'Sale', signOrder.rental && 'Rental', signOrder.perm_signs && 'Permanent Signs']
                                        .filter(Boolean)
                                        .join(', ').toUpperCase() || '-'}
                                </div>
                            </div>
                            
                            <div>
                                <div className='text-sm text-muted-foreground'>
                                    Assigned to
                                </div>
                                <div className='text-base mt-1'>
                                    {signOrder.assigned_to ?? '-'}
                                </div>
                            </div>

                            <div>
                                <div className='text-sm text-muted-foreground'>
                                    Shop Status
                                </div>
                                <div className='text-base mt-1'>
                                    {signOrder.shop_status === 'not-started' ? 'Not Started' : 
                                     signOrder.shop_status === 'in-progress' ? 'In-Process' : 
                                     signOrder.shop_status === 'in-process' ? 'In-Process' : 
                                     signOrder.shop_status === 'complete' ? 'Complete' : 
                                     signOrder.shop_status === 'on-hold' ? 'On Hold' : 
                                     signOrder.shop_status === 'on-order' ? 'On Order' :
                                     signOrder.shop_status || '-'}
                                </div>
                            </div>

                            <div>
                                <div className='text-sm text-muted-foreground'>
                                    Target Date
                                </div>
                                <div className='text-base mt-1'>
                                    {signOrder.target_date ? formatDate(signOrder.target_date) : '-'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Upload Files - Takes 1/3 of the row */}
                    <Dropzone {...fileUploadProps}>
                        <DropzoneEmptyState />
                        <DropzoneContent />
                    </Dropzone>
                </div>
            </div>

            {/* Sheet Component */}
            <SignShopAdminInfoSheet
                open={open}
                handleOpenChange={handleOpenChange}
                signOrder={signOrder}
                setSignOrder={setSignOrder}
            />
        </>
    )
}

export default SignShopAdminInfo