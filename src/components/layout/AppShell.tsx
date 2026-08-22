import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Bell,
  Brain,
  LayoutDashboard,
  Menu,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getNotifications } from "@/services/api";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/recovery", label: "Recovery", icon: Activity },
  { to: "/risk", label: "Risk Detection", icon: ShieldAlert },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/insights", label: "AI Insights", icon: Brain },
] as const;

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const notifications = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    retry: false,
  });

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-sidebar-border bg-sidebar transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Activity className="size-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">
              RecoverAI
            </span>
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="size-5 text-muted-foreground" />
          </button>
        </div>
        <nav className="space-y-1 px-3 py-2">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-muted",
                )}
              >
                <item.icon className="size-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mx-3 mt-6 rounded-xl bg-primary-soft p-4">
          <p className="text-sm font-semibold text-sidebar-accent-foreground">AI Engine Active</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Monitoring payments and churn signals in real time.
          </p>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-foreground/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card px-4 sm:px-6">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold sm:text-lg">{title}</h1>
            {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Notifications">
                  <Bell className="size-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <p className="border-b border-border px-4 py-3 text-sm font-semibold">
                  Notifications
                </p>
                <div className="max-h-80 overflow-y-auto">
                  {(notifications.data ?? []).length === 0 && (
                    <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No notifications yet.
                    </p>
                  )}
                  {(notifications.data ?? []).map((n) => (
                    <div key={n.id} className="border-b border-border px-4 py-3 last:border-0">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.message}</p>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <span className="grid size-9 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-sidebar-accent-foreground">
              SM
            </span>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
