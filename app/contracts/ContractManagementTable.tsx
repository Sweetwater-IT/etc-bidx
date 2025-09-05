'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DataTable } from '../../components/data-table'
import { formatDate } from '../../lib/formatUTCDate'
import { useLoading } from '../../hooks/use-loading'

type ContractData = {
  id: number
  letting_date?: string | null
  contract_number: string
  contractor: string | null
  status: string
  county: string
  branch: string
  estimator?: string | null
  created_at: string
  source: 'bid' | 'job'
  job_number?: string
}

const COLUMNS = [
  { key: 'letting_date', title: 'Letting Date', sortable: true },
  { key: 'contract_number', title: 'Contract #', sortable: true },
  { key: 'job_number', title: 'Job Number' },  
  { key: 'contractor', title: 'Contractor' },
  { key: 'status', title: 'Status' },
  { key: 'county', title: 'County' },
  { key: 'branch', title: 'Branch' },
  { key: 'estimator', title: 'Estimator' },
  { key: 'created_at', title: 'Created At', sortable: true }
]

const ContractManagementTable = () => {
  const router = useRouter()
  const [contracts, setContracts] = useState<ContractData[]>([])
  const { startLoading, stopLoading } = useLoading()
  const [currentSegment, setCurrentSegment] = useState('all')
  const [segmentCounts, setSegmentCounts] = useState<Record<string, number>>({
    all: 0,
    won: 0,
    'won-pending': 0
  })

  // Add state for filters
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})
  const [showFilters, setShowFilters] = useState(false)
  const [branchOptions, setBranchOptions] = useState<
    { label: string; value: string }[]
  >([])
  const [countyOptions, setCountyOptions] = useState<
    { label: string; value: string }[]
  >([])
  const [estimatorOptions, setEstimatorOptions] = useState<
    { label: string; value: string }[]
  >([])
  const [sortBy, setSortBy] = useState<string | undefined>(undefined)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Add table ref for resetting selection
  const tableRef = React.useRef<{ resetRowSelection: () => void } | null>(null)

  // Fetch reference data for filters
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const [branchesRes, countiesRes, estimatorsRes] = await Promise.all([
          fetch('/api/reference-data?type=branches'),
          fetch('/api/reference-data?type=counties'),
          fetch('/api/reference-data?type=estimators')
        ])

        const [branchesData, countiesData, estimatorsData] = await Promise.all([
          branchesRes.json(),
          countiesRes.json(),
          estimatorsRes.json()
        ])

        if (branchesData.success) {
          setBranchOptions(
            branchesData.data.map((b: any) => ({
              label: b.name,
              value: b.code
            }))
          )
        }

        if (countiesData.success) {
          setCountyOptions(
            countiesData.data.map((c: any) => ({
              label: c.name,
              value: c.name
            }))
          )
        }

        if (estimatorsData.success) {
          setEstimatorOptions(
            estimatorsData.data.map((e: any) => ({
              label: e.name,
              value: e.name
            }))
          )
        }
      } catch (error) {
        console.error('Error fetching reference data:', error)
      }
    }

    fetchReferenceData()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        startLoading()

        // Fetch counts first
        const countsResponse = await fetch(
          '/api/jobs/contract-management?counts=true'
        )
        const countsData = await countsResponse.json()

        if (countsData.success) {
          setSegmentCounts({
            all: countsData.counts.all,
            won: countsData.counts.won,
            'won-pending': countsData.counts.wonPending
          })
        }

        // Fetch data for current segment with filters
        let statusParam = ''
        if (currentSegment === 'won') {
          statusParam = '&status=won'
        } else if (currentSegment === 'won-pending') {
          statusParam = '&status=won-pending'
        }

        // Add filter parameters if any are active
        let filterParams = ''
        if (Object.keys(activeFilters).length > 0) {
          filterParams = `&filters=${JSON.stringify(activeFilters)}`
        }

        // Add sorting parameters if available
        let sortParams = ''
        if (sortBy) {
          sortParams = `&sortBy=${sortBy}&sortOrder=${sortOrder}`
        }

        const response = await fetch(
          `/api/jobs/contract-management?page=1&limit=100${statusParam}${filterParams}${sortParams}`
        )
        const result = await response.json()

        if (result.success && result.data) {
          const displayData = result.data.map((job: any) => ({
            id: job.id,
            letting_date: job.letting_date,
            contract_number: job.contract_number,
            contractor: job.contractor,
            status: job.status,
            county: job.county,
            branch: job.branch,
            estimator: job.estimator,
            created_at: job.created_at,
            source: 'job' as const,
            job_number: job.job_number
          }))
          setContracts(displayData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        stopLoading()
      }
    }

    fetchData()
  }, [currentSegment, activeFilters, sortBy, sortOrder, startLoading, stopLoading])

  const handleSegmentChange = (value: string) => {
    setCurrentSegment(value)
  }

  const handleViewDetails = (item: ContractData) => {
    router.push(`/contracts/${encodeURIComponent(item.contract_number)}`)
  }

  const handleFilterChange = (filters: Record<string, any>) => {
    setActiveFilters(filters)
  }

  const handleResetFilters = () => {
    setActiveFilters({})
  }

  const handleSortChange = (column: string, direction: 'asc' | 'desc') => {
    setSortBy(column)
    setSortOrder(direction)
  }

  // Add handlers for bulk actions
  const handleArchiveSelected = async (selectedRows: ContractData[]) => {
    try {
      const response = await fetch('/api/contracts/archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ids: selectedRows.map(row => row.id)
        })
      })

      const result = await response.json()

      if (result.success) {
        // Refresh the data
        if (handleSegmentChange && currentSegment) {
          handleSegmentChange(currentSegment)
        }
      } else {
        console.error('Failed to archive contracts:', result.message)
      }
    } catch (error) {
      console.error('Error archiving contracts:', error)
    }
  }

  const handleDeleteSelected = async (selectedRows: ContractData[]) => {
    try {
      const response = await fetch('/api/contracts/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ids: selectedRows.map(row => row.id)
        })
      })

      const result = await response.json()

      if (result.success) {
        // Refresh the data
        if (handleSegmentChange && currentSegment) {
          handleSegmentChange(currentSegment)
        }
      } else {
        console.error('Failed to delete contracts:', result.message)
      }
    } catch (error) {
      console.error('Error deleting contracts:', error)
    }
  }

  return (
    <DataTable<ContractData>
      data={contracts}
      columns={COLUMNS}
      segments={[
        { label: `All (${segmentCounts.all})`, value: 'all' },
        { label: `Won (${segmentCounts.won})`, value: 'won' },
        {
          label: `Won - Pending (${segmentCounts['won-pending']})`,
          value: 'won-pending'
        }
      ]}
      segmentValue={currentSegment}
      onSegmentChange={handleSegmentChange}
      stickyLastColumn
      onViewDetails={handleViewDetails}
      onRowClick={handleViewDetails}
      // Add filter props
      showFilters={showFilters}
      setShowFilters={setShowFilters}
      branchOptions={branchOptions}
      countyOptions={countyOptions}
      estimatorOptions={estimatorOptions}
      activeFilters={activeFilters}
      onFilterChange={handleFilterChange}
      onReset={handleResetFilters}
      // Add sorting props
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSortChange={handleSortChange}
      // Add bulk action props
      onArchiveSelected={handleArchiveSelected}
      onDeleteSelected={handleDeleteSelected}
      tableRef={tableRef}
    />
  )
}

export default ContractManagementTable
