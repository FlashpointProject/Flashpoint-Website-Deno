// HOW TO USE:
// 1. Install Vencord and enable the "ViewRaw" extension
// 2. Hover over the message you want to import and click the "<>" button
// 3. Click "Copy Message JSON"
// 4. Create a file named discord_message.json in this directory, if you haven't yet
// 5. Open discord_message.json, paste and save
// 6. Open the terminal and run "deno run -A import_discord_message.js"
// 7. Make any changes if necessary

const json = JSON.parse(Deno.readTextFileSync('../data/discord.json'));
const input = JSON.parse(Deno.readTextFileSync('discord_message.json'));

const id = input.timestamp.replace(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/, '$1$2$3$4$5$6$7');
const message = {
	author: input.author.globalName,
	posted: input.timestamp,
	edited: input.editedTimestamp,
	circa: false,
	attachments: input.attachments.map((attachment, i) => ({
		name: attachment.filename,
		size: attachment.size,
		path: '/images/news/discord/' + id + '_' + i.toString().padStart(2, '0') + attachment.filename.substring(attachment.filename.lastIndexOf('.')),
	})),
	original: `https://discord.com/channels/432708847304704010/${input.channel_id}/${input.id}`,
	id: id,
};

json.push(message);
Deno.writeTextFileSync('../data/discord.json', JSON.stringify(json, null, '\t'));
Deno.writeTextFileSync('../news/discord/' + id + '.txt', input.content);

for (let i = 0; i < input.attachments.length; i++) {
	const attachment = input.attachments[i];
	console.log(`downloading ${attachment.url}...`);
	const path = '../static/images/news/discord/' + id + '_' + i.toString().padStart(2, '0') + attachment.filename.substring(attachment.filename.lastIndexOf('.'));
	const data = new Uint8Array(await (await fetch(attachment.url)).arrayBuffer());
	Deno.writeFileSync(path, data);
}

console.log('\n\n' + input.content + '\n\n');