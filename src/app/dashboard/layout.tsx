import { getCurrentAccess } from "@/lib/auth/access";
import { DashboardShell } from "./components/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const access = await getCurrentAccess();

  return (
    <DashboardShell access={access}>
      {children}
    </DashboardShell>
  );
}
