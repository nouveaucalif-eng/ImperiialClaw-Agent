import fs from 'fs';
import path from 'path';

export interface SoulConfig {
  id: string;
  name: string;
  persona: string;
  voice: string;
  allowed_tools: string[];
  description: string;
}

const SOULS_DIR = path.join(process.cwd(), 'souls');

export function listAvailableSouls(): string {
  try {
    const files = fs.readdirSync(SOULS_DIR).filter(f => f.endsWith('.json'));
    const souls = files.map(f => {
      const content = JSON.parse(fs.readFileSync(path.join(SOULS_DIR, f), 'utf-8'));
      return `- **${content.id}** : ${content.name} (${content.description})`;
    });
    return "Âmes disponibles :\n" + souls.join('\n');
  } catch (error: any) {
    return `Erreur lors du listage des âmes: ${error.message}`;
  }
}

export function loadSoul(soulId: string): SoulConfig | null {
  try {
    const filePath = path.join(SOULS_DIR, `${soulId}.json`);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}
