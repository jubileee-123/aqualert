import type { ReactNode } from "react";
import { CircleAlert, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({ title, children, icon }: { title: string; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card px-6 py-12 text-center">
      <div className="mb-3 text-muted-foreground [&_svg]:size-8">{icon ?? <Search aria-hidden="true" />}</div>
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-1 max-w-md text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-lg border border-status-warning/30 bg-status-warning-bg px-6 py-10 text-center text-status-warning">
      <CircleAlert className="size-8" aria-hidden="true" />
      <p className="font-semibold">Could not load data</p>
      <p className="text-sm">{message ?? "The AquaLert service did not respond. Check your connection and try again."}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
