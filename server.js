/**
 * Tier-5 Decision API
 * Governs aggregation + escalation of Tier-4 outputs
 */

import express from "express";
import dotenv from "dotenv";

import { aggregateDecisions } from "./orchestrator/aggregate.js";
import { evaluateEscalation } from "./orchestrator/escalate.js";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

/**
 * POST /decide
 * Body: { decisions: [ { decision: "approved" | "rejected" | "review" } ] }
 */
app.post("/decide", (req, res) => {
  try {
    const { decisions } = req.body;

    if (!Array.isArray(decisions) || decisions.length === 0) {
      return res.status(400).json({
        error: "decisions array is required",
      });
    }

    // STEP 1: Aggregate Tier-4 decisions
    const aggregation = aggregateDecisions(decisions);

    // STEP 2: Evaluate escalation
    const escalation = evaluateEscalation(aggregation);

    // STEP 3: Final governed response
    return res.json({
      tier: 5,
      aggregation,
      escalation,
      final_authority: escalation.escalate
        ? escalation.authority
        : "tier-5",
    });

  } catch (err) {
    console.error("Tier-5 error:", err);
    return res.status(500).json({
      error: "Tier-5 decision failure",
    });
  }
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    tier: 5,
    role: "governed decision authority",
  });
});

app.listen(PORT, () => {
  console.log(`Tier-5 Decision API running on port ${PORT}`);
});
