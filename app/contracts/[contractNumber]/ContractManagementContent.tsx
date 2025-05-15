'use client'
import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PDFViewer } from '@react-pdf/renderer';
import FringeBenefitsStatement from './EmploymentBenefits';
import WorkerProtectionCertification from './WorkersProtection';
import { GenerateEmployeeVerificationForm } from './EmploymentVerification';
import { defaultAdminObject } from '@/types/default-objects/defaultAdminData';
import { AdminData } from '@/types/TAdminData';
import { Customer } from '@/types/Customer';
import { ContractManagementData } from '@/types/IContractManagementData';

// Import child components
import CustomerInformationSection from './CustomerInformationSection';
import ContractUploadSection from './ContractUploadSection';
import PrevailingWagesSection from './PrevailingWagesSection';
import ContractFileManagement from './ContractFileManagement';
import AdditionalFilesSection from './ContractAdditionalFiles';
import FileManagerSection from './FileManagerSection';
import AdminInformationSection from './ContractAdminInfo';
import { DialogTitle } from '@radix-ui/react-dialog';

interface Props {
    contractNumber: string;
}

interface SenderInfo {
    name: string;
    email: string;
    role: string;
}

type CertifiedPayrollType = 'STATE' | 'FEDERAL' | 'N/A';

interface AdditionalFiles {
    'W-9': boolean;
    'EEO-SHARP Policy': boolean;
    'Safety Program': boolean;
    'Sexual Harassment Policy': boolean;
    'Avenue of Appeals': boolean;
}

const ContractManagementContent = ({ contractNumber }: Props) => {
    // State for modals
    const [isOpenFringeBenefits, setIsOpenFringeBenefits] = useState(false);
    const [isOpenWorkersProtection, setIsOpenWorkersProtection] = useState(false);
    const [isOpenEmploymentVerification, setIsOpenEmploymentVerification] = useState(false);

    // State for form data
    const [adminData, setAdminData] = useState<AdminData>({
        ...defaultAdminObject,
        contractNumber
    });

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [customerContractNumber, setCustomerContractNumber] = useState('');
    const [projectManager, setProjectManager] = useState('');
    const [pmEmail, setPmEmail] = useState('');
    const [pmPhone, setPmPhone] = useState('');

    const [sender, setSender] = useState<SenderInfo>({
        name: '',
        email: '',
        role: ''
    });

    const [evDescription, setEvDescription] = useState('');

    const [addedFiles, setAddedFiles] = useState<AdditionalFiles>({
        'W-9': false,
        'EEO-SHARP Policy': false,
        'Safety Program': false,
        'Sexual Harassment Policy': false,
        'Avenue of Appeals': false
    });

    const [files, setFiles] = useState<File[]>([]);

    const [cpr, setCpr] = useState<CertifiedPayrollType>('STATE');

    const [useShopRates, setUseShopRates] = useState(false);
    const [laborRate, setLaborRate] = useState('32.75');
    const [fringeRate, setFringeRate] = useState('25.5');
    const [selectedContractor, setSelectedContractor] = useState('');
    const [laborGroup, setLaborGroup] = useState('labor-group-3');

    // Handle data loading from API
    const handleDataLoaded = useCallback((data: ContractManagementData) => {
        // Update all state with loaded data
        setAdminData(data.adminData);
        setCustomer(data.customer);
        setCustomerContractNumber(data.customerContractNumber);
        setProjectManager(data.projectManager);
        setPmEmail(data.pmEmail);
        setPmPhone(data.pmPhone);
        setSender(data.sender);
        setEvDescription(data.evDescription);
        setAddedFiles(data.addedFiles);
        setCpr(data.cpr);
        setUseShopRates(data.useShopRates);
        setLaborRate(data.laborRate);
        setFringeRate(data.fringeRate);
        setSelectedContractor(data.selectedContractor);
        setLaborGroup(data.laborGroup);
        // Note: We can't set files from the API as File objects can't be serialized
        // Files should be handled separately through file upload
    }, []);

    return (
        <div className="flex gap-6 py-6">
            {/* PDF Modals */}
            <Dialog open={isOpenFringeBenefits} onOpenChange={setIsOpenFringeBenefits}>
                <DialogContent className="max-w-4xl h-fit w-fit">
                    <DialogTitle>Fringe Benefits Letter</DialogTitle>
                    <div className="mt-4">
                        <PDFViewer height={600} width={600}>
                            <FringeBenefitsStatement jobData={{laborGroup: '1', sender}} adminData={adminData} />
                        </PDFViewer>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isOpenWorkersProtection} onOpenChange={setIsOpenWorkersProtection}>
                <DialogContent className="max-w-4xl h-fit w-fit">
                    <DialogTitle>Workers Protection</DialogTitle>
                    <div className="mt-4">
                        <PDFViewer height={600} width={600}>
                            <WorkerProtectionCertification />
                        </PDFViewer>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isOpenEmploymentVerification} onOpenChange={setIsOpenEmploymentVerification}>
                <DialogContent className="max-w-4xl h-fit w-fit">
                    <DialogTitle>Employment Verification</DialogTitle>
                    <div className="mt-4">
                        <PDFViewer height={600} width={600}>
                            <GenerateEmployeeVerificationForm description={evDescription} adminData={adminData} />
                        </PDFViewer>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Main Content (2/3) */}
            <div className="flex-[2] space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                        Contract #{contractNumber}
                    </h2>
                    <Button>Create Job</Button>
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
                <ContractUploadSection />

                {/* Prevailing Wages */}
                <PrevailingWagesSection
                    useShopRates={useShopRates}
                    laborRate={laborRate}
                    fringeRate={fringeRate}
                    cpr={cpr}
                    onUseShopRatesChange={setUseShopRates}
                    onLaborRateChange={setLaborRate}
                    onFringeRateChange={setFringeRate}
                    onCprChange={setCpr}
                />

                {/* Contract File Management */}
                <ContractFileManagement
                    contractNumber={contractNumber}
                    srRoute={adminData.srRoute}
                    selectedContractor={selectedContractor}
                    county={adminData.county.name}
                    laborRate={laborRate}
                    fringeRate={fringeRate}
                    sender={sender}
                    laborGroup={laborGroup}
                    onContractorChange={setSelectedContractor}
                    onSenderChange={setSender}
                    onLaborGroupChange={setLaborGroup}
                    onFringeBenefitsPreview={() => setIsOpenFringeBenefits(true)}
                    onWorkersProtectionPreview={() => setIsOpenWorkersProtection(true)}
                    owner={adminData.owner}
                    evDescription={evDescription}
                    onEvDescriptionChange={setEvDescription}
                    onEmploymentVerificationPreview={() => setIsOpenEmploymentVerification(true)}
                    handleDataLoaded={handleDataLoaded}
                />

                {/* Additional Files */}
                <AdditionalFilesSection
                    addedFiles={addedFiles}
                    onAddedFilesChange={setAddedFiles}
                />
            </div>

            {/* Right Column (1/3) */}
            <div className="flex-1 space-y-6">
                {/* File Manager */}
                <FileManagerSection
                    files={files}
                    onFilesChange={setFiles}
                />

                {/* Admin Information */}
                <AdminInformationSection
                    adminData={adminData}
                />
            </div>
        </div>
    );
};

export default ContractManagementContent;