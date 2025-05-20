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
  saleItems: []
};

const EstimateContext = createContext<EstimateContextType>(defaultBidState);

export const EstimateProvider: React.FC<{ children: React.ReactNode, initialData?: any }> = ({ children, initialData }) => {
  // Use initialData if provided, otherwise use default state
  const initialState = initialData ? {
    ...defaultBidState,
    adminData: initialData.adminData || defaultBidState.adminData,
    mptRental: initialData.mptRental || defaultBidState.mptRental,
    equipmentRental: initialData.equipmentRental || defaultBidState.equipmentRental,
    flagging: initialData.flagging || defaultBidState.flagging,
    saleItems: initialData.saleItems || defaultBidState.saleItems,
    serviceWork: initialData.serviceWork || defaultBidState.serviceWork
  } : defaultBidState;
  
  const [state, dispatch] = useReducer(estimateReducer, initialState);

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