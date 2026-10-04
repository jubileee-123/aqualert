import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { AlertsView } from "@/components/alerts/alerts-view";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Alerts & history" };

export default function AlertsPage() {
  return (
    <>
      <PageHeader
        title="Alerts & history"
        description="Every status change raised by the AquaLert engine, with the SMS, WhatsApp and dashboard notifications sent for it."
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <AlertsView />
      </Suspense>
    </>
  );
}
