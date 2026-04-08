import { LiveDashboard } from "@/components/dashboard/live-dashboard";
import { getAgentConfig } from "@/lib/agent/config";
import { getDashboardMetrics } from "@/lib/server/dashboard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [data, config] = await Promise.all([
    getDashboardMetrics(),
    getAgentConfig(),
  ]);

  return <LiveDashboard config={config} initialData={data} />;
}
