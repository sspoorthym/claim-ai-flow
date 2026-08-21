/**
 * Single place for all data access used by pages and components.
 * Reads/aggregations that must be calculated server-side live in
 * `src/lib/recoverai.functions.ts`; CRUD goes straight to the database.
 */
import { supabase } from "@/integrations/supabase/client";
import {
  fetchAnalytics,
  fetchDashboard,
  fetchInsights,
  fetchRecovery,
  fetchRiskCustomers,
} from "@/lib/recoverai.functions";

export interface Customer {
  id: string;
  name: string;
  email: string;
  amount: number;
  status: string;
  risk: string;
  created_at: string;
}

export interface CustomerInput {
  name: string;
  email: string;
  amount: number;
  status: string;
  risk: string;
}

export interface Payment {
  id: string;
  customer_id: string;
  amount: number;
  payment_date: string;
  payment_status: string;
  payment_method: string;
  failure_reason: string | null;
}

export interface RecoveryAction {
  id: string;
  customer_id: string;
  action_type: string;
  status: string;
  amount_recovered: number;
  created_at: string;
}

export class ApiError extends Error {}

const CONNECTION_ERROR = "Unable to connect to the RecoverAI server.";

function fail(message?: string): never {
  throw new ApiError(message || CONNECTION_ERROR);
}

export async function getCustomers(): Promise<Customer[]> {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) fail(error.message);
    return (data ?? []).map((c) => ({ ...c, amount: Number(c.amount) })) as Customer[];
  } catch (error) {
    return fail(error instanceof ApiError ? error.message : undefined);
  }
}

export async function getCustomer(id: string) {
  try {
    const [customer, payments, actions] = await Promise.all([
      supabase.from("customers").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("payments")
        .select("*")
        .eq("customer_id", id)
        .order("payment_date", { ascending: false }),
      supabase
        .from("recovery_actions")
        .select("*")
        .eq("customer_id", id)
        .order("created_at", { ascending: false }),
    ]);

    if (customer.error) fail(customer.error.message);
    if (!customer.data) fail("Customer not found.");

    return {
      customer: { ...customer.data, amount: Number(customer.data.amount) } as Customer,
      payments: (payments.data ?? []).map((p) => ({ ...p, amount: Number(p.amount) })) as Payment[],
      actions: (actions.data ?? []).map((a) => ({
        ...a,
        amount_recovered: Number(a.amount_recovered),
      })) as RecoveryAction[],
    };
  } catch (error) {
    return fail(error instanceof ApiError ? error.message : undefined);
  }
}

function validate(input: CustomerInput) {
  if (!input.name.trim()) fail("Name is required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) fail("Enter a valid email address.");
  if (!(input.amount > 0)) fail("Amount must be greater than zero.");
  if (!input.status) fail("Status is required.");
  if (!input.risk) fail("Risk level is required.");
}

export async function addCustomer(input: CustomerInput): Promise<Customer> {
  validate(input);
  try {
    const { data, error } = await supabase
      .from("customers")
      .insert({
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        amount: input.amount,
        status: input.status,
        risk: input.risk,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") fail("A customer with this email already exists.");
      fail(error.message);
    }
    return { ...data, amount: Number(data.amount) } as Customer;
  } catch (error) {
    return fail(error instanceof ApiError ? error.message : undefined);
  }
}

export async function updateCustomer(id: string, input: CustomerInput): Promise<Customer> {
  validate(input);
  try {
    const { data, error } = await supabase
      .from("customers")
      .update({
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        amount: input.amount,
        status: input.status,
        risk: input.risk,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") fail("A customer with this email already exists.");
      fail(error.message);
    }
    return { ...data, amount: Number(data.amount) } as Customer;
  } catch (error) {
    return fail(error instanceof ApiError ? error.message : undefined);
  }
}

export async function deleteCustomer(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) fail(error.message);
  } catch (error) {
    fail(error instanceof ApiError ? error.message : undefined);
  }
}

/** Simulated recovery actions - no real card is ever charged. */
export type RecoveryKind = "retry" | "reminder" | "contact" | "recovered";

export async function runRecoveryAction(
  customerId: string,
  kind: RecoveryKind,
  options: { channel?: string } = {},
) {
  try {
    const { data: customer, error: readError } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .maybeSingle();
    if (readError) fail(readError.message);
    if (!customer) fail("Customer not found.");

    const amount = Number(customer.amount);
    const recovers = kind === "retry" || kind === "recovered";
    const actionType =
      kind === "retry"
        ? "Payment Retry"
        : kind === "reminder"
          ? `${options.channel ?? "Email"} Reminder`
          : kind === "contact"
            ? "Customer Contact"
            : "Marked Recovered";

    const { error: actionError } = await supabase.from("recovery_actions").insert({
      customer_id: customerId,
      action_type: actionType,
      status: "Completed",
      amount_recovered: recovers ? amount : 0,
    });
    if (actionError) fail(actionError.message);

    if (recovers) {
      const { error: updateError } = await supabase
        .from("customers")
        .update({ status: "Recovered", risk: "Low" })
        .eq("id", customerId);
      if (updateError) fail(updateError.message);

      await supabase.from("payments").insert({
        customer_id: customerId,
        amount,
        payment_status: "success",
        payment_method: "card",
      });
    }

    await supabase.from("notifications").insert({
      title: recovers ? "Payment recovery successful" : "Recovery action logged",
      message: `${actionType} for ${customer.name}.`,
      type: recovers ? "success" : "info",
    });

    return { actionType, amount: recovers ? amount : 0 };
  } catch (error) {
    return fail(error instanceof ApiError ? error.message : undefined);
  }
}

export async function getNotifications() {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(8);
  if (error) fail(error.message);
  return data ?? [];
}

export const getDashboard = () => fetchDashboard();
export const getRecovery = () => fetchRecovery();
export const getRiskCustomers = () => fetchRiskCustomers();
export const getInsights = () => fetchInsights();
export const getAnalytics = (range: string) => fetchAnalytics({ data: range });
