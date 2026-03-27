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

export async function runAgent(
  userId: string, 
  input: string, 
  onProgress?: (msg: string) => void
): Promise<AgentResponse> {
  console.log(`🚀 runAgent called for user ${userId} with input: "${input.substring(0, 50)}..."`);
  try {
    // 1. Prepare context
    let history = await getHistory(userId);
    const facts = await getFacts(userId);
    const activeSkillName = await getActiveSkill(userId);
    const activeSoulId = await getActiveSoul(userId) || 'master';
    
    // TRUNCATE HISTORY TO SAVE TOKENS (Keep last 15 messages)
    if (history.length > 15) {
      console.log(`✂️ Trimming history for ${userId} (from ${history.length} to 15 messages)`);
      history = history.slice(-15);
    }
    
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

    const currentFiles = fs.readdirSync(process.cwd());
    const diskStatus = `\nÉTAT RÉEL DU DISQUE (VÉRIFIÉ) :\nFichiers/Dossiers présents : ${currentFiles.join(', ')}`;

    const systemPrompt = `// IDENTITY & CORE DIRECTIVE
Tu es ImperiialClaw OS (v2.0), un AGENT MAÎTRE ARCHITECTE d'ÉLITE.
Ton unique but est de transformer la vision de l'utilisateur en RÉALITÉ TECHNIQUE PARFAITE.
Tu n'es pas un chatbot, tu es un INGÉNIEUR EXÉCUTEUR.

// OPERATIONAL PROTOCOL (STRICT)
1. CRITICAL ANALYSIS: Avant d'agir, analyse la demande. Si elle est complexe, crée un PLAN de fichiers.
2. ENGINEERING MODE (THE MIRACLE MAKER): 
   - Application DOIT être (Vite + React + Tailwind).
   - INSTALLE (run_command) et UTILISE obligatoirement 'framer-motion' pour les animations et 'lucide-react' pour les icônes.
   - Design Premium obligatoire : Glassmorphism ultra-fin, Gradients animés, Bento Grids au pixel près.
   - PENSE SEO & MEDIA : Utilise 'get_seo_package' et 'search_images' TOUJOURS avant de finaliser un site commercial.
3. DISK CONTEXT: Utilise toujours 'projectDir' pour tes outils de développement.
4. QUALITY ASSURANCE: Exécute 'check_code_compilation' AVANT de déployer. Si ça échoue, CORRIGE LE CODE MÊME SANS DEMANDER.
5. NO YAPPING: Une fois le plan validé, exécute TOUTES les étapes d'un coup.

// SYSTEM CONTEXT
- Identité : ${soulName}
- Persona : ${persona}
- Faits Utilisateur : ${facts.map(f => f.fact).join(', ') || 'Inconnus'}
- Dossier Actuel (Vérifié) : ${currentFiles.join(', ')}
${skillPrompt}

// DESIGN TOKENS (PREMIUM ONLY)
- Dark Mode: bg-slate-950, text-slate-50
- Primary: blue-500, secondary: cyan-400
- Glass: bg-white/10 backdrop-blur-lg border border-white/20

// ACTION RULE
Réponds toujours en Français. Si tu décides d'utiliser un outil, ne perds pas de temps en explications. AGIS.`;

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
      
      // Heartbeat: If it's taking too long, send a progress message to keep user patient
      if (iterations > 0 && iterations % 5 === 0) {
        console.log("💓 Sending heartbeat message to prevent silence...");
        if (onProgress) onProgress(`Je travaille toujours sur ta demande... (Étape ${iterations}/${maxIterations})`);
      }

      const response = await chatCompletion(messages, toolDefinitions);
      let content = response.content || '';
      let toolCalls = (response as any).tool_calls || [];

      // --- SAFETY PARSER 1: Detect manual XML-like tool calls ---
      if (content.includes('<function/')) {
        console.log("⚠️ Manual XML tool calls detected. Parsing...");
        const regex = /<function\/(\w+)([^>]*)>([\s\S]*?)<\/function>/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
          const name = match[1];
          const tagParams = match[2].trim();
          const betweenContent = match[3].trim();
          let argsStr = tagParams || betweenContent;
          content = content.replace(match[0], `[Exécution de ${name}...]`);
          try {
            if (argsStr) {
               if (!argsStr.startsWith('{')) argsStr = `{${argsStr}}`;
               const args = JSON.parse(argsStr);
               toolCalls.push({
                 id: `manual_xml_${Math.random().toString(36).substr(2, 9)}`,
                 type: 'function',
                 function: { name, arguments: JSON.stringify(args) }
               });
            }
          } catch (e) { console.error(`❌ Failed to parse XML tool args:`, e); }
        }
      }

      // --- SAFETY PARSER 2: Detect 'assistantcommentary' hallucinated format ---
      if (content.includes('assistantcommentary to=functions.')) {
        console.log("⚠️ assistantcommentary tool calls detected. Parsing...");
        // Match: assistantcommentary to=functions.NAME json{...}
        // Note: We use a more relaxed regex and verify with JSON.parse
        const regex = /assistantcommentary to=functions\.(\w+)\s+json(\{[\s\S]+?\})(?=assistant|$)/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
          const name = match[1];
          const argsStr = match[2];
          console.log(`🔍 Found potential commentary call: ${name}`);
          
          try {
            // Try to fix common JSON truncation if any (very basic)
            let cleanedArgs = argsStr.trim();
            if (!cleanedArgs.endsWith('}')) cleanedArgs += '}';
            
            const args = JSON.parse(cleanedArgs);
            toolCalls.push({
              id: `manual_comm_${Math.random().toString(36).substr(2, 9)}`,
              type: 'function',
              function: { name, arguments: JSON.stringify(args) }
            });
            content = content.replace(match[0], `[Auto-fix: Exécution de ${name}]`);
          } catch (e) { 
            console.error(`❌ Failed to parse commentary tool args for ${name}. Raw string: ${argsStr.substring(0, 50)}...`); 
          }
        }
      }
      // ------------------------------------------------------------------
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
