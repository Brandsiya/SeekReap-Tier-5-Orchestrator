import fs from 'fs';
import path from 'path';

const auditLogFile = path.resolve('./logs/human_decisions.json');

export function handleEscalation(tier5Output, humanDecision) {
  const record = {
    timestamp: new Date().toISOString(),
    tier5: tier5Output,
    humanDecision,
    authority: 'tier-6'
  };

  // Append to audit log
  const logs = fs.existsSync(auditLogFile)
    ? JSON.parse(fs.readFileSync(auditLogFile))
    : [];
  logs.push(record);
  fs.writeFileSync(auditLogFile, JSON.stringify(logs, null, 2));

  return {
    final_decision: humanDecision,
    reason: 'Human override / policy exception',
    authority: 'tier-6',
    timestamp: record.timestamp
  };
}
