import "dotenv/config";
import { runAgentLoop } from "@/lib/agent/loop";

runAgentLoop().catch(console.error);
