import { getDashboardMetrics } from "@/lib/server/dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

export function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      const send = async () => {
        const data = await getDashboardMetrics();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      await send();
      const interval = setInterval(() => {
        send().catch(() => undefined);
      }, 2000);
      controller.enqueue(encoder.encode("event: ready\ndata: ok\n\n"));

      return () => clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
