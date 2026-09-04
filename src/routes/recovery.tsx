import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, IndianRupee, RefreshCw, TrendingUp, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  RiskBadge,
  SectionCard,
  inr,
  pct,
} from "@/components/recoverai/common";
import { Button } from "@/components/ui/button";
import { getRecovery, runRecoveryAction, type RecoveryKind } from "@/services/api";

export const Route = createFileRoute("/recovery")({
  head: () => ({
    meta: [
      { title: "Recovery Center — RecoverAI" },
      {
        name: "description",
        content:
          "Work the recovery queue: urgent failed payments, suggested reminders and one-click automated retries.",
      },
      { property: "og:title", content: "Recovery Center — RecoverAI" },
      {
        property: "og:description",
        content: "Prioritised recovery queue with automated payment retries and reminders.",
      },
    ],
  }),
  component: RecoveryPage,
});

function RecoveryPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["recovery"], queryFn: getRecovery, retry: false });

  const action = useMutation({
    mutationFn: ({ id, kind }: { id: string; kind: RecoveryKind }) => runRecoveryAction(id, kind),
    onSuccess: (result) => {
      toast.success(
        result.amount > 0
          ? `${result.actionType} succeeded — ${inr(result.amount)} recovered`
          : `${result.actionType} logged`,
      );
      queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AppShell title="Recovery Center" subtitle="Prioritised actions to recover lost revenue">
      {query.isLoading ? (
        <LoadingState />
      ) : query.error || !query.data ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Total at risk"
              value={inr(query.data.metrics.totalAtRisk)}
              icon={TriangleAlert}
              tone="danger"
            />
            <MetricCard
              label="Potential recovery"
              value={inr(query.data.metrics.potentialRecovery)}
              icon={IndianRupee}
              tone="primary"
              hint="Estimated at 72% success"
            />
            <MetricCard
              label="Recovered this month"
              value={inr(query.data.metrics.recoveredThisMonth)}
              icon={TrendingUp}
              tone="success"
            />
            <MetricCard
              label="Success rate"
              value={pct(query.data.metrics.successRate)}
              icon={RefreshCw}
              tone="success"
            />
          </div>

          <SectionCard
            title="Urgent actions"
            description="High-risk customers needing an immediate payment retry"
          >
            {query.data.urgent.length === 0 ? (
              <EmptyState title="Nothing urgent right now." description="All high-risk accounts are handled." />
            ) : (
              <div className="space-y-3">
                {query.data.urgent.map((row) => (
                  <QueueRow
                    key={row.customerId}
                    row={row}
                    pending={action.isPending}
                    onAction={(kind) => action.mutate({ id: row.customerId, kind })}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Suggested actions"
            description="Medium and low risk accounts to nudge with reminders"
          >
            {query.data.suggested.length === 0 ? (
              <EmptyState title="No suggested actions." />
            ) : (
              <div className="space-y-3">
                {query.data.suggested.map((row) => (
                  <QueueRow
                    key={row.customerId}
                    row={row}
                    pending={action.isPending}
                    onAction={(kind) => action.mutate({ id: row.customerId, kind })}
                  />
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}
    </AppShell>
  );
}

function QueueRow({
  row,
  pending,
  onAction,
}: {
  row: {
    customerId: string;
    name: string;
    email: string;
    amount: number;
    level: string;
    recommendedAction: string;
    reasons: string[];
  };
  pending: boolean;
  onAction: (kind: RecoveryKind) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
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
        <p className="mt-1 text-xs text-muted-foreground">
          {row.reasons[0]} · Recommended: {row.recommendedAction}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-sm font-semibold">{inr(row.amount)}</span>
        <Button size="sm" disabled={pending} onClick={() => onAction("retry")}>
          <RefreshCw className="size-4" /> Retry
        </Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => onAction("reminder")}>
          <Bell className="size-4" /> Remind
        </Button>
      </div>
    </div>
  );
}
