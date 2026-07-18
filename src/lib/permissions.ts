export const DASHBOARD_PERMISSIONS = [
  "overview",
  "locations",
  "bookings",
  "clients",
  "accounts",
] as const;

export type DashboardPermission = (typeof DASHBOARD_PERMISSIONS)[number];
export type ManagementRole = "super_admin" | "custom";

export interface ManagementAccess {
  id: string;
  email: string;
  displayName: string | null;
  role: ManagementRole;
  permissions: DashboardPermission[];
}

export interface ManagementUser extends ManagementAccess {
  createdAt: string;
  updatedAt: string;
}

export const PERMISSION_DETAILS: Record<DashboardPermission, { label: string; description: string; href: string }> = {
  overview: {
    label: "Overview",
    description: "Business KPIs, charts, occupancy, collections and recent activity.",
    href: "/dashboard",
  },
  locations: {
    label: "Locations",
    description: "Location inventory, images, partners, expenses and availability.",
    href: "/dashboard/locations",
  },
  bookings: {
    label: "Bookings",
    description: "Contracts, booking schedules, invoices and payment recording.",
    href: "/dashboard/bookings",
  },
  clients: {
    label: "Clients",
    description: "Client profiles, contact information and booking history.",
    href: "/dashboard/clients",
  },
  accounts: {
    label: "Accounts",
    description: "Sales, collections, expenses, receivables and Excel exports.",
    href: "/dashboard/accounts",
  },
};

export function isDashboardPermission(value: string): value is DashboardPermission {
  return DASHBOARD_PERMISSIONS.includes(value as DashboardPermission);
}

export function canAccess(access: Pick<ManagementAccess, "role" | "permissions">, permission: DashboardPermission): boolean {
  return access.role === "super_admin" || access.permissions.includes(permission);
}

export function firstAllowedPath(access: Pick<ManagementAccess, "role" | "permissions">): string {
  if (access.role === "super_admin") return "/dashboard";
  const firstPermission = DASHBOARD_PERMISSIONS.find((permission) => access.permissions.includes(permission));
  return firstPermission ? PERMISSION_DETAILS[firstPermission].href : "/dashboard/access-denied";
}

export function permissionForPath(pathname: string): DashboardPermission | "users" | null {
  if (pathname === "/dashboard") return "overview";
  if (pathname.startsWith("/dashboard/locations")) return "locations";
  if (pathname.startsWith("/dashboard/bookings")) return "bookings";
  if (pathname.startsWith("/dashboard/clients")) return "clients";
  if (pathname.startsWith("/dashboard/accounts")) return "accounts";
  if (pathname.startsWith("/dashboard/users")) return "users";
  return null;
}
