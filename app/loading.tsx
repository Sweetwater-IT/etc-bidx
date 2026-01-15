'use client';

import { GlobalLoading } from "@/components/global-loading";

export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <GlobalLoading />
    </div>
  );
}
