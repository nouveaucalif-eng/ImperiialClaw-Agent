import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Initialize Firebase Admin
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    // Nettoyage : on enlève les espaces ou retours à la ligne éventuels autour du JSON
    const cleanJson = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
    serviceAccount = JSON.parse(cleanJson);
  } catch (e) {
    console.error('❌ Erreur de lecture du JSON Firebase :', e instanceof Error ? e.message : String(e));
  }
} else {
  const serviceAccountPath = path.resolve(process.cwd(), 'firebase-credentials.json');
  try {
    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    }
  } catch (e) {
    console.warn('Could not read firebase-credentials.json fallback');
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: serviceAccount ? admin.credential.cert(serviceAccount) : admin.credential.applicationDefault()
  });
}

export const db = admin.firestore();

export async function getHistory(userId: string, limitNum: number = 10) {
  const snapshot = await db.collection('users').doc(userId).collection('messages')
    .orderBy('timestamp', 'desc')
    .limit(limitNum)
    .get();

  const messages: { role: string; content: string }[] = [];
  snapshot.forEach(doc => {
    messages.push({ role: doc.data().role, content: doc.data().content });
  });

  return messages.reverse();
}

export async function saveMessage(userId: string, role: string, content: string) {
  await db.collection('users').doc(userId).collection('messages').add({
    role,
    content,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
}

export async function saveFact(userId: string, fact: string) {
  await db.collection('users').doc(userId).collection('facts').add({
    fact,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
}

export async function getFacts(userId: string) {
  const snapshot = await db.collection('users').doc(userId).collection('facts')
    .orderBy('timestamp', 'asc')
    .get();

  const facts: { fact: string }[] = [];
  snapshot.forEach(doc => {
    facts.push({ fact: doc.data().fact });
  });

  return facts;
}
