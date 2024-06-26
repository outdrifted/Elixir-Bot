const db = require('quick.db');
const SteamAPI = require('steamapi');
const { MessageEmbed } = require('discord.js');

const {prefix, steam_apikey} = require('../data/credentials.json');
const guilds = require('../data/guilds.json');
const ids = require('../data/steam_ids.json');

const steam = new SteamAPI(steam_apikey); // boynewtoy3

module.exports = {
	once: true,
	async execute(client) {
		console.log(new Date(), `Logged in as ${client.user.username} in ${client.guilds.cache.size} guild(s).`);
		client.user.setPresence({ activity: { name: `${prefix}help | Pajebat Land`, type: "WATCHING" }, status: "online" });
		//client.user.setPresence({ activities: [{ name: 'with discord.js' }], status: 'idle' });

		//#region Loops
		(function VCChecker() {
			setTimeout(async function () {
				Object.keys(guilds).forEach(async (guildID) => {
					if (!guilds[guildID] || !guilds[guildID].enabled) return;
					if (!Object.keys(guilds[guildID]).includes('vc')) return;
					
					var categoryChannel = await client.channels.fetch(guilds[guildID].vc.category);
					var channels = categoryChannel.children;

					for (const [key, value] of channels.entries()) {
						if (key != guilds[guildID].vc.channel) {
							var guild = categoryChannel.guild;
							var channel = guild.channels.cache.find(c => c.id == key);

							if ((new Date() - channel.createdAt) / 1000 < 5) return;
							
							if (!Object.keys(db.get('vcc')||{}).includes(key)) {
								return channel.delete().catch(() => {});
							}

							if (!channel.members.size) {
								db.set(`vcs.${db.get(`vcc.${channel.id}.owner`)}`, {
									name: channel.name,
									bitrate: channel.bitrate/1000,
									limit: channel.userLimit,
									ow: channel.permissionOverwrites
								})
					
								db.delete(`vcc.${channel.id}`)
								
								return channel.delete().catch(() => {});
							}

							for (const [key, value] of channel.permissionOverwrites.entries()) {
								if (value.allow.toArray().some(r => ["MOVE_MEMBERS", "DEAFEN_MEMBERS", "MUTE_MEMBERS"].includes(r))) {

									console.log("Removed abusive permissions from user.");

									value.update({
										'MOVE_MEMBERS': null,
										'DEAFEN_MEMBERS': null,
										'MUTE_MEMBERS': null,
									})
								}
							}
						}
					}
				})

				VCChecker();
			}, 1000);
		})();

		/*
		(function MuteChecker() {
			setTimeout(async function () {
				var mutes = db.get('mutes') || {};

				for (var [guild_id, mute_list] of Object.entries(mutes)) {
					for (var [member_id, time_ms] of Object.entries(mute_list)) {
						var guild = client.guilds.cache.find(g => g.id == guild_id);
						if (!guild) return;
						var member = guild.members.cache.find(m => m.id == member_id);
						if (!member) return;
						
						var role = guild.roles.cache.find(r => r.id == guilds[guild_id].roles.muted);
						if (!member) return;

						var now = new Date().getTime();
						if (time_ms*1000 < now) {
							await member.roles.remove(role);
							db.delete(`mutes.${member.guild.id}.${member.id}`);
						}
					}
				}

				MuteChecker();
			}, 2000);
		})();
		*/

		// Adds stats to db
		(function VCStats() {
			setTimeout(async function () {
				Object.keys(guilds).forEach(async (guildID) => {
					if (!guilds[guildID] || !guilds[guildID].enabled) return;
					if (!Object.keys(guilds[guildID]).includes('vc')) return;
					const guild = client.guilds.cache.find(g => g.id == guildID);

					var monthly_date = new Date(db.get(`stats.${guild.id}.monthly_date`));
					if (monthly_date.getMonth() != new Date().getMonth()) {
						console.log(`Stats Database - New Month`);
						
						db.set(`stats.${guild.id}.monthly_date`, new Date())

						db.set(`stats.${guild.id}.vc_time.today`, {});
						db.set(`stats.${guild.id}.vc_activity.today`, {});

						db.set(`stats.${guild.id}.vc_time.this_month`, {});
						db.set(`stats.${guild.id}.vc_activity.this_month`, {});
					} else if (monthly_date.getDay() != new Date().getDay()) {
						console.log(`Stats Database - New Day`);

						db.set(`stats.${guild.id}.monthly_date`, new Date())

						db.set(`stats.${guild.id}.vc_time.today`, {});
						db.set(`stats.${guild.id}.vc_activity.today`, {});
					}

					guild.channels.cache.forEach(channel => {
						if (!Object.keys(db.get('vcc')).includes(channel.id)) return;

						var owner_id = db.get(`vcc.${channel.id}.owner`) || "0";
						
						channel.members.forEach(member => {
							if (!member.voice.deaf) {
								db.add(`stats.${guild.id}.vc_time.today.users.${member.id}`, 1);
								db.add(`stats.${guild.id}.vc_time.this_month.users.${member.id}`, 1);
								db.add(`stats.${guild.id}.vc_time.all_time.users.${member.id}`, 1);

								db.add(`stats.${guild.id}.vc_activity.today.${owner_id}.${member.id}`, 1);
								db.add(`stats.${guild.id}.vc_activity.this_month.${owner_id}.${member.id}`, 1);
								db.add(`stats.${guild.id}.vc_activity.all_time.${owner_id}.${member.id}`, 1);
							}
							db.set(`stats.${guild.id}.vc_last_seen.users.${member.id}`, new Date());
						})

						var record_size = db.get(`stats.${guild.id}.records.most_people_vc.people`);
						if (record_size) {
							record_size = record_size.length;
						} else record_size = 0;

						if (channel.members.size > record_size) {
							var people = [];
							channel.members.forEach(member => {
								people.push(member.id);
							})

							db.set(`stats.${guild.id}.records.most_people_vc.date`, new Date());
							db.set(`stats.${guild.id}.records.most_people_vc.channel_owner_id`, owner_id);
							db.set(`stats.${guild.id}.records.most_people_vc.people`, people);
						}
					})
				})

				VCStats();
			}, 60000);
		})();
		
		// Updates VC stats message
		(async function UpdateStats() {
			setTimeout(async function () {
				Object.keys(guilds).forEach(async (guildID) => {
					if (!guilds[guildID] || !guilds[guildID].enabled) return;
					if (!Object.keys(guilds[guildID]).includes('stats')) return;
					const guild = client.guilds.cache.find(g => g.id == guildID);

					//db.set(`stats.${guild.id}.vc_time.this_month`, {});
					//db.set(`stats.${guild.id}.vc_activity.this_month`, {});
					//db.set(`stats.${guild.id}.vc_time.all_time`, {});
					//db.set(`stats.${guild.id}.vc_activity.all_time`, {});
					//db.set(`stats.${guild.id}.records`, {});

					var most_active_users_today = db.get(`stats.${guild.id}.vc_time.today.users`) || {};
					var most_active_users_month = db.get(`stats.${guild.id}.vc_time.this_month.users`) || {};
					var most_active_users_all = db.get(`stats.${guild.id}.vc_time.all_time.users`) || {};
					var records_data = db.get(`stats.${guild.id}.records`) || {};

					//#region Get data for message
					function most_active_users_list(data_month, data_all) {
						var returnable = {};
						
						var most_active_users = {
							1: undefined,
							2: undefined,
							3: undefined,
							4: undefined,
							5: undefined,
						};
						
						var most_active_users_today_arr = [];
						for (let [key, value] of Object.entries(most_active_users_today)) {
							var hrs = value/60;
							most_active_users_today_arr.push({id: key, num: Math.round(hrs * 10) / 10});
						}
						
						var most_active_users_month_arr = [];
						for (let [key, value] of Object.entries(most_active_users_month)) {
							var hrs = value/60;
							most_active_users_month_arr.push({id: key, num: Math.round(hrs * 10) / 10});
						}
					
						var most_active_users_all_arr = [];
						for (let [key, value] of Object.entries(most_active_users_all)) {
							var hrs = value/60;
							most_active_users_all_arr.push({id: key, num: Math.round(hrs * 10) / 10});
						}
					
						var count = most_active_users_month_arr.length;
						for (i = 1; i < Object.keys(most_active_users).length+1; i++) {
							if (i > 5) break;
							if (i > count) {
								returnable[i] = undefined;
							} else {
								var obj = getBiggest(most_active_users_month_arr);
								
								var all_time = most_active_users_all[obj.id] || 0;
								var today = most_active_users_today[obj.id] || 0;
								
								returnable[i] = {
									id: obj.id,
									activity: {
										all_time: Math.round(all_time/60 * 10) / 10,
										month: obj.num,
										today: Math.round(today/60 * 10) / 10
									}
								}
							}
							
						}
					
						function getBiggest(arr) {
							var max = Math.max(...arr.map(i => i.num));
					
							var obj = arr.find(o => o.num == max);
					
							var index = most_active_users_month_arr.indexOf(obj);
							if (index > -1) {
								most_active_users_month_arr.splice(index, 1);
							}
					
							return obj;
						}
					
						return returnable;
					}
					function most_active_users_total(data_month, data_all) {
						var returnable = {};
						
						var most_active_users_today_arr = [];
						for (let [key, value] of Object.entries(most_active_users_today)) {
							most_active_users_today_arr.push({id: key, num: Math.round(value/60 * 10) / 10});
						}
						
						var most_active_users_month_arr = [];
						for (let [key, value] of Object.entries(most_active_users_month)) {
							most_active_users_month_arr.push({id: key, num: Math.round(value/60 * 10) / 10});
						}
					
						var most_active_users_all_arr = [];
						for (let [key, value] of Object.entries(most_active_users_all)) {
							most_active_users_all_arr.push({id: key, num: Math.round(value/60 * 10) / 10});
						}
					
						return {
							today: most_active_users_today_arr.map(v => v.num).reduce((a, b) => a + b, 0),
							month: most_active_users_month_arr.map(v => v.num).reduce((a, b) => a + b, 0),
							all: most_active_users_all_arr.map(v => v.num).reduce((a, b) => a + b, 0)
						};
					}
					function records(data) {
						if (!data.most_people_vc || !data.most_people_vc.date) return `N/A`;
						
						var date = new Date(data.most_people_vc.date);
						
						return {
							date: date,
							users: data.most_people_vc.people
						}
					}
					//#endregion
					
					// Update message in stats channel
					var msg_channel = guild.channels.cache.find(c => c.id == guilds[guildID].stats.vc.channel);
					var msg = await msg_channel.messages.fetch(guilds[guildID].stats.vc.message);

					/*
					var embed = new MessageEmbed()
					.addFields(
						{ name: 'Most Active Users In VC', value: `${most_active_users_list(most_active_users_month, most_active_users_all)}**Whole server combined:** ${most_active_users_total(most_active_users_month, most_active_users_all)}`, inline: false },
						{ name: 'Most People In VC', value: `${records(records_data)}`, inline: false },
					)
					.setFooter('Tracking since 2021-12-11 � Updates every 10 minutes');
					*/

					most_active_users_list_r = most_active_users_list(most_active_users_month, most_active_users_all);
					most_active_total_list_r = most_active_users_total(most_active_users_month, most_active_users_all);
					records_r = records(records_data);

					var print = {};

					for (var i = 1; i <= 5; i++) {
						var index = most_active_users_list_r[i];

						if (index) {
							var medal = "";
							if (i == 1) {
								medal = "🥇 ";
							} else if (i == 2) {
								medal = "🥈 ";
							} else if (i == 3) {
								medal = "🥉 ";
							}
	
							if (index.id == 318383492172087297) {
								print[i] = `**\`[${i}]\`** ${medal}<@${index.id}> Month: ██h | Today: ██h`; // | All Time: ██h`;
							} else {
								print[i] = `**\`[${i}]\`** ${medal}<@${index.id}> Month: ${index.activity.month}h | Today: ${index.activity.today}h`; // | All Time: ${index.activity.all_time}h
							}
						} else {
							print[i] = `**\`[${i}]\`** N/A`
						}
					}

					var highest_amount = "N/A"
					if (records_r) {
						highest_amount = `${records_r.users.length} users (${records_r.date.toLocaleString('lt')})`;
					}

					var embed = new MessageEmbed()
					.addFields(
						{ name: `Most Active Users In VC This Month`, value: `${print[1]}\n${print[2]}\n${print[3]}\n${print[4]}\n${print[5]}\n**Server Total:** Month: ${Math.round(most_active_total_list_r.month * 10) / 10}h | Today: ${Math.round(most_active_total_list_r.today * 10) / 10}h`, inline: false }, // | All Time: ${Math.round(most_active_total_list_r.all * 10) / 10}h`, inline: false },
						{ name: "Highest Amount Of People In VC", value: highest_amount, inline: false}
					)
					.setFooter('Tracking since 2021-12-11 � Updates every 10 minutes')

					msg.edit(embed);
				})

				UpdateStats();
			}, 600000);
		})();

		// Update steam stats message
		(function steamStats() {
			setTimeout(async function () {
				Object.keys(guilds).forEach(async (guildID) => {
					if (!guilds[guildID] || !guilds[guildID].enabled || !guilds[guildID].stats) return;
					const guild = client.guilds.cache.find(g => g.id == guildID);
					
					var apiresult = [];

					for (var i = 0; i < ids.length; i++) {
						var obj = ids[i];

						var min = 0;
						
						for (var z = 0; z < obj.steamID.length; z++) {
							var sid = obj.steamID[z];

							await steam.getUserRecentGames(sid).then(data => {
								data.forEach(d => {
									min += d.playTime2
								});
							});
						}

						apiresult.push({
							steamID: obj.steamID,
							discordID: obj.discordID,
							hrs: Math.round((min/60) * 10) / 10
						});
					}

					returnable = {};
					prepared_array = [];
					
					for (var i = 0; i < apiresult.length; i++) {
						var d = apiresult[i];
						prepared_array.push({steamID: d.steamID, discordID: d.discordID, num: d.hrs});
					}

					for (i = 1; i <= apiresult.length; i++) {
						var obj = getBiggest(prepared_array);
						
						if (obj.num != 0) returnable[i] = obj
					}
				
					function getBiggest(arr) {
						var max = Math.max(...arr.map(i => i.num));
				
						var obj = arr.find(o => o.num == max);
				
						var index = prepared_array.indexOf(obj);
						if (index > -1) {
							prepared_array.splice(index, 1);
						}
				
						return obj;
					}
					
					pages = Math.ceil(Object.keys(returnable).length/5);
					if (pages > 2) pages = 2;

					embed = new MessageEmbed().setFooter('Powered by Steam � Updates every 30 minutes');

					for (var ind = 0; ind < pages; ind++) {
						print = "";

						for (var i = 1; i <= Object.keys(returnable).length; i++) {
							if (i > 5) break;

							var i2 = ind*5+i;
							
							var index = returnable[i2];

							if (index) {
								var medal = "";
								if (i2 == 1) {
									medal = "🥇 ";
								} else if (i2 == 2) {
									medal = "🥈 ";
								} else if (i2 == 3) {
									medal = "🥉 ";
								}
		
								print += `\`[${(((ind*5+i) < 10) && (Object.keys(returnable).length) >= 10) ? `0${ind*5+i}` : ind*5+i}]\` ${medal}<@${index.discordID}> [${index.num} hours past 2 weeks](https://steamcommunity.com/profiles/${index.steamID[0]}) ${(index.steamID.length > 1) ? `[${index.steamID.length}]` : ""}\n`;
							}
						}

						var name = `Steam Highest Recent Activity`;
						if (ind > 0) name = "\u200B";

						embed.addFields(
							{ name: name, value: print, inline: false },
						)
					}

					var msg_channel = guild.channels.cache.find(c => c.id == guilds[guildID].stats.steam.channel);
					var msg = await msg_channel.messages.fetch(guilds[guildID].stats.steam.message);

					msg.edit(embed);
				})
				steamStats();
			}, 1800000);
		})();
	},
};
