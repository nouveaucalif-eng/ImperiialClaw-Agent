import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().trim(),
  TELEGRAM_ALLOWED_USER_IDS: z.string().transform((val) => val.split(',').map((id) => id.trim())),
  GROQ_API_KEY: z.string(),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default('openrouter/auto'),
  DB_PATH: z.string().default('./data/memory.db'),
  AGENT_MAX_ITERATIONS: z.string().transform(Number).default('5'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Configuration error:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
