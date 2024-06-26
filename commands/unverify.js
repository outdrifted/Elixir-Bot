const guilds = require('../data/guilds.json');

module.exports = {
	category: 'mod',
	description: "Removes the verified role from a user.",
	usage: "<user mention or ID>",
	usageExample: ["@User", "243436321018871810"],
	permission: 1,
	async execute(message, args, client) {
		var member = undefined;
		if (args[0]) {
			var mention = await message.mentions.members.first();
			var id = message.channel.guild.members.cache.find(m => m.id == args[0]);

			if (mention) {
				member = mention;
			} else if (id) {
				member = id;
			} else return client.respond("Specified member wasn't found", {msg:message,id:3})
		} else return client.respond(`No member specified`, {msg:message,id:3})

		var role_id = guilds[message.channel.guild.id].roles.verified;
		var role = message.channel.guild.roles.cache.find(r => r.id == role_id);

		if (role) {
			await member.roles.remove(role);
			return client.respond(`Removed verified role from ${member}`, {msg:message,id:1})
		} else return client.respond(`Verified role wasn't found.`, {msg:message,id:3})
	},
};