import { AppHeader } from "@/components/layout/app-header";
import { SiteFooter } from "@/components/layout/site-footer";

/** Shell for the live monitoring app: dashboard, site pages, alerts, about. */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <main id="main" className="container flex-1 py-6" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
