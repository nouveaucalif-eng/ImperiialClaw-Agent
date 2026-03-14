import { Bot } from 'grammy';
import { env } from '../config/index.js';
import { runAgent } from '../agent/index.js';

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

bot.on('message:text', async (ctx) => {
  const userId = ctx.from?.id.toString();
  const text = ctx.message.text;

  if (!userId) return;

  try {
    // Show typing status
    await ctx.replyWithChatAction('typing');
    
    const response = await runAgent(userId, text);
    await ctx.reply(response || "Je n'ai pas pu générer de réponse.");
  } catch (error) {
    console.error('❌ Bot error:', error);
    await ctx.reply('Désolé, j’ai rencontré une erreur lors du traitement de votre demande.');
  }
});

export function startBot() {
  bot.start({
    onStart: (botInfo) => {
      console.log(`🚀 ImperiialClaw is running as @${botInfo.username}`);
    },
  });
}
