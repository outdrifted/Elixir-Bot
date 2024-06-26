const guilds = require('../data/guilds.json');
const Discord = require('discord.js');
const { default_cooldown, ownerid } = require('../data/config.json');
const { prefix } = require('../data/credentials.json');
const db = require('quick.db');

module.exports = {
	execute(message, client) {
		if (message.channel.type == "dm" || message.channel.type == "group_dm") return;
		if (Object.keys(guilds).includes(message.guild.id) && !guilds[message.guild.id].enabled) return; // If guild is disabled

		if (!message.content.startsWith(prefix)) return; // If message doesn't start with prefix
		if (message.author.bot) return; // If message author is bot
		if (message.member.roles.cache.find(r => r.id == guilds[message.guild.id].roles.blacklist)) return; // If user is blacklisted (has blacklist role)

		const message_content = message.content.replace(/\s+/g, " ").slice(prefix.length);
		command = undefined;
		args = [];

		client.commands.forEach(cmd => {
			function updateCmd(cmd_, name_used) {
				command = cmd_;
				args = message_content.substring(name_used.length).trim().split(/ +/);
			}
			
			if (message_content.startsWith(`${cmd.name} `) || message_content == cmd.name) {
				updateCmd(cmd, cmd.name);
			} else if (cmd.aliases) {
				cmd.aliases.forEach(alias => {
					if (message_content.startsWith(`${alias} `) || message_content == alias) updateCmd(cmd, alias);
				})
			}
		})

		//const args = message.content.slice(prefix.length).trim().split(/ +/);

		/*
		const command = (function() {
			var cmdName = args.shift().toLowerCase();
			var cmd = undefined;
			if (client.commands.get(cmdName)) {
				cmd = client.commands.get(cmdName);
			} else {
				for (const [key, value] of client.commands.entries()) {
					if (value.aliases && value.aliases.includes(cmdName)) return cmd = client.commands.get(key)
				}
			}
			return cmd;
		})();
		*/

		if (command) {
			if (!client.cooldowns.has(command.name)) client.cooldowns.set(command.name, new Discord.Collection());
			const timestamps = client.cooldowns.get(command.name);
			if (timestamps.has(message.author.id)) return client.respond(`This command is on a cooldown, you can try again in ${Math.round((((command.cooldown||default_cooldown)-((Date.now()-timestamps.get(message.author.id))/1000)) + Number.EPSILON) * 100) / 100} second(s).`, {id:3,msg:message});

			try {
				if (command.permission > client.getUserPerms(message.member)) return; // If user doesn't have permission to use the command

				if (message.author.id != ownerid) {
					timestamps.set(message.author.id, Date.now());
					setTimeout(() => timestamps.delete(message.author.id), (command.cooldown || default_cooldown)*1000);
				}

				//db.add(`stats.${message.guild.id}.commands_triggered.${message.author.id}.${new Date().getFullYear()}-${new Date().getMonth()+1}-${new Date().getDate()}`, 1);
				command.execute(message, args, client);
			} catch (err) {
				return client.respond(`**Please forward this error to <@${ownerid}>**`, {id:3,msg:message,code:err})
			}
		}
	},
};