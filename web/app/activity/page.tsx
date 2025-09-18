import { Layout } from "@/components/Layout";
import { QueueCard, SuccessSheetCard } from "@/components/ui/card";

const FEED = [
  {
    id: "a1",
    title: "Scheduled cast",
    status: "publishing" as const,
    scheduledFor: "Today · 2:45 PM",
    description: "Pushing new Base ecosystem digest update.",
  },
  {
    id: "a2",
    title: "Queued coin",
    status: "scheduled" as const,
    scheduledFor: "Tomorrow · 9:00 AM",
    description: "$KUDO launch campaign in review.",
  },
];

export default function ActivityPage() {
  return (
    <Layout>
      <div className="grid gap-6">
        <div className="space-y-2">
          <h1 className="text-display font-semibold">Activity</h1>
          <p className="text-body text-muted-foreground">
            Quick snapshot of the latest queue events, successful launches, and pending reviews.
          </p>
        </div>
        <div className="grid gap-4">
          {FEED.map((item) => (
            <QueueCard
              key={item.id}
              title={item.title}
              status={item.status}
              scheduledFor={item.scheduledFor}
              description={item.description}
            />
          ))}
          <SuccessSheetCard
            description="Your scheduled mint completed successfully. Share the highlights with your followers."
            primaryAction={{ label: "Share recap", onClick: () => {} }}
            secondaryAction={{ label: "View details", onClick: () => {} }}
          />
        </div>
      </div>
    </Layout>
  );
}
