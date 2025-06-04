import { Estimate } from "@/types/TEstimate";
import { EstimateAction } from "@/types/TEstimateAction";
import { defaultMPTObject, defaultPhaseObject } from "@/types/default-objects/defaultMPTObject";
import { defaultAdminObject } from "@/types/default-objects/defaultAdminData";
import { defaultFlaggingObject } from "@/types/default-objects/defaultFlaggingObject";
import { MPTRentalEstimating, Phase } from "@/types/MPTEquipment";
import { AdminData } from "@/types/TAdminData";
import { defaultPermanentSignsObject, defaultPMSRemoveB, defaultPMSRemoveF, defaultPMSTypeB, defaultPMSTypeF } from "@/types/default-objects/defaultPermanentSignsObject";
import { SetStateAction } from "react";

// Define the reducer's context type
export interface EstimateContextType extends Estimate {
	dispatch: React.Dispatch<EstimateAction>;
}

// Reducer Function
export const estimateReducer = (
	state: Estimate,
	action: EstimateAction
): Estimate => {
	switch (action.type) {
		case "UPDATE_ADMIN_DATA":
			if (action.payload.key.includes(".")) {
				const [parent, child] = action.payload.key.split(".");

				if (parent === 'county') {
					// Handle county nested properties
					return {
						...state,
						adminData: {
							...state.adminData,
							county: {
								...state.adminData.county,
								[child]: action.payload.value
							}
						}
					};
				} else if (parent === 'emergencyFields') {
					// Handle emergencyFields nested properties
					return {
						...state,
						adminData: {
							...state.adminData,
							emergencyFields: {
								...state.adminData.emergencyFields,
								[child]: action.payload.value,
							},
						},
					};
				}
			}

			// Handle top-level adminData updates
			return {
				...state,
				adminData: {
					...state.adminData,
					[action.payload.key]: action.payload.value,
				},
			};

		case "ADD_MPT_RENTAL":
			return {
				...state,
				mptRental: {
					...defaultMPTObject,
				},
			};

		case "ADD_MPT_PHASE":
			if (!state.mptRental) return state;
			return {
				...state,
				mptRental: {
					...state.mptRental,
					phases: [...state.mptRental.phases, defaultPhaseObject],
				},
			};

		case "DELETE_MPT_PHASE":
			if (!state.mptRental) return state;
			return {
				...state,
				mptRental: {
					...state.mptRental,
					phases: state.mptRental.phases.filter(
						(_, index) => index !== action.payload
					),
				},
			};

		case "UPDATE_MPT_PHASE_TRIP_AND_LABOR":
			if (!state.mptRental) return state;
			return {
				...state,
				mptRental: {
					...state.mptRental,
					phases: state.mptRental.phases.map((phase, index) =>
						index === action.payload.phase
							? {
								...phase,
								[action.payload.key]: action.payload.value,
							}
							: phase
					),
				},
			};

		case "UPDATE_PHASE_NAME":
			if (!state.mptRental) return state;
			return {
				...state,
				mptRental: {
					...state.mptRental,
					phases: state.mptRental.phases.map((phase, index) =>
						index === action.payload.phase
							? {
								...phase,
								name: action.payload.value,
							}
							: phase
					),
				},
			};

		case "UPDATE_MPT_PHASE_START_END":
			if (!state.mptRental) return state;
			return {
				...state,
				mptRental: {
					...state.mptRental,
					phases: state.mptRental.phases.map((phase, index) =>
						index === action.payload.phase
							? {
								...phase,
								[action.payload.key]: action.payload.value,
							}
							: phase
					),
				},
			};

		case "UPDATE_TRUCK_AND_FUEL_COSTS": {
			if (!state.mptRental) return state;
			return {
				...state,
				mptRental: {
					...state.mptRental,
					[action.payload.key]: action.payload.value,
				},
			};
		}

		case "UPDATE_PAYBACK_CALCULATIONS":
			if (!state.mptRental) return state;
			return {
				...state,
				mptRental: {
					...state.mptRental,
					[action.payload.key]: action.payload.value,
				},
			};

		case "UPDATE_STATIC_EQUIPMENT_INFO":
			if (!state.mptRental) return state;
			const { type: equipmentType, property, value } = action.payload;

			// Ensure the equipment type exists in staticEquipmentInfo
			if (!(equipmentType in state.mptRental.staticEquipmentInfo)) {
				console.warn(
					`Equipment type ${equipmentType} does not exist in staticEquipmentInfo.`
				);
				return state;
			}

			return {
				...state,
				mptRental: {
					...state.mptRental,
					staticEquipmentInfo: {
						...state.mptRental.staticEquipmentInfo,
						[equipmentType]: {
							...state.mptRental.staticEquipmentInfo[equipmentType],
							[property]: value,
						},
					},
				},
			};

		case "ADD_MPT_ITEM_NOT_SIGN":
			if (!state.mptRental) return state;
			const {
				phaseNumber,
				equipmentType: addEquipType,
				value: addValue,
				equipmentProperty,
			} = action.payload;

			return {
				...state,
				mptRental: {
					...state.mptRental,
					phases: state.mptRental.phases.map((phase, index) => {
						if (index === phaseNumber) {
							return {
								...phase,
								standardEquipment: {
									...phase.standardEquipment,
									[addEquipType]: {
										...phase.standardEquipment[addEquipType],
										[equipmentProperty]: addValue,
									},
								},
							};
						}
						return phase;
					}),
				},
			};

		case "ADD_LIGHT_AND_DRUM_CUSTOM_ITEM":
			if (!state.mptRental) return state;
			return {
				...state,
				mptRental: {
					...state.mptRental,
					phases: state.mptRental.phases.map((phase, index) => {
						if (index === action.payload.phaseNumber) {
							return {
								...phase,
								customLightAndDrumItems: [
									...phase.customLightAndDrumItems,
									action.payload.item,
								],
							};
						}
						return phase;
					}),
				},
			};

		case "UPDATE_LIGHT_AND_DRUM_CUSTOM_ITEM":
			if (!state.mptRental) return state;
			const {
				phaseNumber: updatePhase,
				id,
				key: updateKey,
				value: newValue,
			} = action.payload;

			return {
				...state,
				mptRental: {
					...state.mptRental,
					phases: state.mptRental.phases.map((phase, index) => {
						if (index === updatePhase) {
							return {
								...phase,
								customLightAndDrumItems: phase.customLightAndDrumItems.map(
									(item) =>
										item.id === id ? { ...item, [updateKey]: newValue } : item
								),
							};
						}
						return phase;
					}),
				},
			};

		case "ADD_MPT_SIGN":
			if (!state.mptRental) return state;
			const { phaseNumber: addSignPhase, sign } = action.payload;

			return {
				...state,
				mptRental: {
					...state.mptRental,
					phases: state.mptRental.phases.map((phase, index) => {
						if (index === addSignPhase) {
							return {
								...phase,
								signs: [...phase.signs, sign],
							};
						}
						return phase;
					}),
				},
			};

		case "ADD_BATCH_MPT_SIGNS":
			if (!state.mptRental) return state;
			const { phaseNumber: batchPhaseNumber, signs } = action.payload;

			return {
				...state,
				mptRental: {
					...state.mptRental,
					phases: state.mptRental.phases.map((phase, index) => {
						if (index === batchPhaseNumber) {
							return {
								...phase,
								signs: signs,
							};
						}
						return phase;
					}),
				},
			};

		case "UPDATE_MPT_SIGN":
			if (!state.mptRental) return state;

			const { phase, signId, key, value: updateValue } = action.payload;

			return {
				...state,
				mptRental: {
					...state.mptRental,
					phases: state.mptRental.phases.map((phaseItem, index) => {
						if (index === phase) {
							return {
								...phaseItem,
								signs: phaseItem.signs.map((sign) =>
									sign.id === signId ? { ...sign, [key]: updateValue } : sign
								),
							};
						}
						return phaseItem;
					}),
				},
			};

		case "RESET_MPT_PHASE_SIGNS":
			if (!state.mptRental) return state;

			return {
				...state,
				mptRental: {
					...state.mptRental,
					phases: state.mptRental.phases.map((phase, index) => {
						if (index === action.payload) {
							return {
								...phase,
								signs: [],
							};
						}
						return phase;
					}),
				},
			};

		case "REFRESH_MPT_PHASE_SIGNS":
			if (!state.mptRental) return state;

			return {
				...state,
				mptRental: {
					...state.mptRental,
					phases: state.mptRental.phases.map((phase, index) => {
						if (index === action.payload.phase) {
							return {
								...phase,
								signs: phase.signs
							};
						}
						return phase;
					}),
				},
			};

		case "DELETE_MPT_SIGN":
			if (!state.mptRental) return state;
			const signIdToDelete = action.payload;

			return {
				...state,
				mptRental: {
					...state.mptRental,
					phases: state.mptRental.phases.map((phase: Phase) => ({
						...phase,
						signs: phase.signs.filter((sign) => sign.id !== signIdToDelete),
					})),
				},
			};

		case "ADD_FLAGGING":
			return {
				...state,
				flagging: {
					...defaultFlaggingObject,
				},
			};

		case "UPDATE_FLAGGING":
			if (!state.flagging) return state;
			return {
				...state,
				flagging: {
					...state.flagging,
					[action.payload.key]: action.payload.value,
				},
			};

		case "ADD_SERVICE_WORK":
			return {
				...state,
				serviceWork: {
					...defaultFlaggingObject
				}
			};

		case "UPDATE_SERVICE_WORK":
			if (!state.serviceWork) return state;
			return {
				...state,
				serviceWork: {
					...state.serviceWork,
					[action.payload.key]: action.payload.value
				}
			}

		case "ADD_RENTAL_ITEM":
			if (!state.equipmentRental) {
				return {
					...state,
					equipmentRental: [action.payload],
				};
			} else
				return {
					...state,
					equipmentRental: [...state.equipmentRental, action.payload],
				};

		case "UPDATE_RENTAL_ITEM":
			if (!state.equipmentRental) return state;
			else
				return {
					...state,
					equipmentRental: state.equipmentRental.map((item, index) => {
						if (index === action.payload.index) {
							return {
								...item,
								[action.payload.key]: action.payload.value,
							};
						}
						return item;
					}),
				};

		case "DELETE_RENTAL_ITEM":
			if (!state.equipmentRental) return state;
			else return {
				...state,
				equipmentRental: state.equipmentRental.filter((item, index) => index !== action.payload.index)
			}

		case "ADD_PERMANENT_SIGNS":
			return {
				...state,
				permanentSigns: defaultPermanentSignsObject,
			};

		case "UPDATE_PERMANENT_SIGNS_INPUTS":
			if (!state.permanentSigns) return state;

			const { key: permSignsKey, value: permSignsValue } = action.payload
			return {
				...state,
				permanentSigns: {
					...state.permanentSigns,
					[permSignsKey]: permSignsValue
				}
			}

		case "UPDATE_STATIC_PERMANENT_SIGNS":
			if (!state.permanentSigns) return state;
			const { key: permSignsStatic, value: permSignsStaticValue } = action.payload;
			return {
				...state,
				permanentSigns: {
					...state.permanentSigns,
					[permSignsStatic]: permSignsStaticValue
				},
			};

		case "UPDATE_PERMANENT_SIGNS_NAME":
			if (!state.permanentSigns) return state;
			const { pmsType: pmsNameUpdate, value: newName } = action.payload;

			const foundPmsName = state.permanentSigns[pmsNameUpdate]
			return {
				...state,
				permanentSigns: {
					...state.permanentSigns,
					[pmsNameUpdate]: {
						...foundPmsName,
						name: newName
					}
				}
			}

		// case "UPDATE_PERMANENT_SIGNS_EQUIPMENT":
		// 	if (!state.permanentSigns) return state;
		// 	//e.g. pmsTypeB, 'flatSheetAlumSigns', quantity, 12
		// 	const { pmsType, pmsEquipType, key: permSignKey, value: permSignValue } = action.payload;

		// 	const foundPms = state.permanentSigns[pmsType] as Record<string, any>;
		// 	const foundEquip = foundPms[pmsEquipType as string];
		// 	// Make a deep copy of the state to safely modify
		// 	return {
		// 		//everything about the state but permanent signs
		// 		...state,
		// 		permanentSigns: {
		// 			//everything about the permanent signs but the particular post type
		// 			...state.permanentSigns,
		// 			[pmsType]: {
		// 				//everything about the particular post type except for the individual equipment piece
		// 				...foundPms,
		// 				[pmsEquipType]: {
		// 					//everyting about the individual equipment piece except the quantity
		// 					...foundEquip,
		// 					[permSignKey]: permSignValue
		// 				}
		// 			}
		// 		}
		// 	}

		case "ADD_PERMANENT_SIGNS_ITEM":
			if (!state.permanentSigns) return state;
			const { key: keyToBeAdded, id: newPMSId } = action.payload
			let defaultObjectToBeAdded: any;
			switch (keyToBeAdded) {
				case 'pmsTypeB':
					defaultObjectToBeAdded = {
						...defaultPMSTypeB,
						id: newPMSId
					}
					break;
				case 'pmsTypeF':
					defaultObjectToBeAdded = {
						...defaultPMSTypeF,
						id: newPMSId
					}
					break;
				case 'resetTypeB':
					defaultObjectToBeAdded = {
						...defaultPMSRemoveB,
						name: '0941-0001',
						id: newPMSId
						// permSignBolts
					}
					break;
				case 'resetTypeF': 
					defaultObjectToBeAdded = {
						...defaultPMSRemoveF,
						name: '0945-0001',
						id: newPMSId
						// permSignBolts
					}
					break;
				case 'removeTypeB': 
					defaultObjectToBeAdded = {
						...defaultPMSRemoveB,
						id: newPMSId
					}
					break;
				case 'removeTypeF':
					defaultObjectToBeAdded = {
						...defaultPMSRemoveF,
						id: newPMSId
					}
					break;
				default: 
					defaultObjectToBeAdded = undefined;
				}
			if(!defaultObjectToBeAdded) return state;
			else return {
				...state,
				permanentSigns: {
					...state.permanentSigns,
					signItems: [...state.permanentSigns.signItems, defaultObjectToBeAdded]
				}
			}
			case "UPDATE_PERMANENT_SIGNS_ITEM":
				if (!state.permanentSigns) return state;
				const { signId : permanentSignIdToUpdate, field, value: fieldValue } = action.payload;
				
				return {
					...state,
					permanentSigns: {
						...state.permanentSigns,
						signItems: state.permanentSigns.signItems.map(pmsItem => {
							if(pmsItem.id !== permanentSignIdToUpdate) return pmsItem;
							return {
								...pmsItem,
								[field] : fieldValue
							}
						})
					}
				};
			
			case "DELETE_PERMANENT_SIGNS_ITEM":
				if (!state.permanentSigns) return state;
				const { signId : permanentSignIdToDelete } = action.payload;
				
				return {
					...state,
					permanentSigns: {
						...state.permanentSigns,
						signItems: state.permanentSigns.signItems.filter(pmsItem => pmsItem.id !== permanentSignIdToDelete)
					}
				};

		//COMING BACK TO THIS BECAUSE WILL LIKELY HAVE TO CHANGE HOW CUTSOM ITEMS ARE ADDED TO PERM SIGNS
		// case "ADD_CUSTOM_PMS_ITEM":
		// 	if (!state.permanentSigns) return state;
		// 	const { pmsType: customPmsType, item } = action.payload;

		// 	return {
		// 		...state,
		// 		permanentSigns: {
		// 			...state.permanentSigns,
		// 			[customPmsType]: {
		// 				...state.permanentSigns[customPmsType],
		// 				customItems: [
		// 					...state.permanentSigns[customPmsType].customItems,
		// 					item
		// 				]
		// 			}
		// 		}
		// 	};

		// case "UPDATE_CUSTOM_PMS_ITEM":
		// 	if (!state.permanentSigns) return state;
		// 	const { pmsType: updatePmsType, itemIndex, key: itemKey, value: itemValue } = action.payload;

		// 	return {
		// 		...state,
		// 		permanentSigns: {
		// 			...state.permanentSigns,
		// 			[updatePmsType]: {
		// 				...state.permanentSigns[updatePmsType],
		// 				customItems: state.permanentSigns[updatePmsType]?.customItems.map(
		// 					(item, index) => index === itemIndex
		// 						? { ...item, [itemKey]: itemValue }
		// 						: item
		// 				)
		// 			}
		// 		}
		// 	};

		// case "DELETE_CUSTOM_PMS_ITEM":
		// 	if (!state.permanentSigns) return state;
		// 	const { pmsType: deletePmsType, itemIndex: deleteIndex } = action.payload;

		// 	return {
		// 		...state,
		// 		permanentSigns: {
		// 			...state.permanentSigns,
		// 			[deletePmsType]: {
		// 				...state.permanentSigns[deletePmsType],
		// 				customItems: state.permanentSigns[deletePmsType].customItems.filter(
		// 					(_, index) => index !== deleteIndex
		// 				)
		// 			}
		// 		}
		// 	};

		case "ADD_SALE_ITEM":
			return {
				...state,
				saleItems: [...state.saleItems, action.payload],
			};

		case "UPDATE_SALE_ITEM":
			return {
				...state,
				saleItems: state.saleItems.map((item) => {
					if (item.itemNumber == action.payload.oldItemNumber) {
						return action.payload.item;
					}
					return item;
				}),
			};

		case "DELETE_SALE_ITEM":
			return {
				...state,
				saleItems: state.saleItems.filter(
					(item) => item.itemNumber !== action.payload
				),
			};

		case "RESET_SALE_ITEMS":
			return {
				...state,
				saleItems: [],
			};

		case "RESET_STATE":
			return {
				adminData: defaultAdminObject,
				saleItems: [],
				mptRental: defaultMPTObject,
				flagging: defaultFlaggingObject,
				equipmentRental: [],
				ratesAcknowledged: false
				// permanentSigns: defaultPermanentSignsObject, 
			};

		case "COPY_ADMIN_DATA":
			//transform strings from db into date objects for frontend
			const transformedAdminData: AdminData = {
				...action.payload,
				startDate: action.payload.startDate ? new Date(action.payload.startDate) : null,
				endDate: action.payload.endDate ? new Date(action.payload.endDate) : null,
				lettingDate: action.payload.lettingDate ? new Date(action.payload.lettingDate) : null,
				winterStart: action.payload.winterStart ? new Date(action.payload.winterStart) : undefined,
				winterEnd: action.payload.winterEnd ? new Date(action.payload.winterEnd) : undefined
			}

			return {
				...state,
				adminData: transformedAdminData
			};

		case "COPY_MPT_RENTAL":
			const transformedMPTData: MPTRentalEstimating = {
				...action.payload,
				phases: action.payload.phases.map(p => ({
					...p,
					startDate: p.startDate ? new Date(p.startDate) : null,
					endDate: p.endDate ? new Date(p.endDate) : null,
					signs: p.signs
				}))
			}

			return {
				...state,
				mptRental: transformedMPTData
			};

		case 'COPY_EQUIPMENT_RENTAL':
			return {
				...state,
				equipmentRental: action.payload
			};

		case 'COPY_FLAGGING':
			return {
				...state,
				flagging: action.payload
			};

		case 'COPY_SERVICE_WORK':
			return {
				...state,
				flagging: action.payload
			};

		case 'COPY_SALE_ITEMS':
			return {
				...state,
				saleItems: action.payload
			}
		
		case 'SET_RATES_ACKNOWLEDGED':
			return {
				...state,
				ratesAcknowledged: action.payload
			}

		default:
			return state;
	}
};