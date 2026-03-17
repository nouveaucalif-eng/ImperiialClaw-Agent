import Groq from 'groq-sdk';
import OpenAI from 'openai';
import { env } from '../config/index.js';

export interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | null;
  tool_call_id?: string;
  name?: string;
  tool_calls?: any[];
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: object;
  };
}

const groq = new Groq({ apiKey: env.GROQ_API_KEY });
const openRouter = env.OPENROUTER_API_KEY
  ? new OpenAI({
      apiKey: env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    })
  : null;

// Ordered list of OpenRouter fallback models to try in sequence
const OPENROUTER_FALLBACK_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemini-2.0-flash-001',
  'mistralai/mistral-7b-instruct:free',
];

async function tryOpenRouter(messages: Message[], tools?: ToolDefinition[]): Promise<any> {
  if (!openRouter) throw new Error('OpenRouter is not configured (missing OPENROUTER_API_KEY).');

  for (const model of OPENROUTER_FALLBACK_MODELS) {
    try {
      console.log(`🔄 Trying OpenRouter model: ${model}...`);
      const response = await openRouter.chat.completions.create({
        model,
        messages: messages as any,
        tools: tools as any,
      });
      const choice = response.choices[0].message;
      
      // Safety check: Free models sometimes silently return empty content when overloaded 
      if (!choice.content && (!choice.tool_calls || choice.tool_calls.length === 0)) {
         throw new Error(`Model ${model} returned empty response (no content, no tools)`);
      }
      
      console.log(`✅ OpenRouter (${model}) responded successfully.`);
      return choice;
    } catch (err: any) {
      console.warn(`⚠️ OpenRouter model ${model} failed: ${err?.message?.substring(0, 100)}`);
      // Continue to next model
    }
  }
  throw new Error('All OpenRouter fallback models failed.');
}

export async function chatCompletion(messages: Message[], tools?: ToolDefinition[]) {
  // ── STRATEGY 1: Groq (primary - fast & free) ──────────────────────────────
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: messages as any,
      tools: tools as any,
      tool_choice: 'auto',
    });

    const choice = response.choices[0].message;
    
    // Safety check: if response is completely empty, treat as failure to trigger Fallback
    if (!choice.content && (!choice.tool_calls || choice.tool_calls.length === 0)) {
       throw new Error(`Groq returned empty response (no content, no tools)`);
    }
    
    if (choice.tool_calls) {
      console.log(`📡 Groq returned ${choice.tool_calls.length} tool calls.`);
    } else {
      console.log(`📡 Groq returned text response: "${choice.content?.substring(0, 50)}..."`);
    }
    return choice;

  } catch (error: any) {
    const status = error?.status;
    const code = error?.error?.error?.code;

    // ── STRATEGY 2: Groq hallucinated tool format → retry as plain text ──────
    if (status === 400 && code === 'tool_use_failed') {
      console.warn('⚠️ Groq tool_use_failed. Retrying WITHOUT tools (Safety Parser mode)...');
      try {
        const retryResponse = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: messages as any,
          tool_choice: 'none',
        });
        const retryChoice = retryResponse.choices[0].message;
        console.log(`📡 Groq no-tool retry succeeded.`);
        return retryChoice;
      } catch (retryError: any) {
        const retryCode = retryError?.error?.error?.code;
        // If even the retry hits rate limits, go to OpenRouter
        if (retryCode !== 'rate_limit_exceeded') {
          console.error('❌ Groq retry failed (non-rate-limit):', retryError?.message);
        }
        console.warn('⬇️ Groq retry also failed. Escalating to OpenRouter...');
      }
    } else if (status === 429 || code === 'rate_limit_exceeded') {
      console.warn('⚠️ Groq daily token limit reached. Switching to OpenRouter...');
    } else {
      console.error('⚠️ Groq unexpected error:', error?.message);
    }

    // ── STRATEGY 3: OpenRouter multi-model waterfall ──────────────────────────
    return tryOpenRouter(messages, tools);
  }
}
