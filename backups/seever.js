// server.js — SeekReap Tier-5 Orchestrator
import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(bodyParser.json());

/**
 * Health check
 */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', tier: 5 });
});

/**
 * Decision aggregation endpoint
 */
app.post('/decide', async (req, res) => {
  const inputs = req.body.decisions || [];

  const counts = { approved: 0, rejected: 0 };

  inputs.forEach(d => {
    if (d.decision === 'approved') counts.approved++;
    if (d.decision === 'rejected') counts.rejected++;
  });

  const total = inputs.length;
  const finalDecision =
    counts.approved >= counts.rejected ? 'approve' : 'reject';

  const confidence =
    total === 0
      ? 0
      : Math.max(counts.approved, counts.rejected) / total;

  const escalation = {
    escalate: confidence < 0.6,
    reason: confidence < 0.6 ? 'Low confidence' : null,
    authority: 'human-or-tier-6',
    timestamp: new Date().toISOString()
  };

  const tier5Output = {
    id: uuidv4(),
    aggregation: { final_decision: finalDecision, confidence },
    escalation
  };

  // Escalation path
  if (escalation.escalate) {
    try {
      await axios.post(
        process.env.TIER6_URL || 'http://localhost:3001/tier6/human-review',
        {
          tier5Output,
          humanDecision: 'pending'
        }
      );
    } catch (err) {
      console.error('Tier-6 notify failed:', err.message);
    }

    return res.json({
      tier: 5,
      aggregation: tier5Output.aggregation,
      escalation,
      final_authority: 'tier-6',
      final_decision: 'pending'
    });
  }

  // Non-escalation path
  res.json({
    tier: 5,
    aggregation: tier5Output.aggregation,
    escalation,
    final_authority: 'tier-5',
    final_decision: finalDecision
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Tier-5 Orchestrator running on port ${PORT}`);
});
