"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, Save, X, Trash2, Plus, Eye, Edit3, ChevronDown, Check, MoreVertical, Minus, Search, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { InputGroup, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import BidProposalWorksheet from "@/app/quotes/create/BidProposalWorksheet"

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

interface Product {
  id: string
  name: string
  price: number
  category: string
  notes: string
}

export default function CreateQuote({ onBack }: CreateQuoteProps) {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [productsError, setProductsError] = useState<string | null>(null)
  const [quoteType, setQuoteType] = useState<"straight_sale" | "to_project" | "estimate_bid">("straight_sale")
  const [showPreview, setShowPreview] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)

  // Customer search state
  const [customers, setCustomers] = useState<any[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
  const [customerSearchQuery, setCustomerSearchQuery] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)

  // Contact search state
  const [contacts, setContacts] = useState<any[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [showContactSearch, setShowContactSearch] = useState(false)
  const [contactSearchQuery, setContactSearchQuery] = useState("")
  const [selectedContact, setSelectedContact] = useState<any | null>(null)

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createModalType, setCreateModalType] = useState<'customer' | 'contact' | null>(null)
  const [createModalData, setCreateModalData] = useState<Record<string, string>>({})

  // Fetch customers for search
  const fetchCustomers = async (query: string = "") => {
    try {
      setLoadingCustomers(true)
      const params = new URLSearchParams()
      if (query.trim()) {
        params.append('search', query)
      }
      // Load more customers initially, like the web version
      params.append('limit', query.trim() ? '100' : '1000')
      params.append('orderBy', 'name')
      params.append('ascending', 'true')

      const response = await fetch(`/api/contractors?${params}`)
      if (!response.ok) throw new Error('Failed to fetch customers')

      const result = await response.json()
      // Sort customers alphabetically like the web version
      const sortedCustomers = (result.data || []).sort((a: any, b: any) =>
        a.name.localeCompare(b.name)
      )
      setCustomers(sortedCustomers)
    } catch (error) {
      console.error('Failed to fetch customers:', error)
      toast.error('Failed to load customers')
    } finally {
      setLoadingCustomers(false)
    }
  }

  // Handle customer selection
  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer)
    setCustomerName(customer.display_name || customer.name || "")
    setCustomerAddress(customer.address || "")
    setCustomerPhone(customer.main_phone || "")

    // Find primary contact
    const primaryContact = customer.customer_contacts?.find((c: any) => c.role === 'PRIMARY CONTACT')
    if (primaryContact) {
      setCustomerPOC(primaryContact.name || "")
      setCustomerEmail(primaryContact.email || "")
    }

    setShowCustomerSearch(false)
    setCustomerSearchQuery("")
  }



  // Load customers when modal opens
  useEffect(() => {
    if (showCustomerSearch && customers.length === 0) {
      fetchCustomers("")
    }
  }, [showCustomerSearch])

  // Fetch contacts for selected customer
  const fetchContacts = async (customerId: string, query: string = "") => {
    try {
      setLoadingContacts(true)
      const params = new URLSearchParams()
      if (query.trim()) {
        params.append('search', query)
      }
      params.append('contractor_id', customerId)
      params.append('limit', '100')

      const response = await fetch(`/api/customer-contacts?${params}`)
      if (!response.ok) throw new Error('Failed to fetch contacts')

      const result = await response.json()
      setContacts(result.data || [])
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
      toast.error('Failed to load contacts')
    } finally {
      setLoadingContacts(false)
    }
  }

  // Handle customer search
  const handleCustomerSearch = (query: string) => {
    setCustomerSearchQuery(query)
    if (query.trim().length >= 2) {
      fetchCustomers(query)
    } else if (query.trim().length === 0) {
      // Load all customers when search is cleared
      fetchCustomers("")
    }
  }

  // Handle contact search
  const handleContactSearch = (query: string) => {
    setContactSearchQuery(query)
    if (selectedCustomer) {
      fetchContacts(selectedCustomer.id, query)
    }
  }

  // Handle contact selection
  const handleContactSelect = (contact: any) => {
    setSelectedContact(contact)
    setCustomerPOC(contact.name || "")
    setCustomerEmail(contact.email || "")
    setCustomerPhone(contact.phone || "")
    setShowContactSearch(false)
    setContactSearchQuery("")
  }

  // Handle create modal
  const handleCreateModalOpen = (type: 'customer' | 'contact') => {
    setCreateModalType(type)
    setCreateModalData({})
    setShowCreateModal(true)
  }

  const handleCreateModalConfirm = async () => {
    if (createModalType === 'customer') {
      try {
        const response = await fetch('/api/contractors/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: createModalData.name,
            address: createModalData.address || null,
            url: createModalData.url || null,
            city: createModalData.city || null,
            state: createModalData.state || null,
            zip: createModalData.zip || null,
            phone: createModalData.phone || null,
            customerNumber: createModalData.customerNumber || null
          })
        })
        const result = await response.json()
        if (result.success) {
          toast.success('Customer created successfully')
          // Refresh customers list
          fetchCustomers("")
          setShowCreateModal(false)
        } else {
          toast.error(result.message || 'Failed to create customer')
        }
      } catch (error) {
        console.error('Error creating customer:', error)
        toast.error('Failed to create customer')
      }
    } else if (createModalType === 'contact' && selectedCustomer) {
      try {
        const response = await fetch('/api/customer-contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contractor_id: selectedCustomer.id,
            name: createModalData.name,
            role: createModalData.role || null,
            email: createModalData.email,
            phone: createModalData.phone || null,
          })
        })
        const result = await response.json()
        if (result.success) {
          toast.success('Contact created successfully')
          // Refresh contacts list
          fetchContacts(selectedCustomer.id, "")
          setShowCreateModal(false)
        } else {
          toast.error(result.message || 'Failed to create contact')
        }
      } catch (error) {
        console.error('Error creating contact:', error)
        toast.error('Failed to create contact')
      }
    }
  }



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
  const [selectedProductItemNumber, setSelectedProductItemNumber] = useState<string | null>(null)
  const [showItemConfig, setShowItemConfig] = useState(false)
  const [itemConfig, setItemConfig] = useState({
    uom: "EA",
    qty: 1,
    unitPrice: 0,
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

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true)
        setProductsError(null)

        const response = await fetch('/api/bid-item-numbers')
        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }

        const result = await response.json()

        if (result.status !== 200 || !result.data) {
          throw new Error('Invalid API response structure')
        }

        // Combine all product types into a flat array
        const allProducts: Product[] = [
          ...result.data.bidItems.map((item: any) => ({
            id: item.id.toString(),
            name: `${item.description} - ${item.item_number}`,
            price: 0, // We'll need to get pricing from a different source
            category: 'bid',
            notes: item.notes || ''
          })),
          ...result.data.saleItems.map((item: any) => ({
            id: item.id.toString(),
            name: `${item.description} - ${item.item_number}`,
            price: 0, // Same here
            category: 'sale',
            notes: item.notes || ''
          })),
          ...result.data.rentalItems.map((item: any) => ({
            id: item.id.toString(),
            name: `${item.description} - ${item.item_number}`,
            price: 0, // And here
            category: 'rental',
            notes: item.notes || ''
          })),
          ...(result.data.mptItems || []).map((item: any) => ({
            id: item.id.toString(),
            name: `${item.description} - ${item.item_number}`,
            price: 0,
            category: 'mpt',
            notes: item.notes || ''
          })),
          ...(result.data.permanentSignItems || []).map((item: any) => ({
            id: item.id.toString(),
            name: `${item.description} - ${item.item_number}`,
            price: 0,
            category: 'permanent_sign',
            notes: item.notes || ''
          }))
        ]

        setProducts(allProducts)
      } catch (error) {
        console.error('Failed to fetch products:', error)
        setProductsError(error instanceof Error ? error.message : 'Failed to load products')
        toast.error('Failed to load products')
      } finally {
        setLoadingProducts(false)
      }
    }

    fetchProducts()
  }, [])

  // User autofill effect
  useEffect(() => {
    if (user && !etcPOC && !etcEmail && !etcPhone) {
      // Autofill ETC information from user profile
      const userName = user.user_metadata?.full_name || user.user_metadata?.name || ""
      const userEmail = user.email || ""
      const userPhone = user.user_metadata?.phone || ""

      if (userName) setEtcPOC(userName)
      if (userEmail) setEtcEmail(userEmail)
      if (userPhone) setEtcPhone(userPhone)
    }
  }, [user, etcPOC, etcEmail, etcPhone])

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const addItem = () => {
    if (!selectedProductItemNumber) {
      toast.error("Please select a product")
      return
    }

    const product = products.find(p => p.name.split(" - ")[1] === selectedProductItemNumber)
    if (!product) return

    const newItem: QuoteItem = {
      id: Math.random().toString(),
      sku: product.name.split(" - ")[1] || "",
      description: product.name.split(" - ")[0] || "",
      uom: itemConfig.uom,
      qty: itemConfig.qty,
      unitPrice: itemConfig.unitPrice,
      discount: 0,
      applyTax: itemConfig.applyTax === "yes",
    }

    setItems([...items, newItem])
    setSelectedProduct("")
    setSelectedProductItemNumber(null)
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

    try {
      // Prepare quote data for API
      const quoteData = {
        type_quote: quoteType,
        customer_name: customerName,
        customer_contact: customerPOC,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        customer_job_number: customerJobNumber,
        purchase_order: purchaseOrder,
        etc_point_of_contact: etcPOC,
        etc_poc_email: etcEmail,
        etc_phone_number: etcPhone,
        etc_branch: etcBranch,
        etc_job_number: etcJobNumber,
        township,
        county,
        sr_route: srRoute,
        job_address: jobAddress,
        ecms_number: ecmsNumber,
        bid_date: bidDate || null,
        start_date: startDate || null,
        end_date: endDate || null,
        notes,
        payment_terms: 'NET30',
        standard_terms: true,
        items: items.map(item => ({
          item_number: item.sku,
          description: item.description,
          quantity: item.qty,
          unit_price: item.unitPrice,
          uom: item.uom,
          discount: item.discount,
          apply_tax: item.applyTax
        }))
      }

      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteData)
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Quote created successfully!")
        onBack()
      } else {
        toast.error(result.message || "Failed to create quote")
      }
    } catch (error) {
      console.error('Error creating quote:', error)
      toast.error("Failed to create quote")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Live PDF Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <Card className="w-full rounded-t-2xl max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-primary text-primary-foreground p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Live PDF Preview</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPreview(false)}
                className="text-primary-foreground"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            <div className="flex-1 overflow-hidden">
              <BidProposalWorksheet
                key={previewKey}
                items={items.map(item => ({
                  id: item.id,
                  itemNumber: item.sku,
                  description: item.description,
                  uom: item.uom,
                  quantity: item.qty,
                  unitPrice: item.unitPrice,
                  discount: item.discount,
                  discountType: 'percentage' as const,
                  associatedItems: [],
                  isCustom: false,
                  tax: item.applyTax ? taxRate : 0,
                  is_tax_percentage: item.applyTax,
                  quote_id: null,
                  created: true,
                  notes: ""
                }))}
                quoteDate={new Date()}
                notes={notes}
                quoteType={quoteType}
                quoteData={{
                  customer_name: customerName,
                  customer_contact: customerPOC,
                  customer_email: customerEmail,
                  customer_phone: customerPhone,
                  customer_address: customerAddress,
                  customer_job_number: customerJobNumber,
                  purchase_order: purchaseOrder,
                  etc_point_of_contact: etcPOC,
                  etc_poc_email: etcEmail,
                  etc_poc_phone_number: etcPhone,
                  etc_branch: etcBranch,
                  etc_job_number: etcJobNumber,
                  township,
                  county,
                  sr_route: srRoute,
                  job_address: jobAddress,
                  ecsm_contract_number: ecmsNumber,
                  bid_date: bidDate,
                  start_date: startDate,
                  end_date: endDate,
                }}
                termsAndConditions={true}
                files={[]}
                exclusions={`PLEASE NOTE THE FOLLOWING ITEMS OR SERVICES ARE EXCLUDED FROM OUR PROPOSAL UNLESS OTHERWISE STATED:
\t• Traffic control supervisor, unless otherwise noted.
\t• Notification of (including permits from) officials (i.e. police, government, DOT), business and / or property owners.
\t• Core drilling, backfilling, grading, excavation or removal of excavated material.
\t• Snow and / or ice removal for placement maintenance and / or removal of temporary signs.
\t• Short-term signs and stands.
\t• Constant surveillance, daily adjustments / resets, pedestrian protection.
\t• Shop / plan drawings and / or layout for MPT signing.
\t• High reach trucks and / or overhead signage.
\t• Shadow vehicles and operators, unless specified above.
\t• Arrow panels, message boards, shadow vehicles, radar trailers, shadow vehicles (and operators), unless specified above.
\t• Reinstallation of signs removed by the contractor for construction.
\t• Restoration or surface repairs.
\t• Temporary signals, lighting, related signage.
\t• Temporary rumble strips, pavement marking or delineators, unless otherwise specified.
\t• Holiday or work stoppage removal of signs and / or devices.`}
                terms={`PLEASE NOTE THE FOLLOWING CONDITIONS MUST BE INCLUDED ON ALL SUBCONTRACT AGREEMENTS:
\t• The Contractor is responsible for all lost, stolen, damaged materials and equipment. In the event of lost, stolen or damaged material or equipment the contractor will be invoiced at replacement cost. Payment terms for lost, stolen, or damaged material are Net 30 days.
\t• All material supplied and quoted pricing is project specific and shall only be used for the quoted project.
\t• Payment terms for sale items accepted as a part of this proposal are Net 14 days. All rental invoices accepted as a part of this proposal are net 30 days.
\t• Quoted pricing does not include sales tax, delivery or shipping unless explicitly stated.
\t• No additional work will be performed without a written change order. Extra work orders signed by an agent of the contractor shall provide full payment within 30 days of invoice date, regardless of whether the project owner has paid the contractor.
\t• If payment by owner to contractor is delayed due to a dispute between owner and contractor, not involving the work performed by Established Traffic Control, Inc. ("ETC"), then payment by the contractor to ETC shall not likewise be delayed.
\t• All pricing for sale items is valid for 60 days from quote date. Sale items requested 60 days or more after quote date require a revised quote.
\t• Permanent sign items are subject to a 5% escalation per year throughout the contract duration, effective December 31 of every year from original quote date to contract end.
\t• ETC requires a minimum notice of 14 business days' (28 days for permanent signs) for all projects start and/or changes with approved drawings or additional fees may apply.
\t• Retainage will not be withheld on subcontractor agreements less than $50,000.
\t• No retainage will be withheld on rental or sale items regardless of value / price.
\t• Contractor must supply certificate of insurance for rental items upon pick-up.`}
              />
            </div>
          </Card>
        </div>
      )}

      {/* Item Configuration Modal */}
      {showItemConfig && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Configure Item</h2>
              </div>

              {selectedProductItemNumber && (
                <div className="mb-4 p-3 bg-muted/50 rounded-md">
                  <div className="text-sm font-medium">{selectedProduct}</div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Unit Price</Label>
                  <InputGroup>
                    <InputGroupButton className="px-3">$</InputGroupButton>
                    <Input
                      type="number"
                      value={itemConfig.unitPrice}
                      onChange={(e) => setItemConfig(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                      onFocus={(e) => e.target.select()}
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      placeholder="0.00"
                      className="flex-1"
                    />
                  </InputGroup>
                </div>

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

                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowItemConfig(false)
                      setItemConfig({ uom: "EA", qty: 1, unitPrice: 0, applyTax: "no" })
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
                      setItemConfig({ uom: "EA", qty: 1, unitPrice: 0, applyTax: "no" })
                    }}
                    className="flex-1"
                  >
                    Add Item
                  </Button>
                </div>
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
                {/* Customer Search Button */}
                <div className="flex justify-start">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCustomerSearch(true)}
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Search Customers
                  </Button>
                </div>

                <div>
                  <Label htmlFor="customer-name" className="text-sm font-semibold">
                    Customer Name
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
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="customer-poc"
                      value={customerPOC}
                      onChange={(e) => setCustomerPOC(e.target.value)}
                      placeholder="Enter POC name"
                      className="flex-1"
                    />
                    {selectedCustomer && selectedCustomer.customer_contacts && selectedCustomer.customer_contacts.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Load contacts and show contact search modal
                          fetchContacts(selectedCustomer.id, "")
                          setShowContactSearch(true)
                        }}
                        className="px-3"
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
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
              {/* Product Dropdown */}
              {loadingProducts ? (
                <div className="p-3 text-sm text-muted-foreground text-center">Loading products...</div>
              ) : productsError ? (
                <div className="p-3 text-sm text-red-500 text-center">Error loading products</div>
              ) : (
                <Select
                  value={selectedProductItemNumber || ""}
                  onValueChange={(value) => {
                    setSelectedProductItemNumber(value)
                    const product = products.find(p => p.name.split(" - ")[1] === value)
                    if (product) {
                      setSelectedProduct(product.name)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.name.split(" - ")[1]}>
                        <div className="flex flex-col">
                          <span className="font-medium">{product.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {product.category === 'mpt' ? 'MPT Equipment' :
                             product.category === 'permanent_sign' ? 'Permanent Sign' :
                             product.category === 'rental' ? 'Rental Item' :
                             product.category === 'sale' ? 'Sale Item' : 'Bid Item'}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button
                type="button"
                onClick={handleAddItemClick}
                disabled={!selectedProductItemNumber || loadingProducts}
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
            onClick={() => {
              setPreviewKey(prev => prev + 1)
              setShowPreview(true)
            }}
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

      {/* Customer Search Modal */}
      <Dialog open={showCustomerSearch} onOpenChange={setShowCustomerSearch}>
        <DialogContent className="max-w-4xl h-[600px] flex flex-col p-0">
          <div className="flex flex-col gap-2 relative z-10 bg-background">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle>Select Customer</DialogTitle>
            </DialogHeader>
            <div className="px-6 pb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search customers by name..."
                  value={customerSearchQuery}
                  onChange={(e) => handleCustomerSearch(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>
          </div>

          {/* Scrollable Customer Table */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
            {loadingCustomers ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading customers...</p>
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {customerSearchQuery ? "No customers found matching your search." : "Start typing to search customers."}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-sm">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-sm">Phone</th>
                    <th className="text-left px-4 py-3 font-medium text-sm">Address</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer, index) => (
                    <tr
                      key={customer.id}
                      onClick={() => handleCustomerSelect(customer)}
                      className={`cursor-pointer transition-colors hover:bg-muted/50 border-b last:border-b-0 ${
                        index % 2 === 0 ? "bg-background" : "bg-muted/20"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">
                                {customer.display_name || customer.name}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {customer.main_phone || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground truncate">
                          {customer.address || "-"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex justify-between items-center p-4 px-6 border-t">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleCreateModalOpen('customer')}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Customer
              </Button>
              {selectedCustomer && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCustomer(null)
                    setCustomerName("")
                    setCustomerPOC("")
                    setCustomerPhone("")
                    setCustomerEmail("")
                    setCustomerAddress("")
                  }}
                  className="text-muted-foreground"
                >
                  Clear Selection
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCustomerSearch(false)}>
                Cancel
              </Button>
              {selectedCustomer && (
                <Button onClick={() => setShowCustomerSearch(false)}>
                  Select Customer
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Search Modal */}
      <Dialog open={showContactSearch} onOpenChange={setShowContactSearch}>
        <DialogContent className="max-w-4xl h-[600px] flex flex-col p-0">
          <div className="flex flex-col gap-2 relative z-10 bg-background">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle>Select Contact</DialogTitle>
            </DialogHeader>
            <div className="px-6 pb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search contacts by name or email..."
                  value={contactSearchQuery}
                  onChange={(e) => handleContactSearch(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>
          </div>

          {/* Scrollable Contact Table */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
            {loadingContacts ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading contacts...</p>
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {contactSearchQuery ? "No contacts found matching your search." : "No contacts available for this customer."}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-sm">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-sm">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-sm">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-sm">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact, index) => (
                    <tr
                      key={contact.id}
                      onClick={() => handleContactSelect(contact)}
                      className={`cursor-pointer transition-colors hover:bg-muted/50 border-b last:border-b-0 ${
                        index % 2 === 0 ? "bg-background" : "bg-muted/20"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-sm truncate">
                              {contact.name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {contact.role || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {contact.email || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {contact.phone || "-"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex justify-between items-center p-4 px-6 border-t">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleCreateModalOpen('contact')}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Contact
              </Button>
              {selectedContact && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedContact(null)
                    setCustomerPOC("")
                    setCustomerEmail("")
                    setCustomerPhone("")
                  }}
                  className="text-muted-foreground"
                >
                  Clear Selection
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowContactSearch(false)}>
                Cancel
              </Button>
              {selectedContact && (
                <Button onClick={() => setShowContactSearch(false)}>
                  Select Contact
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {createModalType === 'customer' ? 'Create New Customer' : 'Create New Contact'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {createModalType === 'customer' ? (
              <>
                <div>
                  <Label htmlFor="create-name" className="text-sm font-semibold">
                    Customer Name *
                  </Label>
                  <Input
                    id="create-name"
                    value={createModalData.name || ''}
                    onChange={(e) => setCreateModalData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter customer name"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="create-address" className="text-sm font-semibold">
                    Address
                  </Label>
                  <Input
                    id="create-address"
                    value={createModalData.address || ''}
                    onChange={(e) => setCreateModalData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter address"
                    className="mt-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="create-city" className="text-sm font-semibold">
                      City
                    </Label>
                    <Input
                      id="create-city"
                      value={createModalData.city || ''}
                      onChange={(e) => setCreateModalData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Enter city"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-state" className="text-sm font-semibold">
                      State
                    </Label>
                    <Input
                      id="create-state"
                      value={createModalData.state || ''}
                      onChange={(e) => setCreateModalData(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="Enter state"
                      className="mt-2"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="create-zip" className="text-sm font-semibold">
                      ZIP Code
                    </Label>
                    <Input
                      id="create-zip"
                      value={createModalData.zip || ''}
                      onChange={(e) => setCreateModalData(prev => ({ ...prev, zip: e.target.value }))}
                      placeholder="Enter ZIP"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-phone" className="text-sm font-semibold">
                      Phone
                    </Label>
                    <Input
                      id="create-phone"
                      value={createModalData.phone || ''}
                      onChange={(e) => setCreateModalData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone"
                      className="mt-2"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="create-customerNumber" className="text-sm font-semibold">
                    Customer Number
                  </Label>
                  <Input
                    id="create-customerNumber"
                    type="number"
                    value={createModalData.customerNumber || ''}
                    onChange={(e) => setCreateModalData(prev => ({ ...prev, customerNumber: e.target.value }))}
                    placeholder="Enter customer number"
                    className="mt-2"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="create-name" className="text-sm font-semibold">
                    Contact Name *
                  </Label>
                  <Input
                    id="create-name"
                    value={createModalData.name || ''}
                    onChange={(e) => setCreateModalData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter contact name"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="create-email" className="text-sm font-semibold">
                    Email *
                  </Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={createModalData.email || ''}
                    onChange={(e) => setCreateModalData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="create-role" className="text-sm font-semibold">
                    Role
                  </Label>
                  <Select
                    value={createModalData.role || ''}
                    onValueChange={(value) => setCreateModalData(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ESTIMATOR">Estimator</SelectItem>
                      <SelectItem value="PROJECT MANAGER">Project Manager</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="FIELD / SUPERVISOR">Field / Supervisor</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="create-phone" className="text-sm font-semibold">
                    Phone
                  </Label>
                  <Input
                    id="create-phone"
                    value={createModalData.phone || ''}
                    onChange={(e) => setCreateModalData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                    className="mt-2"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateModalConfirm}
              className="flex-1"
            >
              Create {createModalType === 'customer' ? 'Customer' : 'Contact'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
