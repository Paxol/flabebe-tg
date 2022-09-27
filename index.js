require('dotenv').config();
const fetch = require('node-fetch');
const { Telegraf } = require('telegraf');

const token = process.env.TOKEN;
const host = process.env.API_HOST;
const createLinkPath = process.env.API_CREATE_LINK;
const getUploadUrlPath = process.env.API_GET_UPLOAD_URL_LINK;

const createShortLink = async (url) => {
	let bodyContent = JSON.stringify({
		json: {
			api_key: process.env.API_KEY,
			url
		}
	});

	const res = await fetch(`${host}/${createLinkPath}`, {
		method: "POST",
		body: bodyContent,
		headers: {
			"content-type": "application/json"
		}
	});

	return await res.json();
}

const getUploadLink = async ({ fileName, fileExtension, contentType }) => {
	let bodyContent = JSON.stringify({
		json: {
			api_key: process.env.API_KEY,
			fileName, fileExtension, contentType
		}
	});

	const res = await fetch(`${host}/${getUploadUrlPath}`, {
		method: "POST",
		body: bodyContent,
		headers: {
			"content-type": "application/json"
		}
	});

	const data = await res.json();

	if (data.error) {
		throw data.error;
	}

	return data.result.data.json;
}

const uploadFile = async (uploadUrl, fileBlob) => {
	return await fetch(uploadUrl, {
		method: "PUT",
		body: fileBlob,
	});
}

const bot = new Telegraf(token);

bot.start(ctx => ctx.reply("Welcome, send an URL to create a shortlink"));
bot.help(ctx => ctx.reply("Send an URL to create a shortlink"));

bot.on('audio', async ctx => {
	const { file_id, file_name, file_unique_id, mime_type } = ctx.message.audio;

	const fileExtension = file_name?.split('.').pop() || 'mp3';
	const fileName = file_name || `${file_unique_id}.${fileExtension}`;

	await handleFile({
		fileId: file_id,
		fileName,
		fileExtension,
		mime_type
	}, ctx);
})

bot.on('document', async ctx => {
	const { file_id, file_name, file_unique_id, mime_type } = ctx.message.document;

	const fileExtension = file_name.split('.').pop() || 'txt';
	const fileName = file_name || `${file_unique_id}.${fileExtension}`;

	await handleFile({
		fileId: file_id,
		fileName,
		fileExtension,
		contentType: mime_type
	}, ctx);
})

bot.on('photo', async ctx => {
	const { file_id, file_unique_id } = ctx.message.photo.pop();
	
	await handleFile({
		fileId: file_id,
		fileName: `${file_unique_id}.jpg`,
		fileExtension: 'jpg',
		contentType: 'image/jpeg'
	}, ctx);
})

bot.on('video', async ctx => {
	const { file_id, file_name, file_unique_id, mime_type } = ctx.message.video;

	const fileExtension = file_name.split('.').pop() || 'mp4';
	const fileName = file_name || `${file_unique_id}.${fileExtension}`;

	await handleFile({
		fileId: file_id,
		fileName,
		fileExtension,
		contentType: mime_type
	}, ctx);
})

bot.on('voice', async ctx => {
	const { file_id, file_unique_id, mime_type } = ctx.message.voice;
	await handleFile({
		fileId: file_id,
		fileName: `${file_unique_id}.mp3`,
		fileExtension: 'mp3',
		contentType: mime_type
	}, ctx);
})

async function handleFile({ fileId, fileName, fileExtension, contentType = 'text/plain' }, ctx) {
	const msgPromise = ctx.reply("Generating shortlink... 🕓");

	try {
		const fileExtToUse = fileExtension || fileName.split('.').pop() || 'txt';

		const file_respose = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`).then(res => res.json());

		if (!file_respose.ok) throw new Error(file_respose.description || "Invalid telegram response");

		const [file_downloaded, { uploadUrl, downloadUrl }] = await Promise.all([
			fetch(`https://api.telegram.org/file/bot${token}/${file_respose.result.file_path}`).then(res => res.blob()),
			getUploadLink({ fileName, fileExtension: fileExtToUse, contentType })
		]);

		await uploadFile(uploadUrl, file_downloaded);

		ctx.deleteMessage((await msgPromise).message_id);
		ctx.reply(`✅ Short link:\n${host}${downloadUrl}`, {
			reply_to_message_id: ctx.message.message_id
		});
	} catch (error) {
		console.error(error);

		let message = "❌ An error occurred";
		if (error.message && error.message.length > 0) {
			message += ":\n" + error.message;
		}
		
		ctx.deleteMessage((await msgPromise).message_id);
		ctx.reply(message, {
			reply_to_message_id: ctx.message.message_id
		});
	}
}

bot.on('text', async ctx => {
	if (ctx.message.from.is_bot) return;

	const matches = ctx.message.text.match(/(https?:\/\/)*(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)/gim);

	if (!matches) return;

	const msgPromise = ctx.reply("Generating shortlink... 🕓");

	const promises = matches.map(async url => {
		try {
			const data = await createShortLink(url);

			if (data.error) {
				const errorMessage = data.error?.json?.message;
				let msg = "❌ An error occurred";

				if (errorMessage) msg += `: ${errorMessage}`;

				ctx.reply(msg, {
					reply_to_message_id: ctx.message.message_id
				});

				return;
			}

			let longUrlRef = url.replace(/https?:\/\//, '');
			const firstSlash = longUrlRef.indexOf('/');
			const secondSlash = longUrlRef.indexOf('/', firstSlash + 1);
			if (firstSlash !== -1 && secondSlash !== -1 && longUrlRef.length > secondSlash) {
				longUrlRef = `${longUrlRef.substring(0, secondSlash)}...`;
			}

			const slug = data.result.data.json.slug;

			ctx.reply(`✅ Short link to ${longUrlRef}:\n${host}/${slug}`);
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