const db = require('quick.db');
const SteamAPI = require('steamapi');
const { MessageEmbed } = require('discord.js');

const {steam_apikey} = require('../data/credentials.json');
const steam_ids = require('../data/steam_ids.json');

const steam = new SteamAPI(steam_apikey); // boynewtoy3

module.exports = {
	category: 'info',
	usage: "[@user]",
	usageExample: [" ", "@user"],
	cooldown: 60,
	aliases: ['stats', 'userinfo'],
	async execute(message, args, client) {
		var user = message.author;
		if (message.mentions.members.first()) user = message.mentions.members.first().user;

		var vc_last_seen = db.get(`stats.${message.guild.id}.vc_last_seen.users.${user.id}`) || undefined;
		var vc_activity = {
			today: db.get(`stats.${message.guild.id}.vc_time.today.users.${user.id}`) || 0,
			month: db.get(`stats.${message.guild.id}.vc_time.this_month.users.${user.id}`) || 0,
			all: db.get(`stats.${message.guild.id}.vc_time.all_time.users.${user.id}`) || 0
		};

		var steam_id = [];
		var steam_activity = 0;

		for (var i = 0; i < steam_ids.length; i++) {
			var index = steam_ids[i];

			if (index.discordID.includes(user.id)) steam_id = index.steamID;
		}

		for (var i = 0; i < steam_id.length; i++) {
			var id = steam_id[i];

			await steam.getUserRecentGames(id).then(data => {
				data.forEach(d => {
					steam_activity += d.playTime2
				});
			});
		}

		embed = new MessageEmbed()
			.setTitle(`Profile — ${user.tag}`)

		if (user.id == 318383492172087297) {
			// If alt account
			embed.addFields(
				{ name: "VC Activity", value: `REDACTED`, inline: false },
				{ name: "VC Last Seen", value: `REDACTED`, inline: false },
				{ name: "Steam Recent Activity", value: `REDACTED`, inline: false }
			)
		} else {
			embed.addFields(
				{ name: "VC Activity", value: `Today: ${Math.round(vc_activity.today/60 * 10) / 10}h | Month: ${Math.round(vc_activity.month/60 * 10) / 10}h | All Time: ${Math.round(vc_activity.all/60 * 10) / 10}h`, inline: false },
				{ name: "VC Last Seen", value: vc_last_seen ? new Date(vc_last_seen).toLocaleString('lt') : "No data", inline: false },
				{ name: "Steam Recent Activity", value: (steam_activity == 0 ? "No data" : `[${Math.round((steam_activity/60) * 10) / 10} hours past 2 weeks](https://steamcommunity.com/profiles/${steam_id[0]})`), inline: false }
			)
		}

		message.channel.send(embed);
	},
};