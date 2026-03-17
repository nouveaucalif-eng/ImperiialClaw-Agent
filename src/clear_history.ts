import { db } from './memory/db.js';
import dotenv from 'dotenv';
dotenv.config();

const userId = "878740721";

async function clearHistory() {
    console.log(`🧹 Clearing history for user ${userId}...`);
    const messages = await db.collection('users').doc(userId).collection('messages').get();
    const batch = db.batch();
    messages.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log("✅ History cleared.");
}

clearHistory().catch(console.error);
