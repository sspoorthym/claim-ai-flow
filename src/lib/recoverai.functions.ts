import { createServerFn } from "@tanstack/react-start";

import {
  getAnalytics,
  getDashboard,
  getInsights,
  getRecovery,
  getRiskCustomers,
} from "./recoverai.server";

export const fetchDashboard = createServerFn({ method: "GET" }).handler(async () => getDashboard());

export const fetchRecovery = createServerFn({ method: "GET" }).handler(async () => getRecovery());

export const fetchRiskCustomers = createServerFn({ method: "GET" }).handler(async () =>
  getRiskCustomers(),
);

export const fetchInsights = createServerFn({ method: "GET" }).handler(async () => getInsights());

export const fetchAnalytics = createServerFn({ method: "GET" })
  .inputValidator((range: string) => range)
  .handler(async ({ data }) => getAnalytics(data));
