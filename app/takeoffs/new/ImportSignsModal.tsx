'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/data-table'
import { AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

interface SignItem {
  designation: string
  description: string
  quantity: number
  width: number
  height: number
  sheeting: string
  substrate: string
  stiffener: string
  bLights: string | number
  cover: boolean
  inStock: number
  order: number
  displayStructure: string
  primarySignId?: string
  id?: string
}

interface ActiveBid {
  id: number
  contract_number: string
  contractor: string
  status: string
}

interface Takeoff {
  id: string
  title: string
  status: string
  created_at: string
}

interface TakeoffItem {
  id: string
  product_name: string
  category: string
  quantity: number
  notes?: string
  sign_details?: any
  sign_description?: string
  sheeting?: string
  width_inches?: number
  height_inches?: number
  material?: string
  cover?: boolean
  bLights?: string
  structureType?: string
}

interface ImportSignsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobId?: string
  onImport: (signs: SignItem[]) => void
}

export function ImportSignsModal({ open, onOpenChange, jobId, onImport }: ImportSignsModalProps) {
  const [activeTab, setActiveTab] = useState<'active-bid' | 'takeoff'>('active-bid')
  const [activeBids, setActiveBids] = useState<ActiveBid[]>([])
  const [takeoffs, setTakeoffs] = useState<Takeoff[]>([])
  const [selectedBid, setSelectedBid] = useState<ActiveBid | null>(null)
  const [selectedTakeoff, setSelectedTakeoff] = useState<Takeoff | null>(null)
  const [previewSigns, setPreviewSigns] = useState<SignItem[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch active bids
  useEffect(() => {
    if (open && activeTab === 'active-bid') {
      fetchActiveBids()
    }
  }, [open, activeTab])

  // Fetch takeoffs for job
  useEffect(() => {
    if (open && activeTab === 'takeoff' && jobId) {
      fetchTakeoffs()
    }
  }, [open, activeTab, jobId])

  const fetchActiveBids = async () => {
    try {
      const response = await fetch('/api/active-bids?limit=1000')
      const data = await response.json()
      setActiveBids(data.data || [])
    } catch (error) {
      toast.error('Failed to fetch active bids')
    }
  }

  const fetchTakeoffs = async () => {
    if (!jobId) return
    try {
      const response = await fetch(`/api/l/jobs/${jobId}/takeoffs`)
      const data = await response.json()
      setTakeoffs(data || [])
    } catch (error) {
      toast.error('Failed to fetch takeoffs')
    }
  }

  const handleBidSelect = async (bid: ActiveBid) => {
    setSelectedBid(bid)
    setLoading(true)
    try {
      const response = await fetch(`/api/active-bids?id=${bid.id}&detailed=true`)
      const data = await response.json()
      const signs = data.data[0]?.mpt_rental?.phases?.[0]?.signs || []
      setPreviewSigns(signs)
    } catch (error) {
      toast.error('Failed to fetch bid signs')
    } finally {
      setLoading(false)
    }
  }

  const handleTakeoffSelect = async (takeoff: Takeoff) => {
    setSelectedTakeoff(takeoff)
    setLoading(true)
    try {
      const response = await fetch(`/api/l/takeoffs/${takeoff.id}/data`)
      const data = await response.json()
      const takeoffItems: TakeoffItem[] = data.takeoffItems || []
      const mappedSigns = mapTakeoffItemsToSignItems(takeoffItems)
      setPreviewSigns(mappedSigns)
    } catch (error) {
      toast.error('Failed to fetch takeoff signs')
    } finally {
      setLoading(false)
    }
  }

  const mapTakeoffItemsToSignItems = (items: TakeoffItem[]): SignItem[] => {
    return items
      .filter(item => item.category === 'sign')
      .map(item => ({
        designation: item.sign_details?.signDesignation || item.product_name,
        description: item.sign_details?.signLegend || item.sign_description || item.notes || '',
        quantity: item.quantity,
        width: item.sign_details?.width || item.width_inches || 0,
        height: item.sign_details?.height || item.height_inches || 0,
        sheeting: item.sign_details?.sheeting || item.sheeting || '',
        substrate: item.sign_details?.material || item.material || '',
        stiffener: item.sign_details?.stiffener || '',
        bLights: item.sign_details?.bLights || item.bLights || '',
        cover: item.cover ?? item.sign_details?.cover ?? true,
        inStock: 0,
        order: 0,
        displayStructure: item.sign_details?.structureType || '',
        id: item.id
      }))
  }

  const columns = [
    { key: 'designation', title: 'Designation' },
    { key: 'description', title: 'Description' },
    { key: 'quantity', title: 'Qty' },
    { key: 'width', title: 'Width' },
    { key: 'height', title: 'Height' },
    { key: 'sheeting', title: 'Sheeting' }
  ]

  const handleImport = () => {
    if (previewSigns.length === 0) {
      toast.error('No signs to import')
      return
    }
    onImport(previewSigns)
    onOpenChange(false)
    toast.success(`Imported ${previewSigns.length} signs`)
  }

  return (
    <AlertDialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
      <AlertDialogHeader>
        <AlertDialogTitle>Import Signs</AlertDialogTitle>
      </AlertDialogHeader>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'active-bid' | 'takeoff')}>
        <TabsList>
          <TabsTrigger value="active-bid">From Active Bid</TabsTrigger>
          <TabsTrigger value="takeoff" disabled={!jobId}>From Takeoff</TabsTrigger>
        </TabsList>

        <TabsContent value="active-bid" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Select Active Bid</h3>
              <div className="max-h-64 overflow-y-auto border rounded p-2">
                {activeBids.map(bid => (
                  <div
                    key={bid.id}
                    className={`p-2 cursor-pointer hover:bg-muted ${selectedBid?.id === bid.id ? 'bg-muted' : ''}`}
                    onClick={() => handleBidSelect(bid)}
                  >
                    {bid.contract_number} - {bid.contractor}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Preview Signs</h3>
              {loading ? <div>Loading...</div> : (
                <DataTable columns={columns} data={previewSigns} />
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="takeoff" className="space-y-4">
          {!jobId ? (
            <div>Please select a job first</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Select Takeoff</h3>
                <div className="max-h-64 overflow-y-auto border rounded p-2">
                  {takeoffs.map(takeoff => (
                    <div
                      key={takeoff.id}
                      className={`p-2 cursor-pointer hover:bg-muted ${selectedTakeoff?.id === takeoff.id ? 'bg-muted' : ''}`}
                      onClick={() => handleTakeoffSelect(takeoff)}
                    >
                      {takeoff.title} - {takeoff.status}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Preview Signs</h3>
                {loading ? <div>Loading...</div> : (
                  <DataTable columns={columns} data={previewSigns} />
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button onClick={handleImport} disabled={previewSigns.length === 0}>Import {previewSigns.length} Signs</Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  )
}