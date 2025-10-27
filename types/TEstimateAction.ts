import { AdminData } from "./TAdminData";
import { EmergencyFields } from "./TAdminData";
import { AssociatedStructures, CustomLightAndDrumItem, DynamicEquipmentInfo, DynamicSignInfo, EquipmentType, MPTRentalEstimating, Phase, PrimarySign, SecondarySign, SheetingType, StaticEquipmentInfo } from "./MPTEquipment";
import { SaleItem } from "./TSaleItem";
import { EquipmentRentalItem } from "./IEquipmentRentalItem";
import { Flagging } from "./TFlagging";
import { County } from "./TCounty";
import { PMSItemNumbers, AllPMSItemKeys, PMSEquipmentPiece, PMSItemKeys, PermanentSigns } from "./TPermanentSigns";
import { INote } from "./TEstimate";

interface AddMPTItemNotSignPayload {
	phaseNumber: number;
	equipmentType: EquipmentType;
	equipmentProperty: keyof DynamicEquipmentInfo;
	value: number;
}

type MPTSignUpdatePayload =
	| { phase: number; signId: string; key: keyof DynamicSignInfo; value: any }  // Base properties
	| { phase: number; signId: string; key: 'associatedStructure'; value: AssociatedStructures }  // Primary-only structure property
	| { phase: number; signId: string; key: 'bLights'; value: number }  // Primary-only number property
	| { phase: number; signId: string; key: 'cover'; value: boolean }  // Primary-only boolean property
	| { phase: number; signId: string; key: 'primarySignId'; value: string }  // Secondary-only property
	| { phase: number; signId: string; key: 'displayStructure'; value: string };  // Secondary-only property

export type EstimateAction =
	|
	{
		type: "UPDATE_MPT_PHASE_EMERGENCY_RATE";
		payload: {
			phase: number;
			equipmentKey: EquipmentType;
			value: number;
		};
	}
	| {
		type: "UPDATE_ADMIN_DATA";
		payload: {
			key:
			| keyof AdminData
			| `emergencyFields.${string}`
			| `county.${keyof County}`;
			value: any;
		};
	}
	/**MPT */
	| { type: "ADD_MPT_RENTAL" }
	| { type: "ADD_MPT_PHASE" }
	| {
		type: "UPDATE_MPT_PHASE_TRIP_AND_LABOR";
		payload: { key: keyof Phase; value: any; phase: number };
	}
	| {
		type: "UPDATE_MPT_PHASE_START_END";
		payload: { key: "startDate" | "endDate"; value: Date; phase: number };
	}
	|
	{
		type: "UPDATE_MPT_PHASE_EMERGENCY";
		payload: { value: boolean; phase: number };
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
	/**CHANNELIZER AND LIGHT AND DRUM RENTAL */
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
	/***MPT SIGNS */
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
	| { type: "DELETE_MPT_SIGN"; payload: { phaseNumber: number; signId: string } }
	/***FLAGGING + SERVICE WORK */
	| { type: "ADD_FLAGGING" }
	| { type: "UPDATE_FLAGGING"; payload: { key: keyof Flagging; value: any } }
	| { type: 'ADD_SERVICE_WORK' }
	| { type: 'UPDATE_SERVICE_WORK'; payload: { key: keyof Flagging; value: any } }
	/**RENTAL EQUIPMENT */
	| { type: "ADD_RENTAL_ITEM"; payload: EquipmentRentalItem }
	| {
		type: "UPDATE_RENTAL_ITEM";
		payload: { index: number; key: keyof EquipmentRentalItem; value: any };
	}
	| {
		type: 'DELETE_RENTAL_ITEM',
		payload: { index: number }
	}
	/****PERMANENT SIGNS */
	| { type: "ADD_PERMANENT_SIGNS" }
	| {
		type: 'ADD_PERMANENT_SIGNS_ITEM';
		payload: { newPMSItem: PMSItemNumbers }
	}
	| {
		type: 'UPDATE_PERMANENT_SIGNS_ASSUMPTIONS';
		payload: {
			key: 'maxDailyHours' | 'equipmentData' | 'productivityRates' | 'itemMarkup',
			value: number | PMSEquipmentPiece[] | Record<PMSItemKeys, number>
		}
	}
	| {
		type: 'UPDATE_PERMANENT_SIGNS_ITEM';
		payload: {
			signId: string;
			field: AllPMSItemKeys;
			value: any;
		}
	}
	| {
		type: 'DELETE_PERMANENT_SIGNS_ITEM';
		payload: {
			signId: string
		}
	}
	/****SALE ITEMS */
	| { type: "ADD_SALE_ITEM"; payload: SaleItem }
	| {
		type: "UPDATE_SALE_ITEM";
		payload: { oldItemNumber: string; item: SaleItem };
	}
	| { type: "DELETE_SALE_ITEM"; payload: string }
	| { type: "RESET_SALE_ITEMS" }
	/**GENERAL RESET */
	| { type: "RESET_STATE" }
	/**FOR COPYING FROM DATABASE, PROBABLY NEEDS TO BE REFACTORED */
	| { type: 'COPY_ADMIN_DATA', payload: AdminData }
	| { type: 'COPY_MPT_RENTAL', payload: MPTRentalEstimating }
	| { type: 'COPY_EQUIPMENT_RENTAL', payload: EquipmentRentalItem[] }
	| { type: 'COPY_FLAGGING', payload: Flagging }
	| { type: 'COPY_SERVICE_WORK', payload: Flagging }
	| { type: 'COPY_SALE_ITEMS', payload: SaleItem[] }
	| { type: 'COPY_PERMANENT_SIGNS', payload: PermanentSigns }
	| { type: 'SET_RATES_ACKNOWLEDGED', payload: boolean }
	| { type: 'UPDATE_NOTES', payload: INote[] }
	| { type: 'COPY_NOTES', payload: INote[] }
	| { type: 'SET_FIRST_SAVE', payload: number }
	| { type: 'SET_ID', payload: number }
	| {
		type: "UPDATE_SIGN_SHOP_TRACKING";
		payload: {
			phaseNumber: number;
			signId: string;
			field: 'make' | 'order' | 'inStock';
			value: number;
		};
	}
	| {
		type: "INITIALIZE_SHOP_TRACKING";
		payload: {
			phaseNumber: number;
			signId: string;
			make?: number;
			order?: number;
			inStock?: number;
		};
	}
	| {
		type: 'DELETE_SERVICE_WORK'
	}
	| {
		type: 'DELETE_FLAGGING'
	}
