import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert, ShieldCheck, ShieldQuestion, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  RiskBadge,
  SectionCard,
  inr,
} from "@/components/recoverai/common";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getRiskCustomers } from "@/services/api";

const FILTERS = ["All", "High", "Medium", "Low"] as const;

export const Route = createFileRoute("/risk")({
  head: () => ({
    meta: [
      { title: "Risk Detection — RecoverAI" },
      {
        name: "description",
        content:
          "AI churn and payment-failure risk scoring for every customer, with the reasons behind each score.",
      },
      { property: "og:title", content: "Risk Detection — RecoverAI" },
      {
        property: "og:description",
        content: "See which customers are most likely to churn and why.",
      },
    ],
  }),
  component: RiskPage,
});

function RiskPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const query = useQuery({ queryKey: ["risk"], queryFn: getRiskCustomers, retry: false });

  const rows = (query.data?.rows ?? []).filter((r) => filter === "All" || r.level === filter);

  return (
    <AppShell title="Risk Detection" subtitle="AI churn and payment failure risk scoring">
      {query.isLoading ? (
        <LoadingState />
      ) : query.error || !query.data ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="High risk"
              value={String(query.data.summary.high)}
              icon={ShieldAlert}
              tone="danger"
            />
            <MetricCard
              label="Medium risk"
              value={String(query.data.summary.medium)}
              icon={ShieldQuestion}
              tone="warning"
            />
            <MetricCard
              label="Low risk"
              value={String(query.data.summary.low)}
              icon={ShieldCheck}
              tone="success"
            />
            <MetricCard
              label="Revenue exposed"
              value={inr(query.data.summary.amountAtRisk)}
              icon={TriangleAlert}
              tone="danger"
            />
          </div>

          <SectionCard
            title="Risk breakdown"
            description="Every customer scored 0-100 by the RecoverAI risk model"
            action={
              <div className="flex flex-wrap gap-1">
                {FILTERS.map((f) => (
                  <Button
                    key={f}
                    size="sm"
                    variant={filter === f ? "default" : "outline"}
                    onClick={() => setFilter(f)}
                  >
                    {f}
                  </Button>
                ))}
              </div>
            }
          >
            {rows.length === 0 ? (
              <EmptyState title="No customers in this risk band." />
            ) : (
              <div className="space-y-3">
                {rows.map((row) => (
                  <div key={row.customerId} className="rounded-xl border border-border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            to="/customers/$id"
                            params={{ id: row.customerId }}
                            className="truncate text-sm font-semibold hover:underline"
                          >
                            {row.name}
                          </Link>
                          <RiskBadge level={row.level} />
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{row.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">{row.score}</p>
                        <p className="text-xs text-muted-foreground">{inr(row.amount)}</p>
                      </div>
                    </div>
                    <Progress value={row.score} className="mt-3 h-2" />
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {row.reasons.map((reason) => (
                        <li
                          key={reason}
                          className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                        >
                          {reason}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs font-medium text-primary">
                      Recommended: {row.recommendedAction}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}
    </AppShell>
  );
}
