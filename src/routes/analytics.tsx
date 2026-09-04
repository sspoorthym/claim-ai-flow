import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { IndianRupee, TrendingUp, TriangleAlert, Users } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/layout/AppShell";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  SectionCard,
  inr,
  pct,
} from "@/components/recoverai/common";
import { Button } from "@/components/ui/button";
import { getAnalytics } from "@/services/api";

const RANGES = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "all", label: "All time" },
];

const RISK_COLORS: Record<string, string> = {
  High: "var(--color-chart-4)",
  Medium: "var(--color-chart-3)",
  Low: "var(--color-chart-2)",
};

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — RecoverAI Revenue Insights" },
      {
        name: "description",
        content:
          "Revenue recovery trends, risk distribution, failure reasons and recovery action performance.",
      },
      { property: "og:title", content: "Analytics — RecoverAI Revenue Insights" },
      {
        property: "og:description",
        content: "Charts for recovery trends, risk distribution and action performance.",
      },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const [range, setRange] = useState("30");
  const query = useQuery({
    queryKey: ["analytics", range],
    queryFn: () => getAnalytics(range),
    retry: false,
  });

  return (
    <AppShell
      title="Analytics"
      subtitle="Recovery performance across your customer base"
      actions={
        <div className="hidden gap-1 sm:flex">
          {RANGES.map((r) => (
            <Button
              key={r.value}
              size="sm"
              variant={range === r.value ? "default" : "outline"}
              onClick={() => setRange(r.value)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      }
    >
      {query.isLoading ? (
        <LoadingState />
      ) : query.error || !query.data ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <div className="space-y-6">
          <div className="flex gap-1 sm:hidden">
            {RANGES.map((r) => (
              <Button
                key={r.value}
                size="sm"
                variant={range === r.value ? "default" : "outline"}
                onClick={() => setRange(r.value)}
              >
                {r.label}
              </Button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Total recovered"
              value={inr(query.data.overview.totalRecovered)}
              icon={IndianRupee}
              tone="success"
            />
            <MetricCard
              label="Total at risk"
              value={inr(query.data.overview.totalAtRisk)}
              icon={TriangleAlert}
              tone="danger"
            />
            <MetricCard
              label="Retry success rate"
              value={pct(query.data.overview.successRate)}
              icon={TrendingUp}
              tone="primary"
            />
            <MetricCard
              label="Customers tracked"
              value={String(query.data.overview.customers)}
              icon={Users}
              tone="primary"
              hint={`${query.data.overview.failedPayments} failed payments in range`}
            />
          </div>

          <SectionCard title="Recovery trend" description="Recovered revenue vs revenue at risk">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={query.data.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v: string) => v.slice(5)}
                    fontSize={12}
                    stroke="var(--color-muted-foreground)"
                  />
                  <YAxis fontSize={12} stroke="var(--color-muted-foreground)" width={60} />
                  <Tooltip formatter={(v) => inr(Number(v))} />
                  <Line
                    type="monotone"
                    dataKey="recovered"
                    name="Recovered"
                    stroke="var(--color-chart-2)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="atRisk"
                    name="At risk"
                    stroke="var(--color-chart-4)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Risk distribution" description="Customers by AI risk level">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={query.data.riskDistribution}
                      dataKey="count"
                      nameKey="level"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {query.data.riskDistribution.map((entry) => (
                        <Cell key={entry.level} fill={RISK_COLORS[entry.level]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4">
                {query.data.riskDistribution.map((entry) => (
                  <span key={entry.level} className="flex items-center gap-2 text-xs">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ background: RISK_COLORS[entry.level] }}
                    />
                    {entry.level} ({entry.count})
                  </span>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Payment failure reasons" description="Why payments failed in range">
              {query.data.failureReasons.length === 0 ? (
                <EmptyState title="No failed payments in this range." />
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={query.data.failureReasons} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis type="number" fontSize={12} stroke="var(--color-muted-foreground)" />
                      <YAxis
                        type="category"
                        dataKey="reason"
                        width={140}
                        fontSize={11}
                        stroke="var(--color-muted-foreground)"
                      />
                      <Tooltip />
                      <Bar dataKey="count" fill="var(--color-chart-1)" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </SectionCard>
          </div>

          <SectionCard
            title="Recovery action performance"
            description="Which recovery actions actually work"
          >
            {query.data.actionPerformance.length === 0 ? (
              <EmptyState title="No recovery actions in this range." />
            ) : (
              <div className="space-y-3">
                {query.data.actionPerformance.map((row) => (
                  <div
                    key={row.action}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{row.action}</p>
                      <p className="text-xs text-muted-foreground">{row.total} attempts</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-success">{inr(row.recovered)}</p>
                      <p className="text-xs text-muted-foreground">
                        {pct(row.successRate)} success
                      </p>
                    </div>
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
