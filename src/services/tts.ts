import axios from 'axios';
import { env } from '../config/index.js';
import fs from 'fs';
import path from 'path';
import { tmpdir } from 'os';

export async function textToSpeech(text: string): Promise<string> {
  try {
    const tempPath = path.join(tmpdir(), `tts_${Date.now()}.mp3`);
    console.log(`🎙️ Generating voice for text: "${text.substring(0, 30)}..." using VoiceID: ${env.ELEVENLABS_VOICE_ID}`);
    
    // ElevenLabs API request
    const response = await axios({
      method: 'post',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${env.ELEVENLABS_VOICE_ID}`,
      data: {
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      },
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      responseType: 'arraybuffer',
    });

    console.log(`✅ Voice generated successfully! Saving to ${tempPath}`);
    fs.writeFileSync(tempPath, response.data);
    return tempPath;
  } catch (error: any) {
    if (error.response) {
      console.error('❌ ElevenLabs API error:', Buffer.from(error.response.data).toString());
    } else {
      console.error('❌ Transcription error:', error.message);
    }
    throw new Error('Erreur lors de la génération de la voix.');
  }
}

