import { EdgeTTS } from 'edge-tts-universal';
import { env } from '../config/index.js';
import fs from 'fs';
import path from 'path';
import { tmpdir } from 'os';

export async function textToSpeech(text: string): Promise<string> {
  try {
    const tempPath = path.join(tmpdir(), `tts_${Date.now()}.mp3`);
    const voice = env.EDGE_TTS_VOICE || 'fr-FR-EloiseNeural';
    
    // Nettoyage du texte pour éviter que la voix ne lise les caractères spéciaux (Markdown)
    const cleanedText = text
      .replace(/\*\*/g, '') // Supprime les gras (**)
      .replace(/\*/g, '')  // Supprime les italiques (*)
      .replace(/__/g, '')  // Supprime les underscores
      .replace(/#/g, '')   // Supprime les hashtags
      .replace(/`/g, '')   // Supprime les backticks
      .trim();

    console.log(`🎙️ Generating Edge TTS voice (Eloise) for text: "${cleanedText.substring(0, 30)}..."`);
    
    const tts = new EdgeTTS(cleanedText, voice, {
      rate: '+0%',
      volume: '+0%',
      pitch: '+0Hz',
    });

    const result = await tts.synthesize();

    const audioBuffer = Buffer.from(await result.audio.arrayBuffer());

    console.log(`✅ Edge Voice generated successfully! Saving to ${tempPath}`);
    fs.writeFileSync(tempPath, audioBuffer);
    return tempPath;
  } catch (error: any) {
    console.error('❌ Edge TTS Error:', error.message);
    throw new Error('Erreur lors de la génération de la voix Microsoft.');
  }
}


