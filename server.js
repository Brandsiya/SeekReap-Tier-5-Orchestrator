// server.js (Tier-5 Orchestrator)
import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(bodyParser.json());

const humanLog = path.resolve('./tier6/logs/human_decisions.json');

// Polling function to wait for human decision
async function waitForHumanDecision(tier5Id) {
  let decision = null;
  while (!decision) {
    if (fs.existsSync(humanLog)) {
      const logs = JSON.parse(fs.readFileSync(humanLog));
      const record = logs.find(l => l.tier5?.id === tier5Id);
      if (record && record.humanDecision && record.humanDecision !== 'pending') {
        decision = record.humanDecision;
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  return decision;
}

// Tier-5 decision endpoint
app.post('/decide', async (req, res) => {
  const inputs = req.body.decisions || [];
  const breakdown = { approved: 0, rejected: 0, pending: 0, escalate: 0, review: 0 };

  inputs.forEach(d => {
    breakdown[d.decision] = (breakdown[d.decision] || 0) + 1;
  });

  const total = inputs.length;
  const finalDecision = breakdown.approved > breakdown.rejected ? 'approve' : 'reject';
  const confidence = total === 0 ? 0 : Math.max(breakdown.approved, breakdown.rejected) / total;

  const escalation = {
    escalate: confidence < 0.6,
    reason: confidence < 0.6 ? 'Confidence below acceptable threshold' : null,
    authority: 'human-or-tier-6',
    timestamp: new Date().toISOString()
  };

  const tier5Id = uuidv4();
  const tier5Output = { id: tier5Id, aggregation: { final_decision: finalDecision, confidence }, escalation };

  let finalAuthority = 'tier-5';
  let finalDecisionResult = finalDecision;

  if (escalation.escalate) {
    try {
      // Send Tier-5 output to Tier-6 with placeholder
      await axios.post('http://localhost:3001/tier6/human-review', {
        tier5Output,
        humanDecision: 'pending'
      });

      // Wait for human decision
      finalDecisionResult = await waitForHumanDecision(tier5Id);
      finalAuthority = 'tier-6';
    } catch (err) {
      console.error('Error calling Tier-6:', err.message);
    }
  }

  res.json({
    tier: 5,
    aggregation: tier5Output.aggregation,
    escalation: tier5Output.escalation,
    final_authority: finalAuthority,
    final_decision: finalDecisionResult
  });
});

app.listen(3000, () => console.log('Tier-5 Orchestrator running on port 3000'));
