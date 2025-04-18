import { create } from "zustand";

interface LoadingState {
  requests: number;
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}

export const useLoading = create<LoadingState>((set) => ({
  requests: 0,
  isLoading: false,
  startLoading: () => set((state) => {
    const newRequests = state.requests + 1;
    return { 
      requests: newRequests,
      isLoading: newRequests > 0
    };
  }),
  stopLoading: () => set((state) => {
    const newRequests = Math.max(0, state.requests - 1);
    return { 
      requests: newRequests,
      isLoading: newRequests > 0
    };
  }),
})); 