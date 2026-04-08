import { AgentConfigForm } from "@/components/agent/agent-config-form";
import { getAgentConfig } from "@/lib/agent/config";
import { readRuntimeState } from "@/lib/runtime-store";

export const dynamic = "force-dynamic";

export default async function AgentPage() {
  const [config, runtime] = await Promise.all([
    getAgentConfig(),
    readRuntimeState(),
  ]);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-muted-foreground text-sm uppercase tracking-[0.24em]">
          Agent
        </p>
        <h1 className="font-heading text-4xl">Strategy Controls</h1>
        <p className="max-w-2xl text-muted-foreground text-sm">
          Configure symbols, risk guardrails, cadence, and model selection.
          Start and stop only control the separate worker process; strategy
          enablement remains explicit.
        </p>
      </div>

      <AgentConfigForm initialConfig={config} runtime={runtime} />
    </section>
  );
}
