import { EstimateProvider } from "@/contexts/EstimateContext";
import BuildTakeoffContent from "./BuildTakeoffContent";

export default async function BuildTakeoffPage() {
    return (
        <EstimateProvider>
            <BuildTakeoffContent />
        </EstimateProvider>
    );
}
