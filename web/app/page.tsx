import Link from "next/link";

import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { CoinCard, QueueCard, TemplateCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";

const QUEUE_ITEMS = [
  {
    id: "q1",
    title: "Morning alpha drop",
    status: "scheduled" as const,
    scheduledFor: "Today · 9:00 AM",
    description: "Queued for the Base growth audience.",
    metrics: [
      { label: "Reach", value: "12.4k", trend: "up" as const },
      { label: "Clicks", value: "318", trend: "neutral" as const },
      { label: "Conversions", value: "42", trend: "up" as const },
    ],
  },
];

const COINS = [
  {
    id: "c1",
    name: "Kamo Classic",
    symbol: "KAMO",
    price: "$0.83",
    changePct: 4.2,
    supply: "12.5k",
    participants: "1.1k holders",
  },
];

const TEMPLATES = [
  {
    id: "t1",
    title: "Base ecosystem digest",
    description: "Three headline blocks with auto-generated CTAs.",
    tags: ["weekly", "digest"],
  },
  {
    id: "t2",
    title: "New coin spotlight",
    description: "Hero image, ticker stats, and primary CTA column.",
    tags: ["coins", "spotlight"],
  },
];

export default function HomePage() {
  return (
    <Layout>
      <section className="grid gap-3">
        <h1 className="text-display font-semibold">Compose, queue, and launch in one place</h1>
        <p className="max-w-2xl text-body text-muted-foreground">
          Kamo keeps Farcaster casts and Zora coins aligned with collaborative drafts, queue health metrics,
          and dynamic accessibility baked in.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/create">Start a draft</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/queue">Review queue</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/activity">Browse activity log</Link>
          </Button>
        </div>
      </section>

      <section className="mt-10 space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="text-title font-semibold">Upcoming queue</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/queue">Open queue</Link>
          </Button>
        </header>
        {QUEUE_ITEMS.length === 0 ? (
          <EmptyState
            variant="noScheduled"
            primaryAction={{ label: "Schedule content", onClick: () => location.assign("/create") }}
          />
        ) : (
          <div className="grid gap-4">
            {QUEUE_ITEMS.map((item) => (
              <QueueCard
                key={item.id}
                title={item.title}
                status={item.status}
                scheduledFor={item.scheduledFor}
                description={item.description}
                metrics={item.metrics}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10 space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="text-title font-semibold">Coins in motion</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/create">Create coin</Link>
          </Button>
        </header>
        <div className="grid gap-4 sm:grid-cols-2">
          {COINS.map((coin) => (
            <CoinCard
              key={coin.id}
              name={coin.name}
              symbol={coin.symbol}
              price={coin.price}
              changePct={coin.changePct}
              supply={coin.supply}
              participants={coin.participants}
              onDetails={() => {}}
              onTrade={() => {}}
            />
          ))}
        </div>
      </section>

      <section className="mt-10 space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="text-title font-semibold">Template library</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/create">Open studio</Link>
          </Button>
        </header>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((template) => (
            <TemplateCard
              key={template.id}
              title={template.title}
              description={template.description}
              tags={template.tags}
              onEdit={() => location.assign(`/create?template=${template.id}`)}
              onPreview={() => {}}
            />
          ))}
        </div>
      </section>
    </Layout>
  );
}
