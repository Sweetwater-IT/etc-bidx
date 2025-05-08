'use client'
import { CardActions } from '@/components/card-actions'
import { DataTable } from '@/components/data-table'
import { Toaster } from '@/components/ui/sonner';
import { fetchCustomers } from '@/lib/api-client';
import { Customer } from '@/types/Customer';
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner';

interface Column {
    key : keyof Customer,
    title: string,
    className? : string
}

const COLUMNS : Column[] = [
    { key: "name", title: "Name" },
    { key: "customerNumber", title: "Customer Number" },
    // { key: "paymentTerms", title: "Payment Terms" },
    { key: "address", title: "Address",},
    { key: "city", title: "City" },
    { key: "state", title: "State" },
    { key: "zip", title: "ZIP" },
    // { key: "displayName", title: "Display Name" },
    // { key: "url", title: "Website URL", className: 'max-w-200' },
    { key: 'created', title: 'Created'},
    { key: 'updated', title: 'Last Updated'}
];

const SEGMENTS = [
    { label: "All", value: "all" },
    { label: "1%10 NET 30", value: "1%10 NET 30" },
    { label: "COD", value: "COD" },
    { label: "CC", value: "CC" },
    { label: "NET15", value: "NET15" },
    { label: "NET30", value: "NET30" }
];

const CustomersContent = () => {

    const [data, setData] = useState<Customer[]>();

    useEffect(() => {
        const fetchData = async() => {
            try{
                const customerResponse = await fetchCustomers();
                setData(customerResponse)
            } catch(error) {
                console.error(error)
                toast.error((error as Error).message);
            }
        }
        fetchData();
    }, [])

    return (
        <div className="flex flex-col items-center justify-between">
            <div className="flex items-center justify-between px-0 -mb-3 ml-auto">
            <CardActions
                createButtonLabel="Create Customer"
                hideCalendar
                goUpActions
            />
            </div>
            {!!data && <div className='w-full mt-3'>
                <DataTable<Customer>
                    columns={COLUMNS}
                    segments={SEGMENTS}
                    stickyLastColumn
                    data={data}
                />
            </div>}
        </div>
    )
}

export default CustomersContent
