import useSWR from 'swr';
import { QuoteGridView } from '@/types/QuoteGridView';

interface FetchQuotesParams {
  page?: number;
  pageSize?: number;
  created_by?: string;
  orderBy?: string;
  ascending?: boolean;
  detailed?: boolean;
}

const fetchQuotes = async ({ page = 1, pageSize = 25, created_by = 'all', orderBy = 'created_at', ascending = false, detailed = false }: FetchQuotesParams) => {
  try {
    const params = new URLSearchParams();
    if (created_by !== 'all') {
      params.append('created_by', created_by);
    }
    params.append('page', page.toString());
    params.append('limit', pageSize.toString());
    params.append('orderBy', orderBy);
    params.append('ascending', ascending.toString());
    params.append('detailed', detailed.toString());

    const response = await fetch(`/api/quotes?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch quotes');
    }

    return {
      quotes: data.data || [],
      pagination: data.pagination || { pageCount: 0, totalCount: 0 }
    };
  } catch (error) {
    console.error('Error fetching quotes:', error);
    throw error;
  }
};

const fetchQuoteCounts = async () => {
  try {
    const response = await fetch('/api/quotes?counts=true');
    const data = await response.json();

    if (!response.ok) {
      throw new Error('Failed to fetch quote counts');
    }

    return data;
  } catch (error) {
    console.error('Error fetching quote counts:', error);
    throw error;
  }
};

export function useQuotesSWR(params: FetchQuotesParams = {}) {
  const { page = 1, pageSize = 25, created_by = 'all', orderBy = 'created_at', ascending = false, detailed = false } = params;

  const quotesKey = ['quotes', page, pageSize, created_by, orderBy, ascending, detailed];
  const countsKey = ['quote-counts'];

  const {
    data: quotesData,
    error: quotesError,
    mutate: mutateQuotes,
    isLoading: isLoadingQuotes
  } = useSWR(quotesKey, () => fetchQuotes({ page, pageSize, created_by, orderBy, ascending, detailed }), {
    revalidateOnFocus: false,
    dedupingInterval: 5000, // 5 seconds
    revalidateIfStale: true,
    revalidateOnReconnect: true,
    shouldRetryOnError: true,
    errorRetryCount: 3
  });

  const {
    data: countsData,
    error: countsError,
    mutate: mutateCounts,
    isLoading: isLoadingCounts
  } = useSWR(countsKey, fetchQuoteCounts, {
    revalidateOnFocus: false,
    dedupingInterval: 30000, // 30 seconds for counts
    revalidateIfStale: true,
    revalidateOnReconnect: true,
    shouldRetryOnError: true,
    errorRetryCount: 2
  });

  return {
    quotes: quotesData?.quotes || [],
    pagination: quotesData?.pagination || { pageCount: 0, totalCount: 0 },
    quoteCounts: countsData || {
      all: 0,
      Napoleon: 0,
      Eric: 0,
      Rad: 0,
      Ken: 0,
      Turner: 0,
      Redden: 0,
      John: 0,
    },
    isLoading: isLoadingQuotes || isLoadingCounts,
    error: quotesError || countsError,
    mutateQuotes,
    mutateCounts,
    // Combined mutate function for both quotes and counts
    mutate: async () => {
      await Promise.all([mutateQuotes(), mutateCounts()]);
    }
  };
}

// Optimistic update helpers
export async function createQuoteOptimistic(mutate: any, newQuote: QuoteGridView) {
  // Optimistically add the new quote to the cache
  await mutate(
    (currentData: any) => {
      if (!currentData) return currentData;
      return {
        ...currentData,
        quotes: [newQuote, ...currentData.quotes],
        pagination: {
          ...currentData.pagination,
          totalCount: currentData.pagination.totalCount + 1
        }
      };
    },
    false // Don't revalidate immediately
  );
}

export async function deleteQuoteOptimistic(mutate: any, quoteId: number) {
  // Optimistically remove the quote from the cache
  await mutate(
    (currentData: any) => {
      if (!currentData) return currentData;
      return {
        ...currentData,
        quotes: currentData.quotes.filter((quote: QuoteGridView) => quote.id !== quoteId),
        pagination: {
          ...currentData.pagination,
          totalCount: Math.max(0, currentData.pagination.totalCount - 1)
        }
      };
    },
    false // Don't revalidate immediately
  );
}