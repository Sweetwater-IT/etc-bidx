"use client";

import { Button } from "@/components/ui/button";
import { ChevronRight, MoreHorizontalIcon, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import AddSignControl from "@/components/pages/active-bid/signs/add-sign-control";
import SignList from "@/components/pages/active-bid/signs/sign-list";
import { useEstimate } from "@/contexts/EstimateContext";
import { generateUniqueId } from "@/components/pages/active-bid/signs/generate-stable-id";
import { returnSignTotalsSquareFootage } from "@/lib/mptRentalHelperFunctions";
import { DataTable } from "@/components/data-table";
import { PrimarySign, SecondarySign } from "@/types/MPTEquipment";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DesignationSearcher from "@/components/pages/active-bid/signs/DesignationSearcher";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import SignEditingSheet from "./SignEditingSheet";

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
        key: 'displayStructure',
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
        key: 'cover',
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

    const [localSign, setLocalSign] = useState<PrimarySign | SecondarySign>();
    const [open, setOpen] = useState<boolean>(false)
    const [mode, setMode] = useState<'create' | 'edit'>('create')

    useEffect(() => {
        if (localSign && localSign.designation !== '') {
            setOpen(true)
        }
    }, [localSign?.designation])

    useEffect(() => {
        const signTotals = returnSignTotalsSquareFootage(mptRental)

        setSquareFootageTotal(signTotals.HI.totalSquareFootage + signTotals.DG.totalSquareFootage + signTotals.Special.totalSquareFootage)
    }, [mptRental])

    const handleSignAddition = () => {
        const defaultSign: PrimarySign = {
            id: generateUniqueId(),
            designation: '',
            width: 0,
            height: 0,
            sheeting: 'DG',
            quantity: 0,
            associatedStructure: "none",
            displayStructure: 'LOOSE',
            bLights: 0,
            cover: false,
            isCustom: false,
            bLightsColor: undefined,
            description: '',
            substrate: undefined
        }
        dispatch({
            type: 'ADD_MPT_SIGN', payload: {
                phaseNumber: 0,
                sign: defaultSign
            }
        })
        setLocalSign(defaultSign)
    }

    const formatColumnValue = (sign: PrimarySign | SecondarySign, column: keyof PrimarySign) => {
        const isPrimary = !Object.hasOwn(sign, 'primarySignId')

        let valueToReturn: any;

        switch (column) {
            case 'stiffener':
                if (!isPrimary) {
                    valueToReturn = '-'
                } else {
                    valueToReturn = (sign as PrimarySign).stiffener ? 'Yes' : 'No'
                }
                break;
            case 'cover':
                if (!isPrimary) {
                    valueToReturn = '-'
                } else {
                    valueToReturn = (sign as PrimarySign).cover ? sign.quantity : 0
                }
                break;
            case 'displayStructure':
                if (!isPrimary) {
                    valueToReturn = '-'
                } else {
                    valueToReturn = sign[column]
                }
                break;
            case 'bLights':
                if (!isPrimary) {
                    valueToReturn = '-'
                } else {
                    valueToReturn = sign[column]
                }
                break;
            default:
                valueToReturn = sign[column]
                break;
        }

        return valueToReturn;
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
                        {mptRental.phases[0].signs.filter(s => s.designation !== '').map(sign => (
                            <TableRow key={sign.id}>
                                {SIGN_COLUMNS.map((sc, index) => (
                                    <TableCell key={sc.key}>
                                        <div className="flex items-center">
                                            {Object.hasOwn(sign, 'primarySignId') && index === 0 && <ChevronRight className="inline h-6 text-muted-foreground" />}
                                            {sc.key === 'actions' ? (<DropdownMenu>
                                                <DropdownMenuTrigger
                                                    asChild
                                                    className="flex items-center justify-center"
                                                >
                                                    <Button variant="ghost" size="sm" className="!p-[2px]">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setLocalSign(sign)
                                                            setOpen(true)
                                                            setMode('edit')
                                                        }}
                                                    >
                                                        <Pencil className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    {Object.hasOwn(sign, 'associatedStructure') && <DropdownMenuItem
                                                        onClick={() => {
                                                            const defaultSecondary: SecondarySign = {
                                                                id: generateUniqueId(),
                                                                primarySignId: sign.id,
                                                                designation: "", // Empty designation
                                                                width: 0,
                                                                height: 0,
                                                                quantity: sign.quantity, // Only inherit quantity
                                                                sheeting: "HI", // Default sheeting
                                                                isCustom: false,
                                                                description: "",
                                                                substrate: "Aluminum",
                                                            };
                                                            dispatch({
                                                                type: 'ADD_MPT_SIGN',
                                                                payload: {
                                                                    phaseNumber: 0,
                                                                    sign: defaultSecondary
                                                                }
                                                            })
                                                            setLocalSign(defaultSecondary)
                                                            setOpen(true)
                                                            setMode('create')
                                                        }}
                                                    >
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        Add Secondary Sign
                                                    </DropdownMenuItem>}
                                                    <DropdownMenuItem onClick={() => dispatch({
                                                        type: 'DELETE_MPT_SIGN',
                                                        payload: sign.id
                                                    })}>
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>) : formatColumnValue(sign, sc.key as keyof PrimarySign)}
                                        </div>
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="space-y-4 mt-4">
                {/* Add Custom Sign Form */}
                {localSign && <DesignationSearcher localSign={localSign} setLocalSign={setLocalSign} />}
                {localSign && <SignEditingSheet open={open} onOpenChange={setOpen} mode={mode} sign={localSign} setParentLocalSign={setLocalSign} />}
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
                        Total Square Footage: {squareFootageTotal.toFixed(2)}
                    </div>
                </div>
            </div>
        </div>
    );
}