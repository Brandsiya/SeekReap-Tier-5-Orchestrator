#!/bin/bash

echo "==> Pulling latest Tier-5 code..."
git pull origin master

echo "==> Installing dependencies..."
npm install

echo "==> Clearing logs..."
> tier5.log
> logs/human_decisions.json

echo "==> Committing any changes..."
git add .
git commit -m "Auto-deploy Tier-5 updates" 2>/dev/null || echo "No changes to commit"

echo "==> Pushing to GitHub..."
git push origin master

echo "==> Starting Tier-5 locally (for testing)..."
nohup node server.js > tier5.log 2>&1 &

echo "==> Tier-5 is running. Logs at tier5.log"
