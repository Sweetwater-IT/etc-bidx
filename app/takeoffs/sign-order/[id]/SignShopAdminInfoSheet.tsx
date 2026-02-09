import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import React, { Dispatch, SetStateAction, useState, useEffect } from 'react'
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SignOrder } from '@/types/TSignOrder';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';

interface Props {
    open: boolean
    handleOpenChange: () => void
    setSignOrder: Dispatch<SetStateAction<SignOrder | undefined>>
    signOrder: SignOrder
}

interface FormData {
    target_date: string
    shop_status: string
    assigned_to: string
}

const SignShopAdminInfoSheet = ({ open, handleOpenChange, signOrder, setSignOrder }: Props) => {
    const [formData, setFormData] = useState<FormData>({
        target_date: '',
        shop_status: '',
        assigned_to: ''
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize form data when sheet opens or signOrder changes
    useEffect(() => {
        if (open && signOrder) {
            setFormData({
                target_date: signOrder.target_date ? signOrder.target_date.split("T")[0] : '',
                shop_status: signOrder.shop_status || 'not-started',
                assigned_to: signOrder.assigned_to || ''
            });
        }
    }, [open, signOrder]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsSubmitting(true);
        
        try {
            // Update the parent state with the form data
            setSignOrder(prev => prev ? {
                ...prev,
                target_date: formData.target_date || undefined,
                shop_status: formData.shop_status,
                assigned_to: formData.assigned_to || undefined
            } : undefined);
            
            // Close the sheet
            handleOpenChange();
            
        } catch (error) {
            console.error('Error updating sign order:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFormDataChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetContent
                side="right"
                className="w-[400px] sm:w-[540px] flex flex-col p-0"
            >
                <div className="flex flex-col gap-2 relative z-10 bg-background">
                    <SheetHeader className="p-6 pb-4">
                        <SheetTitle>
                            Edit Admin Info
                        </SheetTitle>
                    </SheetHeader>
                    <Separator className="w-full -mt-2" />
                </div>
                
                <form
                    onSubmit={handleSubmit}
                    className="-mt-4 flex flex-col overflow-y-auto h-full"
                >
                    <div className="flex-1 overflow-y-auto">
                        <div className="space-y-6 p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2 w-full">
                                    <Label className="text-sm font-medium text-muted-foreground">
                                        Target Date
                                    </Label>
                                    <Input
                                        id="target-date"
                                        type="date"
                                        placeholder="Target date"
                                        value={formData.target_date}
                                        onChange={(e) => handleFormDataChange('target_date', e.target.value)}
                                        className="h-10"
                                    />
                                </div>

                                <div className="space-y-2 w-full">
                                    <Label className="text-sm font-medium text-muted-foreground">
                                        Shop Status *
                                    </Label>
                                    <Select
                                        value={formData.shop_status}
                                        onValueChange={(value) => handleFormDataChange('shop_status', value)}
                                    >
                                        <SelectTrigger className='w-full'>
                                            <SelectValue placeholder='Select shop status' />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value='not-started'>
                                                Not Started
                                            </SelectItem>
                                            <SelectItem value='in-process'>
                                                In-Process
                                            </SelectItem>
                                            <SelectItem value='on-order'>
                                                On Order
                                            </SelectItem>
                                            <SelectItem value='complete'>
                                                Complete
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="space-y-2 w-full">
                                    <Label className="text-sm font-medium text-muted-foreground">
                                        Assigned To
                                    </Label>
                                    <Select
                                        value={formData.assigned_to}
                                        onValueChange={(value) => handleFormDataChange('assigned_to', value)}
                                    >
                                        <SelectTrigger className='w-full'>
                                            <SelectValue placeholder='Select assignee' />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value='Tom Daywalt'>
                                                Tom Daywalt
                                            </SelectItem>
                                            <SelectItem value='Richie Sweigert'>
                                                Richie Sweigert
                                            </SelectItem>
                                            <SelectItem value='David Grooms'>
                                                David Grooms
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />
                    <div className="p-4 pt-4 flex items-center justify-center">
                        <div className="flex flex-col gap-2 w-full">
                            <div className="flex justify-between items-center gap-2 h-full">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={handleOpenChange}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1"
                                    type="submit"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Saving...' : 'Save'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    )
}

export default SignShopAdminInfoSheet