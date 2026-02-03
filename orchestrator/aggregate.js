/**
 * Aggregate multiple Tier-4 decisions into a single governed outcome
 */

export function aggregateDecisions(decisions = []) {
  if (!Array.isArray(decisions) || decisions.length === 0) {
    throw new Error("No decisions provided for aggregation");
  }

  const total = decisions.length;

  const counts = {
    approved: 0,
    rejected: 0,
    pending: 0,
    escalate: 0,
    review: 0,
  };

  for (const d of decisions) {
    if (counts[d.decision] !== undefined) {
      counts[d.decision]++;
    }
  }

  // Rule 1: Escalation dominates
  if (counts.escalate > 0) {
    return buildResult("escalate", counts, total, "Escalation triggered by Tier-4");
  }

  // Rule 2: Rejection majority
  if (counts.rejected / total >= 0.5) {
    return buildResult("reject", counts, total, "Majority rejection");
  }

  // Rule 3: Approval majority
  if (counts.approved / total > 0.5) {
    return buildResult("approve", counts, total, "Majority approval");
  }

  // Rule 4: Default hold
  return buildResult("hold", counts, total, "No decisive majority");
}

/**
 * Build structured aggregation output
 */
function buildResult(finalDecision, counts, total, rationale) {
  return {
    final_decision: finalDecision,
    confidence: calculateConfidence(finalDecision, counts, total),
    rationale,
    breakdown: counts,
    total_inputs: total,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Confidence score (0–1)
 */
function calculateConfidence(finalDecision, counts, total) {
  if (finalDecision === "approve") {
    return counts.approved / total;
  }
  if (finalDecision === "reject") {
    return counts.rejected / total;
  }
  if (finalDecision === "escalate") {
    return 1.0;
  }
  return 0.5;
}
