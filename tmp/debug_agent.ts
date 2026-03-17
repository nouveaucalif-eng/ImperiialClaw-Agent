import { runAgent } from '../src/agent/index.js';
import { env } from '../src/config/index.js';

async function test() {
  const userId = env.TELEGRAM_ALLOWED_USER_IDS[0]; // Use the main user id
  console.log('Testing runAgent for user:', userId);
  
  const response = await runAgent(
    userId,
    "Mettre le site en vert émeraude au lieu de bleu ou ajoute une section Témoignages en Bento dans src/App.jsx",
    (msg) => console.log('Progress:', msg)
  );
  
  console.log('Final Agent Response:', response);
}

test().catch(console.error);
