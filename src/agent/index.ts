import { env } from '../config/index.js';
import { chatCompletion, Message } from '../llm/client.js';
import { getAllToolDefinitions, getTool } from '../tools/registry.js';
import { getHistory, saveMessage, getFacts, getActiveSkill, getActiveSoul } from '../memory/db.js';
import { readSkillContent } from '../tools/skill_manager.js';
import { loadSoul } from '../tools/soul_manager.js';

export interface AgentResponse {
  content: string;
  voice?: string;
}

export async function runAgent(userId: string, input: string): Promise<AgentResponse> {
  // 1. Prepare context
  const history = await getHistory(userId);
  const facts = await getFacts(userId);
  const activeSkillName = await getActiveSkill(userId);
  const activeSoulId = await getActiveSoul(userId) || 'master';
  
  const soul = loadSoul(activeSoulId);
  
  let skillPrompt = "";
  if (activeSkillName) {
    const content = readSkillContent(activeSkillName);
    if (content) {
      skillPrompt = `\n\nCOMPÉTENCE ACTIVE (SKILL) :\nTu as acquis la compétence suivante :\n${content}`;
    }
  }
  
  const persona = soul?.persona || "Tu es ImperiialClaw, un assistant IA personnel de haut niveau.";
  const soulName = soul?.name || "ImperiialClaw";

  const systemPrompt = `Tu es actuellement sous l'identité de : ${soulName}.
${persona}

Tu tournes sur le Cloud (Render) et communiques via Telegram. Tu es capable de comprendre les messages vocaux et de répondre par la voix.

RÈGLES IMPORTANTES :
- L'utilisateur peut t'envoyer des messages vocaux.
- Tu peux répondre par note vocale (TTS).
- ID Utilisateur actuel: ${userId}
- Faits connus sur l'utilisateur:
${facts.map(f => `- ${f.fact}`).join('\n') || 'Aucun'}
${skillPrompt}

Tu dois impérativement répondre en français. Sois fidèle à ton identité actuelle (${soulName}).`;


  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    ...history.map(h => ({ role: h.role as any, content: h.content })),
    { role: 'user', content: input }
  ];

  // Save user message
  await saveMessage(userId, 'user', input);

  // Filter tools if soul has specific allowed_tools
  let toolDefinitions = getAllToolDefinitions();
  if (soul && soul.allowed_tools && !soul.allowed_tools.includes('*')) {
    toolDefinitions = toolDefinitions.filter(def => soul.allowed_tools.includes(def.function.name));
  }

  let iterations = 0;
  const maxIterations = env.AGENT_MAX_ITERATIONS;

  while (iterations < maxIterations) {
    const response = await chatCompletion(messages, toolDefinitions);
    
    // Add assistant response to context for next iterations (or final)
    messages.push({
      role: 'assistant',
      content: response.content || '',
      tool_calls: (response as any).tool_calls
    } as any);

    if (!(response as any).tool_calls || (response as any).tool_calls.length === 0) {
      // Final response
      await saveMessage(userId, 'assistant', response.content || '');
      return { 
        content: response.content || '',
        voice: soul?.voice 
      };
    }

    // Handle tool calls
    for (const toolCall of (response as any).tool_calls) {
      const tool = getTool(toolCall.function.name);
      let result: string;

      if (tool) {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          result = await tool.handler(args, userId);
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
  return { content: finalNote, voice: soul?.voice };
}
