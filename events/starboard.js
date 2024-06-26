const guilds = require('../data/guilds.json');
const db = require('quick.db');

module.exports = {
	name: 'raw',
	async execute(p, d, client) {
		if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(p.t)) return;
		if (p.d.emoji.name != "⭐") return;
		if (!Object.keys(guilds).includes(p.d.guild_id)) return;

		const guild = client.guilds.cache.find(g => g.id == p.d.guild_id);
		const channel = guild.channels.cache.find(c => c.id == p.d.channel_id);
		const message = await channel.messages.fetch(p.d.message_id);
		const starboard_channel = guild.channels.cache.find(c => c.id == guilds[message.channel.guild.id].starboard);
		const reaction = message.reactions.cache.find(r => r.emoji.name == "⭐");

		var reaction_users_size = 0;
		if (reaction) {
			const reaction_users = await reaction.users.fetch();
			var reaction_users_size = reaction_users.size;
			if (reaction_users.find(u => u.id == message.author.id)) reaction_users_size--;
		}

		if (reaction_users_size >= 2) {

			var emoji = "⭐";
			if (reaction_users_size >= 5) emoji = "🌟";

			const embed = {
				embed: {
					author: {
						name: message.author.tag,
						iconURL: message.author.displayAvatarURL()
					},
					description: `**${emoji} ${reaction_users_size} - [Source](${message.url})**\n${message.content}`
				}
			}

			message.attachments.forEach(e => {
				if (e.height != null && e.width != null) {
					embed.embed.image = {
						url: e.url
					}
				} else {
					embed.embed.fields = [{
						"name": "Attachment",
						"value": e.url
					}]
				}
			});

			if (db.get(`sb.${message.id}`)) {
				const starboard_message = await starboard_channel.messages.fetch(db.get(`sb.${message.id}`)).catch(() => {});
				if (starboard_message) {
					starboard_message.edit(embed);
				} else {
					var msg_new = await starboard_channel.send(embed);
					db.set(`sb.${message.id}`, msg_new.id)
				}
			} else {
				var msg_new = await starboard_channel.send(embed);
				db.set(`sb.${message.id}`, msg_new.id)
			}
		} else {
			if (db.get(`sb.${message.id}`)) {
				const starboard_message = await starboard_channel.messages.fetch(db.get(`sb.${message.id}`)).catch(() => {});
				if (starboard_message) {
					starboard_message.delete();
				}
			}

			db.delete(`sb.${message.id}`)
		}
	},
};