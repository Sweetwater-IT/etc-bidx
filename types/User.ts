import { Branches } from "./TAdminData";

export interface User {
    id?: string;
    name?: string;
    email: string;
    role: string;
    branches?: {
        name: Branches
    }
}