import { DAL } from "./dal.js";
import { Telegraf } from 'telegraf';

const apiKey = process.env.API_KEY || "";
const dal = new DAL(apiKey);

const token = process.env.TOKEN || "";
const bot = new Telegraf(token);

bot.start(ctx => ctx.reply("Welcome, send an URL to create a shortlink"));
bot.help(ctx => ctx.reply("Send an URL to create a shortlink"));

bot.on('text', async ctx => {
	if (ctx.message.from.is_bot) return;

	const matches = ctx.message.text.match(/^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/);

	if (!matches) return;

	const msgPromise = ctx.reply("Generating shortlink... 🕓");

	const promises = matches.map(async url => {
		try {
      if (!dal.connected)
        await dal.createClient();
      
      const result = await dal.createLink(url);
      
			if (!result.success || !result.content) {
        // TODO: check
				let msg = "❌ An error occurred";

				if (!result.success) msg += `: ${result.error.message}`;

				ctx.reply(msg, {
					reply_to_message_id: ctx.message.message_id
				});

				return;
			}

			const slug = result.content.slug;
			ctx.reply(`✅ Short link to ${url}:\nhttps://mpxl.dev/${slug}`);
		} catch (err) {
			console.log(err);

			ctx.reply("❌ An error occurred", {
				reply_to_message_id: ctx.message.message_id
			});
		}
	})

	await Promise.all(promises);

	ctx.deleteMessage((await msgPromise).message_id);
});

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
