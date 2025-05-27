'use client'
import { buttonVariants } from '../../components/ui/button'
import { cn } from '../../lib/utils'
import { MoveLeft } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React from 'react'

const ActiveBidHeader = () => {

  const params = useSearchParams();
  const source = params?.get('source') === 'active-bids' ? 'Active Bids' : 'Available Jobs' 
  const contractNumber = params?.get('contract-number')

  return (
    <div>
      <Link
        href="/jobs/active-bids"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "gap-2 -ml-2 mb-4"
        )}
      >
        <MoveLeft className="w-3 mt-[1px]" /> Back to Bid List
      </Link>
      <h1 className="text-3xl font-bold">
        {source === 'Active Bids' ? `Edit Bid - ${contractNumber}`
          : "Create New Bid"}
      </h1>
      {source && <p className="text-muted-foreground">Source: {source}</p>}
    </div>
  )
}

export default ActiveBidHeader
