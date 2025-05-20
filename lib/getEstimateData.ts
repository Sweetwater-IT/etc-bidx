import type { Database } from '@/types/database.types';
import { supabase } from './supabase';

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
        // Create date filter condition for admin_data_entries
        const dateFilter = startDate && endDate
            ? `and ad.bid_date between '${startDate}'::date and '${endDate}'::date`
            : '';

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

        // 4. Get total revenue from won bid items
        // This query aggregates all contract values from won_bid_items associated with jobs with won estimates
        const { data: revenueData, error: revenueError } = await supabase.rpc('calculate_total_revenue', {
            start_date: startDate,
            end_date: endDate
        });

        if (revenueError) {
            console.error('Error getting revenue, using fallback query:', revenueError);

            // Fallback raw SQL query if the RPC doesn't exist yet
            const { data: fallbackRevenueData, error: fallbackError } = await supabase
                .from('won_bid_items')
                .select(`
          contract_value,
          job:jobs(
            estimate:bid_estimates(status),
            job_id:id
          )
        `)
                .eq('job.estimate.status', 'WON');

            if (fallbackError) throw fallbackError;

            // Calculate total revenue from the fallback data
            const totalRevenue = fallbackRevenueData?.reduce((sum, item) => {
                return sum + (item.contract_value || 0);
            }, 0) || 0;

            // 5. Calculate MPT gross margin
            // For this, we'll need to get both revenue and cost data for MPT items
            const { data: mptData, error: mptError } = await supabase
                .from('bid_estimates')
                .select(`
          id,
          total_cost,
          total_gross_profit,
          jobs(
            id,
            won_bid_items(
              contract_value,
              bid_item:bid_item_numbers(
                grouping
              )
            )
          )
        `)
                .eq('status', 'WON')
                .contains('jobs.won_bid_items.bid_item.grouping', 'MPT');

            if (mptError) throw mptError;

            // Calculate MPT gross margin
            let mptRevenue = 0;
            let mptCost = 0;

            mptData?.forEach(estimate => {
                if (!estimate.jobs || !estimate.jobs.length) return;

                estimate.jobs.forEach(job => {
                    if (!job.won_bid_items || !job.won_bid_items.length) return;

                    job.won_bid_items.forEach(item => {
                        if (item.bid_item[0].grouping === 'MPT') {
                            mptRevenue += (item.contract_value || 0);

                            // Calculate proportional cost using the estimate's total cost/revenue ratio
                            if (estimate.total_cost && estimate.total_gross_profit) {
                                const totalEstimateRevenue = estimate.total_cost + estimate.total_gross_profit;
                                const costRatio = estimate.total_cost / totalEstimateRevenue;
                                mptCost += (item.contract_value || 0) * costRatio;
                            }
                        }
                    });
                });
            });

            const mptGrossMargin = mptRevenue ? ((mptRevenue - mptCost) / mptRevenue) * 100 : 0;

            return {
                total_bids: totalBids || 0,
                win_loss_ratio: winLossRatio,
                total_revenue: totalRevenue,
                mpt_gross_margin: mptGrossMargin,
                total_won_jobs: wonJobs || 0
            };
        }

        // If the RPC exists and returned data, use it
        return {
            total_bids: totalBids || 0,
            win_loss_ratio: winLossRatio,
            total_revenue: revenueData?.total_revenue || 0,
            mpt_gross_margin: revenueData?.mpt_gross_margin || 0,
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
        // Create date filter condition if needed
        const dateFilter = startDate && endDate
            ? `and bid_date between '${startDate}'::date and '${endDate}'::date`
            : '';

        // Fallback query to get branch-specific metrics from county JSONB data
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
            if (!estimate.admin_data || !estimate.admin_data.length) return;

            // Extract branch from the county JSONB data
            // The county field is JSONB, so we need to parse it
            const adminData = estimate.admin_data[0];
            if (!adminData || !adminData.county) return;

            // Access the branch property from the JSONB county object
            const countyData = adminData.county;
            let branch = '';

            if (typeof countyData === 'string') {
                try {
                    // If it's a string, try to parse it as JSON
                    const parsed = JSON.parse(countyData);
                    branch = parsed.branch;
                } catch (e) {
                    // If parsing fails, skip this record
                    return;
                }
            } else if (typeof countyData === 'object') {
                // If it's already an object, access the branch property directly
                branch = countyData.branch;
            }

            if (!branch || !branchCounts[branch]) return;

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
            if (!estimate.admin_data || !estimate.admin_data.length) return;

            const adminData = estimate.admin_data[0];
            if (!adminData || !adminData.county) return;

            // Extract branch from the county JSONB data
            const countyData = adminData.county;
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

            // Increment the appropriate counter based on division
            const division = adminData.division;
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
            if (!estimate.admin_data || !estimate.admin_data.length) return;

            // Extract branch from the county JSONB data
            const adminData = estimate.admin_data[0];
            if (!adminData || !adminData.county) return;

            // Access the branch property from the JSONB county object
            const countyData = adminData.county;
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
                    const revenue = (item.contract_value || 0) * (item.quantity || 1);
                    const grouping = item.bid_item[0].grouping;

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
            if (!estimate.admin_data || !estimate.admin_data.length) return;

            // Extract branch from the county JSONB data
            const adminData = estimate.admin_data[0];
            if (!adminData || !adminData.county) return;

            // Access the branch property from the JSONB county object
            const countyData = adminData.county;
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
                    const revenue = (item.contract_value || 0) * (item.quantity || 1);
                    const grossProfit = revenue * (1 - costRatio);
                    const grouping = item.bid_item[0].grouping;

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
            if (!estimate.admin_data || !estimate.admin_data.length) return;

            const adminData = estimate.admin_data[0];
            if (!adminData || !adminData.start_date) return;

            // Format the start date to year-month format (YYYY-MM)
            const startDate = new Date(adminData.start_date);
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
            if (!estimate.admin_data || !estimate.admin_data.length || !estimate.mpt_entries || !estimate.mpt_entries.length) return;

            const adminData = estimate.admin_data[0];
            if (!adminData || !adminData.start_date) return;

            // Format the start date to year-month format (YYYY-MM)
            const startDate = new Date(adminData.start_date);
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
            if (!estimate.admin_data || !estimate.admin_data.length || !estimate.jobs || !estimate.jobs.length) return;

            const adminData = estimate.admin_data[0];
            if (!adminData || !adminData.start_date) return;

            // Format the start date to year-month format (YYYY-MM)
            const startDate = new Date(adminData.start_date);
            if (isNaN(startDate.getTime())) return; // Skip invalid dates

            const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;

            // Check if there are any permanent sign bid items
            let hasPermanentSigns = false;

            estimate.jobs.forEach(job => {
                if (!job.won_bid_items || !job.won_bid_items.length) return;

                job.won_bid_items.forEach(item => {
                    if (item.bid_item[0].grouping === 'PERMANENT_SIGNS' || item.bid_item[0].grouping === 'Perm. Signs') {
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
        // Skip jobs without project data or contractor info
        if (!job.project_data || !job.project_data.length) return;
        const projectData = job.project_data[0];
        if (!projectData || !projectData.contractor || !projectData.contractor.length) return;
        
        const contractor = projectData.contractor[0];
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
            return sum + (item.contract_value || 0) * (item.quantity || 1);
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
      // Get MPT rental entries with related job and contractor data
      const { data: mptData, error: mptError } = await supabase
        .from('mpt_rental_entries')
        .select(`
          id,
          revenue,
          gross_profit,
          bid_estimate_id,
          job_id,
          bid_estimate:bid_estimates(
            id,
            status,
            contract_number
          ),
          job:jobs(
            id,
            project_metadata(
              contractor_id,
              contractors(
                id,
                name
              )
            ),
            admin_data_entries(
              start_date,
              contract_number
            )
          )
        `)
        .gt('revenue', 0); // Only include entries with revenue > 0
      
      if (mptError) throw mptError;
      
      // Process and transform the data
      const result: MPTBid[] = [];
      
      mptData?.forEach(entry => {
        if (!entry.bid_estimate || !entry.job) return;
        
        // Calculate gross profit margin
        const revenue = entry.revenue || 0;
        const grossProfit = entry.gross_profit || 0;
        const grossProfitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
        
        // Get contract number (either from bid_estimate or admin_data_entries)
        let contractNumber = '';
        if (entry.bid_estimate.length > 0 && entry.bid_estimate[0].contract_number) {
          contractNumber = entry.bid_estimate[0].contract_number;
        } else if (entry.job.length > 0 && entry.job[0].admin_data_entries && entry.job[0].admin_data_entries.length > 0) {
          contractNumber = entry.job[0].admin_data_entries[0].contract_number || '';
        }
        
        // Get start date
        let startDate = '';
        if (entry.job.length > 0 && entry.job[0].admin_data_entries && entry.job[0].admin_data_entries.length > 0) {
          startDate = entry.job[0].admin_data_entries[0].start_date || '';
        }
        
        // Get contractor
        let contractor = 'Unknown';
        if (entry.job.length > 0 && entry.job[0].project_metadata && entry.job[0].project_metadata.length > 0) {
          const projectData = entry.job[0].project_metadata[0];
          if (projectData.contractors && projectData.contractors.length > 0) {
            contractor = projectData.contractors[0].name || 'Unknown';
          }
        }
        
        // Get status
        let status: 'won' | 'lost' | 'pending' = 'pending';
        if (entry.bid_estimate.length > 0) {
          const bidStatus = entry.bid_estimate[0].status;
          if (bidStatus === 'WON') status = 'won';
          else if (bidStatus === 'LOST') status = 'lost';
          else if (bidStatus === 'PENDING') status = 'pending';
        }
        
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