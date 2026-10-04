import Link from "next/link";
import { EmptyState } from "@/components/common/states";

export default function NotFound() {
  return (
    <EmptyState title="Page not found">
      <Link href="/" className="underline">
        Go to the live monitoring overview
      </Link>
    </EmptyState>
  );
}
