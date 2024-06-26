const guilds = require('../data/guilds.json');

module.exports = {
	name: 'raw',
	async execute(p, d, client) {
		if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(p.t)) return;
		if (!guilds[p.d.guild_id] || !guilds[p.d.guild_id].reaction_roles) return;
		if (!Object.keys(guilds[p.d.guild_id].reaction_roles).includes(p.d.channel_id)) return;
		if (!Object.keys(guilds[p.d.guild_id].reaction_roles[p.d.channel_id]).includes(p.d.message_id)) return;
		if (!Object.keys(guilds[p.d.guild_id].reaction_roles[p.d.channel_id][p.d.message_id]).includes(p.d.emoji.name)) return;

		const guild = client.guilds.cache.find(g => g.id == p.d.guild_id);
		const channel = client.channels.cache.find(c => c.id == p.d.channel_id);
		const role = await guild.roles.fetch(guilds[p.d.guild_id].reaction_roles[p.d.channel_id][p.d.message_id][p.d.emoji.name]);
		const member = await guild.members.fetch(p.d.user_id);
		
		if (['MESSAGE_REACTION_REMOVE'].includes(p.t)) {
			await member.roles.remove(role);
		} else if (['MESSAGE_REACTION_ADD'].includes(p.t)) {
			await member.roles.add(role);
		}
	},
};