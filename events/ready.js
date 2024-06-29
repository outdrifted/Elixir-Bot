import { PermissionFlagsBits, ChannelType } from 'discord.js';
import guilds from '../guilds.json' with { type: "json" };
import 'dotenv/config';
const ownerid = process.env.OWNER_ID; const default_cooldown_vc = process.env.VC_COOLDOWN;
const { QuickDB } = await import("quick.db");
const db = new QuickDB();

export default {
	once: true,
	async execute(client) {
		//#region Loops
		(function VCChecker() {
			setTimeout(async function () {
				Object.keys(guilds).forEach(async (guildID) => {
					if (!guilds[guildID] || !guilds[guildID].enabled) return;
					if (!Object.keys(guilds[guildID]).includes('vc')) return;
					
					var categoryChannel = await client.channels.fetch(guilds[guildID].vc.category);
					var channels = categoryChannel.children.cache;

					for (const [key, value] of channels.entries()) {
						var guild = categoryChannel.guild;
						var channel = guild.channels.cache.find(c => c.id == key);

						if (key != guilds[guildID].vc.channel) {
							if ((new Date() - channel.createdAt) / 1000 < 5) return;

							if (!Object.keys(await db.get('vcc')||{}).includes(key)) {
								return channel.delete().catch(() => {});
							}

							if (!channel.members.size) {
								await db.set(`vcs.${await db.get(`vcc.${channel.id}.owner`)}`, {
									name: channel.name,
									bitrate: channel.bitrate/1000,
									limit: channel.userLimit,
									ow: channel.permissionOverwrites.cache
								})
					
								await db.delete(`vcc.${channel.id}`)
								
								return channel.delete().catch(() => {});
							}
							
							for (const [key, value] of channel.permissionOverwrites.cache.entries()) {
								if (value.allow.toArray().some(r => [
									PermissionFlagsBits.MoveMembers, 
									PermissionFlagsBits.DeafenMembers, 
									PermissionFlagsBits.MuteMembers].includes(r))) {

									console.log("Removed abusive permissions from user.");

									value.update({
										'MOVE_MEMBERS': null,
										'DEAFEN_MEMBERS': null,
										'MUTE_MEMBERS': null,
									})
								}
							}
						}
						// } else if (channel.members.size) {
						// 	channel.members.forEach(member => {
						// 		console.log(member);
						// 		createVC(member.id, guild);
						// 	});
						// }
					}
				})

				VCChecker();
			}, 1000);
		})();

		async function createVC(userId, guild) {
			if (client.cooldowns_voice.has(userId)) return;

			var member = guild.members.cache.find(m => m.id == userId);
			var vcs = await db.get(`vcs.${userId}`) || {};
			
			if (member.roles.cache.find(r => r.id == guilds[guild.id].roles.blacklist)) return;

			if (userId != ownerid) {
				client.cooldowns_voice.set(userId, Date.now());
				setTimeout(() => client.cooldowns_voice.delete(userId), default_cooldown_vc * 1000);
			}
			
			var options = {
				name: vcs.name || `👥 ${member.user.username}'s Channel`,
				bitrate: vcs.bitrate || 64,
				limit: vcs.limit || 0,
				ow: (() => {
					var ow = vcs.ow || [];

					ow.push({
						id: member.id,
						allow: [
							PermissionFlagsBits.ViewChannel,
							PermissionFlagsBits.Connect,
							PermissionFlagsBits.Speak,
							PermissionFlagsBits.ManageChannels,
							PermissionFlagsBits.ManageRoles]
						//allow: ["VIEW_CHANNEL", "CONNECT", "SPEAK", "MANAGE_CHANNELS", "MANAGE_ROLES"],
					});

					return ow;
				})()
			}

			var channel = await guild.channels.create({
				name: options.name,
				type: ChannelType.GuildVoice,
				parent: guild.channels.cache.find(c => c.id == guilds[guild.id].vc.category),
				bitrate: options.bitrate*1000,
				userLimit: options.limit,
				permissionOverwrites: options.ow
			})

			await db.set(`vcc.${channel.id}`, {
				owner: userId,
				guild: guild.id
			})

			var e = await db.get('vcs');

			return member.voice.setChannel(channel).catch(() => {});
		}
	},
};
