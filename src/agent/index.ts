import { env } from '../config/index.js';
import { chatCompletion, Message } from '../llm/client.js';
import { getAllToolDefinitions, getTool } from '../tools/registry.js';
import { getHistory, saveMessage, getFacts, getActiveSkill, getActiveSoul } from '../memory/db.js';
import { readSkillContent } from '../tools/skill_manager.js';
import { loadSoul } from '../tools/soul_manager.js';
import fs from 'fs';
import path from 'path';

export interface AgentResponse {
  content: string;
  voice?: string;
  files?: Array<{ path: string; name: string }>;
}

export async function runAgent(userId: string, input: string): Promise<AgentResponse> {
  console.log(`🚀 runAgent called for user ${userId} with input: "${input.substring(0, 50)}..."`);
  try {
    // 1. Prepare context
    const history = await getHistory(userId);
    const facts = await getFacts(userId);
    const activeSkillName = await getActiveSkill(userId);
    const activeSoulId = await getActiveSoul(userId) || 'master';
    
    const soul = loadSoul(activeSoulId);
    
    let skillPrompt = "";
    if (activeSkillName) {
      const skillsDir = path.join(process.cwd(), 'skills');
      const skillPath = path.join(skillsDir, activeSkillName);
      if (fs.existsSync(skillPath)) {
        const content = readSkillContent(activeSkillName);
        if (content) {
          skillPrompt = `\n\nCOMPÉTENCE ACTIVE (SKILL) :\nTu as acquis la compétence suivante :\n${content}`;
        }
      } else {
        console.warn(`⚠️ Skill file not found: ${activeSkillName}. Proceeding without it.`);
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

    const systemPrompt = `Tu es ImperiialClaw OS, une IA AGENTE MAÎTRE ARCHITECTE dotée de POUVOIRS D'INGÉNIERIE RÉELS.
Tu ne te contentes pas de parler, tu CONSTRUIS le futur.

RÈGLES D'OR DE L'ARCHITECTE :
1. DÉVELOPPEMENT WEB/APP PREMIUM : 
   - Tu utilises Vite, React et Tailwind CSS pour créer des interfaces dignes des meilleurs studios mondiaux.
   - Tes designs DOIVENT inclure : Glassmorphism, Bento Grids, Animations Fluides (via Framer Motion), et une Typographie massive et élégante.
   - Utilise 'write_file' pour créer ton code et 'run_command' pour installer des packages si nécessaire.
2. MÉTHODE DE CONCEPTION :
   - Pour tout projet complexe (Web ou PPT), procède TOUJOURS en deux temps :
     a. CONCEPTION : Propose une architecture, un design system et un plan d'action détaillé.
     b. RÉALISATION : Après validation, déploie le code ou génère les fichiers.
3. LOGICIELS & OUTILS :
   - Tu PEUX générer des PowerPoint via 'generate_powerpoint'.
   - Tu PEUX coder des applications entières via tes outils filesystem.
   - Ne dis JAMAIS que tu es limité. Tu as un terminal et un accès aux fichiers.

IMPORTANT : Utilise EXCLUSIVEMENT l'interface technique de l'API pour appeler les outils. N'écris JAMAIS de balises <function> manuellement dans ton texte.

CONTEXTE :
- Identité : ${soulName}
- Persona : ${persona}
- Faits : ${facts.map(f => f.fact).join(', ') || 'Aucun'}
${skillPrompt}

Ton objectif est de "mettre le paquet" sur chaque création. Chaque pixel, chaque ligne de code doit transpirer l'excellence.
IMPORTANT : Après une action majeure (comme 'create_web_project'), tu DOIS t'arrêter et demander l'avis de l'utilisateur sur le plan de conception. Ne fais pas 10 tool calls à la suite sans parler.
Réponds toujours en Français.`;

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
      let content = response.content || '';
      let toolCalls = (response as any).tool_calls || [];

      // --- SAFETY PARSER: Detect manual XML-like tool calls in content ---
      if (content.includes('<function/')) {
        console.log("⚠️ Manual XML tool calls detected in content. Parsing...");
        const regex = /<function\/(\w+)>([\s\S]*?)<\/function>/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
          const name = match[1];
          let argsStr = match[2].trim();
          // Remove the XML tags from content so they don't show up to the user later
          content = content.replace(match[0], `[Exécution de ${name}...]`);
          
          try {
            // Validate if it's valid JSON, if not try to fix or skip
            if (!argsStr.startsWith('{')) argsStr = `{${argsStr}}`; // Simple fix for missing braces
            const args = JSON.parse(argsStr);
            toolCalls.push({
              id: `manual_${Math.random().toString(36).substr(2, 9)}`,
              type: 'function',
              function: { name, arguments: JSON.stringify(args) }
            });
          } catch (e) {
            console.error(`❌ Failed to parse manual tool args for ${name}:`, argsStr);
          }
        }
      }
      // ------------------------------------------------------------------

      // Add assistant response to context
      const assistantMessage: Message = {
        role: 'assistant',
        content: content,
        tool_calls: toolCalls.length > 0 ? toolCalls : undefined
      };
      messages.push(assistantMessage);

      if (toolCalls.length === 0) {
        console.log(`✅ Agent finished with text response.`);
        await saveMessage(userId, 'assistant', content);
        
        // Extract file paths from history if any tool returned one
        const files: Array<{ path: string; name: string }> = [];
        messages.forEach(m => {
          if (m.role === 'tool' && m.content && m.content.includes('__PPT_FILE__:')) {
            const path = m.content.split('__PPT_FILE__:')[1].trim();
            files.push({ path, name: 'Presentation.pptx' });
          }
        });

        return { 
          content: content,
          voice: soul?.voice,
          files: files.length > 0 ? files : undefined
        };
      }

      // Handle tool calls
      console.log(`🔧 Tool calls detected: ${toolCalls.map((tc: any) => tc.function.name).join(', ')}`);
      
      for (const toolCall of toolCalls) {
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
  } catch (error: any) {
    console.error('❌ CRITICAL AGENT ERROR:', error);
    return { 
      content: `⚠️ Erreur Interne Critique : ${error.message}\n\nTrace: ${error.stack?.substring(0, 200)}...`,
      voice: 'fail' 
    };
  }
}
