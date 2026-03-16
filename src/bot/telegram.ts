import { Bot, InputFile } from 'grammy';
import { env } from '../config/index.js';
import { runAgent } from '../agent/index.js';
import { transcribeAudio } from '../services/voice.js';
import { textToSpeech } from '../services/tts.js';
import fs from 'fs';

export const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

// Whitelist Middleware
bot.use(async (ctx, next) => {
  const userId = ctx.from?.id.toString();
  if (userId && env.TELEGRAM_ALLOWED_USER_IDS.includes(userId)) {
    return next();
  }
  console.log(`🚫 Unauthorized access attempt from ID: ${userId}`);
  // Implicitly ignore unauthorized users as requested
});

async function processUserMessage(userId: string, text: string, ctx: any, respondWithVoice: boolean = false) {
  try {
    // Show typing status
    await ctx.replyWithChatAction(respondWithVoice ? 'record_voice' : 'typing');
    
    const response = await runAgent(userId, text);
    
    if (!response) {
      await ctx.reply("Je n'ai pas pu générer de réponse.");
      return;
    }

    if (respondWithVoice || text.toLowerCase().includes("réponds en vocal") || text.toLowerCase().includes("parle-moi")) {
      try {
        const audioPath = await textToSpeech(response);
        await ctx.replyWithVoice(new InputFile(audioPath));
        
        // Cleanup temp file
        if (fs.existsSync(audioPath)) {
          fs.unlinkSync(audioPath);
        }
      } catch (ttsError) {
        console.error('❌ TTS Error details:', ttsError);
        await ctx.reply(response); // Fallback to text if TTS fails
      }
    } else {
      await ctx.reply(response);
    }
  } catch (error) {
    console.error('❌ Bot error:', error);
    await ctx.reply('Désolé, j’ai rencontré une erreur lors du traitement de votre demande.');
  }
}

bot.on('message:text', async (ctx) => {
  const userId = ctx.from?.id.toString();
  const text = ctx.message.text;

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

