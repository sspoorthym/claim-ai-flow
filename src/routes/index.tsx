import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Brain, IndianRupee, TrendingUp, TriangleAlert, Users } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/layout/AppShell";
import {
  ErrorState,
  LoadingState,
  MetricCard,
  SectionCard,
  StatusBadge,
  formatDate,
  inr,
  pct,
} from "@/components/recoverai/common";
import { Button } from "@/components/ui/button";
import { getDashboard } from "@/services/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RecoverAI Dashboard — Revenue Recovery Overview" },
      {
        name: "description",
        content:
          "Track recovered revenue, revenue at risk, recovery rate and AI-detected recovery opportunities in one dashboard.",
      },
      { property: "og:title", content: "RecoverAI Dashboard — Revenue Recovery Overview" },
      {
        property: "og:description",
        content: "AI-powered revenue recovery and customer retention analytics.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const query = useQuery({ queryKey: ["dashboard"], queryFn: getDashboard, retry: false });

  return (
    <AppShell title="Dashboard" subtitle="AI-powered revenue recovery overview">
      {query.isLoading ? (
        <LoadingState />
      ) : query.error || !query.data ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl bg-primary p-6 text-primary-foreground shadow-[var(--shadow-pop)]">
            <div className="flex items-start gap-3">
              <Brain className="mt-0.5 size-6 shrink-0" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide opacity-90">
                  AI Insight
                </p>
                <p className="mt-1 text-base leading-relaxed">{query.data.aiSummary}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Revenue Recovered"
              value={inr(query.data.metrics.revenueRecovered)}
              icon={IndianRupee}
              tone="success"
              hint="From completed recovery actions"
            />
            <MetricCard
              label="Revenue at Risk"
              value={inr(query.data.metrics.revenueAtRisk)}
              icon={TriangleAlert}
              tone="danger"
              hint="Failed payments & at-risk accounts"
            />
            <MetricCard
              label="Recovery Rate"
              value={pct(query.data.metrics.recoveryRate)}
              icon={TrendingUp}
              tone="primary"
              hint="Successful payment retries"
            />
            <MetricCard
              label="Customers Saved"
              value={String(query.data.metrics.customersSaved)}
              icon={Users}
              tone="success"
              hint="Marked as recovered"
            />
          </div>

          <SectionCard
            title="Revenue trend"
            description="Recovered revenue vs revenue at risk (last 14 days)"
          >
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={query.data.trend}>
                  <defs>
                    <linearGradient id="recovered" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="atRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-4)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--color-chart-4)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v: string) => v.slice(5)}
                    fontSize={12}
                    stroke="var(--color-muted-foreground)"
                  />
                  <YAxis fontSize={12} stroke="var(--color-muted-foreground)" width={60} />
                  <Tooltip formatter={(v) => inr(Number(v))} />
                  <Area
                    type="monotone"
                    dataKey="recovered"
                    name="Recovered"
                    stroke="var(--color-chart-2)"
                    fill="url(#recovered)"
                  />
                  <Area
                    type="monotone"
                    dataKey="atRisk"
                    name="At risk"
                    stroke="var(--color-chart-4)"
                    fill="url(#atRisk)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard
            title="AI recovery opportunities"
            description="Ranked by potential revenue impact"
            action={
              <Button asChild size="sm">
                <Link to="/recovery">Open recovery center</Link>
              </Button>
            }
          >
            <div className="grid gap-4 lg:grid-cols-3">
              {query.data.opportunities.map((o) => (
                <div key={o.title} className="rounded-xl border border-border p-4">
                  <span
                    className={
                      o.level === "HIGH"
                        ? "inline-flex rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-semibold text-danger"
                        : o.level === "MEDIUM"
                          ? "inline-flex rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-semibold text-warning"
                          : "inline-flex rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success"
                    }
                  >
                    {o.level}
                  </span>
                  <p className="mt-3 text-sm font-semibold">{o.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{o.description}</p>
                  <p className="mt-3 text-xl font-semibold">{inr(o.amount)}</p>
                  <p className="text-xs text-muted-foreground">{o.count} customers</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Recent recovery activity" description="Latest automated actions">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Customer</th>
                    <th className="py-2 pr-4 font-medium">Action</th>
                    <th className="py-2 pr-4 font-medium">Amount</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.recentActivity.map((a) => (
                    <tr key={a.id} className="border-b border-border last:border-0">
                      <td className="py-3 pr-4 font-medium">{a.customer}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{a.action}</td>
                      <td className="py-3 pr-4">{a.amount ? inr(a.amount) : "—"}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={a.status === "Completed" ? "Recovered" : a.status} />
                      </td>
                      <td className="py-3 text-muted-foreground">{formatDate(a.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}
    </AppShell>
  );
}
