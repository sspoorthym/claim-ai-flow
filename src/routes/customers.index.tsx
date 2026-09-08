import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  RiskBadge,
  StatusBadge,
  formatDate,
  inr,
} from "@/components/recoverai/common";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addCustomer,
  deleteCustomer,
  getCustomers,
  updateCustomer,
  type Customer,
  type CustomerInput,
} from "@/services/api";

export const Route = createFileRoute("/customers/")({
  head: () => ({
    meta: [
      { title: "Customers — RecoverAI" },
      {
        name: "description",
        content:
          "Manage customer accounts, outstanding amounts, payment status and churn risk in RecoverAI.",
      },
      { property: "og:title", content: "Customers — RecoverAI" },
      {
        property: "og:description",
        content: "Search, add, edit and delete customer accounts tracked for revenue recovery.",
      },
    ],
  }),
  component: CustomersPage,
});

const STATUSES = ["Active", "At Risk", "Failed Payment", "Recovered", "Churned"];
const RISKS = ["Low", "Medium", "High"];
const EMPTY: CustomerInput = { name: "", email: "", amount: 0, status: "Active", risk: "Low" };

function CustomersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [risk, setRisk] = useState("all");
  const [dialog, setDialog] = useState<{ open: boolean; editing?: Customer | undefined }>({
    open: false,
  });
  const [form, setForm] = useState<CustomerInput>(EMPTY);

  const query = useQuery({ queryKey: ["customers"], queryFn: getCustomers, retry: false });

  const invalidate = () => {
    qc.invalidateQueries();
  };

  const save = useMutation({
    mutationFn: async () =>
      dialog.editing ? updateCustomer(dialog.editing.id, form) : addCustomer(form),
    onSuccess: () => {
      toast.success(dialog.editing ? "Customer updated" : "Customer added");
      setDialog({ open: false });
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => {
      toast.success("Customer deleted");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (query.data ?? []).filter(
      (c) =>
        (!term || c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term)) &&
        (status === "all" || c.status === status) &&
        (risk === "all" || c.risk === risk),
    );
  }, [query.data, search, status, risk]);

  function openAdd() {
    setForm(EMPTY);
    setDialog({ open: true });
  }

  function openEdit(customer: Customer) {
    setForm({
      name: customer.name,
      email: customer.email,
      amount: customer.amount,
      status: customer.status,
      risk: customer.risk,
    });
    setDialog({ open: true, editing: customer });
  }

  return (
    <AppShell
      title="Customers"
      subtitle="All accounts tracked for revenue recovery"
      actions={
        <Button size="sm" onClick={openAdd}>
          <Plus className="size-4" /> Add customer
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="sm:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={risk} onValueChange={setRisk}>
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="Risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All risk levels</SelectItem>
              {RISKS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {query.isLoading ? (
          <LoadingState label="Loading customers..." />
        ) : query.error ? (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No customers found"
            description="Try adjusting your search or filters."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Risk</th>
                  <th className="px-4 py-3 font-medium">Added</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        to="/customers/$id"
                        params={{ id: c.id }}
                        className="font-medium hover:text-primary"
                      >
                        {c.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </td>
                    <td className="px-4 py-3">{inr(c.amount)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3">
                      <RiskBadge level={c.risk} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(c.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-danger hover:text-danger"
                          onClick={() => {
                            if (confirm(`Delete ${c.name}?`)) remove.mutate(c.id);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={dialog.open} onOpenChange={(open) => setDialog({ open, editing: dialog.editing })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog.editing ? "Edit customer" : "Add customer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Outstanding amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                value={form.amount || ""}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => setForm({ ...form, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Risk level</Label>
                <Select value={form.risk} onValueChange={(value) => setForm({ ...form, risk: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RISKS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ open: false })}>
              Cancel
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Saving..." : "Save customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
