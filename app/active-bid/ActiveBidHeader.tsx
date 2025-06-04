'use client'
import { useEstimate } from '@/contexts/EstimateContext'
import { Button, buttonVariants } from '../../components/ui/button'
import { cn } from '../../lib/utils'
import { MoveLeft, XIcon } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React, { useState } from 'react'
import { defaultFlaggingObject } from '@/types/default-objects/defaultFlaggingObject'
import { useLoading } from '@/hooks/use-loading'
import { createActiveBid } from '@/lib/api-client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Separator } from '@/components/ui/separator'
import StepperSaveButtons from '@/components/pages/active-bid/steps/stepper-save-buttons'
import { Badge } from '@/components/ui/badge'

interface Props {
  mode: 'edit' | 'view' | 'new'
  status: string;
  createdAt: string;
}

const ActiveBidHeader = ({mode, status, createdAt}: Props) => {

  const { adminData, mptRental, equipmentRental, saleItems, flagging, serviceWork } = useEstimate()

  const params = useSearchParams();
  const contractNumber = params?.get('contractNumber')

  const { startLoading, stopLoading } = useLoading()

  const router = useRouter();

  const handleSubmit = async () => {
    try {
      startLoading();

      await createActiveBid(adminData, mptRental, equipmentRental, flagging ?? defaultFlaggingObject, serviceWork ?? defaultFlaggingObject, saleItems, 'DRAFT');
      toast.success(`Bid number ${adminData.contractNumber} successfully saved.`)
      router.replace('/jobs/active-bids')
    } catch (error) {
      console.error("Error creating bid:", error);
      toast.error('Bid not succesfully saved as draft: ' + error)
    }
    finally {
      stopLoading();
    }
  }

  return (
    <div className={`flex w-full bg-white z-50 items-center sticky top-0 justify-between px-6 gap-2 pb-4 mb-6 ${mode !== 'view' ? 'pt-6 mt-2 border-b-1' : ''}`}>
      <div className='flex items-center gap-x-0'>
        {mode !== 'view' && <Button variant='ghost' onClick={handleSubmit}>
          <XIcon className="cursor-pointer" />
        </Button>}
        {mode !== 'view' && <Separator className='max-w-8 rotate-90 -ml-2 -mr-1'/>}
        <div>
          <h1 className="text-3xl whitespace-nowrap font-bold">
              {contractNumber ?? 'Create New Bid'}
          </h1>
          {mode !== 'new' && <p className="text-muted-foreground">Created At: {createdAt}</p>}
        </div>
        {mode !== 'new' && <Badge variant={status === 'PENDING' ? 'warning' : status === 'WON' ? 'successful' : status === 'DRAFT' ? 'secondary' : 'destructive'} 
        className={`ml-2 text-sm ${status === 'PENDING' ? 'text-black' : ''}`}>{status}</Badge>}
      </div>
      <StepperSaveButtons key={status} mode={mode} status={status}/>
    </div>
  )
}

export default ActiveBidHeader
