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
}

const ActiveBidHeader = ({mode, status}: Props) => {

  const { adminData, mptRental, equipmentRental, saleItems, flagging, serviceWork } = useEstimate()

  const params = useSearchParams();
  const source = (params?.get('source') === 'active-bids' || params?.get('fullscreen') === 'true') ? 'Active Bids' : 'Available Jobs'
  const contractNumber = params?.get('contractNumber')

  const { startLoading, stopLoading } = useLoading()

  const router = useRouter();

  const handleSubmit = async () => {
    try {
      startLoading();

      await createActiveBid({ ...adminData, contractNumber: adminData.contractNumber.includes('-DRAFT') ? adminData.contractNumber : adminData.contractNumber + '-DRAFT' },
        mptRental, equipmentRental, flagging ?? defaultFlaggingObject, serviceWork ?? defaultFlaggingObject, saleItems);
      toast.success(`Bid number ${adminData.contractNumber} successfully saved.`)
      router.push('/jobs/active-bids');
    } catch (error) {
      console.error("Error creating bid:", error);
      toast.error('Bid not succesfully saved as draft: ' + error)
    }
    finally {
      stopLoading();
    }
  }

  return (
    <div className='flex w-full items-center justify-between gap-2 mb-2'>
      <div className='flex items-center gap-x-2'>
        {/* <Button variant='ghost' onClick={handleSubmit}>
          <XIcon className="cursor-pointer" />
        </Button> */}
        <div>
          <h1 className="text-3xl font-bold">
            {/* {source === 'Active Bids' ? `Edit Bid - ${contractNumber}`
              : "Create New Bid"} */}
              {contractNumber}
          </h1>
          {source && <p className="text-muted-foreground">Source: {source}</p>}
        </div>
        <Badge variant={status === 'PENDING' ? 'secondary' : status === 'WON' ? 'successful' : 'destructive'} className='ml-2 text-lg'>{status}</Badge>
      </div>
      <StepperSaveButtons mode={mode} status={status}/>
    </div>
  )
}

export default ActiveBidHeader
