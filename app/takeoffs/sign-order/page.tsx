"use client";

import { EstimateProvider } from "@/contexts/EstimateContext";
import SignOrderContentSimple from "./SignOrderContentSimple";

export default function CreateSignOrderPage() {
    return (
        <EstimateProvider>
            <SignOrderContentSimple />
        </EstimateProvider>
    );
}
