// server.js
import express from 'express';
import dotenv from 'dotenv';
import { aggregateDecisions } from './orchestrator/aggregate.js';
import { evaluateEscalation } from './orchestrator/escalate.js';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Tier-5 decision API
app.post('/decide', async (req, res) => {
  try {
    const decisions = req.body.decisions;
    if (!decisions || !Array.isArray(decisions)) {
      return res.status(400).json({ error: 'decisions array required' });
    }

    // Tier-5 aggregation
    const aggregation = aggregateDecisions(decisions);

    // Tier-5 escalation check
    const escalation = evaluateEscalation(aggregation);

    let finalDecision = aggregation.final_decision;
    let finalAuthority = 'tier-5';

    // 🚀 Tier-6 escalation integration
    if (escalation.escalate) {
      try {
        // Send Tier-5 output + humanDecision placeholder to Tier-6
        const response = await axios.post('http://localhost:3001/tier6/human-review', {
          tier5Output: { aggregation, escalation },
          humanDecision: 'pending' // Placeholder; real human decision later
        });

        finalDecision = response.data.final_decision;
        finalAuthority = response.data.authority;
        console.log('Tier-6 override applied:', response.data);
      } catch (err) {
        console.error('Error calling Tier-6:', err.message);
      }
    }

    return res.json({
      tier: 5,
      aggregation,
      escalation,
      final_authority: finalAuthority,
      final_decision: finalDecision
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', tier: 5, role: 'governed decision authority' });
});

app.listen(PORT, () => {
  console.log(`Tier-5 Decision API running on port ${PORT}`);
});
