import { Branches } from "./TAdminData";

export interface User {
    name: string;
    email: string;
    role: string;
    id? : number;
    branches?: {
        name: Branches
    }
}