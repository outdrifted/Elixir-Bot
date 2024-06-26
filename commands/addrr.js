const guilds = require('../data/guilds.json');

module.exports = {
	description: "Adds all reactions in that channel.",
	usage: " ",
	usageExample: " ",
	permission: 4,
	async execute(message, args, client) {
		message.delete();
		await Object.keys(guilds[message.channel.guild.id].reaction_roles).forEach(async channel_id => {
			const channel = message.guild.channels.cache.find(c => c.id == channel_id);
			await Object.keys(guilds[message.channel.guild.id].reaction_roles[channel_id]).forEach(async message_id => {
				const msg = await channel.messages.fetch(message_id);
				await Object.keys(guilds[message.channel.guild.id].reaction_roles[channel_id][message_id]).forEach(async emoji => {
					if (emoji !== "single") msg.react(emoji);
				})
			})
		})
	},
};