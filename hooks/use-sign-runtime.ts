'use client';

import type { Dispatch } from 'react';
import { useEstimate } from '@/contexts/EstimateContext';
import { useOptionalSignOrderBuilder } from '@/contexts/SignOrderBuilderContext';

export const useSignRuntime = () => {
  const signOrderBuilder = useOptionalSignOrderBuilder();
  const estimate = useEstimate();

  if (signOrderBuilder) {
    return signOrderBuilder;
  }

  return {
    mptRental: estimate.mptRental,
    dispatch: estimate.dispatch as Dispatch<any>,
  };
};
