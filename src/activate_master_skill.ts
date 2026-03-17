import { setActiveSkill } from './memory/db.js';
import dotenv from 'dotenv';
dotenv.config();

const userId = "878740721"; // L'ID utilisateur autorisé

async function injectSkill() {
    console.log(`💉 Injecting 'master_architect.md' skill into user ${userId}...`);
    await setActiveSkill(userId, "master_architect.md");
    console.log("✅ Core Upgrade complete. Bot is now a Master Architect by default.");
}

injectSkill().catch(console.error);
