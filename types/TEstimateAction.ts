import { AdminData } from "./TAdminData";
import { EmergencyFields } from "./TAdminData";
import { CustomLightAndDrumItem, DynamicEquipmentInfo, DynamicSignInfo, EquipmentType, MPTRentalEstimating, Phase, PrimarySign, SecondarySign, SheetingType, StaticEquipmentInfo } from "./MPTEquipment";
import { SaleItem } from "./TSaleItem";
import { EquipmentRentalItem } from "./IEquipmentRentalItem";
import { Flagging } from "./TFlagging";
import { County } from "./TCounty";
// import { CustomPMSItem, PermanentSigns, PMSEquipment, PMSResetB, PMSResetF, PMSTypeB, PMSTypeF } from "./PermanentSigns";

interface AddMPTItemNotSignPayload {
	phaseNumber: number;
	equipmentType: EquipmentType;
	equipmentProperty: keyof DynamicEquipmentInfo;
	value: number;
}

type MPTSignUpdatePayload =
	| { phase: number; signId: string; key: keyof DynamicSignInfo; value: any }  // Base properties
	| { phase: number; signId: string; key: 'designation' | 'associatedStructure' | 'bLights' | 'covers' | 'description' | 'isCustom'; value: any }  // Primary-only properties
	| { phase: number; signId: string; key: 'primarySignId'; value: string };

// export type PMSEquipmentKey = keyof PMSTypeB | keyof PMSTypeF | keyof PMSResetB | keyof PMSResetF;


export type EstimateAction =
	| {
		type: "UPDATE_ADMIN_DATA";
		payload: {
			key: keyof AdminData | `emergencyFields.${keyof EmergencyFields}` | `county.${keyof County}`; //handle nested objects by requiring a keyof AdminData
			value: any;
		};
	}
	| { type: "ADD_MPT_RENTAL" }
	| { type: "ADD_MPT_PHASE" }
	| {
		type: "UPDATE_MPT_PHASE_TRIP_AND_LABOR";
		payload: { key: keyof Phase; value: number; phase: number };
	}
	| {
		type: "UPDATE_MPT_PHASE_START_END";
		payload: { key: "startDate" | "endDate"; value: Date; phase: number };
	}
	| { type: "UPDATE_PHASE_NAME"; payload: { value: string; phase: number } }
	| { type: "DELETE_MPT_PHASE"; payload: number }
	| {
		type: "UPDATE_STATIC_EQUIPMENT_INFO";
		payload: {
			type: EquipmentType | SheetingType;
			property: keyof StaticEquipmentInfo;
			value: any;
		};
	}
	| {
		type: "UPDATE_TRUCK_AND_FUEL_COSTS";
		payload: { key: "dispatchFee" | "mpgPerTruck"; value: number };
	}
	| {
		type: "UPDATE_PAYBACK_CALCULATIONS";
		payload: {
			key: "targetMOIC" | "paybackPeriod" | "annualUtilization";
			value: number;
		};
	}
	| { type: "ADD_MPT_ITEM_NOT_SIGN"; payload: AddMPTItemNotSignPayload }
	| {
		type: "ADD_LIGHT_AND_DRUM_CUSTOM_ITEM";
		payload: { phaseNumber: number; item: CustomLightAndDrumItem };
	}
	| {
		type: "UPDATE_LIGHT_AND_DRUM_CUSTOM_ITEM";
		payload: {
			phaseNumber: number;
			id: string;
			key: keyof CustomLightAndDrumItem;
			value: any;
		};
	}
	| {
		type: "ADD_MPT_SIGN";
		payload: { phaseNumber: number; sign: PrimarySign | SecondarySign };
	}
	| {
		type: "ADD_BATCH_MPT_SIGNS";
		payload: { phaseNumber: number; signs: (PrimarySign | SecondarySign)[] };
	}
	| {
		type: "RESET_MPT_PHASE_SIGNS";
		payload: number;
	}
	| {
		type: "REFRESH_MPT_PHASE_SIGNS";
		payload: { phase: number; }
	}
	| { type: "UPDATE_MPT_SIGN"; payload: MPTSignUpdatePayload }
	| { type: "DELETE_MPT_SIGN"; payload: string }
	| { type: "ADD_FLAGGING" }
	| { type: "UPDATE_FLAGGING"; payload: { key: keyof Flagging; value: any } }
	| { type: 'ADD_SERVICE_WORK' }
	| { type: 'UPDATE_SERVICE_WORK'; payload: { key: keyof Flagging; value: any } }
	| { type: "ADD_RENTAL_ITEM"; payload: EquipmentRentalItem }
	| {
		type: "UPDATE_RENTAL_ITEM";
		payload: { index: number; key: keyof EquipmentRentalItem; value: any };
	}
	| {
		type: 'DELETE_RENTAL_ITEM',
		payload: {index: number}
	}
    //comment out permanent sign related dispatches for now
	// | { type: "ADD_PERMANENT_SIGNS" }
	// | {
	// 	type: "UPDATE_STATIC_PERMANENT_SIGNS";
	// 	payload: {
	// 		key: 'typeBRemovalRatePerManHour' | 'installedPostManHours';
	// 		value: number;
	// 	};
	// }
	// | {
	// 	type: 'UPDATE_PERMANENT_SIGNS_INPUTS';
	// 	payload: {
	// 		key: 'separateMobilization' | 'trucks' | 'personnel' | 'OWtrips',
	// 		value: boolean | number
	// 	}
	// }
	// | {
	// 	type: 'UPDATE_PERMANENT_SIGNS_NAME',
	// 	payload: {
	// 		pmsType: 'pmsTypeB' | 'pmsTypeF' | 'resetTypeB' | 'resetTypeF' | 'removeTypeB' | 'removeTypeF',
	// 		value: string
	// 	}
	// }
	// | {
	//   type: 'UPDATE_PERMANENT_SIGNS_EQUIPMENT',
	//   payload: {
	// 	pmsType: 'pmsTypeB' | 'pmsTypeF' | 'resetTypeB' | 'resetTypeF' | 'removeTypeB' | 'removeTypeF', //the perm signs number
	// 	pmsEquipType: PMSEquipmentKey,// the actual equipment piece (should exclude labor and fuel and custom items )
	// 	key: keyof PMSEquipment,//name cost quantity markup
	// 	value: number 
	//   }
	// }
	// | { 
	// 	type: 'ADD_CUSTOM_PMS_ITEM',
	// 	payload: {
	// 	  pmsType: 'pmsTypeB' | 'pmsTypeF'  |'resetTypeB' | 'resetTypeF' | 'removeTypeB' | 'removeTypeF',
	// 	  item: CustomPMSItem
	// 	}
	//   }
	//   | {
	// 	type: 'UPDATE_CUSTOM_PMS_ITEM',
	// 	payload: {
	// 	  pmsType: 'pmsTypeB' | 'pmsTypeF' | 'resetTypeF' | 'removeTypeF' | 'resetTypeB' | 'removeTypeB',
	// 	  itemIndex: number,
	// 	  key: keyof CustomPMSItem,
	// 	  value: string | number
	// 	}
	//   }
	//   | {
	// 	type: 'DELETE_CUSTOM_PMS_ITEM',
	// 	payload: {
	// 	  pmsType: 'pmsTypeB' | 'pmsTypeF' | 'resetTypeF' | 'removeTypeF' | 'resetTypeB' | 'removeTypeB',
	// 	  itemIndex: number
	// 	}
	//   }
	| { type: "ADD_SALE_ITEM"; payload: SaleItem }
	| {
		type: "UPDATE_SALE_ITEM";
		payload: { oldItemNumber: string; item: SaleItem };
	}
	| { type: "DELETE_SALE_ITEM"; payload: string }
	| { type: "RESET_SALE_ITEMS" }
	| { type: "RESET_STATE" };