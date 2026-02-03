// server.js — SeekReap Tier-5 Orchestrator (CommonJS)

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(bodyParser.json());

/**
 * Health check
 */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', tier: 5 });
});

/**
 * Decision aggregation
 */
app.post('/decide', async (req, res) => {
  const inputs = req.body.decisions || [];

  let approved = 0;
  let rejected = 0;

  for (const d of inputs) {
    if (d.decision === 'approved') approved++;
    if (d.decision === 'rejected') rejected++;
  }

  const total = inputs.length;
  const finalDecision = approved >= rejected ? 'approve' : 'reject';
  const confidence =
    total === 0 ? 0 : Math.max(approved, rejected) / total;

  const escalation = {
    escalate: confidence < 0.6,
    reason: confidence < 0.6 ? 'Low confidence' : null,
    authority: 'human-or-tier-6',
    timestamp: new Date().toISOString()
  };

  const aggregation = {
    final_decision: finalDecision,
    confidence
  };

  // Escalation path
  if (escalation.escalate) {
    try {
      await axios.post(
        process.env.TIER6_URL || 'http://localhost:3001/tier6/human-review',
        {
          id: uuidv4(),
          aggregation,
          escalation
        }
      );
    } catch (err) {
      console.error('Tier-6 notify failed:', err.message);
    }

    return res.json({
      tier: 5,
      aggregation,
      escalation,
      final_authority: 'tier-6',
      final_decision: 'pending'
    });
  }

  // Non-escalation path
  res.json({
    tier: 5,
    aggregation,
    escalation,
    final_authority: 'tier-5',
    final_decision: finalDecision
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Tier-5 running on port ${PORT}`);
});
