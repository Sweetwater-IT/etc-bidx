'use client'
import React from 'react'
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DataTable } from '@/components/data-table';
import { formatDate } from '@/lib/formatUTCDate';
import { useLoading } from '@/hooks/use-loading';

type ContractData = {
    id: number;
    letting_date?: string | null;
    contract_number: string;
    contractor: string | null;
    status: string;
    county: string;
    branch: string;
    estimator?: string | null;
    created_at: string;
    source: "bid" | "job";
    job_number?: string;
};

const COLUMNS = [
    { key: "letting_date", title: "Letting Date" },
    { key: "contract_number", title: "Contract #" },
    { key: "contractor", title: "Contractor" },
    { key: "status", title: "Status" },
    { key: "county", title: "County" },
    { key: "branch", title: "Branch" },
    { key: "estimator", title: "Estimator" },
    { key: "created_at", title: "Created At" },
];

const ContractManagementTable = () => {

    const router = useRouter();
    const [contracts, setContracts] = useState<ContractData[]>([]);
    const { startLoading, stopLoading } = useLoading();
    const [currentSegment, setCurrentSegment] = useState("all");
    const [segmentCounts, setSegmentCounts] = useState<Record<string, number>>({
        all: 0,
        won: 0,
        'won-pending': 0,
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                startLoading();

                // Fetch counts first
                const countsResponse = await fetch('/api/jobs/active-jobs/contract-management?counts=true');
                const countsData = await countsResponse.json();

                if (countsData.success) {
                    setSegmentCounts({
                        all: countsData.counts.all,
                        won: countsData.counts.won,
                        'won-pending': countsData.counts.wonPending
                    });
                }

                // Fetch data for current segment
                let statusParam = '';
                if (currentSegment === 'won') {
                    statusParam = '&status=won';
                } else if (currentSegment === 'won-pending') {
                    statusParam = '&status=won-pending';
                }

                const response = await fetch(`/api/jobs/active-jobs/contract-management?page=1&limit=100${statusParam}`);
                const result = await response.json();

                if (result.success && result.data) {
                    const displayData = result.data.map((job: any) => ({
                        id: job.id,
                        letting_date: job.letting_date,
                        contract_number: job.contract_number,
                        contractor: job.contractor,
                        status: job.status,
                        county: job.county,
                        branch: job.branch,
                        estimator: job.estimator,
                        created_at: job.created_at,
                        source: 'job' as const,
                        job_number: job.job_number
                    }));
                    setContracts(displayData);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                stopLoading();
            }
        };

        fetchData();
    }, [currentSegment]);

    const handleSegmentChange = (value: string) => {
        setCurrentSegment(value);
    };

    const handleViewDetails = (item: ContractData) => {
        router.push(`/contracts/${encodeURIComponent(item.contract_number)}`);
    };

    return (
        <DataTable<ContractData>
            data={contracts}
            columns={COLUMNS}
            segments={[
                { label: `All (${segmentCounts.all})`, value: "all" },
                { label: `Won (${segmentCounts.won})`, value: "won" },
                { label: `Won - Pending (${segmentCounts['won-pending']})`, value: "won-pending" },
            ]}
            segmentValue={currentSegment}
            onSegmentChange={handleSegmentChange}
            stickyLastColumn
            onViewDetails={handleViewDetails}
        />
    )
}

export default ContractManagementTable