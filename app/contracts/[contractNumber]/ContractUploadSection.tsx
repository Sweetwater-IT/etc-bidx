import React from 'react';
import { Upload } from 'lucide-react';

const ContractUploadSection: React.FC = () => {
    return (
        <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-6 text-lg font-semibold">Contract</h3>
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12">
                <Upload className="mb-4 h-8 w-8 text-muted-foreground" />
                <div className="text-center text-muted-foreground">
                    Upload contract here
                </div>
            </div>
        </div>
    );
};

export default ContractUploadSection;