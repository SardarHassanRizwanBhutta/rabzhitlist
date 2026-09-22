import { NavigationSidebar } from "@/components/navigation-sidebar";
import { DashboardAuthGuard } from "@/contexts/auth-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardAuthGuard>
      <NavigationSidebar>{children}</NavigationSidebar>
    </DashboardAuthGuard>
  );
}


