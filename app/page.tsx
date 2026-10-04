import { PageHeader } from "@/components/common/page-header";
import { OverviewDashboard } from "@/components/overview/overview-dashboard";

export default function OverviewPage() {
  return (
    <>
      <PageHeader
        title="Live monitoring"
        description="Water level, rainfall and flood risk at AquaLert sensor nodes across Accra. Times are GMT (Accra local time). Data refreshes every 30 seconds."
      />
      <OverviewDashboard />
    </>
  );
}
