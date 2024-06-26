module.exports = {
	description: "Changes the bots' activity (game, status). https://discord.js.org/#/docs/main/stable/typedef/PresenceData",
	usage: "<status>, <activity type>, <activity name>",
	usageExample: "dnd, listening, Use !help for commands",
	aliases: ['activity', 'game', 'status'],
	permission: 4,
	async execute(message, args, client) {
		var input = args.join(" ").split(',');
		if (input.length != 3) return client.respond(`Invalid input.`, {msg:message,id:3})

		var status = input[0].replace(/\s+/g, '').toLowerCase();
		var activityType = input[1].replace(/\s+/g, '').toUpperCase();
		var game = input[2].replace(/^\s+/g, '');
		
		await client.user.setPresence({ activity: { name: game, type: activityType }, status: status })
		return client.respond(`Updated bot presence`, {msg:message, id:1})
	},
};
