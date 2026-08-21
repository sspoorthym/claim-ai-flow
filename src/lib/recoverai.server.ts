/**
 * RecoverAI backend services.
 * All dashboard / analytics / risk / insight numbers are calculated here on the
 * server from real database rows - never hard-coded in React.
 */
import { createClient } from "@supabase/supabase-js";

export interface Customer {
  id: string;
  name: string;
  email: string;
  amount: number;
  status: string;
  risk: string;
  created_at: string;
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

function serverClient() {
  const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"]!;
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"]!;

  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

interface Dataset {
  customers: Customer[];
  payments: Payment[];
  actions: RecoveryAction[];
}

async function loadDataset(): Promise<Dataset> {
  const supabase = serverClient();
  const [customers, payments, actions] = await Promise.all([
    supabase.from("customers").select("*").order("created_at", { ascending: false }),
    supabase.from("payments").select("*"),
    supabase.from("recovery_actions").select("*"),
  ]);

  if (customers.error) throw new Error(customers.error.message);
  if (payments.error) throw new Error(payments.error.message);
  if (actions.error) throw new Error(actions.error.message);

  return {
    customers: (customers.data ?? []).map((c) => ({ ...c, amount: Number(c.amount) })) as Customer[],
    payments: (payments.data ?? []).map((p) => ({ ...p, amount: Number(p.amount) })) as Payment[],
    actions: (actions.data ?? []).map((a) => ({
      ...a,
      amount_recovered: Number(a.amount_recovered),
    })) as RecoveryAction[],
  };
}

const AT_RISK_STATUSES = ["Failed Payment", "At Risk"];
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
const dayKey = (date: string | Date) => new Date(date).toISOString().slice(0, 10);

// ---------------------------------------------------------------- risk engine

export interface RiskRow {
  customerId: string;
  name: string;
  email: string;
  amount: number;
  status: string;
  score: number;
  level: "High" | "Medium" | "Low";
  reasons: string[];
  recommendedAction: string;
  failureReasons: string[];
}

function scoreCustomer(customer: Customer, data: Dataset): RiskRow {
  const payments = data.payments.filter((p) => p.customer_id === customer.id);
  const failures = payments.filter((p) => p.payment_status === "failed");
  const actions = data.actions.filter((a) => a.customer_id === customer.id);
  const failedRecoveries = actions.filter((a) => a.status === "Failed");
  const now = Date.now();
  const reasons: string[] = [];
  let score = 0;

  if (failures.length > 0) {
    score += 40;
    reasons.push("Payment failure on record");
  }
  if (failures.length > 1) {
    score += 20;
    reasons.push(`${failures.length} failed payment attempts`);
  }
  if (customer.amount >= 15000) {
    score += 15;
    reasons.push("High outstanding amount");
  }
  const recentFailure = failures.some(
    (p) => now - new Date(p.payment_date).getTime() < 14 * 24 * 60 * 60 * 1000,
  );
  if (recentFailure) {
    score += 15;
    reasons.push("Recent payment failure (last 14 days)");
  }
  if (failedRecoveries.length > 0) {
    score += 10;
    reasons.push("Previous recovery attempt failed");
  }
  if (customer.status === "At Risk" && failures.length === 0) {
    score += 25;
    reasons.push("Early churn signals detected");
  }
  if (customer.status === "Recovered") {
    score = Math.max(0, score - 30);
  }
  score = Math.min(100, score);
  if (reasons.length === 0) reasons.push("Healthy payment behaviour");

  const level: RiskRow["level"] = score > 60 ? "High" : score > 30 ? "Medium" : "Low";
  const recommendedAction =
    level === "High"
      ? "Retry payment immediately"
      : level === "Medium"
        ? "Send payment reminder"
        : "Monitor account";

  return {
    customerId: customer.id,
    name: customer.name,
    email: customer.email,
    amount: customer.amount,
    status: customer.status,
    score,
    level,
    reasons,
    recommendedAction,
    failureReasons: [...new Set(failures.map((f) => f.failure_reason).filter(Boolean))] as string[],
  };
}

export async function getRiskCustomers() {
  const data = await loadDataset();
  const rows = data.customers
    .map((customer) => scoreCustomer(customer, data))
    .sort((a, b) => b.score - a.score);

  return {
    rows,
    summary: {
      high: rows.filter((r) => r.level === "High").length,
      medium: rows.filter((r) => r.level === "Medium").length,
      low: rows.filter((r) => r.level === "Low").length,
      amountAtRisk: sum(rows.filter((r) => r.level !== "Low").map((r) => r.amount)),
    },
  };
}

// ----------------------------------------------------------------- dashboard

export async function getDashboard() {
  const data = await loadDataset();
  const { customers, payments, actions } = data;

  const completed = actions.filter((a) => a.status === "Completed");
  const revenueRecovered = sum(completed.map((a) => a.amount_recovered));
  const atRiskCustomers = customers.filter((c) => AT_RISK_STATUSES.includes(c.status));
  const revenueAtRisk = sum(atRiskCustomers.map((c) => c.amount));
  const customersSaved = customers.filter((c) => c.status === "Recovered").length;
  const recoveryAttempts = actions.filter((a) => a.action_type === "Payment Retry").length;
  const successfulRetries = actions.filter(
    (a) => a.action_type === "Payment Retry" && a.status === "Completed",
  ).length;
  const recoveryRate = recoveryAttempts ? (successfulRetries / recoveryAttempts) * 100 : 0;

  const failedCustomers = customers.filter((c) => c.status === "Failed Payment");
  const churnCustomers = customers.filter((c) => c.status === "At Risk");
  const methodIssueCustomers = customers.filter(
    (c) => payments.filter((p) => p.customer_id === c.id && p.payment_status === "failed").length > 1,
  );

  const opportunities = [
    {
      level: "HIGH" as const,
      title: "Failed subscription payments",
      description: "AI detected customers whose recurring payments failed.",
      amount: sum(failedCustomers.map((c) => c.amount)),
      count: failedCustomers.length,
      filter: "High Risk",
    },
    {
      level: "MEDIUM" as const,
      title: "Customers likely to churn",
      description: "AI detected early signs of customer cancellation.",
      amount: sum(churnCustomers.map((c) => c.amount)),
      count: churnCustomers.length,
      filter: "At Risk",
    },
    {
      level: "LOW" as const,
      title: "Payment method issues",
      description: "Customers experiencing repeated payment problems.",
      amount: sum(methodIssueCustomers.map((c) => c.amount)),
      count: methodIssueCustomers.length,
      filter: "Failed Payment",
    },
  ];

  const trend: { date: string; recovered: number; atRisk: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = dayKey(date);
    trend.push({
      date: key,
      recovered: sum(
        completed.filter((a) => dayKey(a.created_at) === key).map((a) => a.amount_recovered),
      ),
      atRisk: sum(
        payments
          .filter((p) => p.payment_status === "failed" && dayKey(p.payment_date) === key)
          .map((p) => p.amount),
      ),
    });
  }

  const nameById = new Map(customers.map((c) => [c.id, c.name]));
  const recentActivity = [...actions]
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 8)
    .map((a) => ({
      id: a.id,
      customer: nameById.get(a.customer_id) ?? "Unknown customer",
      action: a.action_type,
      amount: a.amount_recovered,
      status: a.status,
      date: a.created_at,
    }));

  const risk = await getRiskCustomers();
  const potentialRecovery = sum(
    risk.rows.filter((r) => r.level === "High").map((r) => r.amount),
  );
  const aiSummary =
    `RecoverAI detected ${risk.summary.high} high-risk customers today. ` +
    `Automated payment retries could potentially recover ${formatInr(potentialRecovery)} ` +
    `from ${failedCustomers.length} failed subscription payments.`;

  return {
    metrics: {
      revenueRecovered,
      revenueAtRisk,
      recoveryRate,
      customersSaved,
    },
    opportunities,
    trend,
    recentActivity,
    aiSummary,
  };
}

function formatInr(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

// ------------------------------------------------------------------ recovery

export async function getRecovery() {
  const data = await loadDataset();
  const risk = await getRiskCustomers();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const completed = data.actions.filter((a) => a.status === "Completed");
  const attempts = data.actions.filter((a) => a.action_type === "Payment Retry");
  const queue = risk.rows.filter((r) => AT_RISK_STATUSES.includes(r.status));

  return {
    metrics: {
      totalAtRisk: sum(queue.map((r) => r.amount)),
      potentialRecovery: sum(queue.filter((r) => r.level !== "Low").map((r) => r.amount)) * 0.72,
      recoveredThisMonth: sum(
        completed
          .filter((a) => new Date(a.created_at) >= monthStart)
          .map((a) => a.amount_recovered),
      ),
      successRate: attempts.length
        ? (attempts.filter((a) => a.status === "Completed").length / attempts.length) * 100
        : 0,
    },
    urgent: queue.filter((r) => r.level === "High"),
    suggested: queue.filter((r) => r.level !== "High"),
  };
}

// ----------------------------------------------------------------- analytics

export async function getAnalytics(range: string) {
  const days = range === "7" ? 7 : range === "30" ? 30 : range === "90" ? 90 : 3650;
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const data = await loadDataset();
  const risk = await getRiskCustomers();

  const actions = data.actions.filter((a) => +new Date(a.created_at) >= since);
  const payments = data.payments.filter((p) => +new Date(p.payment_date) >= since);

  const buckets = Math.min(days, 30);
  const series: { date: string; recovered: number; atRisk: number }[] = [];
  for (let i = buckets - 1; i >= 0; i--) {
    const key = dayKey(new Date(Date.now() - i * 24 * 60 * 60 * 1000));
    series.push({
      date: key,
      recovered: sum(
        actions
          .filter((a) => a.status === "Completed" && dayKey(a.created_at) === key)
          .map((a) => a.amount_recovered),
      ),
      atRisk: sum(
        payments
          .filter((p) => p.payment_status === "failed" && dayKey(p.payment_date) === key)
          .map((p) => p.amount),
      ),
    });
  }

  const failureReasons = Object.entries(
    payments
      .filter((p) => p.payment_status === "failed" && p.failure_reason)
      .reduce<Record<string, number>>((acc, p) => {
        const key = p.failure_reason as string;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {}),
  ).map(([reason, count]) => ({ reason, count }));

  const actionPerformance = Object.entries(
    actions.reduce<Record<string, { total: number; completed: number; recovered: number }>>(
      (acc, a) => {
        const bucket = acc[a.action_type] ?? { total: 0, completed: 0, recovered: 0 };
        bucket.total += 1;
        if (a.status === "Completed") bucket.completed += 1;
        bucket.recovered += a.amount_recovered;
        acc[a.action_type] = bucket;
        return acc;
      },
      {},
    ),
  ).map(([action, stats]) => ({
    action,
    total: stats.total,
    recovered: stats.recovered,
    successRate: stats.total ? (stats.completed / stats.total) * 100 : 0,
  }));

  const attempts = actions.filter((a) => a.action_type === "Payment Retry");
  const totalRecovered = sum(
    actions.filter((a) => a.status === "Completed").map((a) => a.amount_recovered),
  );

  return {
    overview: {
      totalRecovered,
      totalAtRisk: sum(
        data.customers.filter((c) => AT_RISK_STATUSES.includes(c.status)).map((c) => c.amount),
      ),
      successRate: attempts.length
        ? (attempts.filter((a) => a.status === "Completed").length / attempts.length) * 100
        : 0,
      failedPayments: payments.filter((p) => p.payment_status === "failed").length,
      customers: data.customers.length,
    },
    series,
    riskDistribution: [
      { level: "High", count: risk.summary.high },
      { level: "Medium", count: risk.summary.medium },
      { level: "Low", count: risk.summary.low },
    ],
    failureReasons,
    actionPerformance,
  };
}

// ------------------------------------------------------------------ insights

export interface InsightsPayload {
  executiveSummary: string;
  aiGenerated: boolean;
  revenueRisk: { label: string; value: string }[];
  topOpportunities: { name: string; amount: number; reason: string }[];
  behaviourPatterns: string[];
  failurePatterns: { reason: string; count: number }[];
  recommendedActions: string[];
  potentialRecovery: number;
}

export async function getInsights(): Promise<InsightsPayload> {
  const data = await loadDataset();
  const risk = await getRiskCustomers();

  const failedPayments = data.payments.filter((p) => p.payment_status === "failed");
  const events = data.payments.length + data.actions.length;
  const atRisk = data.customers.filter((c) => AT_RISK_STATUSES.includes(c.status));
  const potentialRecovery = sum(
    risk.rows.filter((r) => r.level !== "Low").map((r) => r.amount * 0.72),
  );

  const failurePatterns = Object.entries(
    failedPayments.reduce<Record<string, number>>((acc, p) => {
      const key = p.failure_reason ?? "Unknown";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  const topOpportunities = risk.rows
    .filter((r) => r.level !== "Low")
    .slice(0, 5)
    .map((r) => ({ name: r.name, amount: r.amount, reason: r.reasons[0] ?? "Elevated risk" }));

  const avgAtRisk = atRisk.length ? sum(atRisk.map((c) => c.amount)) / atRisk.length : 0;
  const behaviourPatterns = [
    `${atRisk.length} of ${data.customers.length} customers currently show revenue-loss signals.`,
    `Average outstanding amount per at-risk customer is ${formatInr(avgAtRisk)}.`,
    `${failedPayments.length} failed payment events were recorded across the customer base.`,
    `${risk.summary.high} customers scored above 60 on the RecoverAI risk model.`,
  ];

  const recommendedActions = [
    `Trigger automated payment retries for ${risk.summary.high} high-risk customers.`,
    `Send reminders to ${risk.summary.medium} medium-risk customers before renewal.`,
    failurePatterns[0]
      ? `Address "${failurePatterns[0].reason}" - the most common failure reason (${failurePatterns[0].count} events).`
      : "Keep monitoring payment failure reasons.",
    "Ask customers with repeated failures to update their payment method.",
  ];

  const fallbackSummary =
    `RecoverAI analyzed ${events} customer payment events and identified ${atRisk.length} customers ` +
    `with elevated revenue-loss risk, representing ${formatInr(sum(atRisk.map((c) => c.amount)))} ` +
    `of exposed revenue. An estimated ${formatInr(potentialRecovery)} is recoverable through ` +
    `automated retries and reminders.`;

  let executiveSummary = fallbackSummary;
  let aiGenerated = false;

  // Optional AI narrative - the app must keep working when the AI API is down.
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (apiKey) {
    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content:
                "You are RecoverAI, a revenue recovery analyst. Reply with 2-3 concise sentences, no markdown.",
            },
            {
              role: "user",
              content: `Write an executive summary from these stats: ${JSON.stringify({
                customers: data.customers.length,
                events,
                highRisk: risk.summary.high,
                mediumRisk: risk.summary.medium,
                atRiskRevenue: sum(atRisk.map((c) => c.amount)),
                potentialRecovery: Math.round(potentialRecovery),
                topFailureReason: failurePatterns[0]?.reason,
              })}. Amounts are in Indian rupees.`,
            },
          ],
        }),
      });
      if (response.ok) {
        const json = (await response.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const text = json.choices?.[0]?.message?.content?.trim();
        if (text) {
          executiveSummary = text;
          aiGenerated = true;
        }
      }
    } catch {
      // fall back to the calculated summary
    }
  }

  return {
    executiveSummary,
    aiGenerated,
    revenueRisk: [
      { label: "Revenue at risk", value: formatInr(sum(atRisk.map((c) => c.amount))) },
      { label: "High risk customers", value: String(risk.summary.high) },
      { label: "Failed payment events", value: String(failedPayments.length) },
      { label: "Estimated recoverable", value: formatInr(potentialRecovery) },
    ],
    topOpportunities,
    behaviourPatterns,
    failurePatterns: failurePatterns.slice(0, 5),
    recommendedActions,
    potentialRecovery,
  };
}
