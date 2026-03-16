import { Bot, InputFile } from 'grammy';
import { env } from '../config/index.js';
import { runAgent } from '../agent/index.js';
import { transcribeAudio } from '../services/voice.js';
import { textToSpeech } from '../services/tts.js';
import fs from 'fs';

export const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

// Global logging middleware
bot.use(async (ctx, next) => {
  console.log(`📩 Incoming update: [${ctx.update.update_id}] - Type: ${Object.keys(ctx.update).filter(k => k !== 'update_id')[0]}`);
  return next();
});

// Whitelist Middleware
bot.use(async (ctx, next) => {
  const userId = ctx.from?.id.toString();
  console.log(`👤 Processing request from UserID: ${userId}`);
  
  if (userId && env.TELEGRAM_ALLOWED_USER_IDS.includes(userId)) {
    console.log(`✅ User ${userId} is whitelisted.`);
    return next();
  }
  
  console.log(`🚫 Unauthorized access attempt from ID: ${userId}. Allowed IDs: [${env.TELEGRAM_ALLOWED_USER_IDS.join(', ')}]`);
  // Implicitly ignore unauthorized users as requested
});

async function processUserMessage(userId: string, text: string, ctx: any, respondWithVoice: boolean = false) {
  try {
    // Show typing status
    await ctx.replyWithChatAction(respondWithVoice ? 'record_voice' : 'typing');
    
    const agentResponse = await runAgent(userId, text);
    const responseText = agentResponse.content;
    
    if (!responseText && (!agentResponse.files || agentResponse.files.length === 0)) {
      await ctx.reply("Je n'ai pas pu générer de réponse.");
      return;
    }

    // 1. Send Text or Voice response
    if (responseText) {
      if (respondWithVoice || text.toLowerCase().includes("réponds en vocal") || text.toLowerCase().includes("parle-moi")) {
        try {
          const audioPath = await textToSpeech(responseText, agentResponse.voice);
          await ctx.replyWithVoice(new InputFile(audioPath));
          if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        } catch (ttsError) {
          console.error('❌ TTS Error:', ttsError);
          await ctx.reply(responseText);
        }
      } else {
        await ctx.reply(responseText);
      }
    }

    // 2. Send generated files if any
    if (agentResponse.files && agentResponse.files.length > 0) {
      for (const file of agentResponse.files) {
        try {
          console.log(`Sending file: ${file.path}`);
          await ctx.replyWithDocument(new InputFile(file.path, file.name));
          
          // Cleanup temp file after sending
          if (fs.existsSync(file.path)) {
            setTimeout(() => {
                try { fs.unlinkSync(file.path); } catch(e) {}
            }, 5000); // Wait 5s to ensure TG finished upload
          }
        } catch (fileError) {
          console.error('❌ Error sending file:', fileError);
          await ctx.reply(`Erreur lors de l'envoi du fichier: ${file.name}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Bot error:', error);
    await ctx.reply('Désolé, j’ai rencontré une erreur lors du traitement de votre demande.');
  }
}

bot.on('message:text', async (ctx) => {
  const userId = ctx.from?.id.toString();
  const text = ctx.message.text;
  console.log(`📝 Received text message from ${userId}: "${text}"`);

  if (!userId) return;
  await processUserMessage(userId, text, ctx);
});

bot.on('message:voice', async (ctx) => {
  const userId = ctx.from?.id.toString();
  if (!userId) return;

  try {
    await ctx.replyWithChatAction('record_voice');
    
    // 1. Get file info from Telegram
    const file = await ctx.getFile();
    const fileUrl = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

    // 2. Transcribe using our service
    const transcribedText = await transcribeAudio(fileUrl);
    
    if (!transcribedText || transcribedText.trim() === "") {
        await ctx.reply("Je n'ai pas pu entendre ce que vous avez dit.");
        return;
    }

    // 3. Process with voice response enabled
    await processUserMessage(userId, transcribedText, ctx, true);
  } catch (error) {
    console.error('❌ Voice processing error:', error);
    await ctx.reply('Désolé, je n’ai pas pu traiter votre message vocal.');
  }
});


export function startBot() {
  bot.start({
    onStart: (botInfo) => {
      console.log(`🚀 ImperiialClaw is running as @${botInfo.username}`);
    },
  });
}

