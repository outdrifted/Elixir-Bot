const guilds = require('../data/guilds.json');
const db = require('quick.db');
const { ownerid, default_cooldown_vc } = require('../data/config.json');

module.exports = {
	execute(os, ns, client) {
		if (!guilds[os.guild.id] || !guilds[os.guild.id].enabled) return;
		if (os.channelID && ns.channelID) {vc_leave();vc_join()} else if (!os.channelID && ns.channelID) vc_join(); else if (os.channelID && !ns.channelID) vc_leave(); 

		async function vc_join() {
			if (client.cooldowns_voice.has(ns.id)) return;

			var member = ns.guild.members.cache.find(m => m.id == ns.id);
			var vcs = db.get(`vcs.${ns.id}`) || {};
			var oldChanData = db.get(`vcc.${os.channelID}`) || {};
			
			if (member.roles.cache.find(r => r.id == guilds[ns.guild.id].roles.blacklist)) return;
			if (ns.channelID != guilds[os.guild.id].vc.channel) return;
			
			if (oldChanData.owner == ns.id) {
				var channel = os.guild.channels.cache.find(c => c.id == os.channelID);

				db.set(`vcs.${db.get(`vcc.${os.channelID}.owner`)}`, {
					name: channel.name,
					bitrate: channel.bitrate/1000,
					limit: channel.userLimit,
					ow: channel.permissionOverwrites
				})
	
				db.delete(`vcc.${channel.id}`)
				
				await channel.delete().catch(() => {});
			}

			if (ns.id != ownerid) {
				client.cooldowns_voice.set(ns.id, Date.now());
				setTimeout(() => client.cooldowns_voice.delete(ns.id), default_cooldown_vc * 1000);
			}
			
			var options = {
				name: vcs.name || `👥 ${member.user.username}'s Channel`,
				bitrate: vcs.bitrate || 64,
				limit: vcs.limit || 0,
				ow: (() => {
					var ow = vcs.ow || [];

					ow.push({
						id: member.id,
						allow: ["VIEW_CHANNEL", "CONNECT", "SPEAK", "MANAGE_CHANNELS", "MANAGE_ROLES"],
					});

					return ow;
				})()
			}

			var channel = await ns.guild.channels.create(options.name, {
				type: "voice",
				parent: ns.guild.channels.cache.find(c => c.id == guilds[os.guild.id].vc.category),
				bitrate: options.bitrate*1000,
				userLimit: options.limit,
				permissionOverwrites: options.ow
			})

			db.set(`vcc.${channel.id}`, {
				owner: ns.id,
				guild: ns.guild.id
			})

			return member.voice.setChannel(channel).catch(() => {});
		}

		function vc_leave() {
			var channel = os.guild.channels.cache.find(c => c.id == os.channelID);

			if (channel.parentID != guilds[os.guild.id].vc.category) return;
			if (os.channelID == guilds[os.guild.id].vc.channel) return;
			if (channel.members.keyArray().length) return;
			if (!db.get(`vcc.${os.channelID}`)) return;

			db.set(`vcs.${db.get(`vcc.${os.channelID}.owner`)}`, {
				name: channel.name,
				bitrate: channel.bitrate/1000,
				limit: channel.userLimit,
				ow: channel.permissionOverwrites
			})

			db.delete(`vcc.${channel.id}`)
			
			return channel.delete().catch(() => {});
		}
	},
};
