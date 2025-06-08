"use client";

import { Button } from "@/components/ui/button";
import { MoreHorizontalIcon, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import AddSignControl from "@/components/pages/active-bid/signs/add-sign-control";
import SignList from "@/components/pages/active-bid/signs/sign-list";
import { useEstimate } from "@/contexts/EstimateContext";
import { generateUniqueId } from "@/components/pages/active-bid/signs/generate-stable-id";
import { returnSignTotalsSquareFootage } from "@/lib/mptRentalHelperFunctions";
import { DataTable } from "@/components/data-table";
import { PrimarySign } from "@/types/MPTEquipment";
import PrimarySignItem from "@/components/pages/active-bid/signs/primary-sign-item";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const SIGN_COLUMNS = [
    {
        key: 'designation',
        title: 'Designation'
    },
    {
        key: 'description',
        title: 'Description'
    },
    {
        key: 'width',
        title: 'Width'
    },
    {
        key: 'height',
        title: 'Height'
    },
    {
        key: 'quantity',
        title: 'Quantity'
    },
    {
        key: 'sheeting',
        title: 'Sheeting'
    },
    {
        key: 'substrate',
        title: 'Substrate'
    },
    {
        key: 'associatedStructure',
        title: 'Structure'
    },
    {
        key: 'stiffener',
        title: 'Stiffener'
    },
    {
        key: 'bLights',
        title: 'B Lights'
    },
    {
        key: 'covers',
        title: 'Covers'
    },
    {
        key: 'actions',
        title: ''
    }
]


export function SignOrderList() {

    const { mptRental, dispatch } = useEstimate();

    const [squareFootageTotal, setSquareFootageTotal] = useState<number>(0)

    useEffect(() => {
        const signTotals = returnSignTotalsSquareFootage(mptRental)

        setSquareFootageTotal(signTotals.HI.totalSquareFootage + signTotals.DG.totalSquareFootage + signTotals.Special.totalSquareFootage)
    }, [mptRental])

    const handleSignAddition = () => {
        dispatch({
            type: 'ADD_MPT_SIGN', payload: {
                phaseNumber: 0,
                sign: {
                    id: generateUniqueId(),
                    designation: '',
                    width: 0,
                    height: 0,
                    sheeting: 'DG',
                    quantity: 0,
                    associatedStructure: "none",
                    bLights: 0,
                    covers: 0,
                    isCustom: false,
                    description: '',
                    substrate: 'aluminum'
                }
            }
        })
    }

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Sign List</h2>
                <Button onClick={handleSignAddition}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Sign
                </Button>
            </div>
            <div className="border rounded-md">
            <Table >
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        {SIGN_COLUMNS.map(sc => (
                            <TableHead key={sc.key}>
                                {sc.title}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {mptRental.phases[0].signs.map(sign => (
                        <TableRow key={sign.id}>
                            {SIGN_COLUMNS.map(sc => (
                                <TableCell key={sc.key}>
                                    {sc.key === 'stiffener' ? sign.stiffener ? 'Yes' : 'No' : sc.key === 'actions' ? <MoreHorizontalIcon/> : sign[sc.key]}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            </div>

            <div className="space-y-4">
                {/* Add Custom Sign Form */}
                <SignList currentPhase={0} isTakeoff={true} />
            </div>
            <div className="flex justify-start">
                <Button
                    className="mt-4 border-none p-0 !bg-transparent shadow-none"
                    variant="outline"
                    onClick={handleSignAddition}
                >
                    + Add New Sign
                </Button>
            </div>
            {/* Totals */}
            <div className="mt-6 flex justify-end space-y-1 text-sm">
                <div className="text-right">
                    <div>Total Signs: {mptRental.phases[0].signs.length}</div>
                    <div className="font-medium">
                        Total Square Footage: {squareFootageTotal}
                    </div>
                </div>
            </div>
        </div>
    );
}