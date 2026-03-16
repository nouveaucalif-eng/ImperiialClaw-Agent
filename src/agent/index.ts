import { env } from '../config/index.js';
import { chatCompletion, Message } from '../llm/client.js';
import { getAllToolDefinitions, getTool } from '../tools/registry.js';
import { getHistory, saveMessage, getFacts } from '../memory/db.js';

export async function runAgent(userId: string, input: string) {
  // 1. Prepare context
  const history = await getHistory(userId);
  const facts = await getFacts(userId);
  
  const systemPrompt = `Tu es ImperiialClaw, un assistant IA personnel de haut niveau. 
Tu tournes sur le Cloud (Render) et communiques via Telegram. Tu es capable de comprendre les messages vocaux (transcription via Groq Whisper) et de répondre par la voix (via ElevenLabs).

RÈGLES IMPORTANTES :
- L'utilisateur peut t'envoyer des messages vocaux.
- Tu peux répondre par note vocale (TTS) de manière fluide.
- ID Utilisateur actuel: ${userId}
- Faits connus sur l'utilisateur:
${facts.map(f => `- ${f.fact}`).join('\n') || 'Aucun'}

Tu dois impérativement répondre en français. Sois concis, utile, chaleureux et professionnel.`;


  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    ...history.map(h => ({ role: h.role as any, content: h.content })),
    { role: 'user', content: input }
  ];

  // Save user message
  await saveMessage(userId, 'user', input);

  let iterations = 0;
  const maxIterations = env.AGENT_MAX_ITERATIONS;

  while (iterations < maxIterations) {
    const response = await chatCompletion(messages, getAllToolDefinitions());
    
    // Add assistant response to context for next iterations (or final)
    messages.push({
      role: 'assistant',
      content: response.content || '',
      tool_calls: (response as any).tool_calls
    } as any);

    if (!(response as any).tool_calls || (response as any).tool_calls.length === 0) {
      // Final response
      await saveMessage(userId, 'assistant', response.content || '');
      return response.content;
    }

    // Handle tool calls
    for (const toolCall of (response as any).tool_calls) {
      const tool = getTool(toolCall.function.name);
      let result: string;

      if (tool) {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          result = await tool.handler(args);
        } catch (e) {
          result = `Error executing tool: ${e instanceof Error ? e.message : String(e)}`;
        }
      } else {
        result = `Tool ${toolCall.function.name} not found.`;
      }

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        name: toolCall.function.name,
        content: result
      });
    }

    iterations++;
  }

  const finalNote = "I reached my iteration limit and couldn't finish the reasoning chain.";
  await saveMessage(userId, 'assistant', finalNote);
  return finalNote;
}
