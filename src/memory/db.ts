import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Initialize Firebase Admin
const serviceAccountPath = path.resolve(process.cwd(), 'firebase-credentials.json');
let serviceAccount;
try {
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
} catch (e) {
  console.warn('Could not read firebase-credentials.json, fallback to default credentials');
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
