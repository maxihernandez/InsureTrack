import { DashboardView } from "@/app/dashboard-view";

export const instant = false;

export default function Dashboard({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  return <DashboardView searchParams={searchParams} />;
}
