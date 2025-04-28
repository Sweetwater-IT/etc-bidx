import { InputData } from "./InputData";

export interface Step {
    id: string;
    name: string;
    description: string;
    fields: InputData[]
}