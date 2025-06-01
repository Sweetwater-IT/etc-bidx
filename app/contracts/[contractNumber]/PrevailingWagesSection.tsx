import React, { Dispatch, SetStateAction, useState, useEffect } from 'react';
import { Switch } from '../../../components/ui/switch';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { AdminData } from '../../../types/TAdminData';
import { formatDecimal } from '@/lib/formatDecimals';
import { handleNextDigits } from '@/lib/handleNextDigits';

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

    const [digits, setDigits] = useState({
        laborRate: "000",
        fringeRate: "000",
    });

    // Update digits when county changes or when switching between RATED/NON-RATED
    useEffect(() => {
        if (adminData.county && adminData.rated === 'RATED') {
            setDigits((prev) => ({
                ...prev,
                laborRate: Math.round((adminData.county.laborRate || 0) * 100)
                    .toString()
                    .padStart(3, "0"),
                fringeRate: Math.round((adminData.county.fringeRate || 0) * 100)
                    .toString()
                    .padStart(3, "0"),
            }));
        }
    }, [adminData.county, adminData.rated]);

    // Handle rate changes with decimal formatting
    const handleRateChange = (field: 'laborRate' | 'fringeRate', formattedValue: string) => {
        const numValue = Number(formattedValue);
        setAdminData(prev => ({
            ...prev,
            county: {
                ...prev.county!,
                [field]: numValue
            }
        }));
    };

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
                            inputMode={adminData.rated === 'RATED' ? "decimal" : "none"}
                            pattern={adminData.rated === 'RATED' ? "^\\d*(\\.\\d{0,2})?$" : undefined}
                            className="rounded-l-none bg-muted/50"
                            value={adminData.rated === 'RATED' ? `$ ${formatDecimal(digits.laborRate)}` : 'SHOP'}
                            onChange={(e) => {
                                if (adminData.rated === 'RATED') {
                                    const ev = e.nativeEvent as InputEvent;
                                    const { inputType } = ev;
                                    const data = (ev.data || "").replace(/\$/g, "");

                                    const nextDigits = handleNextDigits(digits.laborRate, inputType, data);
                                    setDigits((prev) => ({ ...prev, laborRate: nextDigits }));

                                    const formatted = (parseInt(nextDigits, 10) / 100).toFixed(2);
                                    handleRateChange('laborRate', formatted);
                                }
                            }}
                            readOnly={adminData.rated === 'NON-RATED'}
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
                            inputMode={adminData.rated === 'RATED' ? "decimal" : "none"}
                            pattern={adminData.rated === 'RATED' ? "^\\d*(\\.\\d{0,2})?$" : undefined}
                            className="rounded-l-none bg-muted/50"
                            value={adminData.rated === 'RATED' ? `$ ${formatDecimal(digits.fringeRate)}` : 'SHOP'}
                            onChange={(e) => {
                                if (adminData.rated === 'RATED') {
                                    const ev = e.nativeEvent as InputEvent;
                                    const { inputType } = ev;
                                    const data = (ev.data || "").replace(/\$/g, "");

                                    const nextDigits = handleNextDigits(digits.fringeRate, inputType, data);
                                    setDigits((prev) => ({ ...prev, fringeRate: nextDigits }));

                                    const formatted = (parseInt(nextDigits, 10) / 100).toFixed(2);
                                    handleRateChange('fringeRate', formatted);
                                }
                            }}
                            readOnly={adminData.rated === 'NON-RATED'}
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