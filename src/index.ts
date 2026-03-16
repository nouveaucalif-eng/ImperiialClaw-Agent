import express from 'express';
import { startBot } from './bot/telegram.js';
import { env } from './config/index.js';

const app = express();
const port = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send('ImperiialClaw AI Agent is running!');
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(port, () => {
  console.log(`📡 Health check server listening on port ${port}`);
});

console.log(`--- Initializing ImperiialClaw (Token length: ${env.TELEGRAM_BOT_TOKEN.length}) ---`);

try {
  startBot();
} catch (error) {
  console.error('❌ Failed to start ImperiialClaw:', error);
  process.exit(1);
}
