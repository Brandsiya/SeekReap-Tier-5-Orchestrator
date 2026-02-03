/**
 * Escalation semantics for Tier-5 governance
 * Determines whether a decision must be escalated beyond automation
 */

export function evaluateEscalation(aggregationResult) {
  if (!aggregationResult) {
    throw new Error("No aggregation result provided");
  }

  const {
    final_decision,
    confidence,
    breakdown,
  } = aggregationResult;

  // Rule 1: Explicit escalation decision
  if (final_decision === "escalate") {
    return escalation("Explicit escalation decision");
  }

  // Rule 2: Low confidence
  if (confidence < 0.7) {
    return escalation("Confidence below acceptable threshold");
  }

  // Rule 3: Conflicting inputs
  const hasApproval = breakdown.approved > 0;
  const hasRejection = breakdown.rejected > 0;

  if (hasApproval && hasRejection) {
    return escalation("Conflicting Tier-4 decisions");
  }

  // Rule 4: Manual review requested
  if (breakdown.review > 0) {
    return escalation("Manual review requested by Tier-4");
  }

  // Otherwise safe to proceed
  return {
    escalate: false,
    reason: null,
    authority: "tier-5",
  };
}

function escalation(reason) {
  return {
    escalate: true,
    reason,
    authority: "human-or-tier-6",
    timestamp: new Date().toISOString(),
  };
}
