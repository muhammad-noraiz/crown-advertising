import { getCurrentAccess } from "@/lib/auth/access";
import { getAlerts } from "@/lib/alerts-data";
import { DashboardShell } from "./components/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [access, alerts] = await Promise.all([getCurrentAccess(), getAlerts()]);

  return (
    <DashboardShell access={access} alertCount={alerts.length}>
      {children}
    </DashboardShell>
  );
}
