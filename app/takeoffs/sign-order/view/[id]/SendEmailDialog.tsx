'use client'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dispatch, SetStateAction, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { SignOrderAdminInformation } from './SignOrderViewContent'
import { MPTRentalEstimating } from "@/types/MPTEquipment";
import SignOrderWorksheet from '@/components/sheets/SignOrderWorksheet'
import { SignItem } from '@/components/sheets/SignOrderWorksheetPDF'
import { Note } from '@/components/pages/quote-form/QuoteNotes'
import { TagsInput } from '@/components/ui/tags-input'
import { toast } from 'sonner'
import ReactPDF from '@react-pdf/renderer'
import SignOrderWorksheetPDF from '@/components/sheets/SignOrderWorksheetPDF'
import { FileIcon } from 'lucide-react'

interface SendEmailDialogProps {
  open: boolean
  onOpenChange: Dispatch<SetStateAction<boolean>>
  mptRental: MPTRentalEstimating | undefined
  adminInfo: SignOrderAdminInformation
  notes: Note[]
}

export function SendEmailDialog ({
  open,
  onOpenChange,
  mptRental,
  adminInfo,
  notes
}: SendEmailDialogProps) {
  const [ccEmails, setCcEmails] = useState<string[]>([])
  const [bccEmails, setBccEmails] = useState<string[]>([])
  const [subject, setSubject] = useState<string>('')
  const [emailBody, setEmailBody] = useState<string>('')
  const [toEmails, setToEmails] = useState<string[]>([])
  const [isSending, setIsSending] = useState(false)

  const signList = useMemo(() => {
    return mptRental?.phases[0].signs.map(normalizeSign) || []
  }, [mptRental])

  const handleViewPdf = async () => {
    try {
      // Generate the PDF blob
      const pdfBlob = await ReactPDF.pdf(
        <SignOrderWorksheetPDF 
          adminInfo={adminInfo} 
          signList={signList} 
          mptRental={mptRental} 
          notes={notes} 
        />
      ).toBlob()

      // Create a URL for the blob
      const url = URL.createObjectURL(pdfBlob)
      
      // Open the PDF in a new tab
      const newWindow = window.open(url, '_blank')
      
      // Clean up the blob URL after a delay to ensure the new tab has loaded
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 1000)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF')
    }
  }

  const handleSendEmail = async () => {
    if (toEmails.length === 0) {
      toast.error('Please add at least one recipient')
      return
    }

    if (!subject.trim()) {
      toast.error('Please enter a subject')
      return
    }

    if (!emailBody.trim()) {
      toast.error('Please enter an email body')
      return
    }

    setIsSending(true)

    try {
      // Generate the PDF blob
      const pdfBlob = await ReactPDF.pdf(
        <SignOrderWorksheetPDF 
          adminInfo={adminInfo} 
          signList={signList} 
          mptRental={mptRental} 
          notes={notes} 
        />
      ).toBlob()

      // Create a File object from the blob
      const pdfFile = new File([pdfBlob], `Sign-Order-Worksheet-${adminInfo.contractNumber || ''}.pdf`, {
        type: 'application/pdf'
      })

      // Create FormData to send to the API
      const formData = new FormData()
      formData.append('to', toEmails.join(','))
      formData.append('cc', ccEmails.join(','))
      formData.append('bcc', bccEmails.join(','))
      formData.append('subject', subject)
      formData.append('emailBody', emailBody)
      formData.append('fromEmail', 'it@establishedtraffic.com')
      formData.append('signOrderId', adminInfo.contractNumber || '')
      formData.append('pdfFile', pdfFile)

      // Send the email
      const response = await fetch('/api/sign-orders/send-email', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send email')
      }

      const result = await response.json()
      
      if (result.success) {
        toast.success('Email sent successfully!')
        onOpenChange(false)
        // Reset form
        setToEmails([])
        setCcEmails([])
        setBccEmails([])
        setSubject('')
        setEmailBody('')
      } else {
        throw new Error(result.error || 'Failed to send email')
      }
    } catch (error: any) {
      console.log('Error sending email:', error)
      
      // Log detailed error information
      if (error.response) {
        console.log('Response status:', error.response.status)
        console.log('Response headers:', error.response.headers)
        console.log('Response body:', error.response.body)
      }
      
      // Extract error message
      let errorMessage = 'Failed to send email'
      
      if (error.response?.body?.errors) {
        const sendGridError = error.response.body.errors[0]
        errorMessage = sendGridError.message || sendGridError
        console.log('SendGrid error details:', sendGridError)
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl h-fit w-fit max-h-[95vh] overflow-y-auto'>
        <DialogTitle>
          Email Details
        </DialogTitle>
        {open && (
          <div className='mt-4 min-w-xl'>
            <div className='flex flex-col gap-y-2'>
              <TagsInput placeholder='To' className='w-full' value={toEmails} onChange={setToEmails} options={[]} />
              <TagsInput
                value={ccEmails}
                onChange={setCcEmails}
                placeholder="CC"
                options={[]}
              />
              <TagsInput
                value={bccEmails}
                onChange={setBccEmails}
                placeholder="BCC"
                options={[]}
              />
              <Input
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <div className='flex flex-col gap-y-2 bg-[#F4F5F7] rounded-lg p-2 max-h-[50vh] overflow-y-auto'>
                <Textarea
                  placeholder="Body"
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                />
                <div 
                  className='p-1 text-blue-700 border border-background rounded shadow w-fit text-sm bg-white flex gap-1 items-center cursor-pointer hover:text-blue-500 transition-colors'
                  onClick={handleViewPdf}
                >
                  <FileIcon className='w-4 h-4' />
                  <div>Sign-Order-Worksheet-{adminInfo.contractNumber||""}.pdf</div>
                </div>
              </div>
              <div className='flex items-center justify-end gap-4'>
                <Button variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={handleSendEmail} disabled={isSending}>
                  {isSending ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
const normalizeSign = (sign: any): SignItem => ({
  designation: sign.designation || '',
  description: sign.description || '',
  quantity: sign.quantity || 0,
  width: sign.width || 0,
  height: sign.height || 0,
  sheeting: sign.sheeting || '',
  substrate: sign.substrate || '', // ensure string, fallback to empty string
  stiffener: typeof sign.stiffener === 'string' || typeof sign.stiffener === 'boolean' ? sign.stiffener : '',
  inStock: sign.inStock ?? 0,
  order: sign.order ?? 0,
  displayStructure: sign.displayStructure || '',
  bLights: sign.bLights || 0,
  cover: sign.cover || false,
  make: sign.make ?? 0,
  unitPrice: sign.unitPrice ?? 0,
  totalPrice: sign.totalPrice ?? 0,
  primarySignId: sign.primarySignId ?? 0,
});
