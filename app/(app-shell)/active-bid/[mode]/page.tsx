import { SiteHeader } from "@/components/site-header";
import { Suspense } from "react";
import ActiveBidContent from "./ActiveBidContent";

export default async function ActiveBidPage({params} : {params : any}) {

  const resolvedParams = await params;
  const mode = resolvedParams.mode

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64">Loading...</div>}>
      {mode === 'view' && <SiteHeader showTitleBlock={false} />}
      <div className={`flex flex-1 flex-col ${mode === 'view' ? '' : 'md:mt-0'}`}>
        <ActiveBidContent mode={mode}/>
      </div>
    </Suspense>
  );
}
