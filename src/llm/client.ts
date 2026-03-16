import Groq from 'groq-sdk';
import OpenAI from 'openai';
import { env } from '../config/index.js';

export interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_call_id?: string;
  name?: string;
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

export async function chatCompletion(messages: Message[], tools?: ToolDefinition[]) {
  try {
    // Primary: Groq
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: messages as any,
      tools: tools as any,
      tool_choice: 'auto',
    });
    
    const choice = response.choices[0].message;
    if (choice.tool_calls) {
      console.log(`📡 Groq returned ${choice.tool_calls.length} tool calls.`);
    } else {
      console.log(`📡 Groq returned text response: "${choice.content?.substring(0, 50)}..."`);
    }
    
    return choice;
  } catch (error) {
    console.error('⚠️ Groq error, attempting fallback to OpenRouter:', error);
    
    if (!openRouter) {
      throw new Error('Groq failed and OpenRouter is not configured.');
    }

    try {
      const response = await openRouter.chat.completions.create({
        model: env.OPENROUTER_MODEL,
        messages: messages as any,
        tools: tools as any,
      });
      return response.choices[0].message;
    } catch (fallbackError) {
      console.error('❌ OpenRouter fallback also failed:', fallbackError);
      throw fallbackError;
    }
  }
}
