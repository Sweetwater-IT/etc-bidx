'use client'
import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { PDFViewer } from '@react-pdf/renderer'
import FringeBenefitsStatement from './EmploymentBenefits'
import WorkerProtectionCertification from './WorkersProtection'
import { GenerateEmploymentVerificationForm } from './EmploymentVerification'
import { defaultAdminObject } from '../../../types/default-objects/defaultAdminData'
import { AdminData } from '../../../types/TAdminData'
import { Customer } from '../../../types/Customer'
import { toast } from 'sonner'
// Import child components
import CustomerInformationSection from './CustomerInformationSection'
import ContractUploadSection from './ContractUploadSection'
import PrevailingWagesSection from './PrevailingWagesSection'
import ContractFileManagement from './ContractFileManagement'
import AdditionalFilesSection from './ContractAdditionalFiles'
import FileManagerSection from './FileManagerSection'
import AdminInformationSection from './ContractAdminInfo'
import { DialogTitle } from '@radix-ui/react-dialog'
import { User } from '../../../types/User'
import { useCustomers } from '../../../hooks/use-customers'
import { useLoading } from '../../../hooks/use-loading'
import { TagsInput } from '../../../components/ui/tags-input'
import EmailSendingModal from './EmailSendingModal'
import CreateJobModal from './CreateJobModal'
import { FileMetadata } from '@/types/FileTypes'

interface Props {
  contractNumber: string
}

type CertifiedPayrollType = 'STATE' | 'FEDERAL' | 'N/A'

export interface AdditionalFiles {
  'W-9': boolean
  'EEO-SHARP Policy': boolean
  'Safety Program': boolean
  'Sexual Harassment Policy': boolean
  'Avenue of Appeals': boolean
}

const ContractManagementContent = ({ contractNumber }: Props) => {
  // Initialize customers state
  const {
    customers,
    isLoading: isLoadingCustomers,
    getCustomers
  } = useCustomers()

  // State for loading
  const { startLoading, stopLoading } = useLoading()

  // State for modals
  const [isOpenFringeBenefits, setIsOpenFringeBenefits] = useState(false)
  const [isOpenWorkersProtection, setIsOpenWorkersProtection] = useState(false)
  const [isOpenEmploymentVerification, setIsOpenEmploymentVerification] =
    useState(false)
  const [isOpenEmailSending, setIsOpenEmailSending] = useState<boolean>(false)
  const [isOpenJobCreation, setIsOpenJobCreation] = useState<boolean>(false)

  // State for form data
  const [adminData, setAdminData] = useState<AdminData>({
    ...defaultAdminObject,
    contractNumber
  })

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [customerContractNumber, setCustomerContractNumber] = useState('')
  const [projectManager, setProjectManager] = useState('')
  const [pmEmail, setPmEmail] = useState('')
  const [pmPhone, setPmPhone] = useState('')
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [subject, setSubject] = useState<string>()
  const [body, setBody] = useState<string>()

  // Initialize sender with current user if available
  const [sender, setSender] = useState<User>({
    name: 'Garret Brunton',
    email: 'gbrunton@establishedtraffic.com',
    role: 'Chief Operating Officer'
  })

  const [evDescription, setEvDescription] = useState('')

  const [addedFiles, setAddedFiles] = useState<AdditionalFiles>({
    'W-9': false,
    'EEO-SHARP Policy': false,
    'Safety Program': false,
    'Sexual Harassment Policy': false,
    'Avenue of Appeals': false
  })

  const [files, setFiles] = useState<FileMetadata[]>([])
  const [cpr, setCpr] = useState<CertifiedPayrollType>('STATE')
  const [laborGroup, setLaborGroup] = useState('Labor Group 3')

  const [jobId, setJobId] = useState<number>()
  const [jobNumber, setJobNumber] = useState<string | undefined>(undefined)

  // Fetch customers first
  useEffect(() => {
    getCustomers()
  }, [getCustomers])

  // Fetch contract data
  const fetchData = async () => {
    if (!contractNumber || isLoadingCustomers) return
    startLoading()
    try {
      const jobResponse = await fetch('/api/jobs/contract-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contractNumber })
      })

      if (!jobResponse.ok) {
        const errorData = await jobResponse.json()
        toast('Failed to fetch contract data: ' + errorData)
        stopLoading()
        return
      }

      const response = await jobResponse.json()

      // Update admin data
      if (response.adminData) {
        setAdminData(response.adminData)
      }

      // Find customer by name in the customers array
      if (response.contractorName && customers.length > 0) {
        const foundCustomer = customers.find(
          c => c.name === response.contractorName
        )
        setCustomer(foundCustomer || null)
      }

      // Set customer contract number
      if (response.customerContractNumber) {
        setCustomerContractNumber(response.customerContractNumber)
      }

      // Set project manager details
      if (response.projectManager) {
        setProjectManager(response.projectManager)
      }

      if (response.pmEmail) {
        setPmEmail(response.pmEmail)
      }

      if (response.pmPhone) {
        setPmPhone(response.pmPhone)
      }

      // Set description
      if (response.evDescription) {
        setEvDescription(response.evDescription)
      }

      // Set added files from the database fields
      setAddedFiles({
        'W-9': response.w9_added || false,
        'EEO-SHARP Policy': response.eea_sharp_added || false,
        'Safety Program': response.safety_program_added || false,
        'Sexual Harassment Policy': response.sexual_harrassment_added || false,
        'Avenue of Appeals': response.avenue_appeals_added || false
      })

      // Set certified payroll type
      if (response.certified_payroll) {
        setCpr(response.certified_payroll as CertifiedPayrollType)
      }

      // Set labor group
      if (response.labor_group) {
        setLaborGroup(response.labor_group)
      }

      // Fetch files for this job
      if (response.job_id) {
        setJobId(response.job_id)
      }
      if (response.job_number) {
        setJobNumber(response.job_number)
      }
    } catch (error) {
      console.error('Error fetching contract data:', error)
      toast(`Failed to fetch contract data: ${error}`)
    } finally {
      stopLoading()
    }
  }

  useEffect(() => {
    fetchData()
  }, [contractNumber, customers, isLoadingCustomers])

  const fetchFiles = async () => {
    if (!jobId) return
    try {
      const filesResponse = await fetch(
        `/api/files/contract-management?job_id=${jobId}`
      )
      if (filesResponse.ok) {
        const filesData = await filesResponse.json()
        setFiles(filesData.data)
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [jobId])

  return (
    <div className='flex flex-grow w-full gap-6 py-6'>
      {/* PDF Modals */}
      <Dialog
        open={isOpenFringeBenefits}
        onOpenChange={setIsOpenFringeBenefits}
      >
        <DialogContent className='max-w-4xl h-fit w-fit'>
          <DialogTitle>Fringe Benefits Letter</DialogTitle>
          <div className='mt-4'>
            <PDFViewer height={600} width={600}>
              <FringeBenefitsStatement
                laborGroup={laborGroup}
                sender={sender}
                adminData={adminData}
              />
            </PDFViewer>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isOpenWorkersProtection}
        onOpenChange={setIsOpenWorkersProtection}
      >
        <DialogContent className='max-w-4xl h-fit w-fit'>
          <DialogTitle>Workers Protection</DialogTitle>
          <div className='mt-4'>
            <PDFViewer height={600} width={600}>
              <WorkerProtectionCertification sender={sender} />
            </PDFViewer>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isOpenEmploymentVerification}
        onOpenChange={setIsOpenEmploymentVerification}
      >
        <DialogContent className='max-w-4xl h-fit w-fit'>
          <DialogTitle>Employment Verification</DialogTitle>
          <div className='mt-4'>
            <PDFViewer height={600} width={600}>
              <GenerateEmploymentVerificationForm
                user={sender}
                description={evDescription}
                adminData={adminData}
              />
            </PDFViewer>
          </div>
        </DialogContent>
      </Dialog>

      <CreateJobModal
        jobId={jobId}
        isOpen={isOpenJobCreation}
        onOpenChange={setIsOpenJobCreation}
        customer={customer}
        customerContractNumber={customerContractNumber}
        projectManager={projectManager}
        pmEmail={pmEmail}
        pmPhone={pmPhone}
        contractNumber={contractNumber}
        adminData={adminData}
        sender={sender}
        onJobCreated={() => {
          // Re-fetch contract data after job creation
          fetchData()
        }}
      />

      <EmailSendingModal
        isOpen={isOpenEmailSending}
        contractNumber={contractNumber}
        onOpenChange={setIsOpenEmailSending}
        files={files}
        customer={customer}
        sender={sender}
      />

      {/* Main Content (2/3) */}
      <div className='w-2/3 space-y-6'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold'>Contract #{contractNumber}</h2>
          <Button
            onClick={() => setIsOpenJobCreation(true)}
            disabled={
              Boolean(jobId) && !!jobNumber && !jobNumber?.startsWith('P-')
            }
          >
            Create Job
          </Button>
        </div>

        {/* Customer Information */}
        <CustomerInformationSection
          customer={customer}
          customerContractNumber={customerContractNumber}
          projectManager={projectManager}
          pmEmail={pmEmail}
          pmPhone={pmPhone}
          onCustomerChange={setCustomer}
          onCustomerContractNumberChange={setCustomerContractNumber}
          onProjectManagerChange={setProjectManager}
          onPmEmailChange={setPmEmail}
          onPmPhoneChange={setPmPhone}
        />

        {/* Contract Upload */}
        <ContractUploadSection onSuccess={fetchFiles} jobId={jobId} />

        {/* Prevailing Wages */}
        <PrevailingWagesSection
          adminData={adminData}
          cpr={cpr}
          onCprChange={setCpr}
          setAdminData={setAdminData}
        />

        {/* Contract File Management */}
        <ContractFileManagement
          adminData={adminData}
          setAdminData={setAdminData}
          sender={sender}
          laborGroup={laborGroup}
          onSenderChange={setSender}
          customer={customer}
          setCustomer={setCustomer}
          onLaborGroupChange={setLaborGroup}
          onFringeBenefitsPreview={() => setIsOpenFringeBenefits(true)}
          onWorkersProtectionPreview={() => setIsOpenWorkersProtection(true)}
          evDescription={evDescription}
          onEvDescriptionChange={setEvDescription}
          onEmploymentVerificationPreview={() =>
            setIsOpenEmploymentVerification(true)
          }
          allCustomers={customers}
          jobId={jobId}
          setFiles={setFiles}
        />

        {/* Additional Files */}
        <AdditionalFilesSection
          addedFiles={addedFiles}
          onAddedFilesChange={setAddedFiles}
          setFiles={setFiles}
          jobId={jobId}
        />
      </div>

      {/* Right Column (1/3) */}
      <div className='w-1/3 space-y-6'>
        {/* File Manager */}
        <FileManagerSection
          files={files}
          onFilesChange={setFiles}
          open={setIsOpenEmailSending}
          jobId={jobId}
        />

        {/* Admin Information */}
        <AdminInformationSection adminData={adminData} />
      </div>
    </div>
  )
}

export default ContractManagementContent
