import React from 'react';
import { create } from 'zustand';

interface TakeoffData {
  id: string;
  title: string;
  work_type: string;
  status: string;
  created_at: string;
  install_date: string | null;
  pickup_date: string | null;
  needed_by_date: string | null;
  work_order_number: string | null;
  job_id: string;
}

interface TakeoffState {
  data: TakeoffData | null;
  isLoading: boolean;
  error: string | null;
  fetchTakeoff: (id: string) => Promise<void>;
}

export const useTakeoffStore = create<TakeoffState>((set, get) => ({
  data: null,
  isLoading: false,
  error: null,

  fetchTakeoff: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/takeoffs/${id}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error fetching takeoff:", errorText);
        set({ error: `Failed to fetch takeoff: ${response.status}`, isLoading: false });
        return;
      }

      const data = await response.json();

      if (!data) {
        set({ data: null, isLoading: false });
        return;
      }

      set({ data, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  }
}));

export function useTakeoffFromDB(id: string | undefined) {
  const { data, isLoading, error, fetchTakeoff } = useTakeoffStore();

  // Auto-fetch when id changes
  React.useEffect(() => {
    if (id) {
      fetchTakeoff(id);
    } else {
      useTakeoffStore.setState({ data: null, isLoading: false, error: null });
    }
  }, [id, fetchTakeoff]);

  return {
    data,
    isLoading,
    error,
    refetch: () => id && fetchTakeoff(id)
  };
}