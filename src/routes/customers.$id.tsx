import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bell, IndianRupee, RefreshCw, UserCheck } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import {
  ErrorState,
  LoadingState,
  MetricCard,
  RiskBadge,
  SectionCard,
  StatusBadge,
  EmptyState,
  formatDate,
  inr,
} from "@/components/recoverai/common";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCustomer, runRecoveryAction, type RecoveryKind } from "@/services/api";

export const Route = createFileRoute("/customers/$id")({
  head: () => ({
    meta: [
      { title: "Customer Profile — RecoverAI" },
      {
        name: "description",
        content:
          "Full customer profile with payment history, recovery actions and one-click recovery tools.",
      },
      { property: "og:title", content: "Customer Profile — RecoverAI" },
      {
        property: "og:description",
        content: "Payment history, risk signals and recovery actions for a single customer.",
      },
    ],
  }),
  component: CustomerDetail,
});

function CustomerDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["customer", id],
    queryFn: () => getCustomer(id),
    retry: false,
  });

  const action = useMutation({
    mutationFn: (kind: RecoveryKind) => runRecoveryAction(id, kind),
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
    <AppShell
      title="Customer profile"
      subtitle="Payment history, risk signals and recovery actions"
      actions={
        <Button asChild variant="outline" size="sm">
          <Link to="/customers">
            <ArrowLeft className="size-4" /> Back
          </Link>
        </Button>
      }
    >
      {query.isLoading ? (
        <LoadingState />
      ) : query.error || !query.data ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <div className="space-y-6">
          <SectionCard title={query.data.customer.name} description={query.data.customer.email}>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={query.data.customer.status} />
              <RiskBadge level={query.data.customer.risk} />
              <span className="text-sm text-muted-foreground">
                Customer since {formatDate(query.data.customer.created_at)}
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={action.isPending}
                onClick={() => action.mutate("retry")}
              >
                <RefreshCw className="size-4" /> Retry payment
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={action.isPending}
                onClick={() => action.mutate("reminder")}
              >
                <Bell className="size-4" /> Send reminder
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={action.isPending}
                onClick={() => action.mutate("contact")}
              >
                <UserCheck className="size-4" /> Log contact
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={action.isPending}
                onClick={() => action.mutate("recovered")}
              >
                Mark recovered
              </Button>
            </div>
          </SectionCard>

          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard
              label="Outstanding amount"
              value={inr(query.data.customer.amount)}
              icon={IndianRupee}
              tone="warning"
            />
            <MetricCard
              label="Payments recorded"
              value={String(query.data.payments.length)}
              icon={RefreshCw}
              tone="primary"
            />
            <MetricCard
              label="Recovery actions"
              value={String(query.data.actions.length)}
              icon={UserCheck}
              tone="success"
            />
          </div>

          <SectionCard title="Payment history" description="All recorded payment attempts">
            {query.data.payments.length === 0 ? (
              <EmptyState title="No payments recorded yet." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Failure reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {query.data.payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{formatDate(p.payment_date)}</TableCell>
                        <TableCell>{inr(p.amount)}</TableCell>
                        <TableCell>
                          <StatusBadge
                            status={p.payment_status === "success" ? "Recovered" : "Failed Payment"}
                          />
                        </TableCell>
                        <TableCell className="capitalize">{p.payment_method}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {p.failure_reason ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Recovery timeline" description="Every action taken by RecoverAI">
            {query.data.actions.length === 0 ? (
              <EmptyState title="No recovery actions yet." />
            ) : (
              <ul className="space-y-3">
                {query.data.actions.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{a.action_type}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(a.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={a.status === "Completed" ? "Recovered" : a.status} />
                      {a.amount_recovered > 0 && (
                        <p className="mt-1 text-xs font-semibold text-success">
                          +{inr(a.amount_recovered)}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      )}
    </AppShell>
  );
}
