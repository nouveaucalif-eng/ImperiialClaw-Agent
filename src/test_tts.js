import axios from 'axios';
import fs from 'fs';
import path from 'path';
// Vos informations de test
const API_KEY = 'sk_55aebfc5911cbc1dc66afa1bb72164ba64dbab3b2dccd19c';
const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Bella
async function testLocalTTS() {
    console.log('--- TEST LOCAL ELEVENLABS ---');
    try {
        const response = await axios({
            method: 'post',
            url: `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
            data: {
                text: "Ceci est un test depuis mon ordinateur personnel.",
                model_id: 'eleven_multilingual_v2',
            },
            headers: {
                'Accept': 'audio/mpeg',
                'xi-api-key': API_KEY,
                'Content-Type': 'application/json',
            },
            responseType: 'arraybuffer',
        });
        const outputPath = path.join(process.cwd(), 'test_voix_local.mp3');
        fs.writeFileSync(outputPath, response.data);
        console.log('✅ SUCCÈS ! Le fichier "test_voix_local.mp3" a été créé sur votre bureau.');
        console.log('Cela signifie que votre clé fonctionne, mais que Render est bloqué.');
    }
    catch (error) {
        if (error.response) {
            console.error('❌ Erreur API:', Buffer.from(error.response.data).toString());
        }
        else {
            console.error('❌ Erreur:', error.message);
        }
    }
}
testLocalTTS();
