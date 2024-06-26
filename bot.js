// const { Client, Events, GatewayIntentBits, Collection } = require('discord.js');
import { Client, Events, GatewayIntentBits, Collection } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from 'url';
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory
import 'dotenv/config';
//const fs = require('node:fs');
//const path = require('node:path');
//require('dotenv').config();
const token = process.env.BOT_TOKEN;

const client = new Client({ 
	presence: { activity: { name: `/help | Pajebat Land`, type: "WATCHING" }, status: "online" },
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

import config from './data/config.json' with { type: "json" };
const colors = config.colors;
const ownerid = config.ownerid;
import guilds from './data/guilds.json' with { type: "json" };
//const { colors, ownerid } = require('./data/config.json');
//const guilds = require('./data/guilds.json');

client.commands = new Collection();
client.cooldowns = new Collection();
client.cooldowns_voice = new Collection();

//#region Command Handler
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = pathToFileURL(path.join(commandsPath, file)).href;
        const { default: command } = await import(filePath); // Destructure default export
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});
//#endregion

//#region Event Handler
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = await import(pathToFileURL(`./events/${file}`).href);
    if (event && event.default && event.default.execute) {
        if (event.default.once) {
            client.once(event.default.name || file.replace('.js', ''), (...args) => event.default.execute(...args, client));
        } else {
            client.on(event.default.name || file.replace('.js', ''), (...args) => event.default.execute(...args, client));
        }
    } else {
        console.log(`[WARNING] The event at ${file} is missing a required "execute" property.`);
    }
}
//#endregion

//#region Functions
	client.getUserPerms = (member) => {
		if (!member) throw new Error("Member is required");
		if (!guilds[member.guild.id]) return 4;

		if (member.id == ownerid) return 4;
		if (member.roles.cache.find(r => r.id == guilds[member.guild.id].roles.owner)) return 3;
		if (member.roles.cache.find(r => r.id == guilds[member.guild.id].roles.admin)) return 2;
		if (member.roles.cache.find(r => r.id == guilds[member.guild.id].roles.mod)) return 1;
		return 0;
	}
	client.respond = async (response, options) => {
		if (!options) throw new Error("Options are required");
		if (!options.msg) throw new Error("Message to respond to is required");
		if (!response) throw new Error("Response is required");

		var color, emoji, code=options.code?`\`\`\`${options.code}\`\`\``:"";
		switch (options.id) {
			case 1:
				color = colors.ok;
				emoji = "✅";
				break;
			case 2:
				color = colors.warn;
				emoji = "⚠️";
				break;
			case 3:
				color = colors.error;
				emoji = "❌";
				break;
			default:
				emoji = "";
				break;
		}

		var msg = await options.msg.reply({embed: {
			color: color,
			description: `${emoji} ${response || ""}${code}`
		}});
		if (options.del != false) {
			if (!isNaN(options.del) && options.del != true) {
				return client.deleteMessage([msg, options.msg], options.del)
			} else {
				return client.deleteMessage([msg, options.msg])
			}
		}
		return msg;
	}
	client.deleteMessage = async (messages, wait) => {
		if (!wait) wait = 10;
		if (!messages) throw new Error(`No message(s) were provided`);

		if (isArray(messages)) {
			messages.forEach(message => {
				if ((message.channel.type !== 'dm')) {
					if (message.guild.me.hasPermission("MANAGE_MESSAGES")) {
						return message.delete({ timeout: wait * 1000 }).catch(() => {});
					}
				}
			})
		} else {
			var message = messages;
			if ((message.channel.type !== 'dm')) {
				if (message.guild.me.hasPermission("MANAGE_MESSAGES")) {
					return message.delete({ timeout: wait * 1000 }).catch(() => {});
				}
			}
		}
	}
//#endregion

client.login(token);

// const fs = require('fs');
// require('dotenv').config();
// const Discord = require('discord.js');
// const { isArray } = require('lodash');

// const token = process.env.DISCORD_BOT_TOKEN;
// const { colors, ownerid, prefix } = require('./data/config.json');
// const guilds = require('./data/guilds.json');


// const client = new Discord.Client({
// 	presence: {status: "online"}, /*{presence: {status: "online", activity: {name: `${prefix}help`, type: "WATCHING"}}}*/
// 	intents: [
// 		Discord.GatewayIntentBits.Guilds, 
// 		Discord.GatewayIntentBits.GuildMessages
// 	]
// });
// client.commands = new Discord.Collection();
// client.cooldowns = new Discord.Collection();
// client.cooldowns_voice = new Discord.Collection();

// //#region Functions
// 	client.getUserPerms = (member) => {
// 		if (!member) throw new Error("Member is required");
// 		if (!guilds[member.guild.id]) return 4;

// 		if (member.id == ownerid) return 4;
// 		if (member.roles.cache.find(r => r.id == guilds[member.guild.id].roles.owner)) return 3;
// 		if (member.roles.cache.find(r => r.id == guilds[member.guild.id].roles.admin)) return 2;
// 		if (member.roles.cache.find(r => r.id == guilds[member.guild.id].roles.mod)) return 1;
// 		return 0;
// 	}
// 	client.respond = async (response, options) => {
// 		if (!options) throw new Error("Options are required");
// 		if (!options.msg) throw new Error("Message to respond to is required");
// 		if (!response) throw new Error("Response is required");

// 		var color, emoji, code=options.code?`\`\`\`${options.code}\`\`\``:"";
// 		switch (options.id) {
// 			case 1:
// 				color = colors.ok;
// 				emoji = "✅";
// 				break;
// 			case 2:
// 				color = colors.warn;
// 				emoji = "⚠️";
// 				break;
// 			case 3:
// 				color = colors.error;
// 				emoji = "❌";
// 				break;
// 			default:
// 				emoji = "";
// 				break;
// 		}

// 		var msg = await options.msg.reply({embed: {
// 			color: color,
// 			description: `${emoji} ${response || ""}${code}`
// 		}});
// 		if (options.del != false) {
// 			if (!isNaN(options.del) && options.del != true) {
// 				return client.deleteMessage([msg, options.msg], options.del)
// 			} else {
// 				return client.deleteMessage([msg, options.msg])
// 			}
// 		}
// 		return msg;
// 	}
// 	client.deleteMessage = async (messages, wait) => {
// 		if (!wait) wait = 10;
// 		if (!messages) throw new Error(`No message(s) were provided`);

// 		if (isArray(messages)) {
// 			messages.forEach(message => {
// 				if ((message.channel.type !== 'dm')) {
// 					if (message.guild.me.hasPermission("MANAGE_MESSAGES")) {
// 						return message.delete({ timeout: wait * 1000 }).catch(() => {});
// 					}
// 				}
// 			})
// 		} else {
// 			var message = messages;
// 			if ((message.channel.type !== 'dm')) {
// 				if (message.guild.me.hasPermission("MANAGE_MESSAGES")) {
// 					return message.delete({ timeout: wait * 1000 }).catch(() => {});
// 				}
// 			}
// 		}
// 	}
// //#endregion

// const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
// for (const file of eventFiles) {
// 	const event = require(`./events/${file}`);
// 	if (event.once) {
// 		client.once(event.name || file.replace('.js', ''), (...args) => event.execute(...args, client));
// 	} else {
// 		client.on(event.name || file.replace('.js', ''), (...args) => event.execute(...args, client));
// 	}
// }

// const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
// for (const file of commandFiles) {
// 	const command = require(`./commands/${file}`);
// 	const fileName = file.replace('.js', '');
	
// 	//#region Command info
// 		command.name = command.name || fileName;
// 		command.category = command.category || 'misc';
// 		command.permission = (function() {
// 			if (!command.permission) return 0; else return command.permission;
// 		})();
// 		if (command.usage) command.usage = `\`\`\`${prefix}${command.name} ${command.usage}\`\`\``
// 		if (command.usageExample) command.usageExample = (function() {
// 			if (typeof command.usageExample != "string") {
// 				var r = [];
// 				command.usageExample.forEach(e => {r.push(`${prefix}${command.name} ${e}`)});
// 				return r;
// 			} else return `${prefix}${command.name} ${command.usageExample}`
// 		})()
// 	//#endregion

// 	client.commands.set(command.name || fileName, command);
// }

// client.login(token);