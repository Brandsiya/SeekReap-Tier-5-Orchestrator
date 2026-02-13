require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Logs folder
const LOG_DIR = path.join(__dirname, 'logs');
const ARCHIVE_DIR = path.join(LOG_DIR, 'archive');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);
if (!fs.existsSync(ARCHIVE_DIR)) fs.mkdirSync(ARCHIVE_DIR);

// Log utility
function logDecision(data) {
    const timestamp = new Date().toISOString();
    const logPath = path.join(LOG_DIR, 'human_decisions.json');
    const archivePath = path.join(ARCHIVE_DIR, `human_decisions_${Date.now()}.json`);

    fs.appendFileSync(logPath, JSON.stringify({ timestamp, ...data }) + '\n');
    fs.writeFileSync(archivePath, JSON.stringify({ timestamp, ...data }));
}

// Dummy Hybrid Rules + AI processing
async function processVideoTask(task) {
    const ruleCheck = task.metadata.usesThirdPartyMusic ? 'Flagged for review' : 'Clean';
    const aiPrediction = Math.random() > 0.5 ? 'Pass' : 'Review';
    const finalDecision = (ruleCheck === 'Clean' && aiPrediction === 'Pass') ? 'Approved' : 'Manual Review';
    logDecision({
        taskId: uuidv4(),
        title: task.metadata.title,
        ruleCheck,
        aiPrediction,
        finalDecision
    });
    return { ruleCheck, aiPrediction, finalDecision };
}

// POST endpoint
app.post('/task', async (req, res) => {
    try {
        const task = req.body;
        const result = await processVideoTask(task);
        res.json({ success: true, result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Health check
app.get('/health', (req, res) => res.send('Tier-5 is healthy ✅'));

app.listen(PORT, () => console.log(`Tier-5 running on port ${PORT}`));
