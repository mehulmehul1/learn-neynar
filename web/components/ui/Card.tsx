import * as React from "react";
import {
  CheckCircle2,
  Clock,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Play,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "group/card rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm transition hover:shadow-lg focus-within:shadow-lg",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<React.ElementRef<"h3">, React.ComponentPropsWithoutRef<"h3">>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg font-semibold tracking-tight", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<React.ElementRef<"p">, React.ComponentPropsWithoutRef<"p">>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center gap-3 p-6 pt-0", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

const statusStyles: Record<QueueStatus, string> = {
  scheduled: "bg-primary/10 text-primary",
  publishing: "bg-warning/15 text-warning-foreground",
  posted: "bg-success/15 text-success",
  failed: "bg-destructive/15 text-destructive",
};

type QueueStatus = "scheduled" | "publishing" | "posted" | "failed";

type QueueMetric = {
  label: string;
  value: string;
  trend?: "up" | "down" | "neutral";
};

type QueueCardProps = {
  title: string;
  status: QueueStatus;
  scheduledFor: string;
  description?: string;
  metrics?: QueueMetric[];
  dragging?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onActivate?: () => void;
  actions?: Array<{ label: string; onSelect: () => void; danger?: boolean }>;
};

const QueueCard = React.forwardRef<HTMLDivElement, QueueCardProps>(
  (
    { title, status, scheduledFor, metrics = [], description, dragging, onMoveDown, onMoveUp, onActivate, actions },
    ref
  ) => {
    const reorderHintId = React.useId();

    return (
      <Card
        ref={ref}
        data-variant="queue"
        className={cn(
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          dragging && "border-dashed border-primary bg-primary/5"
        )}
      >
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Reorder item"
              aria-describedby={reorderHintId}
              className="mt-1 hidden rounded-full border border-border/70 text-muted-foreground sm:inline-flex"
              onClick={onActivate}
            >
              <GripVertical className="size-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-title">{title}</CardTitle>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                    statusStyles[status]
                  )}
                >
                  {status === "publishing"
                    ? "Publishing"
                    : status === "posted"
                    ? "Posted"
                    : status === "failed"
                    ? "Failed"
                    : "Scheduled"}
                </span>
              </div>
              <CardDescription className="mt-1 flex items-center gap-2 text-caption">
                <Clock className="size-3.5" aria-hidden="true" />
                <span>Queued for {scheduledFor}</span>
              </CardDescription>
              {description && <p className="mt-2 text-body text-muted-foreground">{description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 self-start">
            {(onMoveUp || onMoveDown) && (
              <div className="hidden items-center gap-1 sm:flex">
                <Button variant="ghost" size="sm" onClick={onMoveUp} aria-label="Move item up">
                  ?
                </Button>
                <Button variant="ghost" size="sm" onClick={onMoveDown} aria-label="Move item down">
                  ?
                </Button>
              </div>
            )}
            {actions && actions.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Queue item actions">
                    <MoreHorizontal className="size-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {actions.map((action) => (
                    <DropdownMenuItem
                      key={action.label}
                      onSelect={action.onSelect}
                      className={cn(action.danger && "text-destructive focus:text-destructive")}
                    >
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </CardHeader>
        <p id={reorderHintId} className="sr-only">
          Use the drag handle or move buttons to reorder this item.
        </p>
        {metrics.length > 0 && (
          <CardContent className="p-0">
            <Separator className="bg-border/60" />
            <ul className="grid gap-3 p-6 sm:grid-cols-3">
              {metrics.map((metric) => (
                <li key={metric.label} className="flex flex-col gap-1">
                  <span className="text-caption text-muted-foreground">{metric.label}</span>
                  <span className="text-title font-semibold">
                    {metric.value}
                    {metric.trend && (
                      <span
                        className={cn(
                          "ml-2 inline-flex items-center gap-1 text-xs font-semibold",
                          metric.trend === "up" && "text-success",
                          metric.trend === "down" && "text-destructive/90",
                          metric.trend === "neutral" && "text-muted-foreground"
                        )}
                      >
                        {metric.trend === "up" && <TrendingUp className="size-3" aria-hidden="true" />}
                        {metric.trend === "down" && <TrendingDown className="size-3" aria-hidden="true" />}
                        {metric.trend === "neutral" && <MoreHorizontal className="size-3" aria-hidden="true" />}
                        <span className="sr-only">trend {metric.trend}</span>
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>
    );
  }
);
QueueCard.displayName = "QueueCard";

type CoinCardProps = {
  name: string;
  symbol: string;
  price: string;
  changePct: number;
  supply: string;
  participants: string;
  onTrade?: () => void;
  onDetails?: () => void;
};

const CoinCard = React.forwardRef<HTMLDivElement, CoinCardProps>(
  ({ name, symbol, price, changePct, supply, participants, onDetails, onTrade }, ref) => {
    const changePositive = changePct >= 0;
    return (
      <Card ref={ref} data-variant="coin" className="overflow-hidden">
        <CardHeader className="gap-2">
          <CardTitle className="flex items-center justify-between text-title">
            <span>{name}</span>
            <span className="text-caption text-muted-foreground">{symbol}</span>
          </CardTitle>
          <div className="flex items-baseline gap-3">
            <span className="text-display font-semibold">{price}</span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                changePositive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
              )}
            >
              {changePositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {changePct.toFixed(2)}%
            </span>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="text-caption text-muted-foreground">Supply</span>
            <p className="text-body font-medium text-foreground">{supply}</p>
          </div>
          <div>
            <span className="text-caption text-muted-foreground">Participants</span>
            <p className="text-body font-medium text-foreground">{participants}</p>
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onDetails}>
            View Details
          </Button>
          <Button size="sm" onClick={onTrade}>
            Trade
          </Button>
        </CardFooter>
      </Card>
    );
  }
);
CoinCard.displayName = "CoinCard";

type TemplateCardProps = {
  title: string;
  description: string;
  thumbnail?: string;
  tags?: string[];
  onPreview?: () => void;
  onEdit?: () => void;
};

const TemplateCard = React.forwardRef<HTMLDivElement, TemplateCardProps>(
  ({ title, description, thumbnail, tags = [], onPreview, onEdit }, ref) => {
    return (
      <Card ref={ref} data-variant="template" className="flex h-full flex-col overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt="Template preview"
            className="aspect-[16/9] w-full object-cover"
          />
        ) : (
          <div className="aspect-[16/9] w-full bg-muted" aria-hidden="true" />
        )}
        <CardHeader className="flex-1">
          <CardTitle className="text-title">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
          {tags.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {tags.map((tag) => (
                <li key={tag} className="rounded-full bg-muted px-2 py-1">
                  #{tag}
                </li>
              ))}
            </ul>
          )}
        </CardHeader>
        <CardFooter className="justify-end gap-2">
          <Button variant="ghost" size="sm" icon={<Play className="size-4" />} onClick={onPreview}>
            Preview
          </Button>
          <Button size="sm" icon={<Pencil className="size-4" />} onClick={onEdit}>
            Edit
          </Button>
        </CardFooter>
      </Card>
    );
  }
);
TemplateCard.displayName = "TemplateCard";

type SuccessSheetCardProps = {
  title?: string;
  description?: string;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
};

const SuccessSheetCard = React.forwardRef<HTMLDivElement, SuccessSheetCardProps>(
  ({ title = "Success!", description, primaryAction, secondaryAction }, ref) => {
    return (
      <Card ref={ref} data-variant="success" className="bg-success/5 text-success-foreground">
        <CardHeader className="items-center gap-3 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success text-success-foreground">
            <CheckCircle2 className="size-8" aria-hidden="true" />
            <span className="sr-only">Success</span>
          </span>
          <CardTitle className="text-display text-success">{title}</CardTitle>
          {description && (
            <CardDescription className="max-w-md text-body text-success-foreground/90">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        {(primaryAction || secondaryAction) && (
          <CardFooter className="justify-center gap-3">
            {secondaryAction && (
              <Button variant="ghost" size="md" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )}
            {primaryAction && (
              <Button size="md" onClick={primaryAction.onClick}>
                {primaryAction.label}
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    );
  }
);
SuccessSheetCard.displayName = "SuccessSheetCard";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  QueueCard,
  CoinCard,
  TemplateCard,
  SuccessSheetCard,
};
