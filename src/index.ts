import express from 'express';
import { startBot } from './bot/telegram.js';

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('ImperiialClaw AI Agent is running!');
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(port, () => {
  console.log(`📡 Health check server listening on port ${port}`);
});

console.log('--- Initializing ImperiialClaw ---');

try {
  startBot();
} catch (error) {
  console.error('❌ Failed to start ImperiialClaw:', error);
  process.exit(1);
}
