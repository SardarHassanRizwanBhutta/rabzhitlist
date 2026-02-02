import { NavigationSidebar } from "@/components/navigation-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NavigationSidebar>{children}</NavigationSidebar>;
}


