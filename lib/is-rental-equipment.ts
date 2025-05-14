import { EquipmentType } from "@/types/MPTEquipment";

export function isEquipmentType(value: string): value is EquipmentType {
    return ['Truck Mounted Attenuator', 'Message Board', 'Arrow Board', 'Speed Trailer'].includes(value);
}