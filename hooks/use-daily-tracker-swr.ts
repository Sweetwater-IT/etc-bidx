import useSWR from 'swr';
import { DailyTrackerEntry } from '@/types/DailyTrackerEntry';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface FetchDailyTrackerParams {
  page?: number;
  pageSize?: number;
}

const fetchDailyTrackerEntries = async ({ page = 1, pageSize = 10 }: FetchDailyTrackerParams) => {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const query = supabase
      .from('daily_tracker_entries') // Assuming your table name is daily_tracker_entries
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false }); // Order by created date, latest first
      
    const response = await query.range(from, to);
      
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    const dailyTrackerEntries: DailyTrackerEntry[] = (response.data as any[]).map(entry => ({
      id: entry.id,
      created: entry.created_at,
      signDesignation: entry.sign_designation,
      dimension: entry.dimension,
      quantity: entry.quantity,
    }));
    
    return {
      dailyTrackerEntries,
      totalCount: response.count || 0
    };
  } catch (error) {
    console.error('Error fetching daily tracker entries:', error);
    throw error;
  }
};

export function useDailyTrackerSWR(params: FetchDailyTrackerParams = {}) {
  const { page = 1, pageSize = 10 } = params;
  
  const key = ['dailyTrackerEntries', page, pageSize];
  
  const { data, error, mutate, isLoading } = useSWR(
    key, 
    () => fetchDailyTrackerEntries({ page, pageSize }), 
    {
      revalidateOnFocus: false,
      dedupingInterval: 0,
      errorRetryCount: 3,
      revalidateIfStale: true,
      revalidateOnReconnect: true,
      shouldRetryOnError: true
    }
  );
  
  return {
    data: data?.dailyTrackerEntries || [],
    totalCount: data?.totalCount || 0,
    isLoading,
    error: error ? (error as Error).message : null,
    mutate
  };
}

export async function createDailyTrackerEntry(entryData: Omit<DailyTrackerEntry, 'id' | 'created'>) {
  try {
    const { data, error } = await supabase
      .from('daily_tracker_entries')
      .insert({
        sign_designation: entryData.signDesignation,
        dimension: entryData.dimension,
        quantity: entryData.quantity,
        created_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      throw error;
    }

    return data ? data[0] : null;
  } catch (error) {
    console.error('Error creating daily tracker entry:', error);
    throw error;
  }
} 