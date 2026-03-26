'use client'

import React from 'react'
import { pdf } from '@react-pdf/renderer'
import { toast } from 'sonner'
import SignOrderWorksheetPDF, { SignItem } from '@/components/sheets/SignOrderWorksheetPDF'
import { SignOrderAdminInformation } from '@/app/takeoffs/sign-order/SignOrderContentSimple'
import { MPTRentalEstimating } from '@/types/MPTEquipment'
import { Note } from '@/components/pages/quote-form/QuoteNotes'

interface DownloadSignOrderWorksheetPdfOptions {
  adminInfo: SignOrderAdminInformation
  signList: SignItem[]
  mptRental?: MPTRentalEstimating
  notes: Note[]
  filename?: string
}

export async function downloadSignOrderWorksheetPdf({
  adminInfo,
  signList,
  mptRental,
  notes,
  filename = 'sign-order-worksheet.pdf',
}: DownloadSignOrderWorksheetPdfOptions) {
  try {
    const pdfElement = (
      <SignOrderWorksheetPDF
        adminInfo={adminInfo}
        signList={signList}
        mptRental={mptRental}
        notes={notes}
      />
    )

    const blob = await pdf(pdfElement).toBlob()
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setTimeout(() => URL.revokeObjectURL(url), 100)
  } catch (error) {
    console.error('Error generating sign order worksheet PDF:', error)
    toast.error('Error generating sign order worksheet PDF')
  }
}
