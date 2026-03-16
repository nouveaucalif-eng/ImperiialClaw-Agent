import { searchCommunitySkills, installSkill, listInstalledSkills } from './skill_manager.js';
import { listAvailableSouls } from './soul_manager.js';
import { setActiveSkill, setActiveSoul } from '../memory/db.js';

export type ToolFunction = (args: any, userId?: string) => Promise<string> | string;

export interface Tool {
  definition: {
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
      };
    };
  };
  handler: ToolFunction;
}

const registry: Map<string, Tool> = new Map();

export function registerTool(tool: Tool) {
  registry.set(tool.definition.function.name, tool);
}

export function getTool(name: string) {
  return registry.get(name);
}

export function getAllToolDefinitions() {
  return Array.from(registry.values()).map(t => t.definition);
}

// --- Specific Tools Registration ---

// Souls Management
registerTool({
  definition: {
    type: 'function',
    function: {
      name: 'list_available_souls',
      description: 'Liste les "Âmes" (personnalités profondes) disponibles pour le bot.',
      parameters: { type: 'object', properties: {} },
    },
  },
  handler: () => listAvailableSouls(),
});

registerTool({
  definition: {
    type: 'function',
    function: {
      name: 'switch_soul',
      description: 'Change l\'âme active du bot. Cela modifie sa personnalité, sa voix et ses outils.',
      parameters: {
        type: 'object',
        properties: {
          soulId: { type: 'string', description: 'L\'ID de l\'âme à activer (ex: "master", "shadow")' }
        },
        required: ['soulId']
      },
    },
  },
  handler: async (args: any, userId?: string) => {
    if (!userId) return "Erreur: ID utilisateur manquant.";
    await setActiveSoul(userId, args.soulId);
    return `✅ Transition vers l'âme "${args.soulId}" effectuée.`;
  },
});

// Skills Tools
registerTool({
  definition: {
    type: 'function',
    function: {
      name: 'search_community_skills',
      description: 'Cherche des nouveaux personas/compétences sur la bibliothèque communautaire prompts.chat.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Le mot-clé pour la recherche (ex: "Linux Terminal", "Travel Guide")' }
        },
        required: ['query']
      },
    },
  },
  handler: (args: any) => searchCommunitySkills(args.query),
});

registerTool({
  definition: {
    type: 'function',
    function: {
      name: 'install_skill',
      description: 'Installe un nouveau persona/compétence localement.',
      parameters: {
        type: 'object',
        properties: {
          act: { type: 'string', description: 'Le nom du rôle/persona' },
          prompt: { type: 'string', description: 'Le contenu complet du prompt à installer' }
        },
        required: ['act', 'prompt']
      },
    },
  },
  handler: (args: any) => installSkill(args.act, args.prompt),
});

registerTool({
  definition: {
    type: 'function',
    function: {
      name: 'list_installed_skills',
      description: 'Liste les compétences (personas) actuellement installées dans le bot.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  handler: () => listInstalledSkills(),
});

registerTool({
  definition: {
    type: 'function',
    function: {
      name: 'activate_skill',
      description: 'Active un persona spécifique parmi ceux installés localement.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Le nom du fichier skill à activer (ex: "linux_terminal.md"). Utilise "none" pour désactiver.' }
        },
        required: ['name']
      },
    },
  },
  handler: async (args: any, userId?: string) => {
    if (!userId) return "Erreur: ID utilisateur manquant.";
    const skillToSet = args.name.toLowerCase() === 'none' ? null : args.name;
    await setActiveSkill(userId, skillToSet);
    return `✅ Persona "${args.name}" activé. Le bot changera de comportement dès le prochain message.`;
  },
});

// Initial Tool: get_current_time
registerTool({
  definition: {
    type: 'function',
    function: {
      name: 'get_current_time',
      description: 'Get the current date and time.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  handler: () => {
    return new Date().toLocaleString('fr-FR', {
      timeZone: 'Europe/Paris',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  },
});
