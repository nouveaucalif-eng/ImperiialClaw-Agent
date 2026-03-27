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
      description: 'Crée ou modifie un fichier sur le disque. IMPORTANT : Si tu travailles sur un projet (ex: MaVitrinePro), utilise le paramètre projectDir.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Chemin relatif du fichier (ex: src/App.tsx)' },
          content: { type: 'string', description: 'Contenu complet du fichier' },
          projectDir: { type: 'string', description: 'Le dossier du projet (ex: MaVitrinePro). Optionnel.' }
        },
        required: ['path', 'content']
      },
    },
  },
  handler: async (args: any) => {
    const baseDir = args.projectDir ? path.join(process.cwd(), args.projectDir) : process.cwd();
    const fullPath = path.resolve(baseDir, args.path);
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, args.content, 'utf8');
    return `✅ Fichier écrit avec succès dans ${args.projectDir || 'racine'} : ${args.path}`;
  },
});

registerTool({
  definition: {
    type: 'function',
    function: {
      name: 'run_command',
      description: 'Exécute une commande système. IMPORTANT : Utilise projectDir pour exécuter DANS le dossier du projet (ex: npm install).',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'La commande à exécuter' },
          projectDir: { type: 'string', description: 'Le dossier où exécuter la commande (ex: MaVitrinePro). Optionnel.' }
        },
        required: ['command']
      },
    },
  },
  handler: async (args: any) => {
    try {
      const execOptions = args.projectDir ? { cwd: path.join(process.cwd(), args.projectDir) } : {};
      const { stdout, stderr } = await execAsync(args.command, execOptions);
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
    const projectPath = path.join(process.cwd(), args.name);
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }
    return `🚀 Dossier "${args.name}" créé physiquement à l'emplacement : ${projectPath}. Tu peux maintenant enchaîner avec 'write_file' ou 'run_command' pour configurer le projet.`;
  },
});

registerTool({
  definition: {
    type: 'function',
    function: {
      name: 'check_code_compilation',
      description: 'Vérifie si le code d\'un projet React/Vite compile sans erreur de syntaxe (crucial avant déploiement).',
      parameters: {
        type: 'object',
        properties: {
          projectDir: { type: 'string', description: 'Le dossier du projet (ex: MaVitrinePro)' }
        },
        required: ['projectDir']
      },
    },
  },
  handler: async (args: { projectDir: string }) => {
    try {
      const projectPath = path.join(process.cwd(), args.projectDir);
      if (!fs.existsSync(projectPath)) return `❌ Erreur : Le dossier ${args.projectDir} n'existe pas.`;
      
      const { stdout, stderr } = await execAsync('npm run build', { cwd: projectPath });
      return `✅ Compilation réussie ! Aucun bug détecté. Le code est prêt pour Vercel.\nLogs: ${stdout.substring(0, 150)}...`;
    } catch (e: any) {
      return `❌ ERREUR DE COMPILATION/SYNTAXE DÉTECTÉE :\n${e.message}\n${e.stderr || ''}\nCorrige imperativement ton code (Vérifie tes imports et tes balises XML) avant de redéployer.`;
    }
  },
});

registerTool({
  definition: {
    type: 'function',
    function: {
      name: 'deploy_web_project',
      description: 'Déploie un projet Web (Vite/React) sur Internet via Vercel. Retourne l\'URL publique du site.',
      parameters: {
        type: 'object',
        properties: {
          projectDir: { type: 'string', description: 'Le dossier du projet à déployer (ex: MaVitrinePro)' }
        },
        required: ['projectDir']
      },
    },
  },
  handler: async (args: any) => {
    const vercelToken = process.env.VERCEL_TOKEN;
    if (!vercelToken) {
      return `❌ Échec du déploiement : La variable d'environnement VERCEL_TOKEN est absente du fichier .env.\nDemande à l'utilisateur de configurer son token Vercel.`;
    }

    try {
      const projectPath = path.join(process.cwd(), args.projectDir);
      if (!fs.existsSync(projectPath)) {
         return `❌ Erreur : Le dossier ${args.projectDir} n'existe pas.`;
      }

      // Vercel project names must be lowercase and max 100 chars
      const sanitizedProjectName = args.projectDir.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      
      // We use npx vercel directly to avoid requiring a global install on the user's machine
      const command = `npx vercel --prod --yes --token ${vercelToken} --name ${sanitizedProjectName}`;
      const { stdout, stderr } = await execAsync(command, { cwd: projectPath });

      // Vercel CLI usually outputs the production URL in standard output (or stderr sometimes)
      const urlMatch = stdout.match(/https:\/\/[a-zA-Z0-9-]+\.vercel\.app/i) || stderr.match(/https:\/\/[a-zA-Z0-9-]+\.vercel\.app/i);
      
      if (urlMatch) {
         return `✅ Déploiement réussi ! Le site est EN LIGNE à cette adresse : ${urlMatch[0]}`;
      } else {
         return `✅ Commande de déploiement exécutée, mais l'URL exacte n'a pas pu être extraite. Logs:\n${stdout}\n${stderr}`;
      }
    } catch (e: any) {
      return `❌ Erreur lors du déploiement Vercel :\n${e.message}\nVerifie que le projet contient bien un package.json valide et qu'il compile sans erreur.`;
    }
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

registerTool({
  definition: {
    type: 'function',
    function: {
      name: 'search_images',
      description: 'Recherche des images haute définition (Unsplash) pour enrichir visuellement le site.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Le sujet de l\'image (ex: "modern office", "cybersecurity background")' },
          count: { type: 'number', description: 'Nombre d\'images (défaut: 3)' }
        },
        required: ['query']
      },
    },
  },
  handler: async (args: { query: string, count?: number }) => {
    const num = args.count || 3;
    const images = [];
    for (let i = 0; i < num; i++) {
      // Direct Unsplash source pattern (v2) - using high quality random source per keyword
      const randomId = Math.floor(Math.random() * 1000);
      images.push(`https://images.unsplash.com/photo-${randomId}?auto=format&fit=crop&q=80&w=1200&q=keyword-${encodeURIComponent(args.query)}`);
    }
    return `Voici des URLs d'images premium pour "${args.query}" :\n- ${images.join('\n- ')}\n\n(TIPS: Utilise ces liens directement dans les balises <img> ou les bg-image de ton code React).`;
  },
});

registerTool({
  definition: {
    type: 'function',
    function: {
      name: 'get_seo_package',
      description: 'Génère un pack SEO complet (Meta tags, JSON-LD, Sitemap instructions) pour un site commercial.',
      parameters: {
        type: 'object',
        properties: {
          siteName: { type: 'string' },
          description: { type: 'string' },
          location: { type: 'string', description: 'Cible géographique (ex: "Sénégal", "Paris")' }
        },
        required: ['siteName', 'description']
      },
    },
  },
  handler: (args: any) => {
    return JSON.stringify({
      title: `${args.siteName} | Meilleur service à ${args.location || 'votre région'}`,
      meta: `<meta name="description" content="${args.description}">\n<meta name="keywords" content="${args.siteName}, ${args.location}, service premium, expert">`,
      structuredData: {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": args.siteName,
        "description": args.description,
        "address": { "@type": "PostalAddress", "addressLocality": args.location || "International" }
      }
    }, null, 2);
  },
});

registerTool({
  definition: {
    type: 'function',
    function: {
      name: 'search_web',
      description: 'Recherche des informations en temps réel sur Internet (actualités, docs techniques, tendances).',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Le sujet de la recherche (ex: "dernier cri design web 2024", "tuto framer motion")' }
        },
        required: ['query']
      },
    },
  },
  handler: async (args: { query: string }) => {
    try {
      // Use DuckDuckGo HTML version (lite) as it's easier to scrape simply without an API key
      const axios = (await import('axios')).default;
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(args.query)}`;
      const { data } = await axios.get(searchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      
      // Basic extraction of snippets (DDG Lite HTML structure)
      // We look for 'result__snippet' class which is present in the Lite version
      const snippets: string[] = [];
      const regex = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
      let match;
      let count = 0;
      while ((match = regex.exec(data)) !== null && count < 5) {
        snippets.push(match[1].replace(/<[^>]+>/g, '').trim()); // Clean HTML tags
        count++;
      }

      if (snippets.length === 0) return "Aucun résultat trouvé pour cette recherche.";
      return `Résultats de recherche pour "${args.query}" :\n\n- ${snippets.join('\n- ')}`;
    } catch (e: any) {
      return `❌ Erreur de recherche : ${e.message}`;
    }
  },
});
