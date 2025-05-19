import React, { Dispatch, SetStateAction } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminData } from '@/types/TAdminData';

interface PrevailingWagesSectionProps {
    adminData: AdminData;
    setAdminData: Dispatch<SetStateAction<AdminData>>
    cpr: 'STATE' | 'FEDERAL' | 'N/A';
    onCprChange: (value: 'STATE' | 'FEDERAL' | 'N/A') => void;
}

const PrevailingWagesSection: React.FC<PrevailingWagesSectionProps> = ({
    adminData,
    setAdminData,
    cpr,
    onCprChange
}) => {
    return (
        <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-6 text-lg font-semibold">Prevailing Wages</h3>
            <div className="mb-6 flex items-center space-x-2">
                <Switch
                    id="use-shop-rates"
                    checked={adminData.rated === 'NON-RATED'}
                    onCheckedChange={(checked) => setAdminData(prev => ({ ...prev, rated: checked ? 'NON-RATED' : 'RATED' }))}
                />
                <Label htmlFor="use-shop-rates">Use shop rates</Label>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="space-y-2">
                    <Label>Labor Rate</Label>
                    <div className="flex items-center">
                        <div className="pointer-events-none flex h-10 w-10 items-center justify-center rounded-l-md border border-r-0 bg-muted text-sm text-muted-foreground">
                            $
                        </div>
                        <Input
                            type={adminData.rated === 'RATED' ? 'number' : 'text'}
                            className="rounded-l-none bg-muted/50"
                            value={adminData.rated === 'RATED' ? adminData.county.laborRate : 'SHOP'}
                            onChange={(e) => setAdminData(prev => ({ ...prev, county: { ...prev.county, laborRate: Number(e.target.value) } }))}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Fringe Rate</Label>
                    <div className="flex items-center">
                        <div className="pointer-events-none flex h-10 w-10 items-center justify-center rounded-l-md border border-r-0 bg-muted text-sm text-muted-foreground">
                            $
                        </div>
                        <Input
                            type={adminData.rated === 'RATED' ? 'number' : 'text'}
                            className="rounded-l-none bg-muted/50"
                            value={adminData.rated === 'RATED' ? adminData.county.fringeRate : 'SHOP'}
                            onChange={(e) => setAdminData(prev => ({ ...prev, county: { ...prev.county, fringeRate: Number(e.target.value) } }))}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Certified Payroll</Label>
                    <Select value={cpr} onValueChange={(value) => onCprChange(value as 'STATE' | 'FEDERAL' | 'N/A')}>
                        <SelectTrigger className="bg-muted/50">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="STATE">State</SelectItem>
                            <SelectItem value="FEDERAL">Federal</SelectItem>
                            <SelectItem value="N/A">N/A</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
};

export default PrevailingWagesSection;