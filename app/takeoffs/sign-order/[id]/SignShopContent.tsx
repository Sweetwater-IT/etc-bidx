'use client'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { SignOrderList } from '../../new/SignOrderList'
import SignShopAdminInfo from './SignShopAdminInfo'
import { SiteHeader } from '@/components/site-header'
import { useLoading } from '@/hooks/use-loading'
import { fetchReferenceData } from '@/lib/api-client'
import { PrimarySign, SecondarySign, ExtendedPrimarySign, ExtendedSecondarySign, hasShopTracking } from '@/types/MPTEquipment'
import { generateUniqueId } from '@/components/pages/active-bid/signs/generate-stable-id'
import { SignOrder } from '@/types/TSignOrder'
import { toast } from 'sonner'
import { useEstimate } from '@/contexts/EstimateContext'
import { defaultMPTObject } from '@/types/default-objects/defaultMPTObject'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const generateOrderMakeText = (items: (ExtendedPrimarySign | ExtendedSecondarySign)[]): string => {
    const itemsWithQuantities = items.filter(item => item.order > 0 || item.make > 0)
    if (itemsWithQuantities.length === 0) return ''

    const parts: any[] = []

    for (const item of itemsWithQuantities) {
        if (item.order > 0) {
            parts.push(`order ${item.order} ${item.designation}`)
        }
        if (item.make > 0) {
            parts.push(`make ${item.make} ${item.designation}`)
        }
    }

    if (parts.length === 1) return parts[0]

    const lastPart = parts.pop()
    return `${parts.join(', ')} and ${lastPart}`
}

interface Props {
    id: number
}

const SignShopContent = ({ id }: Props) => {

    const { mptRental, dispatch } = useEstimate();

    const [signOrder, setSignOrder] = useState<SignOrder>()
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)

    const { isLoading, startLoading, stopLoading } = useLoading();

    // Get signs with shop tracking from context
    const getShopSigns = (): (ExtendedPrimarySign | ExtendedSecondarySign)[] => {
        return mptRental.phases[0].signs.filter(hasShopTracking) as (ExtendedPrimarySign | ExtendedSecondarySign)[];
    };

    // Function to show confirmation dialog before saving changes
    const handleSaveChanges = () => {
        if (!signOrder) return
        setShowConfirmDialog(true)
    }

    const confirmSaveChanges = async () => {
        if (!signOrder) return
    
        try {
          startLoading();
    
          const shopSigns = getShopSigns();
    
          // Convert the sign items array to the expected signs object format
          const signsObject = shopSigns.reduce((acc, item) => {
            acc[item.id.toString()] = {
              designation: item.designation,
              description: item.description,
              width: item.width,
              height: item.height,
              quantity: item.quantity,
              sheeting: item.sheeting,
              stiffener: 'stiffener' in item ? item.stiffener : undefined,
              in_stock: item.inStock,
              order: item.order,
              make: item.make,
              substrate: item.substrate,
              cover: 'cover' in item ? item.cover : undefined
            }
            return acc
          }, {})
    
          // Update the sign order in the database
          const response = await fetch(`/api/sign-orders/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              signs: signsObject,
              shop_status: signOrder.shop_status || 'not-started'
            })
          })
    
          const result = await response.json()
    
          if (!result.success) {
            throw new Error(result.message || 'Failed to update sign order')
          }
    
          stopLoading()
          setShowConfirmDialog(false)
    
          // Show success message
          toast.success('Changes saved successfully!')
        } catch (error: any) {
          console.error('Error updating sign order:', error)
          stopLoading()
          setShowConfirmDialog(false)
          alert(`Failed to save changes: ${error?.message || 'Unknown error'}`)
        }
      }

    // Helper function to update shop tracking values
    const updateShopTracking = (signId: string, field: 'make' | 'order' | 'inStock', value: number) => {
        dispatch({
            type: 'UPDATE_SIGN_SHOP_TRACKING',
            payload: {
                phaseNumber: 0,
                signId,
                field,
                value
            }
        });
    };

    // Helper function to increment/decrement values
    const adjustShopValue = (signId: string, field: 'make' | 'order' | 'inStock', delta: number) => {
        const signs = getShopSigns();
        const sign = signs.find(s => s.id === signId);
        if (sign) {
            const currentValue = sign[field] || 0;
            const newValue = Math.max(0, currentValue + delta);
            updateShopTracking(signId, field, newValue);
        }
    };

    useEffect(() => {
        const fetchSignOrder = async () => {
            dispatch({ type: 'ADD_MPT_RENTAL' })
            dispatch({ type: 'ADD_MPT_PHASE' })
            try {
                startLoading();
                console.log(`Fetching sign order with ID: ${id}`)
                const response = await fetch(`/api/sign-orders/${id}`)
                const data = await response.json()

                if (!response.ok) {
                    console.error('API response not OK:', response.status, data)
                    throw new Error(
                        `Failed to fetch sign order: ${data.message || response.statusText}`
                    )
                }

                console.log('Sign order data:', data)
                if (!data.success || !data.data) {
                    console.error('Invalid API response format:', data)
                    throw new Error('Invalid API response format')
                }

                const users = await fetchReferenceData('users')

                // Add branch information based on ID ranges (temporary solution)
                const orderWithBranch = {
                    ...data.data,
                    branch: users.find(u => u.name === data.data.requestor)?.branches?.name || ''
                }

                setSignOrder(orderWithBranch)

                // Extract sign items from the signs JSON field
                if (data.data.signs) {
                    try {
                        // Convert the signs object to an array and prepare for shop tracking
                        const signItemsArray = Object.values(data.data.signs).map((s: any) => ({
                            ...s,
                            id: s.id ? s.id : generateUniqueId(),
                            bLights: s.bLights || 0
                        }));

                        const signsDataForShop = Object.values(data.data.signs).map((s: any) => ({
                            id: s.id ? s.id : generateUniqueId(),
                            make: 'make' in s ? s.make : 0,
                            inStock: 'in_stock' in s ? s.in_stock : 0,
                            order: 'order' in s ? s.order : 0
                        }));

                        console.log(signItemsArray)
                        
                        // First copy the MPT rental with regular signs
                        dispatch({
                            type: 'COPY_MPT_RENTAL', payload: {
                                ...defaultMPTObject,
                                phases: defaultMPTObject.phases.map(p => ({
                                    ...p,
                                    signs: signItemsArray
                                }))
                            }
                        });

                        // Then convert to shop signs with tracking properties
                        dispatch({
                            type: 'CONVERT_TO_SHOP_SIGNS',
                            payload: {
                                phaseNumber: 0,
                                signsData: signsDataForShop
                            }
                        });

                    } catch (error) {
                        toast.error('Error parsing signs data:' + error)
                        console.error('Error parsing signs data:', error)
                    }
                } else {
                    console.log('No signs data found in the sign order')
                }
            } catch (error) {
                toast.error('Error fetching sign order:' + error)
                console.error('Error fetching sign order:', error)
            } finally {
                stopLoading()
            }
        }

        if (id) {
            fetchSignOrder()
        }
    }, [id])

    // Handle adding new signs - ensure they have shop tracking
    const handleAddNewSign = () => {
        const defaultSign: ExtendedPrimarySign = {
            id: generateUniqueId(),
            isCustom: false,
            designation: '',
            description: '',
            width: 0,
            height: 0,
            quantity: 1,
            sheeting: 'DG',
            displayStructure: 'LOOSE',
            associatedStructure: 'none',
            stiffener: false,
            inStock: 0,
            order: 0,
            make: 0,
            bLights: 0,
            cover: false,
            substrate: 'Aluminum',
        };

        dispatch({
            type: 'ADD_MPT_SIGN', 
            payload: {
                phaseNumber: 0,
                sign: defaultSign
            }
        });
    };

    const shopSigns = getShopSigns();

    return (
        <>
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Changes</DialogTitle>
              <DialogDescription>
                {signOrder && (
                  <div className="space-y-4 mt-2">
                    <div>
                      Confirm you want to assign this order to <span>{signOrder.assigned_to}</span>
                    </div>

                    {shopSigns.length > 0 && (
                      <div className="space-y-2">
                        <p className="font-medium">And confirm the following quantities:</p>
                        <div className="max-h-60 overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2">Designation</th>
                                <th className="text-center py-2">Order</th>
                                <th className="text-center py-2">Make</th>
                              </tr>
                            </thead>
                            <tbody>
                              {shopSigns.map((item) => (
                                (item.order > 0 || item.make > 0) && (
                                  <tr key={item.id} className="border-b">
                                    <td className="py-2">{item.designation}</td>
                                    <td className="text-center py-2">{item.order || 0}</td>
                                    <td className="text-center py-2">{item.make || 0}</td>
                                  </tr>
                                )
                              ))}
                              {shopSigns.every(item => (item.order === 0 || item.order === undefined) &&
                                (item.make === 0 || item.make === undefined)) && (
                                  <tr>
                                    <td colSpan={3} className="text-center py-2 text-gray-500">
                                      No items to order or make
                                    </td>
                                  </tr>
                                )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmSaveChanges} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Yes, Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
            <SiteHeader>
                <div className='flex items-center justify-between'>
                    <h1 className='text-3xl font-bold mt-2 ml-0'>
                        Sign Shop Order Tracker
                    </h1>
                    <div className='flex gap-2'>
                        <Button
                            onClick={() => setShowConfirmDialog(true)}
                            className='bg-primary text-white hover:bg-primary/90'
                        >
                            Submit Order
                        </Button>
                        <Button variant='outline'
                        // onClick={handleExport}
                        >
                            Export
                        </Button>
                    </div>
                </div>
            </SiteHeader>
            {!isLoading && signOrder && <div className='w-full flex flex-1 flex-col'>
                <div className='@container/main flex flex-1 flex-col gap-2'>
                    <SignShopAdminInfo
                        signOrder={signOrder}
                        setSignOrder={setSignOrder}
                        id={id}
                    />
                    <div className='w-full bg-white p-8 rounded-md shadow-sm border border-gray-100 mb-8'>
                        <div className='flex justify-between items-center mb-4'>
                            <h2 className='text-xl font-semibold'>Sign order</h2>
                            <div className='flex gap-2'>
                                <Button
                                    onClick={handleAddNewSign}
                                    className='bg-primary text-white hover:bg-primary/90'
                                >
                                    <Plus className='h-4 w-4 mr-2' />
                                    Add New Sign
                                </Button>
                                <Button
                                    onClick={handleSaveChanges}
                                    className='bg-green-600 text-white hover:bg-green-700'
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                        {shopSigns.length > 0 && <div className='max-w-full flex gap-x-2 overflow-x-scroll'>
                            <div className='border rounded-md'>
                                <Table className='rounded-md overflow-hidden'>
                                    <TableHeader className='rounded-t-md'>
                                        <TableRow className='bg-gray-50 text-sm font-medium text-gray-600'>
                                            <TableHead className='border text-left'>Designation</TableHead>
                                            <TableHead className='border text-left'>In Stock</TableHead>
                                            <TableHead className='border text-left'>Order</TableHead>
                                            <TableHead className='border text-left'>Make</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {shopSigns.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className='border'>{item.designation}</TableCell>
                                                <TableCell className='border'>
                                                    <div className='flex items-center'>
                                                        <Button
                                                            type='button'
                                                            variant='outline'
                                                            className='h-8 w-8 text-xs rounded-r-none border-r-0 bg-gray-100 hover:bg-gray-200'
                                                            onClick={() => adjustShopValue(item.id, 'inStock', -1)}
                                                        >
                                                            -
                                                        </Button>
                                                        <Input
                                                            type='number'
                                                            value={item.inStock || 0}
                                                            onChange={e => {
                                                                const value = parseInt(e.target.value)
                                                                const newValue = isNaN(value) ? 0 : Math.max(0, value)
                                                                updateShopTracking(item.id, 'inStock', newValue)
                                                            }}
                                                            className='h-8 rounded-none text-center w-12 min-w-[2rem] px-0 text-xs'
                                                            min={0}
                                                        />
                                                        <Button
                                                            type='button'
                                                            variant='outline'
                                                            className='h-8 w-8 text-xs rounded-l-none border-l-0 bg-gray-100 hover:bg-gray-200'
                                                            onClick={() => adjustShopValue(item.id, 'inStock', 1)}
                                                        >
                                                            +
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell className='border p-2'>
                                                    <div className='flex items-center'>
                                                        <Button
                                                            type='button'
                                                            variant='outline'
                                                            className='h-8 w-8 text-xs rounded-r-none border-r-0 bg-gray-100 hover:bg-gray-200'
                                                            onClick={() => adjustShopValue(item.id, 'order', -1)}
                                                        >
                                                            -
                                                        </Button>
                                                        <Input
                                                            type='number'
                                                            value={item.order || 0}
                                                            onChange={e => {
                                                                const value = parseInt(e.target.value)
                                                                const newValue = isNaN(value) ? 0 : Math.max(0, value)
                                                                updateShopTracking(item.id, 'order', newValue)
                                                            }}
                                                            className='h-8 rounded-none text-center w-12 min-w-[2rem] px-0 text-xs'
                                                            min={0}
                                                        />
                                                        <Button
                                                            type='button'
                                                            variant='outline'
                                                            className='h-8 w-8 text-xs rounded-l-none border-l-0 bg-gray-100 hover:bg-gray-200'
                                                            onClick={() => adjustShopValue(item.id, 'order', 1)}
                                                        >
                                                            +
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell className='border p-2'>
                                                    <div className='flex items-center'>
                                                        <Button
                                                            type='button'
                                                            variant='outline'
                                                            className='h-8 w-8 text-xs rounded-r-none border-r-0 bg-gray-100 hover:bg-gray-200'
                                                            onClick={() => adjustShopValue(item.id, 'make', -1)}
                                                        >
                                                            -
                                                        </Button>
                                                        <Input
                                                            type='number'
                                                            value={item.make || 0}
                                                            onChange={e => {
                                                                const value = parseInt(e.target.value)
                                                                const newValue = isNaN(value) ? 0 : Math.max(0, value)
                                                                updateShopTracking(item.id, 'make', newValue)
                                                            }}
                                                            className='h-8 rounded-none text-center w-12 min-w-[2rem] px-0 text-xs'
                                                            min={0}
                                                        />
                                                        <Button
                                                            type='button'
                                                            variant='outline'
                                                            className='h-8 w-8 text-xs rounded-l-none border-l-0 bg-gray-100 hover:bg-gray-200'
                                                            onClick={() => adjustShopValue(item.id, 'make', 1)}
                                                        >
                                                            +
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <SignOrderList currentPhase={0} onlyTable={true} />
                        </div>}
                    </div>
                </div>
            </div>}
        </>
    )
}

export default SignShopContent