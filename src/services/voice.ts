import axios from 'axios';
import FormData from 'form-data';
import { env } from '../config/index.js';
import fs from 'fs';
import path from 'path';
import { tmpdir } from 'os';

export async function transcribeAudio(fileUrl: string): Promise<string> {
  try {
    // 1. Download the file
    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    
    // 2. Save to a temp file (Whisper API needs a file with extension usually)
    const tempPath = path.join(tmpdir(), `voice_${Date.now()}.ogg`);
    fs.writeFileSync(tempPath, buffer);

    // 3. Prepare form data for Groq
    const formData = new FormData();
    formData.append('file', fs.createReadStream(tempPath));
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'fr'); // Default to French as requested by context
    formData.append('response_format', 'json');

    // 4. Send to Groq
    const groqResponse = await axios.post(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${env.GROQ_API_KEY}`,
        },
      }
    );

    // 5. Cleanup
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }

    return groqResponse.data.text;
  } catch (error) {
    console.error('❌ Transcription error:', error);
    throw new Error('Erreur lors de la transcription vocale.');
  }
}
