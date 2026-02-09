'use client'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Trash2, Download } from 'lucide-react'
import { CustomerSelectionModal } from '@/components/CustomerSelectionModal'
import { Customer } from '@/types/Customer'
import { TakeoffHeader, TakeoffItem, WORK_TYPES } from '@/types/Takeoff'
import { toast } from 'sonner'
import PageHeaderWithSaving from '@/components/PageContainer/PageHeaderWithSaving'
import { pdf } from '@react-pdf/renderer'
import BuildTakeoffPDF from './BuildTakeoffPDF'
import BuildTakeoffPreview from './BuildTakeoffPreview'
import { useRouter } from 'next/navigation'
import { useCustomers } from '@/hooks/use-customers'

type HeaderFormData = {
  etcJobNumber: string
  workType: string
  customerJobNumber: string
  contractNumber: string
  customerPOC: string
  customerPOCEmail: string
  customerPOCPhone: string
}

export default function BuildTakeoffContent() {
  const router = useRouter()
  const { customers } = useCustomers()

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<HeaderFormData>()

  const [header, setHeader] = useState<TakeoffHeader>({
    etcJobNumber: '',
    workType: '',
    customer: null,
    customerJobNumber: '',
    customerPOC: '',
    customerPOCEmail: '',
    customerPOCPhone: '',
    contractNumber: ''
  })

  const [items, setItems] = useState<TakeoffItem[]>([])
  const [bidItems, setBidItems] = useState<any[]>([])
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const handleSaveAndExit = () => {
    router.back()
  }

  // Fetch bid items for dropdown
  useEffect(() => {
    const fetchBidItems = async () => {
      try {
        const response = await fetch('/api/bid-item-numbers')
        if (response.ok) {
          const data = await response.json()
          // Combine all item types
          const allItems = [
            ...(data.data?.bidItems || []),
            ...(data.data?.saleItems || []),
            ...(data.data?.rentalItems || [])
          ]
          setBidItems(allItems)
        }
      } catch (error) {
        console.error('Error fetching bid items:', error)
      }
    }
    fetchBidItems()
  }, [])

  const handleHeaderChange = (field: keyof TakeoffHeader, value: any) => {
    setHeader(prev => ({ ...prev, [field]: value }))
  }

  const handleCustomerSelect = (customer: Customer | null) => {
    setHeader(prev => ({ ...prev, customer }))
    setShowCustomerModal(false)
  }

  const addItem = () => {
    const newItem: TakeoffItem = {
      id: Date.now().toString(),
      itemNumber: '',
      description: '',
      quantity: 0,
      uom: '',
      notes: ''
    }
    setItems(prev => [...prev, newItem])
  }

  const updateItem = (id: string, field: keyof TakeoffItem, value: any) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const handleItemNumberChange = (id: string, itemNumber: string) => {
    const selectedItem = bidItems.find(item => item.item_number === itemNumber)
    if (selectedItem) {
      updateItem(id, 'itemNumber', itemNumber)
      updateItem(id, 'description', selectedItem.description || selectedItem.item_description || '')
      updateItem(id, 'uom', selectedItem.unit_of_measure || selectedItem.uom || selectedItem.uom_1 || '')
    }
  }

  const generatePDF = async () => {
    if (!header.etcJobNumber || !header.workType || !header.customer) {
      toast.error('Please fill in all required header fields')
      return
    }

    if (items.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    setIsGeneratingPDF(true)
    try {
      const pdfElement = (
        <BuildTakeoffPDF
          header={header}
          items={items}
        />
      )

      const blob = await pdf(pdfElement).toBlob()
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `takeoff-${header.etcJobNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      setTimeout(() => URL.revokeObjectURL(url), 100)
      toast.success('PDF generated successfully')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Error generating PDF')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeaderWithSaving
        heading="Build Takeoff"
        handleSubmit={handleSaveAndExit}
        showX
        saveButtons={
          <div className="flex items-center gap-4">
            <Button
              onClick={generatePDF}
              disabled={isGeneratingPDF}
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              {isGeneratingPDF ? 'Generating...' : 'Generate PDF'}
            </Button>
          </div>
        }
      />

      <div className="flex gap-4 p-6 pt-0 pr-0 max-w-full h-[calc(100vh-80px)] overflow-hidden">
        {/* Form Column (Left) */}
        <div className="flex w-1/2 flex-col overflow-y-auto px-2">
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex flex-row gap-4 mb-4 w-full">
              <div className="w-1/2 gap-4">
                <p className="font-semibold mb-1">ETC Job # *</p>
                <Input
                  {...register("etcJobNumber", { required: "ETC Job # is required" })}
                  onChange={(e) => {
                    register("etcJobNumber").onChange(e);
                    handleHeaderChange('etcJobNumber', e.target.value);
                  }}
                  placeholder="Enter ETC job number"
                />
                {errors.etcJobNumber && (
                  <p className="text-sm text-red-500">{errors.etcJobNumber.message}</p>
                )}
              </div>

              <div className="w-1/2">
                <p className="font-semibold mb-1">Work Type *</p>
                <Select
                  value={header.workType}
                  onValueChange={(value) => handleHeaderChange('workType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select work type" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mb-4">
              <p className="font-semibold mb-1">Customer *</p>
              <div className="flex gap-2">
                <Input
                  value={header.customer?.displayName || ''}
                  readOnly
                  placeholder="Select customer"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCustomerModal(true)}
                >
                  Select
                </Button>
              </div>
            </div>

            <div className="flex flex-row gap-4 mb-4 w-full">
              <div className="w-1/2">
                <p className="font-semibold mb-1">Customer Job #</p>
                <Input
                  {...register("customerJobNumber")}
                  onChange={(e) => {
                    register("customerJobNumber").onChange(e);
                    handleHeaderChange('customerJobNumber', e.target.value);
                  }}
                  placeholder="Enter customer job number"
                />
              </div>

              <div className="w-1/2">
                <p className="font-semibold mb-1">Contract #</p>
                <Input
                  {...register("contractNumber")}
                  onChange={(e) => {
                    register("contractNumber").onChange(e);
                    handleHeaderChange('contractNumber', e.target.value);
                  }}
                  placeholder="Enter contract number"
                />
              </div>
            </div>

            <div className="flex flex-row gap-4 mb-4 w-full">
              <div className="w-1/3">
                <p className="font-semibold mb-1">Customer POC</p>
                <Input
                  {...register("customerPOC")}
                  onChange={(e) => {
                    register("customerPOC").onChange(e);
                    handleHeaderChange('customerPOC', e.target.value);
                  }}
                  placeholder="Point of contact"
                />
              </div>

              <div className="w-1/3">
                <p className="font-semibold mb-1">POC Email</p>
                <Input
                  {...register("customerPOCEmail", {
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Please enter a valid email"
                    }
                  })}
                  onChange={(e) => {
                    register("customerPOCEmail").onChange(e);
                    handleHeaderChange('customerPOCEmail', e.target.value);
                  }}
                  placeholder="poc@email.com"
                />
                {errors.customerPOCEmail && (
                  <p className="text-sm text-red-500">{errors.customerPOCEmail.message}</p>
                )}
              </div>

              <div className="w-1/3">
                <p className="font-semibold mb-1">POC Phone</p>
                <Input
                  {...register("customerPOCPhone")}
                  onChange={(e) => {
                    register("customerPOCPhone").onChange(e);
                    handleHeaderChange('customerPOCPhone', e.target.value);
                  }}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="my-4">
            <div className="flex justify-between items-center mb-4">
              <p className="font-semibold">Items</p>
              <Button onClick={addItem} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Number</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>UOM</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Select
                        value={item.itemNumber}
                        onValueChange={(value) => handleItemNumberChange(item.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select item" />
                        </SelectTrigger>
                        <SelectContent>
                          {bidItems.map((bidItem) => (
                            <SelectItem key={bidItem.item_number} value={bidItem.item_number}>
                              {bidItem.item_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Description"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        min="0"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.uom}
                        onChange={(e) => updateItem(item.id, 'uom', e.target.value)}
                        placeholder="UOM"
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        value={item.notes}
                        onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                        placeholder="Notes"
                        rows={2}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {items.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No items added yet. Click Add Item to get started.
              </div>
            )}
          </div>
        </div>

        {/* Preview Column (Right) */}
        <div className="w-1/2 overflow-y-auto">
          <div className="bg-[#F4F5F7] p-6 rounded-lg sticky">
            <h3 className="text-lg font-semibold mb-4">Live Preview</h3>
            <div className="min-h-[1000px] overflow-y-auto bg-white p-4 mt-4 border rounded-md">
              <BuildTakeoffPreview
                header={header}
                items={items}
              />
            </div>
          </div>
        </div>
      </div>

      <CustomerSelectionModal
        open={showCustomerModal}
        onOpenChange={setShowCustomerModal}
        customers={customers}
        selectedCustomer={header.customer}
        onSelectCustomer={handleCustomerSelect}
      />
    </div>
  )
}
