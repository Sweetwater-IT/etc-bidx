import { createClient } from '@supabase/supabase-js';

let supabase;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// Types for the query response structure
export interface BidMetrics {
    // Total number of bids submitted (excluding drafts)
    total_bids: number;
    // Percentage of won bids vs lost bids
    win_loss_ratio: number;
    // Total revenue from won bids (calculated from won_bid_items)
    total_revenue: number;
    // Weighted average of MPT gross margins for won bids (using cost from bid_estimates)
    mpt_gross_margin: number;
    total_won_jobs: number;
}

export interface BranchWinLossMetrics {
    branch_name: string;  // Bedford, Hatfield, or Turbotville
    won_count: number;
    lost_count: number;
    pending_count: number;
    total_count: number;
    win_ratio: number;  // won_count / total_count
}

export interface BranchJobTypeMetrics {
    branch_name: string;
    public_jobs: number;
    private_jobs: number;
    public_ratio: number;  // public_jobs / (public_jobs + private_jobs)
}

export interface BranchMPTMetrics {
    branch_name: string;
    total_gross_profit: number;
    total_mpt_jobs: number;
}

export interface BranchRevenueByBidItem {
    branch_name: string;
    mpt_revenue: number;
    sale_items_revenue: number;
    equipment_rental_revenue: number;
    permanent_signs_revenue: number;
}

export interface ProjectStartMetrics {
    month: Date;
    project_count: number;
}

export interface DivisionRevenueByMonth {
    month: Date;
    public_revenue: number;
    private_revenue: number;
}

export interface MonthlyHourMetrics {
    month: Date;
    mpt_hours: number;
    permanent_sign_hours: number;
}

export interface CustomerRevenue {
    customer: string;
    revenue: number;
    total_bids: number;
    won_bids: number;
}

export interface BranchGrossProfitMetrics {
    branch_name: string;
    total_gross_profit: number;
    mpt_gross_profit: number;
    equipment_rental_gross_profit: number;
    sale_items_gross_profit: number;
    permanent_signs_gross_profit: number;
}

export interface MPTBid {
    bid_value: number;
    gross_profit_margin: number;
    contract_number: string;
    contractor: string;
    start_date: string;
    status: 'won' | 'lost' | 'pending';
}

export interface EstimateQueryResult {
    bid_metrics: BidMetrics;
    branch_win_loss: BranchWinLossMetrics[];
    branch_job_types: BranchJobTypeMetrics[];
    branch_revenue_by_bid_item: BranchRevenueByBidItem[];
    project_starts: ProjectStartMetrics[];
    monthly_hours: MonthlyHourMetrics[];
    owner_revenue: CustomerRevenue[];
    branch_gross_profit_metrics: BranchGrossProfitMetrics[];
    mpt_bids: MPTBid[];
}

export async function getEstimateData(startDate?: string, endDate?: string): Promise<EstimateQueryResult | null> {
    if (!supabase) {
        // Mock data for testing without Supabase
        return {
            bid_metrics: {
                total_bids: 42,
                win_loss_ratio: 65.5,
                total_revenue: 1250000,
                mpt_gross_margin: 28.3,
                total_won_jobs: 27
            },
            branch_win_loss: [
                { branch_name: 'Hatfield', won_count: 10, lost_count: 5, pending_count: 2, total_count: 17, win_ratio: 58.8 },
                { branch_name: 'Turbotville', won_count: 8, lost_count: 6, pending_count: 3, total_count: 17, win_ratio: 47.1 },
                { branch_name: 'Bedford', won_count: 9, lost_count: 4, pending_count: 1, total_count: 14, win_ratio: 64.3 }
            ],
            branch_job_types: [
                { branch_name: 'Hatfield', public_jobs: 12, private_jobs: 5, public_ratio: 70.6 },
                { branch_name: 'Turbotville', public_jobs: 8, private_jobs: 9, public_ratio: 47.1 },
                { branch_name: 'Bedford', public_jobs: 10, private_jobs: 4, public_ratio: 71.4 }
            ],
            branch_revenue_by_bid_item: [
                { branch_name: 'Hatfield', mpt_revenue: 450000, sale_items_revenue: 150000, equipment_rental_revenue: 80000, permanent_signs_revenue: 120000 },
                { branch_name: 'Turbotville', mpt_revenue: 380000, sale_items_revenue: 200000, equipment_rental_revenue: 60000, permanent_signs_revenue: 90000 },
                { branch_name: 'Bedford', mpt_revenue: 420000, sale_items_revenue: 100000, equipment_rental_revenue: 70000, permanent_signs_revenue: 110000 }
            ],
            project_starts: [
                { month: new Date(2023, 0, 1), project_count: 5 },
                { month: new Date(2023, 1, 1), project_count: 7 },
                { month: new Date(2023, 2, 1), project_count: 4 }
            ],
            monthly_hours: [
                { month: new Date(2023, 0, 1), mpt_hours: 1200, permanent_sign_hours: 300 },
                { month: new Date(2023, 1, 1), mpt_hours: 1500, permanent_sign_hours: 250 },
                { month: new Date(2023, 2, 1), mpt_hours: 1100, permanent_sign_hours: 350 }
            ],
            owner_revenue: [
                { customer: 'PennDOT', revenue: 500000, total_bids: 15, won_bids: 10 },
                { customer: 'Private Client A', revenue: 300000, total_bids: 8, won_bids: 5 },
                { customer: 'Private Client B', revenue: 250000, total_bids: 6, won_bids: 4 }
            ],
            branch_gross_profit_metrics: [
                { branch_name: 'Hatfield', total_gross_profit: 350000, mpt_gross_profit: 120000, equipment_rental_gross_profit: 20000, sale_items_gross_profit: 30000, permanent_signs_gross_profit: 40000 },
                { branch_name: 'Turbotville', total_gross_profit: 280000, mpt_gross_profit: 100000, equipment_rental_gross_profit: 15000, sale_items_gross_profit: 40000, permanent_signs_gross_profit: 30000 },
                { branch_name: 'Bedford', total_gross_profit: 320000, mpt_gross_profit: 110000, equipment_rental_gross_profit: 18000, sale_items_gross_profit: 20000, permanent_signs_gross_profit: 35000 }
            ],
            mpt_bids: [
                { bid_value: 50000, gross_profit_margin: 25.5, contract_number: 'CN-123', contractor: 'PennDOT', start_date: '2023-01-15', status: 'won' },
                { bid_value: 45000, gross_profit_margin: 30.2, contract_number: 'CN-124', contractor: 'Private A', start_date: '2023-02-10', status: 'won' }
            ]
        };
    }

    try {
        // 1. First, let's get the basic bid metrics
        const bidMetrics = await getBidMetrics(startDate, endDate);

        // 2. Get branch win/loss metrics
        const branchWinLoss = await getBranchWinLossMetrics(startDate, endDate);

        // 3. Get branch job types
        const branchJobTypes = await getBranchJobTypeMetrics(startDate, endDate);

        // 4. Get branch MPT metrics
        // const branchMPTMetrics = await getBranchMPTMetrics(startDate, endDate);

        // 5. Get branch revenue by bid item
        const branchRevenueByBidItem = await getBranchRevenueByBidItem(startDate, endDate);

        // 6. Get project starts by month
        const projectStarts = await getProjectStarts(startDate, endDate);

        // 8. Get monthly hour metrics
        const monthlyHours = await getMonthlyHours(startDate, endDate);

        // 9. Get customer revenue
        const ownerRevenue = await getCustomerRevenue(startDate, endDate);

        // 10. Get branch gross profit metrics
        const branchGrossProfitMetrics = await getBranchGrossProfitMetrics(startDate, endDate);

        const mptBids = await getMPTBids(startDate, endDate);

        return {
            bid_metrics: bidMetrics,
            branch_win_loss: branchWinLoss,
            branch_job_types: branchJobTypes,
            branch_revenue_by_bid_item: branchRevenueByBidItem,
            project_starts: projectStarts,
            monthly_hours: monthlyHours,
            owner_revenue: ownerRevenue,
            branch_gross_profit_metrics: branchGrossProfitMetrics,
            mpt_bids: mptBids
        };
    } catch (err) {
        console.error('Error in getEstimateData:', err);
        return null
    }
}

// Get the top 6 card metrics
async function getBidMetrics(startDate?: string, endDate?: string): Promise<BidMetrics> {
    try {
        // 1. Total bids (excluding drafts)
        const { count: totalBids, error: totalBidsError } = await supabase
            .from('bid_estimates')
            .select('*', { count: 'exact', head: false })
            .not('status', 'eq', 'DRAFT');

        if (totalBidsError) throw totalBidsError;

        // 2. Total won jobs
        const { count: wonJobs, error: wonJobsError } = await supabase
            .from('bid_estimates')
            .select('*', { count: 'exact', head: false })
            .eq('status', 'WON');

        if (wonJobsError) throw wonJobsError;

        // 3. Calculate win/loss ratio
        const winLossRatio = totalBids ? ((wonJobs || 0) / totalBids) * 100 : 0;

        //get all items
        const { data: wonBidItems, error: wonBidItemsError } = await supabase
            .from('won_bid_items')
            .select('contract_value, quantity');

        if (wonBidItemsError) throw wonBidItemsError;

        // Simply sum contract_value * quantity for all items
        const totalRevenue = wonBidItems?.reduce((sum, item) => {
            // Ensure values are treated as numbers
            const contractValue = Number(item.contract_value) || 0;
            const quantity = Number(item.quantity) || 1;
            return sum + (contractValue * quantity);
        }, 0) || 0;

        // 5. Calculate MPT specific revenue and gross margin
        // 5a. Get all won_bid_items with MPT grouping
        const { data: wonEstimates, error: wonEstimatesError } = await supabase
            .from('bid_estimates')
            .select(`
            id,
            status
        `)
            .eq('status', 'WON');

        if (wonEstimatesError) throw wonEstimatesError;
        if (!wonEstimates || wonEstimates.length === 0) {
            return {
                total_bids: totalBids || 0,
                win_loss_ratio: winLossRatio,
                total_revenue: totalRevenue,
                mpt_gross_margin: 0,
                total_won_jobs: wonJobs || 0
            };
        }

        // Get the estimate IDs
        const estimateIds = wonEstimates.map(est => est.id);

        // Get cost data from mpt_rental_entries for these estimates
        const { data: mptRentalEntries, error: mptRentalError } = await supabase
            .from('mpt_rental_entries')
            .select(`
            id,
            cost,
            bid_estimate_id
        `)
            .in('bid_estimate_id', estimateIds);

        if (mptRentalError) throw mptRentalError;

        // Create a map of estimate ID to cost
        const estimateToCost = new Map();
        mptRentalEntries?.forEach(entry => {
            if (entry.bid_estimate_id && entry.cost) {
                estimateToCost.set(entry.bid_estimate_id, Number(entry.cost) || 0);
            }
        });

        // Get jobs for these estimates
        const { data: jobsData, error: jobsError } = await supabase
            .from('jobs')
            .select(`
            id,
            estimate_id,
            won_bid_items(
                id,
                contract_value,
                quantity,
                bid_item_id
            )
        `)
            .in('estimate_id', estimateIds);

        if (jobsError) throw jobsError;

        // Get all bid item IDs to check which ones are MPT
        const bidItemIds = new Set();
        jobsData?.forEach(job => {
            job.won_bid_items?.forEach(item => {
                if (item.bid_item_id) {
                    bidItemIds.add(item.bid_item_id);
                }
            });
        });

        // Get bid item groupings
        const { data: bidItems, error: bidItemsError } = await supabase
            .from('bid_item_numbers')
            .select(`
            id,
            grouping
        `)
            .in('id', Array.from(bidItemIds));

        if (bidItemsError) throw bidItemsError;

        // Create a map of bid item ID to grouping
        const bidItemToGrouping = new Map();
        bidItems?.forEach(item => {
            bidItemToGrouping.set(item.id, item.grouping);
        });

        // Calculate MPT revenue by estimate and the total cost
        let totalMptRevenue = 0;
        let totalMptCost = 0;

        jobsData?.forEach(job => {
            if (!job.estimate_id) return;

            // Get the cost for this estimate
            const cost = estimateToCost.get(job.estimate_id) || 0;

            // Calculate MPT revenue for this job
            let mptRevenue = 0;

            job.won_bid_items?.forEach(item => {
                // Check if this is an MPT item
                if (bidItemToGrouping.get(item.bid_item_id) === 'MPT') {
                    const contractValue = Number(item.contract_value) || 0;
                    const quantity = Number(item.quantity) || 1;
                    mptRevenue += contractValue * quantity;
                }
            });

            // If this job has MPT revenue, add the proportional cost
            if (mptRevenue > 0) {
                totalMptRevenue += mptRevenue;
                totalMptCost += cost;
            }
        });

        // Calculate the MPT gross margin
        const mptGrossMargin = totalMptRevenue > 0
            ? ((totalMptRevenue - totalMptCost) / totalMptRevenue) * 100
            : 0;

        // Return the calculated metrics
        return {
            total_bids: totalBids || 0,
            win_loss_ratio: winLossRatio,
            total_revenue: totalRevenue,
            mpt_gross_margin: mptGrossMargin,
            total_won_jobs: wonJobs || 0
        };
    } catch (err) {
        console.error('Error in getBidMetrics:', err);
        return {
            total_bids: 0,
            win_loss_ratio: 0,
            total_revenue: 0,
            mpt_gross_margin: 0,
            total_won_jobs: 0
        };
    }
}

// These would be implemented similarly to getBidMetrics above
async function getBranchWinLossMetrics(startDate?: string, endDate?: string): Promise<BranchWinLossMetrics[]> {
    try {
        // Get bid estimates with admin data
        const { data: rawData, error: rawError } = await supabase
            .from('bid_estimates')
            .select(`
                id,
                status,
                admin_data:admin_data_entries(
                    bid_estimate_id,
                    county
                )
            `)
            .not('status', 'eq', 'DRAFT');

        if (rawError) throw rawError;

        // Process the raw data to calculate branch-specific metrics
        const branchCounts: Record<string, {
            won: number;
            lost: number;
            pending: number;
            total: number;
        }> = {};

        // Initialize the three branches
        ['Hatfield', 'Turbotville', 'Bedford'].forEach(branch => {
            branchCounts[branch] = { won: 0, lost: 0, pending: 0, total: 0 };
        });

        // Count estimates by branch and status
        rawData?.forEach(estimate => {
            // Check if admin_data exists (it's an object, not an array)
            if (!estimate.admin_data) return;

            // Access the county data directly from the object
            //these seems to be a type mismatch here in supabase with what the query returns vs what the types expect
            //hence the any type
            const countyData = (estimate.admin_data as any).county;
            if (!countyData) return;

            // Parse branch from county data
            let branch = '';

            if (typeof countyData === 'string') {
                try {
                    // Try to parse if it's a JSON string
                    const parsed = JSON.parse(countyData);
                    branch = parsed.branch;
                } catch (e) {
                    // Not valid JSON, might be just a string value
                    return;
                }
            } else if (typeof countyData === 'object') {
                // If it's already an object, try to access branch property
                branch = countyData.branch;
            }

            // Skip if branch is not in our tracked branches
            if (!branch || !branchCounts[branch]) return;

            // Increment the appropriate counters
            branchCounts[branch].total++;

            if (estimate.status === 'WON') {
                branchCounts[branch].won++;
            } else if (estimate.status === 'LOST') {
                branchCounts[branch].lost++;
            } else if (estimate.status === 'PENDING') {
                branchCounts[branch].pending++;
            }
        });

        // Convert to the expected format
        return Object.entries(branchCounts).map(([branch, counts]) => ({
            branch_name: branch,
            won_count: counts.won,
            lost_count: counts.lost,
            pending_count: counts.pending,
            total_count: counts.total,
            win_ratio: counts.total ? (counts.won / counts.total) * 100 : 0
        }));
    } catch (err) {
        console.error('Error in getBranchWinLossMetrics:', err);
        return [];
    }
}

async function getBranchJobTypeMetrics(startDate?: string, endDate?: string): Promise<BranchJobTypeMetrics[]> {
    try {
        // Get won bid estimates with admin data to determine branch and division
        const { data: estimatesData, error: estimatesError } = await supabase
            .from('bid_estimates')
            .select(`
                id,
                status,
                admin_data:admin_data_entries(
                    bid_estimate_id,
                    county,
                    division
                )
            `)
            .eq('status', 'WON');

        if (estimatesError) throw estimatesError;

        // Initialize job types by branch
        const branchJobTypes: Record<string, {
            public_jobs: number;
            private_jobs: number;
        }> = {};

        // Initialize the three branches
        ['Hatfield', 'Turbotville', 'Bedford'].forEach(branch => {
            branchJobTypes[branch] = { public_jobs: 0, private_jobs: 0 };
        });

        // Count job types by branch and division
        estimatesData?.forEach(estimate => {
            // Check if admin_data exists (it's an object, not an array)
            if (!estimate.admin_data) return;

            // Access county data directly
            const countyData = (estimate.admin_data as any).county;
            if (!countyData) return;

            // Parse branch from county data
            let branch = '';

            if (typeof countyData === 'string') {
                try {
                    const parsed = JSON.parse(countyData);
                    branch = parsed.branch;
                } catch (e) {
                    return;
                }
            } else if (typeof countyData === 'object') {
                branch = countyData.branch;
            }

            if (!branch || !branchJobTypes[branch]) return;

            // Get division directly from admin_data
            const division = (estimate.admin_data as any).division;

            // Increment the appropriate counter
            if (division === 'PUBLIC') {
                branchJobTypes[branch].public_jobs++;
            } else if (division === 'PRIVATE') {
                branchJobTypes[branch].private_jobs++;
            }
        });

        // Convert to the expected format
        return Object.entries(branchJobTypes).map(([branch, counts]) => {
            const total = counts.public_jobs + counts.private_jobs;
            return {
                branch_name: branch,
                public_jobs: counts.public_jobs,
                private_jobs: counts.private_jobs,
                public_ratio: total ? (counts.public_jobs / total) * 100 : 0
            };
        });
    } catch (err) {
        console.error('Error in getBranchJobTypeMetrics:', err);
        return [];
    }
}

async function getBranchRevenueByBidItem(startDate?: string, endDate?: string): Promise<BranchRevenueByBidItem[]> {
    try {
        // Get won bid estimates with admin data to determine branch
        const { data: estimatesData, error: estimatesError } = await supabase
            .from('bid_estimates')
            .select(`
                id,
                status,
                admin_data:admin_data_entries(
                    bid_estimate_id,
                    county
                ),
                jobs(
                    id,
                    won_bid_items(
                        contract_value,
                        quantity,
                        bid_item:bid_item_numbers(
                            grouping
                        )
                    )
                )
            `)
            .eq('status', 'WON');

        if (estimatesError) throw estimatesError;

        // Initialize revenue by branch and bid item type
        const branchRevenue: Record<string, {
            mpt_revenue: number;
            sale_items_revenue: number;
            equipment_rental_revenue: number;
            permanent_signs_revenue: number;
        }> = {};

        // Initialize the three branches
        ['Hatfield', 'Turbotville', 'Bedford'].forEach(branch => {
            branchRevenue[branch] = {
                mpt_revenue: 0,
                sale_items_revenue: 0,
                equipment_rental_revenue: 0,
                permanent_signs_revenue: 0
            };
        });

        // Calculate revenue by branch and bid item type
        estimatesData?.forEach(estimate => {
            // Check if admin_data exists (it's an object, not an array)
            if (!estimate.admin_data) return;

            // Access county data directly
            const countyData = (estimate.admin_data as any).county;
            if (!countyData) return;

            // Parse branch from county data
            let branch = '';

            if (typeof countyData === 'string') {
                try {
                    const parsed = JSON.parse(countyData);
                    branch = parsed.branch;
                } catch (e) {
                    return;
                }
            } else if (typeof countyData === 'object') {
                branch = countyData.branch;
            }

            if (!branch || !branchRevenue[branch]) return;

            // Process jobs and won_bid_items
            if (!estimate.jobs || !estimate.jobs.length) return;

            estimate.jobs.forEach(job => {
                if (!job.won_bid_items || !job.won_bid_items.length) return;

                job.won_bid_items.forEach(item => {
                    // Convert values to numbers to ensure proper calculation
                    const contractValue = Number(item.contract_value) || 0;
                    const quantity = Number(item.quantity) || 1;
                    const revenue = contractValue * quantity;

                    // Make sure bid_item exists and has grouping
                    // It's now directly accessible as item.bid_item.grouping instead of item.bid_item[0].grouping
                    if (!item.bid_item || !item.bid_item.grouping) return;

                    const grouping = item.bid_item.grouping;

                    if (grouping === 'MPT') {
                        branchRevenue[branch].mpt_revenue += revenue;
                    } else if (grouping === 'EQUIPMENT_RENTAL' || grouping === 'Rental') {
                        branchRevenue[branch].equipment_rental_revenue += revenue;
                    } else if (grouping === 'PERMANENT_SIGNS' || grouping === 'Perm. Signs') {
                        branchRevenue[branch].permanent_signs_revenue += revenue;
                    } else if (grouping === 'Sale') {
                        branchRevenue[branch].sale_items_revenue += revenue;
                    }
                });
            });
        });

        // Convert to the expected format
        return Object.entries(branchRevenue).map(([branch, revenue]) => ({
            branch_name: branch,
            mpt_revenue: revenue.mpt_revenue,
            sale_items_revenue: revenue.sale_items_revenue,
            equipment_rental_revenue: revenue.equipment_rental_revenue,
            permanent_signs_revenue: revenue.permanent_signs_revenue
        }));

    } catch (err) {
        console.error('Error in getBranchRevenueByBidItem:', err);
        return [];
    }
}

async function getBranchGrossProfitMetrics(startDate?: string, endDate?: string): Promise<BranchGrossProfitMetrics[]> {
    try {
        // Get the revenue by branch and bid item
        const branchRevenueByBidItem = await getBranchRevenueByBidItem(startDate, endDate);

        // Get won bid estimates with admin data to determine branch and calculate costs
        const { data: estimatesData, error: estimatesError } = await supabase
            .from('bid_estimates')
            .select(`
                id,
                status,
                total_cost,
                total_revenue,
                total_gross_profit,
                admin_data:admin_data_entries(
                    bid_estimate_id,
                    county
                ),
                jobs(
                    id,
                    won_bid_items(
                        contract_value,
                        quantity,
                        bid_item:bid_item_numbers(
                            grouping
                        )
                    )
                )
            `)
            .eq('status', 'WON');

        if (estimatesError) throw estimatesError;

        // Initialize gross profit by branch and bid item type
        const branchGrossProfit: Record<string, {
            total_gross_profit: number;
            mpt_gross_profit: number;
            equipment_rental_gross_profit: number;
            sale_items_gross_profit: number;
            permanent_signs_gross_profit: number;
        }> = {};

        // Initialize the three branches
        ['Hatfield', 'Turbotville', 'Bedford'].forEach(branch => {
            branchGrossProfit[branch] = {
                total_gross_profit: 0,
                mpt_gross_profit: 0,
                equipment_rental_gross_profit: 0,
                sale_items_gross_profit: 0,
                permanent_signs_gross_profit: 0
            };
        });

        // Calculate gross profit by branch and bid item type
        estimatesData?.forEach(estimate => {
            // Check if admin_data exists (it's an object, not an array)
            if (!estimate.admin_data) return;

            // Access county data directly
            const countyData = (estimate.admin_data as any).county;
            if (!countyData) return;

            // Parse branch from county data
            let branch = '';

            if (typeof countyData === 'string') {
                try {
                    const parsed = JSON.parse(countyData);
                    branch = parsed.branch;
                } catch (e) {
                    return;
                }
            } else if (typeof countyData === 'object') {
                branch = countyData.branch;
            }

            if (!branch || !branchGrossProfit[branch]) return;

            // Add total gross profit
            branchGrossProfit[branch].total_gross_profit += (estimate.total_gross_profit || 0);

            // Calculate cost ratio if we have revenue and cost
            let costRatio = 0.7; // Default to 70% cost ratio
            if (estimate.total_revenue && estimate.total_cost && estimate.total_revenue > 0) {
                costRatio = estimate.total_cost / estimate.total_revenue;
            }

            // Process jobs and won_bid_items
            if (!estimate.jobs || !estimate.jobs.length) return;

            estimate.jobs.forEach(job => {
                if (!job.won_bid_items || !job.won_bid_items.length) return;

                job.won_bid_items.forEach(item => {
                    // Convert values to numbers for calculation
                    const contractValue = Number(item.contract_value) || 0;
                    const quantity = Number(item.quantity) || 1;
                    const revenue = contractValue * quantity;
                    const grossProfit = revenue * (1 - costRatio);

                    // Make sure bid_item exists and has grouping
                    // Accessing directly as item.bid_item.grouping
                    if (!item.bid_item || !item.bid_item.grouping) return;

                    const grouping = item.bid_item.grouping;

                    if (grouping === 'MPT') {
                        branchGrossProfit[branch].mpt_gross_profit += grossProfit;
                    } else if (grouping === 'EQUIPMENT_RENTAL' || grouping === 'Rental') {
                        branchGrossProfit[branch].equipment_rental_gross_profit += grossProfit;
                    } else if (grouping === 'PERMANENT_SIGNS' || grouping === 'Perm. Signs') {
                        branchGrossProfit[branch].permanent_signs_gross_profit += grossProfit;
                    } else if (grouping === 'Sale') {
                        // For sale items, assuming a 15% markup
                        branchGrossProfit[branch].sale_items_gross_profit += revenue * 0.15;
                    }
                });
            });
        });

        // Convert to the expected format and ensure we maintain branch order from revenue data
        return branchRevenueByBidItem.map(revenueItem => {
            const branchName = revenueItem.branch_name;
            const profitData = branchGrossProfit[branchName] || {
                total_gross_profit: 0,
                mpt_gross_profit: 0,
                equipment_rental_gross_profit: 0,
                sale_items_gross_profit: 0,
                permanent_signs_gross_profit: 0
            };

            return {
                branch_name: branchName,
                total_gross_profit: profitData.total_gross_profit,
                mpt_gross_profit: profitData.mpt_gross_profit,
                equipment_rental_gross_profit: profitData.equipment_rental_gross_profit,
                sale_items_gross_profit: profitData.sale_items_gross_profit,
                permanent_signs_gross_profit: profitData.permanent_signs_gross_profit
            };
        });

    } catch (err) {
        console.error('Error in getBranchGrossProfitMetrics:', err);
        return [];
    }
}

async function getProjectStarts(startDate?: string, endDate?: string): Promise<ProjectStartMetrics[]> {
    try {
        // Get won bid estimates with admin data to get start dates
        const { data: estimatesData, error: estimatesError } = await supabase
            .from('bid_estimates')
            .select(`
                id,
                status,
                admin_data:admin_data_entries(
                    bid_estimate_id,
                    start_date
                )
            `)
            .eq('status', 'WON');

        if (estimatesError) throw estimatesError;

        // Initialize project counts by month
        const projectsByMonth: Record<string, number> = {};

        // Process each estimate to extract start date
        estimatesData?.forEach(estimate => {
            // Check if admin_data exists (it's an object, not an array)
            if (!estimate.admin_data) return;

            // Access start_date directly
            const startDateStr = (estimate.admin_data as any).start_date;
            if (!startDateStr) return;

            // Format the start date to year-month format (YYYY-MM)
            const startDate = new Date(startDateStr);
            if (isNaN(startDate.getTime())) return; // Skip invalid dates

            const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;

            // Increment the count for this month
            projectsByMonth[monthKey] = (projectsByMonth[monthKey] || 0) + 1;
        });

        // Convert to the expected format and sort by date
        const result = Object.entries(projectsByMonth).map(([monthKey, count]) => {
            const [year, month] = monthKey.split('-').map(Number);
            return {
                month: new Date(year, month - 1, 1), // Create Date object for the first day of the month
                project_count: count
            };
        });

        // Sort by date (ascending)
        result.sort((a, b) => a.month.getTime() - b.month.getTime());

        return result;

    } catch (err) {
        console.error('Error in getProjectStarts:', err);
        return [];
    }
}

async function getMonthlyHours(startDate?: string, endDate?: string): Promise<MonthlyHourMetrics[]> {
    try {
        // Get won bid estimates with admin data, joining with mpt_rental_entries
        const { data: mptData, error: mptError } = await supabase
            .from('bid_estimates')
            .select(`
                id,
                status,
                admin_data:admin_data_entries(
                    bid_estimate_id,
                    start_date
                ),
                mpt_entries:mpt_rental_entries(
                    bid_estimate_id,
                    hours
                )
            `)
            .eq('status', 'WON');

        if (mptError) throw mptError;

        // Initialize hours by month for MPT
        const mptHoursByMonth: Record<string, number> = {};

        // Process each estimate to extract MPT hours and organize by month
        mptData?.forEach(estimate => {
            // Check if admin_data and mpt_entries exist
            if (!estimate.admin_data || !estimate.mpt_entries || !estimate.mpt_entries.length) return;

            // Access start_date directly
            const startDateStr = (estimate.admin_data as any).start_date;
            if (!startDateStr) return;

            // Format the start date to year-month format (YYYY-MM)
            const startDate = new Date(startDateStr);
            if (isNaN(startDate.getTime())) return; // Skip invalid dates

            const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;

            // Sum up the hours for this estimate
            const totalHours = estimate.mpt_entries.reduce((sum, entry) => sum + (entry.hours || 0), 0);

            // Add to the total for this month
            mptHoursByMonth[monthKey] = (mptHoursByMonth[monthKey] || 0) + totalHours;
        });

        // Now get permanent sign hours (we assume any job with won_bid_items with grouping 'PERMANENT_SIGNS' has hours)
        const { data: signData, error: signError } = await supabase
            .from('bid_estimates')
            .select(`
                id,
                status,
                admin_data:admin_data_entries(
                    bid_estimate_id,
                    start_date
                ),
                jobs(
                    id,
                    won_bid_items(
                        contract_value,
                        quantity,
                        bid_item:bid_item_numbers(
                            grouping
                        )
                    )
                )
            `)
            .eq('status', 'WON');

        if (signError) throw signError;

        // Initialize hours by month for permanent signs
        const signHoursByMonth: Record<string, number> = {};

        // Process each estimate to extract permanent sign hours and organize by month
        signData?.forEach(estimate => {
            // Check if admin_data and jobs exist
            if (!estimate.admin_data || !estimate.jobs || !estimate.jobs.length) return;

            // Access start_date directly
            const startDateStr = (estimate.admin_data as any).start_date;
            if (!startDateStr) return;

            // Format the start date to year-month format (YYYY-MM)
            const startDate = new Date(startDateStr);
            if (isNaN(startDate.getTime())) return; // Skip invalid dates

            const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;

            // Check if there are any permanent sign bid items
            let hasPermanentSigns = false;

            estimate.jobs.forEach(job => {
                if (!job.won_bid_items || !job.won_bid_items.length) return;

                job.won_bid_items.forEach(item => {
                    // Access grouping directly from bid_item object
                    if (!item.bid_item || !item.bid_item.grouping) return;

                    if (item.bid_item.grouping === 'PERMANENT_SIGNS' || item.bid_item.grouping === 'Perm. Signs') {
                        hasPermanentSigns = true;
                    }
                });
            });

            // If there are permanent signs, estimate 8 hours per job (you can adjust this based on your business logic)
            if (hasPermanentSigns) {
                const estimatedHours = 8; // Assuming 8 hours per permanent sign job
                signHoursByMonth[monthKey] = (signHoursByMonth[monthKey] || 0) + estimatedHours;
            }
        });

        // Combine all month keys from both MPT and permanent signs
        const allMonths = new Set([...Object.keys(mptHoursByMonth), ...Object.keys(signHoursByMonth)]);

        // Convert to the expected format and sort by date
        const result: MonthlyHourMetrics[] = Array.from(allMonths).map(monthKey => {
            const [year, month] = monthKey.split('-').map(Number);
            return {
                month: new Date(year, month - 1, 1), // Create Date object for the first day of the month
                mpt_hours: mptHoursByMonth[monthKey] || 0,
                permanent_sign_hours: signHoursByMonth[monthKey] || 0
            };
        });

        // Sort by date (ascending)
        result.sort((a, b) => a.month.getTime() - b.month.getTime());

        return result;

    } catch (err) {
        console.error('Error in getMonthlyHours:', err);
        return [];
    }
}

async function getCustomerRevenue(startDate?: string, endDate?: string): Promise<CustomerRevenue[]> {
    try {
        // Get jobs with won bid items, project metadata, and contractor info
        const { data: jobsData, error: jobsError } = await supabase
            .from('jobs')
            .select(`
                id,
                estimate:bid_estimates!inner(
                    id,
                    status
                ),
                project_data:project_metadata(
                    job_id,
                    contractor_id,
                    contractor:contractors(
                        id,
                        name
                    )
                ),
                won_bid_items(
                    contract_value,
                    quantity
                )
            `)
            .eq('estimate.status', 'WON');

        if (jobsError) throw jobsError;

        // Track revenue and job counts by contractor
        const contractorMetrics: Record<string, {
            revenue: number;
            total_bids: number;
            won_bids: number;
            name: string;
        }> = {};


        // Process each job
        jobsData?.forEach(job => {
            // Skip jobs without project data
            if (!job.project_data) return;

            // Handle project_data as an array
            const projectData = job.project_data;

            // Check if project data array exists and has elements
            if (!projectData || !Array.isArray(projectData) || projectData.length === 0) return;

            // Check if contractor info exists
            if (!projectData[0].contractor || !Array.isArray(projectData[0].contractor) || projectData[0].contractor.length === 0) return;

            // Handle contractor as an array
            const contractor = projectData[0].contractor[0];
            if (!contractor || !contractor.name) return;

            const contractorId = String(contractor.id);
            const contractorName = contractor.name;

            // Initialize contractor metrics if not present
            if (!contractorMetrics[contractorId]) {
                contractorMetrics[contractorId] = {
                    revenue: 0,
                    total_bids: 0,
                    won_bids: 1, // This is a won job by definition
                    name: contractorName
                };
            } else {
                contractorMetrics[contractorId].won_bids++;
            }

            // Calculate revenue from won bid items
            if (job.won_bid_items && job.won_bid_items.length > 0) {
                const jobRevenue = job.won_bid_items.reduce((sum, item) => {
                    // Ensure we're using numbers
                    const contractValue = Number(item.contract_value) || 0;
                    const quantity = Number(item.quantity) || 1;
                    return sum + (contractValue * quantity);
                }, 0);

                contractorMetrics[contractorId].revenue += jobRevenue;
            }

            // Increment total bids
            contractorMetrics[contractorId].total_bids++;
        });

        // Convert to array and sort by revenue (descending)
        const result = Object.values(contractorMetrics)
            .map(metrics => ({
                customer: metrics.name,
                revenue: metrics.revenue,
                total_bids: metrics.total_bids,
                won_bids: metrics.won_bids
            }))
            .sort((a, b) => b.revenue - a.revenue);

        // Return top 5 contractors by revenue
        return result.slice(0, 5);

    } catch (err) {
        console.error('Error in getCustomerRevenue:', err);
        return [];
    }
}

async function getMPTBids(startDate?: string, endDate?: string): Promise<MPTBid[]> {
    try {
        // Get MPT rental entries with bid_estimate data
        const { data: mptData, error: mptError } = await supabase
            .from('mpt_rental_entries')
            .select(`
                id,
                revenue,
                gross_profit,
                bid_estimate_id,
                bid_estimate:bid_estimates(
                    id,
                    status,
                    contract_number
                )
            `)
            .gt('revenue', 0); // Only include entries with revenue > 0

        if (mptError) throw mptError;
        console.log("Total MPT entries found:", mptData?.length || 0);

        // Process and transform the data
        const result: MPTBid[] = [];

        mptData?.forEach(entry => {
            // Skip entries without estimate data
            if (!entry.bid_estimate) return;

            // Calculate gross profit margin
            const revenue = Number(entry.revenue) || 0;
            const grossProfit = Number(entry.gross_profit) || 0;
            const grossProfitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

            // Get contract number from bid_estimate
            const contractNumber = (entry.bid_estimate as any).contract_number || '';

            // Get status from bid_estimate
            let status: 'won' | 'lost' | 'pending' = 'pending';
            const bidStatus = (entry.bid_estimate as any).status;
            if (bidStatus === 'WON') status = 'won';
            else if (bidStatus === 'LOST') status = 'lost';
            else if (bidStatus === 'PENDING') status = 'pending';

            // For now, use generic contractor info since we don't have it from the job
            const contractor = "Unknown Client";
            const startDate = "";

            result.push({
                bid_value: revenue,
                gross_profit_margin: grossProfitMargin,
                contract_number: contractNumber,
                contractor: contractor,
                start_date: startDate,
                status: status
            });
        });

        // Sort by bid value (descending)
        result.sort((a, b) => b.bid_value - a.bid_value);

        console.log("Processed MPT bids:", result.length);
        return result;

    } catch (err) {
        console.error('Error in getMPTBids:', err);
        return [];
    }
}

// RPC function to implement in Supabase (optional)
/*
CREATE OR REPLACE FUNCTION calculate_total_revenue(start_date text DEFAULT NULL, end_date text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  total_rev numeric;
  mpt_rev numeric;
  mpt_cost numeric;
  mpt_margin numeric;
BEGIN
  -- Calculate total revenue from won bid items
  SELECT COALESCE(SUM(wbi.contract_value), 0)
  INTO total_rev
  FROM won_bid_items wbi
  JOIN jobs j ON wbi.job_id = j.id
  JOIN bid_estimates be ON j.estimate_id = be.id
  LEFT JOIN admin_data_entries ad ON ad.job_id = j.id
  WHERE be.status = 'WON'
  AND (start_date IS NULL OR end_date IS NULL OR 
       ad.bid_date BETWEEN start_date::date AND end_date::date);
  
  -- Calculate MPT revenue
  SELECT 
    COALESCE(SUM(wbi.contract_value), 0),
    COALESCE(SUM(be.total_cost * (wbi.contract_value / be.total_revenue)), 0)
  INTO mpt_rev, mpt_cost
  FROM won_bid_items wbi
  JOIN bid_item_numbers bin ON wbi.bid_item_id = bin.id
  JOIN jobs j ON wbi.job_id = j.id
  JOIN bid_estimates be ON j.estimate_id = be.id
  LEFT JOIN admin_data_entries ad ON ad.job_id = j.id
  WHERE be.status = 'WON'
  AND bin.grouping = 'MPT'
  AND (start_date IS NULL OR end_date IS NULL OR 
       ad.bid_date BETWEEN start_date::date AND end_date::date);
  
  -- Calculate MPT gross margin
  IF mpt_rev > 0 THEN
    mpt_margin := ((mpt_rev - mpt_cost) / mpt_rev) * 100;
  ELSE
    mpt_margin := 0;
  END IF;
  
  RETURN json_build_object(
    'total_revenue', total_rev,
    'mpt_gross_margin', mpt_margin
  );
END;
$$;
*/
