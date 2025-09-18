import * as React from "react";
import { WifiOff, Inbox, FileText, CalendarX } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateVariant = "noDrafts" | "noCoins" | "noScheduled" | "offline";

type BaseAction = {
  label: string;
  onClick?: () => void;
  variant?: React.ComponentProps<typeof Button>["variant"];
};

type EmptyStateProps = {
  variant: EmptyStateVariant;
  title?: string;
  description?: string;
  primaryAction?: BaseAction;
  secondaryAction?: BaseAction;
  className?: string;
};

const variantConfig: Record<EmptyStateVariant, { icon: React.ReactNode; title: string; description: string; tone: string }> = {
  noDrafts: {
    icon: <FileText className="size-6" aria-hidden="true" />,
    title: "No drafts yet",
    description: "Start a cast or Zora coin draft to see it appear here.",
    tone: "text-primary",
  },
  noCoins: {
    icon: <Inbox className="size-6" aria-hidden="true" />,
    title: "No coins created",
    description: "Launch your first coin to build momentum with your community.",
    tone: "text-accent",
  },
  noScheduled: {
    icon: <CalendarX className="size-6" aria-hidden="true" />,
    title: "Empty schedule",
    description: "Drag a draft into the calendar to queue it for later.",
    tone: "text-warning",
  },
  offline: {
    icon: <WifiOff className="size-6" aria-hidden="true" />,
    title: "Offline mode",
    description: "We'll keep your latest changes safe. Reconnect to sync to everyone else.",
    tone: "text-destructive",
  },
};

export function EmptyState({
  variant,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const config = variantConfig[variant];

  return (
    <Alert
      className={cn(
        "flex flex-col items-center gap-4 border-dashed bg-background/60 px-6 py-10 text-center shadow-none",
        className
      )}
    >
      <div
        className={cn(
          "inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground",
          config.tone
        )}
      >
        {config.icon}
        <span className="sr-only">{config.title}</span>
      </div>
      <div className="space-y-2">
        <AlertTitle className="text-title font-semibold">
          {title ?? config.title}
        </AlertTitle>
        <AlertDescription className="mx-auto max-w-md text-body text-muted-foreground">
          {description ?? config.description}
        </AlertDescription>
      </div>
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-col gap-3 sm:flex-row">
          {secondaryAction && (
            <Button
              variant={secondaryAction.variant ?? "ghost"}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
          {primaryAction && (
            <Button
              onClick={primaryAction.onClick}
              variant={primaryAction.variant ?? "primary"}
            >
              {primaryAction.label}
            </Button>
          )}
        </div>
      )}
    </Alert>
  );
}
