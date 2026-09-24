import { NavigationSidebar } from "@/components/navigation-sidebar";
import { RoleRouteGuard } from "@/components/role-route-guard";
import { DashboardAuthGuard } from "@/contexts/auth-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardAuthGuard>
      <RoleRouteGuard>
        <NavigationSidebar>{children}</NavigationSidebar>
      </RoleRouteGuard>
    </DashboardAuthGuard>
  );
}


