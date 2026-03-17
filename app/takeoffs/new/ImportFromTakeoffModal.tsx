'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
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

interface Job {
  job_number: string
  branch: string
  contractNumber?: string
  contractorName?: string
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

interface ImportFromTakeoffModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobId?: string
  onImport: (signs: SignItem[]) => void
}

export function ImportFromTakeoffModal({ open, onOpenChange, jobId, onImport }: ImportFromTakeoffModalProps) {
  const [step, setStep] = useState<'job' | 'takeoff'>('job')
  const [jobs, setJobs] = useState<Job[]>([])
  const [takeoffs, setTakeoffs] = useState<Takeoff[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [selectedTakeoff, setSelectedTakeoff] = useState<Takeoff | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep('job')
      setSelectedJob(null)
      setSelectedTakeoff(null)
      setSearchValue('')
      fetchJobs()
    }
  }, [open])

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/l/jobs')
      const data = await response.json()
      setJobs(data || [])
    } catch (error) {
      toast.error('Failed to fetch jobs')
    }
  }

  const fetchTakeoffs = async (jobNumber: string) => {
    try {
      const response = await fetch(`/api/l/jobs/${jobNumber}/takeoffs`)
      const data = await response.json()
      setTakeoffs(data || [])
    } catch (error) {
      toast.error('Failed to fetch takeoffs')
    }
  }

  const handleJobSelect = (job: Job) => {
    setSelectedJob(job)
    setStep('takeoff')
    fetchTakeoffs(job.job_number)
  }

  const handleTakeoffSelect = async (takeoff: Takeoff) => {
    setSelectedTakeoff(takeoff)
    setLoading(true)
    try {
      const response = await fetch(`/api/l/takeoffs/${takeoff.id}/data`)
      const data = await response.json()
      const takeoffItems: TakeoffItem[] = data.takeoffItems || []
      const mappedSigns = mapTakeoffItemsToSignItems(takeoffItems)

      if (mappedSigns.length === 0) {
        toast.error('No signs found in this takeoff')
        setLoading(false)
        return
      }

      onImport(mappedSigns)
      onOpenChange(false)
      toast.success(`Imported ${mappedSigns.length} signs from ${takeoff.title}`)
    } catch (error) {
      toast.error('Failed to import signs from takeoff')
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

  const filteredJobs = jobs.filter(
    (job) =>
      !searchValue ||
      job.job_number.toLowerCase().includes(searchValue.toLowerCase()) ||
      (job.contractNumber && job.contractNumber.toLowerCase().includes(searchValue.toLowerCase()))
  )

  return (
    <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <AlertDialogHeader>
        <AlertDialogTitle>Import from Takeoff</AlertDialogTitle>
        <p className="text-sm text-muted-foreground">
          {step === 'job' ? 'Select a job to view its takeoffs' : `Select a takeoff from ${selectedJob?.job_number}`}
        </p>
      </AlertDialogHeader>

      <div className="space-y-4">
        {step === 'job' ? (
          <>
            <div className="relative">
              <input
                className="w-full rounded-md border border-border px-3 py-2"
                placeholder="Search jobs..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
            <div className="max-h-96 overflow-y-auto border rounded p-2">
              {filteredJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No jobs found
                </div>
              ) : (
                filteredJobs.map(job => (
                  <div
                    key={job.job_number}
                    className="p-3 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleJobSelect(job)}
                  >
                    <div className="font-medium">{job.job_number}</div>
                    <div className="text-sm text-muted-foreground">
                      Branch: {job.branch}
                      {job.contractNumber && ` • Contract: ${job.contractNumber}`}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={() => setStep('job')}>
                ← Back to Jobs
              </Button>
              <div className="text-sm text-muted-foreground">
                Selected: {selectedJob?.job_number}
              </div>
            </div>
            {takeoffs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No takeoffs found for this job
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto border rounded p-2">
                {takeoffs.map(takeoff => (
                  <div
                    key={takeoff.id}
                    className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer"
                    onClick={() => !loading && handleTakeoffSelect(takeoff)}
                  >
                    <div>
                      <div className="font-medium">{takeoff.title}</div>
                      <div className="text-sm text-muted-foreground">
                        Status: {takeoff.status} • Created: {new Date(takeoff.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      disabled={loading}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTakeoffSelect(takeoff)
                      }}
                    >
                      {loading && selectedTakeoff?.id === takeoff.id ? 'Importing...' : 'Import'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <AlertDialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
          Cancel
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  )
}
