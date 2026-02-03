import express from 'express';
import { handleEscalation } from './humanReview.js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Tier-6 API endpoint
app.post('/tier6/human-review', (req, res) => {
  const { tier5Output, humanDecision } = req.body;

  if (!tier5Output || !humanDecision) {
    return res.status(400).json({ error: 'tier5Output and humanDecision are required' });
  }

  const result = handleEscalation(tier5Output, humanDecision);
  res.json(result);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', tier: 6, role: 'human override authority' });
});

app.listen(PORT, () => {
  console.log(`Tier-6 Human Review API running on port ${PORT}`);
});
