// server.js (Tier-6 Human Review)
import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(bodyParser.json());

const logDir = path.resolve('./logs');
const auditLogFile = path.join(logDir, 'human_decisions.json');

// Ensure logs directory exists
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

// Human review endpoint
app.post('/tier6/human-review', (req, res) => {
  const { tier5Output, humanDecision } = req.body;
  if (!tier5Output || !tier5Output.id) {
    return res.status(400).json({ error: 'tier5Output with unique id required' });
  }

  const record = {
    timestamp: new Date().toISOString(),
    tier5: tier5Output,
    humanDecision: humanDecision || 'pending',
    authority: 'tier-6'
  };

  // Read current logs
  const logs = fs.existsSync(auditLogFile) ? JSON.parse(fs.readFileSync(auditLogFile)) : [];

  // Check if record for this tier5 ID exists
  const existing = logs.find(r => r.tier5.id === tier5Output.id);
  if (existing) {
    existing.humanDecision = humanDecision || existing.humanDecision;
    existing.timestamp = record.timestamp;
  } else {
    logs.push(record);
  }

  fs.writeFileSync(auditLogFile, JSON.stringify(logs, null, 2));

  res.json({
    final_decision: humanDecision || 'pending',
    reason: 'Human override / policy exception',
    authority: 'tier-6',
    timestamp: record.timestamp
  });
});

app.listen(3001, () => {
  console.log('Tier-6 Human Review API running on port 3001');
});
