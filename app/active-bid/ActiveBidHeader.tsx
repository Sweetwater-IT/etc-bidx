'use client'
import { useEstimate } from '@/contexts/EstimateContext'
import { Button, buttonVariants } from '../../components/ui/button'
import { XIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { defaultFlaggingObject } from '@/types/default-objects/defaultFlaggingObject'
import { useLoading } from '@/hooks/use-loading'
import { createActiveBid } from '@/lib/api-client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Separator } from '@/components/ui/separator'
import StepperSaveButtons from '@/components/pages/active-bid/steps/stepper-save-buttons'
import { Badge } from '@/components/ui/badge'
import isEqual from 'lodash/isEqual'
import { defaultPermanentSignsObject } from '@/types/default-objects/defaultPermanentSignsObject'

interface Props {
  mode: 'edit' | 'view' | 'new'
  status: string;
  createdAt: string;
}

const ActiveBidHeader = ({ mode, status, createdAt }: Props) => {

  const { dispatch, adminData, mptRental, equipmentRental, saleItems, flagging, serviceWork, permanentSigns, notes, id, firstSaveTimestamp } = useEstimate()

  const [isSaving, setIsSaving] = useState<boolean>(false)
  const params = useSearchParams();
  const bidId = params?.get('bidId')

  const { startLoading, stopLoading } = useLoading()

  const router = useRouter();

  const saveTimeoutRef = useRef<number | null>(null)

  const [secondCounter, setSecondCounter] = useState<number>(0)

  useEffect(() => {
    if(firstSaveTimestamp){
      setSecondCounter(1)
    }
  }, [firstSaveTimestamp])

  useEffect(() => {
      const intervalId = setInterval(() => {
        setSecondCounter(prev => prev + 1)
      }, 1000)

      return () => clearInterval(intervalId)
  }, [secondCounter])

  const prevStateRef = useRef({
    adminData,
    mptRental,
    equipmentRental,
    flagging,
    serviceWork,
    saleItems,
    permanentSigns
  })

  useEffect(() => {
    if (!bidId || isNaN(Number(bidId))) return;

    dispatch({ type: 'SET_ID', payload: Number(bidId) })
  }, [bidId])

  useEffect(() => {
    if (mode === 'view') return;
    //before doing anything, check if there were any changes
    const hasAdminDataChanged = !isEqual(adminData, prevStateRef.current.adminData)
    const hasMptRentalChanged = !isEqual(mptRental, prevStateRef.current.mptRental)
    const hasEquipmentRentalChanged = !isEqual(equipmentRental, prevStateRef.current.equipmentRental)
    const hasFlaggingChanged = !isEqual(flagging, prevStateRef.current.flagging)
    const hasServiceWorkChanged = !isEqual(serviceWork, prevStateRef.current.serviceWork)
    const hasSaleItemsChanged = !isEqual(saleItems, prevStateRef.current.saleItems)
    const hasPermanentSignsChanged = !isEqual(permanentSigns, prevStateRef.current.permanentSigns)

    const hasAnyStateChanged =
      hasAdminDataChanged ||
      hasMptRentalChanged ||
      hasEquipmentRentalChanged ||
      hasFlaggingChanged ||
      hasServiceWorkChanged ||
      hasSaleItemsChanged ||
      hasPermanentSignsChanged

    if (!adminData.contractNumber || adminData.contractNumber.trim() === '' || !hasAnyStateChanged || !id || (mode === 'new' && !firstSaveTimestamp)) return;
    else {
      //clear timeout if there is one
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = window.setTimeout(() => {
        autosave();
      }, 5000)
    }
  }, [adminData, mptRental, equipmentRental, flagging, serviceWork, saleItems, permanentSigns])

  const autosave = async () => {
    if (!id) return;
    setIsSaving(true)
    prevStateRef.current = {
      adminData,
      mptRental,
      equipmentRental,
      flagging,
      serviceWork,
      saleItems,
      permanentSigns
    };

    try {
      const statusToUse = mode === 'new' ? 'DRAFT' : status as 'DRAFT' | 'PENDING'
      const createdId = await createActiveBid(adminData, mptRental, equipmentRental, flagging ?? defaultFlaggingObject, serviceWork ?? defaultFlaggingObject, saleItems, permanentSigns ?? defaultPermanentSignsObject, statusToUse, notes, id);
      if (!createdId.id) {
        toast.error('Id was not properly set after saving bid')
      } else {
        dispatch({ type: 'SET_ID', payload: createdId.id })
        setSecondCounter(1);
        if(mode === 'edit'){
          dispatch({type: 'SET_FIRST_SAVE', payload: 1})
        }
      }
    }
    catch (error) {
      toast.error('Bid not successfully saved as draft: ' + error)
    } finally {
      setIsSaving(false)
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const handleSubmit = async () => {
    if (!adminData.contractNumber || adminData.contractNumber.trim() === '') {
      router.replace('/jobs/active-bids')
      return;
    }
    else {
      try {
        startLoading();
        const statusToUse = mode === 'new' ? 'DRAFT' : status as 'DRAFT' | 'PENDING'
        await createActiveBid(adminData, mptRental, equipmentRental, flagging ?? defaultFlaggingObject, 
        serviceWork ?? defaultFlaggingObject, saleItems, permanentSigns ?? defaultPermanentSignsObject, statusToUse, notes, id ?? undefined);
        toast.success(`Bid number ${adminData.contractNumber} successfully saved.`)
        router.replace('/jobs/active-bids')
      } catch (error) {
        console.error("Error creating bid:", error);
        toast.error('Bid not successfully saved as draft: ' + error)
      }
      finally {
        stopLoading();
      }
    }
  }

  // Generate save status message
  const getSaveStatusMessage = () => {
    if (isSaving) return 'Saving...';
    const displayStatus = mode === 'new' ? 'Draft' : status === 'DRAFT' ? 'Draft' : 'Pending bid';

    if (mode === 'edit' && firstSaveTimestamp && firstSaveTimestamp !== 1) {
      // Convert the database timestamp string to a Date object, then to milliseconds
      const timeDifference = new Date().getTime() - firstSaveTimestamp
      
      // Handle negative differences (clock skew, etc.)
      if (timeDifference < 0) {
        return 'Just saved'
      }
      
      const secondsAgo = Math.floor(timeDifference / 1000)
      
      if (secondsAgo < 60) {
        return `Last saved ${secondsAgo} second${secondsAgo !== 1 ? 's' : ''} ago`
      } else if (secondsAgo < 3600) {
        const minutesAgo = Math.floor(secondsAgo / 60)
        return `Last saved ${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''} ago`
      } else if (secondsAgo < 86400) {
        const hoursAgo = Math.floor(secondsAgo / 3600)
        return `Last saved ${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`
      } else {
        const daysAgo = Math.floor(secondsAgo / 86400)
        return `Last saved ${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`
      }
    }

    if (secondCounter < 60) {
      return `${displayStatus} saved ${secondCounter} second${secondCounter !== 1 ? 's' : ''} ago`;
    } else if (secondCounter < 3600) {
      const minutesAgo = Math.floor(secondCounter / 60);
      return `${displayStatus} saved ${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''} ago`;
    } else {
      const hoursAgo = Math.floor(secondCounter / 3600);
      return `${displayStatus} saved ${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`
    }
  };

  return (
    <div className={`flex w-full bg-white z-50 items-center sticky top-0 justify-between px-6 gap-2 pb-4 mb-6 ${mode !== 'view' ? 'pt-6 mt-2 border-b-1' : ''}`}>
      <div className='flex items-center gap-x-0'>
        {mode !== 'view' && <Button variant='ghost' onClick={handleSubmit}>
          <XIcon className="cursor-pointer" />
        </Button>}
        {mode !== 'view' && <Separator className='max-w-8 rotate-90 -ml-2 -mr-1' />}
        <div>
          <h1 className="text-3xl whitespace-nowrap font-bold">
            {mode === 'new' ? 'Create New Bid' : adminData.contractNumber}
          </h1>
          {mode === 'view' && <p className="text-muted-foreground whitespace-nowrap">Created At: {createdAt}</p>}
        </div>
        {mode !== 'new' && <Badge variant={status === 'PENDING' ? 'warning' : status === 'WON' ? 'successful' : status === 'DRAFT' ? 'secondary' : 'destructive'}
          className={`ml-2 mt-1 text-sm ${status === 'PENDING' ? 'text-black' : ''}`}>{status}</Badge>}
      </div>
      <div className='flex gap-x-2 items-center'>
        {mode !== 'view' && <div className="text-sm text-muted-foreground">{!firstSaveTimestamp ? '' : firstSaveTimestamp === 0 ? 'Saving...' : getSaveStatusMessage()}</div>}
        <StepperSaveButtons key={status} mode={mode} status={status} />
      </div>
    </div>
  )
}

export default ActiveBidHeader