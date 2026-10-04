import Link from "next/link";
import { EmptyState } from "@/components/common/states";

export default function NotFound() {
  return (
    <EmptyState title="Page not found">
      <Link href="/dashboard" className="underline">
        Go to the live monitoring dashboard
      </Link>
    </EmptyState>
  );
}
