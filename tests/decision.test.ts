import { describe, expect, it } from "vitest";
import { normalizeDecision } from "@/lib/agent/decision";
import { DECISION_ACTION } from "@/lib/domain";

describe("normalizeDecision", () => {
  it("parses strict JSON payloads", () => {
    const decision = normalizeDecision(
      JSON.stringify({ action: "BUY", reason: "Oversold", confidence: 0.8 })
    );
    expect(decision.action).toBe(DECISION_ACTION.BUY);
    expect(decision.reason).toContain("Oversold");
  });

  it("falls back to free-form SELL text", () => {
    const decision = normalizeDecision("SELL because risk spiked");
    expect(decision.action).toBe(DECISION_ACTION.SELL);
  });

  it("throws when the payload has no valid action", () => {
    expect(() => normalizeDecision("Wait and see")).toThrow();
  });
});
