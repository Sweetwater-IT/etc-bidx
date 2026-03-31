'use client';

import React, { createContext, useContext, useMemo, useReducer } from 'react';
import {
  defaultMPTObject,
  defaultPhaseObject,
} from '@/types/default-objects/defaultMPTObject';
import {
  DynamicEquipmentInfo,
  EquipmentType,
  ExtendedPrimarySign,
  MPTRentalEstimating,
  Phase,
  PrimarySign,
  SecondarySign,
} from '@/types/MPTEquipment';

type SignOrderBuilderAction =
  | { type: 'ADD_MPT_RENTAL' }
  | { type: 'ADD_MPT_PHASE' }
  | {
      type: 'ADD_MPT_ITEM_NOT_SIGN';
      payload: {
        phaseNumber: number;
        equipmentType: EquipmentType;
        equipmentProperty: keyof DynamicEquipmentInfo;
        value: number;
      };
    }
  | {
      type: 'ADD_MPT_SIGN';
      payload: { phaseNumber: number; sign: PrimarySign | SecondarySign };
    }
  | {
      type: 'ADD_BATCH_MPT_SIGNS';
      payload: { phaseNumber: number; signs: (PrimarySign | SecondarySign)[] };
    }
  | {
      type: 'UPDATE_MPT_SIGN';
      payload: { phase: number; signId: string; key: keyof PrimarySign; value: any };
    }
  | {
      type: 'DELETE_MPT_SIGN';
      payload: { phaseNumber: number; signId: string };
    }
  | {
      type: 'COPY_MPT_RENTAL';
      payload: MPTRentalEstimating;
    }
  | {
      type: 'UPDATE_SIGN_SHOP_TRACKING';
      payload: {
        phaseNumber: number;
        signId: string;
        field: 'make' | 'order' | 'inStock';
        value: number;
      };
    }
  | {
      type: 'INITIALIZE_SHOP_TRACKING';
      payload: {
        phaseNumber: number;
        signId: string;
        make?: number;
        order?: number;
        inStock?: number;
      };
    };

interface SignOrderBuilderContextValue {
  mptRental: MPTRentalEstimating;
  dispatch: React.Dispatch<SignOrderBuilderAction>;
}

const SignOrderBuilderContext =
  createContext<SignOrderBuilderContextValue | null>(null);

const copyMptRental = (payload: MPTRentalEstimating): MPTRentalEstimating => {
  if (!payload.phases || payload.phases.length === 0) {
    return defaultMPTObject;
  }

  const primarySignMap: Record<string, number> = {};
  payload.phases.forEach(phase => {
    phase.signs.forEach(sign => {
      if (!('primarySignId' in sign)) {
        primarySignMap[sign.id] = sign.quantity;
      }
    });
  });

  return {
    ...payload,
    equipmentCosts: defaultMPTObject.equipmentCosts,
    phases: payload.phases.map(phase => ({
      ...phase,
      startDate: phase.startDate ? new Date(phase.startDate) : null,
      endDate: phase.endDate ? new Date(phase.endDate) : null,
      signs: phase.signs.map(sign => {
        const additionalProperties: Partial<ExtendedPrimarySign> = {};
        if ('make' in sign) {
          additionalProperties.make = (sign as ExtendedPrimarySign).make;
          additionalProperties.order = (sign as ExtendedPrimarySign).order;
          additionalProperties.inStock = (sign as ExtendedPrimarySign).inStock;
        }

        if ('primarySignId' in sign) {
          return {
            ...sign,
            quantity: primarySignMap[sign.primarySignId],
            ...additionalProperties,
          };
        }

        return {
          ...sign,
          ...additionalProperties,
        };
      }),
    })),
  };
};

const signOrderBuilderReducer = (
  state: MPTRentalEstimating,
  action: SignOrderBuilderAction
): MPTRentalEstimating => {
  switch (action.type) {
    case 'ADD_MPT_RENTAL':
      return { ...defaultMPTObject };

    case 'ADD_MPT_PHASE':
      return {
        ...state,
        phases: [...state.phases, defaultPhaseObject],
      };

    case 'ADD_MPT_ITEM_NOT_SIGN': {
      const { phaseNumber, equipmentType, equipmentProperty, value } =
        action.payload;
      return {
        ...state,
        phases: state.phases.map((phase, index) =>
          index === phaseNumber
            ? {
                ...phase,
                standardEquipment: {
                  ...phase.standardEquipment,
                  [equipmentType]: {
                    ...phase.standardEquipment[equipmentType],
                    [equipmentProperty]: value,
                  },
                },
              }
            : phase
        ),
      };
    }

    case 'ADD_MPT_SIGN': {
      const { phaseNumber, sign } = action.payload;
      return {
        ...state,
        phases: state.phases.map((phase, index) =>
          index === phaseNumber
            ? {
                ...phase,
                signs: [...(phase.signs || []), sign],
              }
            : phase
        ),
      };
    }

    case 'ADD_BATCH_MPT_SIGNS': {
      const { phaseNumber, signs } = action.payload;
      return {
        ...state,
        phases: state.phases.map((phase, index) =>
          index === phaseNumber
            ? {
                ...phase,
                signs,
              }
            : phase
        ),
      };
    }

    case 'UPDATE_MPT_SIGN': {
      const { phase, signId, key, value } = action.payload;
      return {
        ...state,
        phases: state.phases.map((phaseItem, index) =>
          index === phase
            ? {
                ...phaseItem,
                signs: phaseItem.signs.map(sign =>
                  sign.id === signId ? { ...sign, [key]: value } : sign
                ),
              }
            : phaseItem
        ),
      };
    }

    case 'DELETE_MPT_SIGN': {
      const { phaseNumber, signId } = action.payload;
      return {
        ...state,
        phases: state.phases.map((phase, index) =>
          index === phaseNumber
            ? {
                ...phase,
                signs: phase.signs.filter(sign => sign.id !== signId),
              }
            : phase
        ),
      };
    }

    case 'COPY_MPT_RENTAL':
      return copyMptRental(action.payload);

    case 'UPDATE_SIGN_SHOP_TRACKING': {
      const { phaseNumber, signId, field, value } = action.payload;
      return {
        ...state,
        phases: state.phases.map((phase, index) =>
          index === phaseNumber
            ? {
                ...phase,
                signs: phase.signs.map(sign => {
                  if (sign.id !== signId) return sign;
                  const extendedSign = {
                    ...sign,
                    make: 'make' in sign ? (sign as any).make : 0,
                    order: 'order' in sign ? (sign as any).order : 0,
                    inStock: 'inStock' in sign ? (sign as any).inStock : 0,
                  };
                  return {
                    ...extendedSign,
                    [field]: value,
                  };
                }),
              }
            : phase
        ),
      };
    }

    case 'INITIALIZE_SHOP_TRACKING': {
      const { phaseNumber, signId, make = 0, order = 0, inStock = 0 } =
        action.payload;
      return {
        ...state,
        phases: state.phases.map((phase, index) =>
          index === phaseNumber
            ? {
                ...phase,
                signs: phase.signs.map(sign =>
                  sign.id === signId && !('make' in sign)
                    ? {
                        ...sign,
                        make,
                        order,
                        inStock,
                      }
                    : sign
                ),
              }
            : phase
        ),
      };
    }

    default:
      return state;
  }
};

export const SignOrderBuilderProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [mptRental, dispatch] = useReducer(
    signOrderBuilderReducer,
    defaultMPTObject
  );

  const value = useMemo(
    () => ({
      mptRental,
      dispatch,
    }),
    [mptRental]
  );

  return (
    <SignOrderBuilderContext.Provider value={value}>
      {children}
    </SignOrderBuilderContext.Provider>
  );
};

export const useSignOrderBuilder = (): SignOrderBuilderContextValue => {
  const context = useContext(SignOrderBuilderContext);
  if (!context) {
    throw new Error(
      'useSignOrderBuilder must be used within a SignOrderBuilderProvider'
    );
  }
  return context;
};

export const useOptionalSignOrderBuilder = () => {
  return useContext(SignOrderBuilderContext);
};
