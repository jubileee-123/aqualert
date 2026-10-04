import Link from "next/link";
import { API_MODE } from "@/lib/constants/config";

export function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="container flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          AquaLert community flood early-warning network, Accra. Hackathon prototype.{" "}
          {API_MODE === "mock" && <strong className="font-semibold text-foreground">Showing simulated data.</strong>}
        </p>
        <p>
          In an emergency call <strong className="text-foreground">112</strong>.{" "}
          <Link href="/about" className="underline underline-offset-2 hover:text-foreground">
            How alerts work
          </Link>
        </p>
      </div>
    </footer>
  );
}
