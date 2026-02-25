"use client"

import { useState } from "react"
import { ChevronLeft, Save, X, Trash2, Plus, Eye, ChevronDown, Check, MoreVertical, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { InputGroup, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"

interface QuoteItem {
  id: string
  sku: string
  description: string
  uom: string
  qty: number
  unitPrice: number
  discount: number
  applyTax: boolean
}

interface CreateQuoteProps {
  onBack: () => void
}

const PRODUCT_OPTIONS = [
  { id: "1", name: "Product A - SKU001", price: 100 },
  { id: "2", name: "Product B - SKU002", price: 250 },
  { id: "3", name: "Product C - SKU003", price: 500 },
  { id: "4", name: "Service X - SVC001", price: 150 },
  { id: "5", name: "Service Y - SVC002", price: 200 },
]

export default function CreateQuote({ onBack }: CreateQuoteProps) {
  const [quoteType, setQuoteType] = useState<"straight_sale" | "to_project" | "estimate_bid">("straight_sale")
  const [showPreview, setShowPreview] = useState(false)

  // Expandable section states
  const [expandedSections, setExpandedSections] = useState({
    customer: false,
    etc: false,
    jobDetails: false,
    projectDetails: false,
  })

  // Item edit state
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null)
  const [applyTaxToAll, setApplyTaxToAll] = useState(false)

  // Form state for Customer Information
  const [customerName, setCustomerName] = useState("")
  const [customerPOC, setCustomerPOC] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [customerJobNumber, setCustomerJobNumber] = useState("")
  const [purchaseOrder, setPurchaseOrder] = useState("")

  // Form state for ETC Information
  const [etcPOC, setEtcPOC] = useState("")
  const [etcEmail, setEtcEmail] = useState("")
  const [etcPhone, setEtcPhone] = useState("")
  const [etcBranch, setEtcBranch] = useState("")
  const [etcJobNumber, setEtcJobNumber] = useState("")

  // Form state for Job Details
  const [township, setTownship] = useState("")
  const [county, setCounty] = useState("")
  const [srRoute, setSrRoute] = useState("")
  const [jobAddress, setJobAddress] = useState("")
  const [ecmsNumber, setEcmsNumber] = useState("")

  // Form state for Project Details
  const [bidDate, setBidDate] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [notes, setNotes] = useState("")

  // Quote items state
  const [taxRate, setTaxRate] = useState<number>(6)
  const [items, setItems] = useState<QuoteItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState("")
  const [showItemConfig, setShowItemConfig] = useState(false)
  const [itemConfig, setItemConfig] = useState({
    uom: "EA",
    qty: 1,
    applyTax: "no" as "yes" | "no",
  })

  // Validation functions
  const getCustomerInfoProgress = () => {
    const fields = [customerName, customerPOC, customerPhone, customerEmail, customerAddress, customerJobNumber, purchaseOrder]
    const filled = fields.filter(field => field.trim() !== "").length
    const total = fields.length
    const isComplete = filled === total // ALL fields must be filled
    return { filled, total, isComplete }
  }

  const getEtcInfoProgress = () => {
    const fields = [etcPOC, etcEmail, etcPhone, etcBranch, etcJobNumber]
    const filled = fields.filter(field => field.trim() !== "").length
    const total = fields.length
    const isComplete = filled === total // ALL fields must be filled
    return { filled, total, isComplete }
  }

  const isJobDetailsComplete = () => township || county || srRoute || jobAddress || ecmsNumber
  const isProjectDetailsComplete = () => bidDate || startDate || endDate

  const customerProgress = getCustomerInfoProgress()
  const etcProgress = getEtcInfoProgress()

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const addItem = () => {
    if (!selectedProduct) {
      toast.error("Please select a product")
      return
    }

    const product = PRODUCT_OPTIONS.find(p => p.id === selectedProduct)
    if (!product) return

    const newItem: QuoteItem = {
      id: Math.random().toString(),
      sku: product.name.split(" - ")[1] || "",
      description: product.name.split(" - ")[0] || "",
      uom: itemConfig.uom,
      qty: itemConfig.qty,
      unitPrice: product.price,
      discount: 0,
      applyTax: itemConfig.applyTax === "yes",
    }

    setItems([...items, newItem])
    setSelectedProduct("")
  }

  const handleAddItemClick = () => {
    if (!selectedProduct) {
      toast.error("Please select a product")
      return
    }
    setShowItemConfig(true)
  }

  const incrementQuantity = () => {
    setItemConfig(prev => ({ ...prev, qty: prev.qty + 1 }))
  }

  const decrementQuantity = () => {
    setItemConfig(prev => ({ ...prev, qty: Math.max(1, prev.qty - 1) }))
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const calculateExtPrice = (item: QuoteItem) => {
    const subtotal = item.qty * item.unitPrice
    const afterDiscount = subtotal - item.discount
    return afterDiscount
  }

  const calculateTotals = () => {
    let subtotal = 0
    let taxAmount = 0

    items.forEach(item => {
      const extPrice = calculateExtPrice(item)
      subtotal += extPrice
      if (item.applyTax) {
        taxAmount += extPrice * (taxRate / 100)
      }
    })

    return {
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
    }
  }

  const totals = calculateTotals()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!customerName) {
      toast.error("Customer name is required")
      return
    }

    if (!etcPOC || !etcEmail || !etcPhone) {
      toast.error("All ETC Information fields are required (POC, Email, Phone)")
      return
    }

    if (items.length === 0) {
      toast.error("Please add at least one item to the quote")
      return
    }

    // TODO: Connect to backend API when ready
    toast.success("Quote created successfully!")
    onBack()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <Card className="w-full rounded-t-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-primary text-primary-foreground p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Quote Preview</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPreview(false)}
                className="text-primary-foreground"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              {/* Customer Info */}
              <div className="border-b border-border pb-4">
                <h3 className="font-semibold mb-2">Customer Information</h3>
                {customerName && <p className="text-sm"><span className="text-muted-foreground">Name:</span> {customerName}</p>}
                {customerEmail && <p className="text-sm"><span className="text-muted-foreground">Email:</span> {customerEmail}</p>}
                {customerPhone && <p className="text-sm"><span className="text-muted-foreground">Phone:</span> {customerPhone}</p>}
                {customerAddress && <p className="text-sm"><span className="text-muted-foreground">Address:</span> {customerAddress}</p>}
                {purchaseOrder && <p className="text-sm"><span className="text-muted-foreground">PO:</span> {purchaseOrder}</p>}
              </div>

              {/* Project Info */}
              {(quoteType === "to_project" || quoteType === "estimate_bid") && (jobAddress || township || county || srRoute || bidDate || startDate || endDate) && (
                <div className="border-b border-border pb-4">
                  <h3 className="font-semibold mb-2">Project Information</h3>
                  {jobAddress && <p className="text-sm"><span className="text-muted-foreground">Job Address:</span> {jobAddress}</p>}
                  {township && <p className="text-sm"><span className="text-muted-foreground">Township:</span> {township}</p>}
                  {county && <p className="text-sm"><span className="text-muted-foreground">County:</span> {county}</p>}
                  {srRoute && <p className="text-sm"><span className="text-muted-foreground">State Route:</span> {srRoute}</p>}
                  {bidDate && <p className="text-sm"><span className="text-muted-foreground">Bid Date:</span> {bidDate}</p>}
                  {startDate && <p className="text-sm"><span className="text-muted-foreground">Start Date:</span> {startDate}</p>}
                  {endDate && <p className="text-sm"><span className="text-muted-foreground">End Date:</span> {endDate}</p>}
                </div>
              )}

              {/* Items */}
              <div className="border-b border-border pb-4">
                <h3 className="font-semibold mb-3">Line Items</h3>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start border-b border-border pb-2 last:border-0">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.description}</p>
                        <p className="text-xs text-muted-foreground">{item.sku} • {item.qty} × ${item.unitPrice.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">${calculateExtPrice(item).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-2 text-sm font-medium">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax ({taxRate}%):</span>
                  <span>${totals.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                  <span>Total:</span>
                  <span>${totals.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Notes */}
              {notes && (
                <div className="border-t border-border pt-4">
                  <h3 className="font-semibold mb-2 text-sm">Notes</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Item Configuration Modal */}
      {showItemConfig && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm">
            <div className="p-6">
              <h2 className="text-lg font-bold mb-4">Configure Item</h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Quantity</Label>
                  <InputGroup className="w-fit">
                    <InputGroupButton
                      onClick={decrementQuantity}
                      disabled={itemConfig.qty <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </InputGroupButton>
                    <InputGroupInput
                      type="number"
                      value={itemConfig.qty}
                      onChange={(e) => setItemConfig(prev => ({ ...prev, qty: parseInt(e.target.value) || 1 }))}
                      onFocus={(e) => e.target.select()}
                      min="1"
                      inputMode="numeric"
                      className="w-16 text-center"
                    />
                    <InputGroupButton onClick={incrementQuantity}>
                      <Plus className="h-4 w-4" />
                    </InputGroupButton>
                  </InputGroup>
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">Unit of Measure (UOM)</Label>
                  <Select value={itemConfig.uom} onValueChange={(value) => setItemConfig(prev => ({ ...prev, uom: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EA">EA (Each)</SelectItem>
                      <SelectItem value="FT">FT (Feet)</SelectItem>
                      <SelectItem value="IN">IN (Inches)</SelectItem>
                      <SelectItem value="LB">LB (Pounds)</SelectItem>
                      <SelectItem value="GAL">GAL (Gallons)</SelectItem>
                      <SelectItem value="HR">HR (Hours)</SelectItem>
                      <SelectItem value="DAY">DAY (Days)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">Apply Tax</Label>
                  <RadioGroup
                    value={itemConfig.applyTax}
                    onValueChange={(value) => setItemConfig(prev => ({ ...prev, applyTax: value as "yes" | "no" }))}
                    className="flex flex-row gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="tax-no" />
                      <Label htmlFor="tax-no" className="text-sm font-medium cursor-pointer">
                        No
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="tax-yes" />
                      <Label htmlFor="tax-yes" className="text-sm font-medium cursor-pointer">
                        Yes
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowItemConfig(false)
                    setItemConfig({ uom: "EA", qty: 1, applyTax: "no" })
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    addItem()
                    setShowItemConfig(false)
                    setItemConfig({ uom: "EA", qty: 1, applyTax: "no" })
                  }}
                  className="flex-1"
                >
                  Add Item
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm">
            <div className="p-6">
              <h2 className="text-lg font-bold mb-2">Delete Item?</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to delete this line item? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    removeItem(deleteConfirmId)
                    setDeleteConfirmId(null)
                  }}
                  className="flex-1"
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItemId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <Card className="w-full rounded-t-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-primary text-primary-foreground p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Edit Line Item</h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setEditingItemId(null)}
                className="text-primary-foreground"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              {items.find(item => item.id === editingItemId) && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Quantity</Label>
                    <Input
                      type="number"
                      value={items.find(item => item.id === editingItemId)?.qty || ""}
                      onChange={(e) => updateItem(editingItemId, "qty", parseInt(e.target.value))}
                      min="1"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Unit Price</Label>
                    <Input
                      type="number"
                      value={items.find(item => item.id === editingItemId)?.unitPrice || ""}
                      onChange={(e) => updateItem(editingItemId, "unitPrice", parseFloat(e.target.value))}
                      step="0.01"
                      className="w-full"
                    />
                  </div>

                  <div className="flex gap-3 sticky bottom-0 p-4 bg-background border-t border-border -mx-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingItemId(null)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setEditingItemId(null)}
                      className="flex-1"
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-primary-foreground"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Create New Quote</h1>
          </div>
        </div>
      </header>

      {/* Form Content */}
      <main className="p-4 pb-32">
        <div className="space-y-6">
          {/* Quote Type Selection */}
          <Card className="p-4 bg-accent border border-border">
            <Label className="text-sm font-semibold mb-2 block">Quote Type</Label>
            <Select value={quoteType} onValueChange={(value) => setQuoteType(value as "straight_sale" | "to_project" | "estimate_bid")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="straight_sale">Straight Sale</SelectItem>
                <SelectItem value="to_project">To Project</SelectItem>
                <SelectItem value="estimate_bid">Estimate/Bid</SelectItem>
              </SelectContent>
            </Select>
          </Card>

          {/* Admin Information Header */}
          <div className="bg-accent rounded-lg px-4 py-3">
            <h2 className="font-semibold text-sm text-foreground">Admin Information</h2>
          </div>

          {/* Expandable Sections */}
          {/* Customer Information Section */}
          <Card className="p-0 bg-card border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("customer")}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${expandedSections.customer ? "" : "-rotate-90"}`}
                />
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">Customer Information <span className="text-red-500">*</span></h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {customerProgress.filled} of {customerProgress.total}
                  </span>
                </div>
              </div>
              {customerProgress.isComplete && (
                <Check className="h-5 w-5 text-green-600" />
              )}
            </button>

            {expandedSections.customer && (
              <div className="p-4 border-t border-border space-y-4">
                <div>
                  <Label htmlFor="customer-name" className="text-sm font-semibold">
                    Customer Name *
                  </Label>
                  <Input
                    id="customer-name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="customer-poc" className="text-sm font-semibold">
                    Customer Point of Contact
                  </Label>
                  <Input
                    id="customer-poc"
                    value={customerPOC}
                    onChange={(e) => setCustomerPOC(e.target.value)}
                    placeholder="Enter POC name"
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="customer-phone" className="text-sm font-semibold">
                      Phone
                    </Label>
                    <Input
                      id="customer-phone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Enter phone"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="customer-email" className="text-sm font-semibold">
                      Email
                    </Label>
                    <Input
                      id="customer-email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="Enter email"
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="customer-address" className="text-sm font-semibold">
                    Address
                  </Label>
                  <Input
                    id="customer-address"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Enter address"
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="customer-job-number" className="text-sm font-semibold">
                      Job Number
                    </Label>
                    <Input
                      id="customer-job-number"
                      value={customerJobNumber}
                      onChange={(e) => setCustomerJobNumber(e.target.value)}
                      placeholder="Enter job number"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="po-number" className="text-sm font-semibold">
                      Purchase Order #
                    </Label>
                    <Input
                      id="po-number"
                      value={purchaseOrder}
                      onChange={(e) => setPurchaseOrder(e.target.value)}
                      placeholder="Enter PO#"
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* ETC Information Section */}
          <Card className="p-0 bg-card border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("etc")}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${expandedSections.etc ? "" : "-rotate-90"}`}
                />
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">ETC Information <span className="text-red-500">*</span></h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {etcProgress.filled} of {etcProgress.total}
                  </span>
                </div>
              </div>
              {etcProgress.isComplete && (
                <Check className="h-5 w-5 text-green-600" />
              )}
            </button>

            {expandedSections.etc && (
              <div className="p-4 border-t border-border space-y-4">
                <div>
                  <Label htmlFor="etc-poc" className="text-sm font-semibold">
                    ETC Point of Contact *
                  </Label>
                  <Input
                    id="etc-poc"
                    value={etcPOC}
                    onChange={(e) => setEtcPOC(e.target.value)}
                    placeholder="Enter POC name"
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="etc-email" className="text-sm font-semibold">
                      Email *
                    </Label>
                    <Input
                      id="etc-email"
                      value={etcEmail}
                      onChange={(e) => setEtcEmail(e.target.value)}
                      placeholder="Enter email"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="etc-phone" className="text-sm font-semibold">
                      Phone *
                    </Label>
                    <Input
                      id="etc-phone"
                      value={etcPhone}
                      onChange={(e) => setEtcPhone(e.target.value)}
                      placeholder="Enter phone"
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="etc-branch" className="text-sm font-semibold">
                      Branch
                    </Label>
                    <Input
                      id="etc-branch"
                      value={etcBranch}
                      onChange={(e) => setEtcBranch(e.target.value)}
                      placeholder="Enter branch"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="etc-job-number" className="text-sm font-semibold">
                      Job Number
                    </Label>
                    <Input
                      id="etc-job-number"
                      value={etcJobNumber}
                      onChange={(e) => setEtcJobNumber(e.target.value)}
                      placeholder="Enter job number"
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Job Details Section */}
          <Card className="p-0 bg-card border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("jobDetails")}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${expandedSections.jobDetails ? "" : "-rotate-90"}`}
                />
                <h3 className="font-semibold text-sm">Job Details</h3>
              </div>
              {isJobDetailsComplete() && (
                <Check className="h-5 w-5 text-green-600" />
              )}
            </button>

            {expandedSections.jobDetails && (
              <div className="p-4 border-t border-border space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="township" className="text-sm font-semibold">
                      Township
                    </Label>
                    <Input
                      id="township"
                      value={township}
                      onChange={(e) => setTownship(e.target.value)}
                      placeholder="Enter township"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="county" className="text-sm font-semibold">
                      County
                    </Label>
                    <Input
                      id="county"
                      value={county}
                      onChange={(e) => setCounty(e.target.value)}
                      placeholder="Enter county"
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="sr-route" className="text-sm font-semibold">
                    SR Route
                  </Label>
                  <Input
                    id="sr-route"
                    value={srRoute}
                    onChange={(e) => setSrRoute(e.target.value)}
                    placeholder="Enter SR route"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="job-address" className="text-sm font-semibold">
                    Job Address
                  </Label>
                  <Input
                    id="job-address"
                    value={jobAddress}
                    onChange={(e) => setJobAddress(e.target.value)}
                    placeholder="Enter job address"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="ecms-number" className="text-sm font-semibold">
                    ECMS / Contract Number
                  </Label>
                  <Input
                    id="ecms-number"
                    value={ecmsNumber}
                    onChange={(e) => setEcmsNumber(e.target.value)}
                    placeholder="Enter ECMS/Contract number"
                    className="mt-2"
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Additional Project Details Section */}
          <Card className="p-0 bg-card border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("projectDetails")}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${expandedSections.projectDetails ? "" : "-rotate-90"}`}
                />
                <h3 className="font-semibold text-sm">Additional Project Details</h3>
              </div>
              {isProjectDetailsComplete() && (
                <Check className="h-5 w-5 text-green-600" />
              )}
            </button>

            {expandedSections.projectDetails && (
              <div className="p-4 border-t border-border space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="bid-date" className="text-sm font-semibold">
                      Bid Date
                    </Label>
                    <Input
                      id="bid-date"
                      type="date"
                      value={bidDate}
                      onChange={(e) => setBidDate(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="start-date" className="text-sm font-semibold">
                      Start Date
                    </Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="end-date" className="text-sm font-semibold">
                      End Date
                    </Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Tax Rate Header */}
          <div className="bg-accent rounded-lg px-4 py-3">
            <h2 className="font-semibold text-sm text-foreground">Tax Rate</h2>
          </div>

          {/* Tax Rate */}
          <Card className="p-4 bg-card border border-border">
            <Label htmlFor="tax-rate" className="text-sm font-semibold block mb-3">
              Standard Tax Rate
            </Label>
            <div className="flex items-center gap-2 mb-3">
              <Input
                id="tax-rate"
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                className="w-24"
                min="0"
                max="100"
                step="0.1"
              />
              <span className="text-sm font-semibold">%</span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="apply-tax-all"
                checked={applyTaxToAll}
                onCheckedChange={(checked) => setApplyTaxToAll(checked as boolean)}
              />
              <Label htmlFor="apply-tax-all" className="text-sm font-medium cursor-pointer">
                Apply to all items
              </Label>
            </div>
          </Card>

          {/* Quote Items Header */}
          <div className="bg-accent rounded-lg px-4 py-3">
            <h2 className="font-semibold text-sm text-foreground">Quote Items</h2>
          </div>

          {/* Add Item Section */}
          <Card className="p-4 bg-card border-border">
            <Label className="text-sm font-semibold block mb-3">Add Items</Label>
            <div className="space-y-3">
              <Select value={selectedProduct || ""} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product..." />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_OPTIONS.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - ${product.price.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={handleAddItemClick}
                disabled={!selectedProduct}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </Card>

          {/* Added Items Table */}
          <Card className="p-4 bg-card border-border">
            <h3 className="font-semibold text-sm mb-4">Line Items ({items.length})</h3>
            {items.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">No items added yet</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-2 py-2 text-left font-semibold text-muted-foreground">SKU</th>
                        <th className="px-2 py-2 text-center font-semibold text-muted-foreground">Qty</th>
                        <th className="px-2 py-2 text-right font-semibold text-muted-foreground">Price</th>
                        <th className="px-2 py-2 text-right font-semibold text-muted-foreground">Total</th>
                        <th className="px-2 py-2 text-center font-semibold text-muted-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <>
                          <tr key={`${item.id}-main`} className="hover:bg-muted/20">
                            <td className="px-2 py-2 font-mono text-xs">{item.sku}</td>
                            <td className="px-2 py-2 text-xs text-center">{item.qty}</td>
                            <td className="px-2 py-2 text-xs text-right">${item.unitPrice.toFixed(2)}</td>
                            <td className="px-2 py-2 text-xs text-right font-medium">
                              ${calculateExtPrice(item).toFixed(2)}
                            </td>
                            <td className="px-2 py-2 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => setOpenActionMenuId(openActionMenuId === item.id ? null : item.id)}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                          {openActionMenuId === item.id && (
                            <tr key={`${item.id}-actions`} className="border-b border-border bg-muted/30">
                              <td colSpan={5} className="px-2 py-2">
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingItemId(item.id)
                                      setOpenActionMenuId(null)
                                    }}
                                    className="text-xs h-8"
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      toast.info("Tax applied to item")
                                      setOpenActionMenuId(null)
                                    }}
                                    className="text-xs h-8"
                                  >
                                    Add Tax
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      setDeleteConfirmId(item.id)
                                      setOpenActionMenuId(null)
                                    }}
                                    className="text-xs h-8"
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )}
                          <tr key={`${item.id}-desc`} className="border-b border-border hover:bg-muted/20">
                            <td colSpan={5} className="px-2 py-1 text-xs text-muted-foreground">
                              {item.description} • {item.uom} {item.applyTax && <span className="text-red-500">• TAX APPLIED</span>}
                            </td>
                          </tr>
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Summary */}
                <div className="space-y-2 text-sm font-medium border-t border-border pt-4">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax ({taxRate}%):</span>
                    <span>${totals.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t border-border pt-2">
                    <span>Total:</span>
                    <span>${totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* Additional Notes Header */}
          <div className="bg-accent rounded-lg px-4 py-3">
            <h2 className="font-semibold text-sm text-foreground">Additional Notes</h2>
          </div>

          {/* Notes */}
          <Card className="p-4 bg-card border-border">
            <Label htmlFor="notes" className="text-sm font-semibold mb-2 block">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              maxLength={5000}
              className="min-h-24"
            />
            <p className="text-sm text-gray-500 text-right mt-1">
              {5000 - notes.length} characters remaining
            </p>
          </Card>

          {/* Preview Button */}
          <Button
            type="button"
            onClick={() => setShowPreview(true)}
            variant="destructive"
            className="w-full"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview Quote
          </Button>
        </div>
      </main>

      {/* Sticky Footer - Mobile */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 md:relative md:border-t-0 md:bg-transparent md:p-0">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              handleSubmit(e as any)
            }}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            Create Quote
          </Button>
        </div>
      </footer>
    </div>
  )
}
