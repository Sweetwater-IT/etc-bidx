'use client'
import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import { Grid } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { Contractor } from '@/app/customers/types'
import { CustomersTable } from './CustomersTable'
import { CustomerInfo } from './CustomerInfo'
import { CreateCustomerSheet } from './components/CreateCustomerSheet'

export interface CustomersWrapperRef {
    openCreateModal: () => void;
}

type CustomersWrapperProps = {
  ref?: React.RefObject<CustomersWrapperRef>;
};

export const CustomersWrapper = forwardRef<CustomersWrapperRef, CustomersWrapperProps>((props, ref) => {
    const [contractors, setContractors] = useState<Contractor[]>([])
    const [selectedContractorId, setSelectedContractorId] = useState<number | undefined>()
    const [isRefetching, setIsRefetching] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false)

    // Derive the selected contractor from the current contractors array
    const selectedContractor = React.useMemo(() => {
        return contractors.find(c => c.id === selectedContractorId)
    }, [contractors, selectedContractorId])

    useImperativeHandle(ref, () => ({
        openCreateModal: () => {
            console.log('openCreateModal called');
            setIsCreateSheetOpen(true);
        }
    }), []);

    // Modified to store ID instead of the whole object
    const handleSelectContractor = (contractor: Contractor) => {
        setSelectedContractorId(contractor.id)
    }

    const handleSubmitContractor = async (data: {
        name: string
        customerNumber: string
        url: string
        phone: string
        address: string
        city: string
        state: string
        zip: string
    }) => {
        try {
            const response = await fetch('/api/contractors/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...data,
                    customerNumber: data.customerNumber ? parseInt(data.customerNumber) : undefined
                })
            })
            
            if (response.ok) {
                notifications.show({
                    color: 'green',
                    message: 'Customer successfully created'
                })
                
                // Refresh the contractors list
                await handleRefetch()
                
                // Close the sheet
                setIsCreateSheetOpen(false)
            } else {
                const errorData = await response.json()
                notifications.show({
                    color: 'red',
                    message: `Failed to create customer: ${errorData.message || 'Unknown error'}`
                })
            }
        } catch (error) {
            notifications.show({
                color: 'red',
                message: 'An error occurred while creating the customer'
            })
        }
    }

    // Enhanced refetch function with loading indicator
    const handleRefetch = async () => {
        setIsRefetching(true)
        try {
            const response = await fetch('/api/contractors')
            if (!response.ok) {
                throw new Error('Failed to fetch contractors')
            }
            const { data } = await response.json()
            setContractors(data)
        } catch (error) {
            console.error('Error fetching contractors:', error)
            notifications.show({
                color: 'red',
                message: 'Failed to fetch contractors'
            })
        } finally {
            setIsRefetching(false)
        }
    }

    useEffect(() => {
        handleRefetch()
    }, [])

    return (
        <>
            <CreateCustomerSheet
                open={isCreateSheetOpen}
                onOpenChange={setIsCreateSheetOpen}
                onSubmit={handleSubmitContractor}
            />
            
            <Grid>
                <Grid.Col span={12}>
                    <CustomersTable
                        contractors={contractors}
                        isLoading={isLoading}
                        selectedContractor={selectedContractor}
                        handleSelectContractor={handleSelectContractor}
                    />
                </Grid.Col>
                <Grid.Col span={12}>
                    <CustomerInfo
                        refetch={handleRefetch}
                        isReloading={isLoading || isRefetching}
                        contractor={selectedContractor}
                    />
                </Grid.Col>
            </Grid>
        </>
    )
})

CustomersWrapper.displayName = 'CustomersWrapper'; 