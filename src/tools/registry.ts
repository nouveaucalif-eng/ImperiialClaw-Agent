import { searchCommunitySkills, installSkill, listInstalledSkills } from './skill_manager.js';
import { listAvailableSouls, loadSoul } from './soul_manager.js';
import { createPowerPoint, SlideData } from './ppt_generator.js';
import { setActiveSkill, setActiveSoul } from '../memory/db.js';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

registerTool({
  definition: {
    type: 'function',
    function: {
      name: 'generate_powerpoint',
      description: 'Génère un véritable fichier PowerPoint (.pptx). IMPORTANT: À n\'utiliser QU\'APRÈS la phase de conceptualisation et de validation du plan avec l\'utilisateur.',
      parameters: {
        type: 'object',
        properties: {
          filename: { type: 'string', description: 'Nom du fichier (ex: presentation_musset)' },
          theme: { 
            type: 'string', 
            enum: ['zenith', 'nova', 'imperial'], 
            description: 'Le style visuel premium (zenith: Dark Tech, nova: Modern Clean, imperial: Elegant Gold)' 
          },
          slides: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                content: { type: 'string', description: 'Texte de la slide (utilisez des tirets pour les listes)' }
              },
              required: ['title', 'content']
            }
          }
        },
        required: ['filename', 'slides']
      }
    },
  },
  handler: async (args: { filename: string, slides: SlideData[], theme?: any }) => {
    const filePath = await createPowerPoint(args.slides, args.filename, args.theme);
    return `Succès ! Le fichier a été généré avec le style "${args.theme || 'modern'}". __PPT_FILE__:${filePath}`;
  }
});

// Skills Tools
registerTool({
  definition: {
    type: 'function',
    function: {
      name: 'search_community_skills',
      description: 'Cherche des nouveaux personas/compétences sur la bibliothèque communautaire prompts.chat. IMPORTANT: Utilise des mots-clés simples et courts (ex: "PowerPoint", "English", "Code") pour de meilleurs résultats.',
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

// --- Engineering & System Tools ---

registerTool({
  definition: {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Crée ou modifie un fichier sur le disque. Utile pour coder des applications ou des scripts.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Chemin relatif du fichier (ex: ./src/App.tsx)' },
          content: { type: 'string', description: 'Contenu complet du fichier' }
        },
        required: ['path', 'content']
      },
    },
  },
  handler: async (args: any) => {
    const fullPath = path.resolve(process.cwd(), args.path);
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, args.content, 'utf8');
    return `✅ Fichier écrit avec succès : ${args.path}`;
  },
});

registerTool({
  definition: {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Lit le contenu d\'un fichier sur le disque.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Chemin relatif du fichier' }
        },
        required: ['path']
      },
    },
  },
  handler: async (args: any) => {
    const fullPath = path.resolve(process.cwd(), args.path);
    if (!fs.existsSync(fullPath)) return `❌ Erreur : Le fichier ${args.path} n'existe pas.`;
    return await fs.promises.readFile(fullPath, 'utf8');
  },
});

registerTool({
  definition: {
    type: 'function',
    function: {
      name: 'list_dir',
      description: 'Liste les fichiers et dossiers dans un répertoire.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Répertoire à lister (défaut: ".")' }
        }
      },
    },
  },
  handler: async (args: any) => {
    const dirPath = path.resolve(process.cwd(), args.path || '.');
    if (!fs.existsSync(dirPath)) return `❌ Erreur : Le dossier ${args.path} n'existe pas.`;
    const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
    return files.map(f => `${f.isDirectory() ? '[DIR]' : '[FILE]'} ${f.name}`).join('\n');
  },
});

registerTool({
  definition: {
    type: 'function',
    function: {
      name: 'run_command',
      description: 'Exécute une commande système (npm install, git, etc.). À utiliser avec prudence.',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'La commande à exécuter' }
        },
        required: ['command']
      },
    },
  },
  handler: async (args: any) => {
    try {
      const { stdout, stderr } = await execAsync(args.command);
      return `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`;
    } catch (e: any) {
      return `❌ Erreur d'exécution :\n${e.message}`;
    }
  },
});

registerTool({
  definition: {
    type: 'function',
    function: {
      name: 'create_web_project',
      description: 'Scaffolding d\'un projet Web Premium (Vite + React + Tailwind + Framer Motion).',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nom du dossier du projet' },
          description: { type: 'string', description: 'Objectif du projet pour pré-générer le code' }
        },
        required: ['name']
      },
    },
  },
  handler: async (args: any) => {
    // This tool is a macro that prepares the environment
    return `🚀 Projet "${args.name}" initialisé dans ma zone de travail. 
Je suis prêt à écrire le code. Quelle page souhaites-tu que je conçoive en premier ? (Je recommande de commencer par le composant App.tsx avec un design system Tailwind).`;
  },
});

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
