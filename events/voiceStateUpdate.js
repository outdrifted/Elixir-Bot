//const guilds = require('../data/guilds.json');
//const db = require('quick.db');
//const { ownerid, default_cooldown_vc } = require('../data/config.json');

import guilds from '../data/guilds.json' with { type: "json" };
const { QuickDB } = await import("quick.db");
const db = new QuickDB();
import { PermissionFlagsBits, ChannelType } from 'discord.js';
import config from '../data/config.json' with { type: "json" };
const ownerid = config.ownerid; const default_cooldown_vc = config.default_cooldown_vc;

export default {
	execute(os, ns, client) {
		// vcc (channels) syntax = { '1255536377454526497': { owner: '243436321018871810', guild: '702127865713393755' }
		// vcs (settings) syntax =  
		if (!guilds[os.guild.id] || !guilds[os.guild.id].enabled) return;
		
		if (os.channelId && ns.channelId) {
			vc_leave();
			vc_join()
		} else if (!os.channelId && ns.channelId) {
			vc_join();
		} else if (os.channelId && !ns.channelId) {
			vc_leave(); 
		}

		async function vc_join() {
			if (client.cooldowns_voice.has(ns.id)) return;

			var member = ns.guild.members.cache.find(m => m.id == ns.id);
			var vcs = await db.get(`vcs.${ns.id}`) || {};
			var oldChanData = await db.get(`vcc.${os.channelId}`) || {};
			
			if (member.roles.cache.find(r => r.id == guilds[ns.guild.id].roles.blacklist)) return;
			if (ns.channelId != guilds[os.guild.id].vc.channel) return;
			
			if (oldChanData.owner == ns.id) {
				var channel = os.guild.channels.cache.find(c => c.id == os.channelId);

				await db.set(`vcs.${await db.get(`vcc.${os.channelId}.owner`)}`, {
					name: channel.name,
					bitrate: channel.bitrate/1000,
					limit: channel.userLimit,
					ow: channel.permissionOverwrites
				})

				
	
				await db.delete(`vcc.${channel.id}`)
				
				await channel.delete().catch(() => {});
			}

			if (ns.id != ownerid) {
				client.cooldowns_voice.set(ns.id, Date.now());
				setTimeout(() => client.cooldowns_voice.delete(ns.id), default_cooldown_vc * 1000);
			}

			console.log(vcs);
			
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

			var channel = await ns.guild.channels.create({
				name: options.name,
				type: ChannelType.GuildVoice,
				parent: ns.guild.channels.cache.find(c => c.id == guilds[os.guild.id].vc.category),
				bitrate: options.bitrate*1000,
				userLimit: options.limit,
				permissionOverwrites: options.ow
			})

			await db.set(`vcc.${channel.id}`, {
				owner: ns.id,
				guild: ns.guild.id
			})

			var e = await db.get('vcs');

			return member.voice.setChannel(channel).catch(() => {});
		}

		async function vc_leave() {
			var channel = os.guild.channels.cache.find(c => c.id == os.channelId);

			if (channel.parentID != guilds[os.guild.id].vc.category) return;
			if (os.channelId == guilds[os.guild.id].vc.channel) return;
			if (channel.members.keyArray().length) return;
			if (!await db.get(`vcc.${os.channelId}`)) return;

			//console.log(channel.permissionOverwrites);

			await db.set(`vcs.${await db.get(`vcc.${os.channelId}.owner`)}`, {
				name: channel.name,
				bitrate: channel.bitrate/1000,
				limit: channel.userLimit,
				ow: channel.permissionOverwrites
			})

			await db.delete(`vcc.${channel.id}`)
			
			return channel.delete().catch(() => {});
		}
	},
};
