import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().trim().transform(v => v.replace(/^["']|["']$/g, '')),
  TELEGRAM_ALLOWED_USER_IDS: z.string().transform((val) => val.split(',').map((id) => id.trim())),
  GROQ_API_KEY: z.string().trim().transform(v => v.replace(/^["']|["']$/g, '')),
  OPENROUTER_API_KEY: z.string().optional().transform(v => v?.trim().replace(/^["']|["']$/g, '')),
  OPENROUTER_MODEL: z.string().default('openrouter/auto'),
  AGENT_MAX_ITERATIONS: z.string().transform(Number).default('40'),
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVENLABS_VOICE_ID: z.string().optional(),
  EDGE_TTS_VOICE: z.string().default('fr-FR-EloiseNeural'), // More natural French female
});






const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Configuration error:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
