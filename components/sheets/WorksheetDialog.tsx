'use client'
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { PDFViewer } from "@react-pdf/renderer"
import GenerateBidSummaryReactPDF from "./worksheet-pdf"
import { Dispatch, SetStateAction } from "react"

interface WorksheetDialogProps {
  open: boolean
  onOpenChange: Dispatch<SetStateAction<boolean>>
  selectedPdfType: string
  mptRental: any
  equipmentRental: any
  flagging: any
  adminData: any
  mptTotals: any
  allTotals: any
  rentalTotals: any
  saleTotals: any
  flaggingTotals: any
}

export function WorksheetDialog({
  open,
  onOpenChange,
  selectedPdfType,
  mptRental,
  equipmentRental,
  flagging,
  adminData,
  mptTotals,
  allTotals,
  rentalTotals,
  saleTotals,
  flaggingTotals
}: WorksheetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-fit w-fit">
        <DialogTitle>
          {selectedPdfType === 'estimators' ? 'Bid Summary - For Estimators' : 'Bid Summary - For Project Managers'}
        </DialogTitle>
        {open && (
          <div className="mt-4">
            <PDFViewer height={600} width={800}>
              <GenerateBidSummaryReactPDF
                showFinancials={selectedPdfType === 'estimators'}
                mptRental={mptRental}
                equipmentRental={equipmentRental}
                flagging={flagging}
                adminData={adminData}
                mptTotals={mptTotals}
                allTotals={allTotals}
                rentalTotals={rentalTotals}
                saleTotals={saleTotals}
                flaggingTotals={flaggingTotals}
              />
            </PDFViewer>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}