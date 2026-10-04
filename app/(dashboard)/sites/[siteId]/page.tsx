import type { Metadata } from "next";
import { SiteDetail } from "@/components/site/site-detail";
import { SITE_CONFIGS } from "@/lib/constants/sites";

interface Props {
  params: { siteId: string };
}

export function generateMetadata({ params }: Props): Metadata {
  const site = SITE_CONFIGS.find((s) => s.siteId === params.siteId);
  return { title: site ? `${site.siteName} site` : "Site" };
}

export default function SitePage({ params }: Props) {
  return <SiteDetail siteId={params.siteId} />;
}
