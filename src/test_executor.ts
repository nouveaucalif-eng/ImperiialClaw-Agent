import { runAgent } from './agent/index.js';
import dotenv from 'dotenv';
dotenv.config();

const userId = "878740721"; // The allowed ID from .env
const input = `Regarde ton ÉTAT RÉEL DU DISQUE (VÉRIFIÉ) : il est vide, tu as halluciné. Reprend TOUT le code que tu as écrit plus haut et utilise tes outils pour créer RÉELLEMENT le dossier MaVitrinePro et TOUS ses fichiers maintenant. Je ne veux plus de texte, je veux des fichiers sur mon disque`;

console.log("🚀 Starting Agent Simulation with 'Order CHOC'...");

runAgent(userId, input, (msg) => {
  console.log(`📡 Progress: ${msg}`);
}).then(res => {
  console.log("✅ Final Agent Response:", res.content);
}).catch(err => {
  console.error("❌ Agent Simulation Failed:", err);
});
