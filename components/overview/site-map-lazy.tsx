"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

export const SiteMapLazy = dynamic(() => import("./site-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});
