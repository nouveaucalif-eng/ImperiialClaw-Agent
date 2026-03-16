import axios from 'axios';
import fs from 'fs';
import path from 'path';

const PROMPTS_CHAT_URL = 'https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv';
const SKILLS_DIR = path.join(process.cwd(), 'skills');

// Ensure directory exists
if (!fs.existsSync(SKILLS_DIR)) {
  fs.mkdirSync(SKILLS_DIR);
}

/**
 * Basic CSV parser for the specific format of prompts.chat
 */
function parsePromptsCSV(csv: string) {
  const lines = csv.split('\n');
  const prompts: { act: string; prompt: string }[] = [];
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Simple regex to match "Act","Prompt"
    const match = line.match(/^"([^"]+)","(.+)"$/);
    if (match) {
      prompts.push({ act: match[1], prompt: match[2].replace(/""/g, '"') });
    }
  }
  return prompts;
}

export async function searchCommunitySkills(query: string): Promise<string> {
  try {
    const response = await axios.get(PROMPTS_CHAT_URL);
    const allPrompts = parsePromptsCSV(response.data);
    
    const filtered = allPrompts.filter(p => 
      p.act.toLowerCase().includes(query.toLowerCase()) || 
      p.prompt.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10); // Limit to 10 results

    if (filtered.length === 0) return "Aucun skill trouvé pour cette recherche.";

    return filtered.map(p => `🎭 Act: ${p.act}\n📝 Prompt: ${p.prompt.substring(0, 150)}...\n---`).join('\n\n');
  } catch (error: any) {
    return `Erreur lors de la recherche: ${error.message}`;
  }
}

export async function installSkill(act: string, prompt: string): Promise<string> {
  try {
    const filename = `${act.toLowerCase().replace(/[^a-z0-9]/g, '_')}.md`;
    const filepath = path.join(SKILLS_DIR, filename);
    
    const content = `---
description: ${act}
---
${prompt}`;

    fs.writeFileSync(filepath, content);
    return `✅ Skill "${act}" installé avec succès dans skills/${filename}`;
  } catch (error: any) {
    return `Erreur lors de l'installation: ${error.message}`;
  }
}

export function listInstalledSkills(): string {
  try {
    const files = fs.readdirSync(SKILLS_DIR);
    if (files.length === 0) return "Aucun skill installé localement.";
    
    return "Skills installés :\n" + files.map(f => `- ${f}`).join('\n');
  } catch (error: any) {
    return `Erreur lors du listage: ${error.message}`;
  }
}

export function readSkillContent(filename: string): string | null {
  try {
    const filepath = path.join(SKILLS_DIR, filename);
    if (!fs.existsSync(filepath)) return null;
    const content = fs.readFileSync(filepath, 'utf-8');
    // Remove YAML frontmatter if present
    return content.replace(/---[\s\S]*?---/, '').trim();
  } catch {
    return null;
  }
}
