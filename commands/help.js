const { default_cooldown } = require('../data/config.json')
const { prefix } = require('../data/credentials.json');

module.exports = {
	category: 'info',
	description: "Lists all available commands and command info.",
	usage: "[command]",
	usageExample: [" ", "bitrate"],
	aliases: ["h"],
	async execute(message, args, client) {
		if (args[0]) {
			const command = (function() {
				var cmd = client.commands.get(args.join(" "));
				if (!cmd) {
					for (const [key, value] of client.commands.entries()) {
						if (value.aliases && value.aliases.includes(args.join(" "))) cmd = value
					}
				}
				return cmd;
			})()

			if (command && client.getUserPerms(message.member) >= command.permission) {
				var msg = await message.channel.send({embed:{
					fields: [
						{
							"name": "Name(s)",
							"value": command.name + (function() {
								var aliases = "";
								if (command.aliases) aliases = ", " + command.aliases.join(', ')
								return aliases;
							})(),
							"inline": true
						},
						{
							"name": "Description",
							"value": command.description || `*none*`,
							"inline": true
						},
						{
							"name": "Usage",
							"value": command.usage || `*none*`
						},
						{
							"name": "Usage Example(s)",
							"value": (function() {
								const usage = command.usageExample;

								if (usage) {
									if (typeof command.usageExample != "string") return `\`\`\`\n${usage.join('\n\n')}\n\`\`\``; else return `\`\`\`${command.usageExample}\`\`\``
								} else return `*none*`
							})()
						},
						{
							"name": "Permission",
							"value": (function() {
								switch (command.permission) {
									case 0:
										return "Everyone"
									case 1:
										return "Mod"
									case 2:
										return "Admin"
									case 3:
										return "Owner"
									case 4:
										return "Bot Owner"
								}
							})(),
							"inline": true
						},
						{
							"name": "Cooldown",
							"value": (command.cooldown || default_cooldown) + " second(s)",
							"inline": true
						},
						{
							"name": "Category",
							"value": command.category,
							"inline": true
						}
					]
				}})
				return client.deleteMessage([message, msg], 30);
			} else {
				client.respond(`No command found with the name '${args.join(" ")}' that you can use.`, {id:2,msg:message})
			}
		} else {
			var names = (function() {
				var list = {};
				for (const [key, value] of client.commands.entries()) {
					var useri = client.getUserPerms(message.member);
					var cmdi = value.permission;

					if (useri >= cmdi) {
						if (!(value.category in list)) list[value.category] = [];
						list[value.category].push(key)
					};
				}
				return list;
			})();

			var msg = await message.channel.send({embed:{
				description: `Type \`${prefix}help <command>\` for more info about a command.`,
				fields: (function() {
					var list = [];
					
					for (const [key, value] of Object.entries(names)) {
						list.push({
							"name": `» ${key.toUpperCase()}`,
							"value": `\`${value.join('`, `')}\``
						});					
					}
					
					return list;
				})()
			}})
			return client.deleteMessage([message, msg], 30);
		}
	},
};