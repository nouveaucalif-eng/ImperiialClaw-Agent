import { env } from '../config/index.js';
import { chatCompletion, Message } from '../llm/client.js';
import { getAllToolDefinitions, getTool } from '../tools/registry.js';
import { getHistory, saveMessage, getFacts, getActiveSkill, getActiveSoul } from '../memory/db.js';
import { readSkillContent } from '../tools/skill_manager.js';
import { loadSoul } from '../tools/soul_manager.js';

export interface AgentResponse {
  content: string;
  voice?: string;
  files?: Array<{ path: string; name: string }>;
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

  // Filter tools if soul has specific allowed_tools
  let toolDefinitions = getAllToolDefinitions();
  console.log(`🛠️ Agent Diagnostic for ${userId}: Number of tools registered: ${toolDefinitions.length}`);
  
  if (soul && soul.allowed_tools && !soul.allowed_tools.includes('*')) {
    toolDefinitions = toolDefinitions.filter(def => soul.allowed_tools.includes(def.function.name));
  }

  const systemPrompt = `Tu es ImperiialClaw, une IA AGENTE dotée d'OUTILS.
Tu n'es pas un simple chatbot, tu DOIS agir.

RÈGLE D'OR :
- Si l'utilisateur demande une capacité, un talent, ou un "skill", tu NE RÉPONDS PAS par du texte.
- Tu DOIS IMMÉDIATEMENT appeler l'outil 'search_community_skills'.
- Si 'search_community_skills' ne donne rien de satisfaisant, tu as l'AUTORISATION de créer toi-même le contenu du skill et de l'installer avec 'install_skill'.
- Ne dis jamais "Désolé, je n'ai pas trouvé" avant d'avoir RÉELLEMENT lancé une recherche ou tenté de créer une solution.

CONTEXTE :
- Ton identité : ${soulName}
- Persona : ${persona}
- Faits connus : ${facts.map(f => f.fact).join(', ') || 'Aucun'}
${skillPrompt}

Réponds toujours en français de manière concise.`;

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
    console.log(`🤖 Planning iteration ${iterations + 1}...`);
    
    const response = await chatCompletion(messages, toolDefinitions);
    
    // Add assistant response to context
    const assistantMessage: Message = {
      role: 'assistant',
      content: response.content || '',
      tool_calls: (response as any).tool_calls
    };
    messages.push(assistantMessage);

    if (!(response as any).tool_calls || (response as any).tool_calls.length === 0) {
      console.log(`✅ Agent finished with text response.`);
      await saveMessage(userId, 'assistant', response.content || '');
      
      // Extract file paths from history if any tool returned one
      const files: Array<{ path: string; name: string }> = [];
      messages.forEach(m => {
        if (m.role === 'tool' && m.content && m.content.includes('__PPT_FILE__:')) {
          const path = m.content.split('__PPT_FILE__:')[1].trim();
          files.push({ path, name: 'Presentation.pptx' });
        }
      });

      return { 
        content: response.content || '',
        voice: soul?.voice,
        files: files.length > 0 ? files : undefined
      };
    }

    // Handle tool calls
    console.log(`🔧 Tool calls detected: ${(response as any).tool_calls.map((tc: any) => tc.function.name).join(', ')}`);
    
    for (const toolCall of (response as any).tool_calls) {
      const tool = getTool(toolCall.function.name);
      let result: string;

      if (tool) {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          console.log(`🛠️ Executing ${toolCall.function.name} with args:`, args);
          result = await tool.handler(args, userId);
        } catch (e) {
          console.error(`❌ Tool execution error (${toolCall.function.name}):`, e);
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

  const finalNote = "Désolé, j'ai atteint ma limite de réflexion pour cette tâche complexe. Peux-tu reformuler ou être plus spécifique ?";
  await saveMessage(userId, 'assistant', finalNote);
  return { content: finalNote, voice: soul?.voice };
}
