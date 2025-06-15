'use client';
import React, { createContext, useReducer, useMemo, useContext } from 'react';
import { estimateReducer } from './EstimateReducer';
import { EstimateContextType } from './EstimateReducer';
import { defaultAdminObject } from '@/types/default-objects/defaultAdminData';
import { defaultFlaggingObject } from '@/types/default-objects/defaultFlaggingObject';
import { defaultMPTObject } from '@/types/default-objects/defaultMPTObject';

const defaultBidState: EstimateContextType = {
  adminData: defaultAdminObject,
  mptRental: defaultMPTObject,
  dispatch: () => { },
  equipmentRental: [],
  flagging: defaultFlaggingObject,
  saleItems: [],
  ratesAcknowledged: false,
  notes: ''
};

const EstimateContext = createContext<EstimateContextType>(defaultBidState);

export const EstimateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(estimateReducer, defaultBidState);

  const contextValue = useMemo<EstimateContextType>(() => ({
    ...state,
    dispatch
  }), [state]);

  return (
    <EstimateContext.Provider value={contextValue}>
      {children}
    </EstimateContext.Provider>
  );
};

export const useEstimate = (): EstimateContextType => {
  const context = useContext(EstimateContext);
  if (!context) {
    throw new Error('useEstimate must be used within a EstimateProvider');
  }
  return context;
};