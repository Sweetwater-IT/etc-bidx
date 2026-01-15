import { EstimateProvider } from "@/contexts/EstimateContext";
import SignOrderContentSimple from "./SignOrderContentSimple";

export default async function CreateSignOrderPage() {    
    return (
        <EstimateProvider>
            <SignOrderContentSimple />
        </EstimateProvider>
    );
}
