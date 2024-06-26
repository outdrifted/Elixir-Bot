const { toInteger } = require('lodash');

module.exports = {
	category: 'mod',
	description: "Deletes a specified amount of messages. Default is 10",
	usage: "[amount]",
	usageExample: ["17"],
	permission: 1,
	aliases: ['purge', 'clean', 'delete'],
	async execute(message, args, client) {
		var amount = 10;
		if (!isNaN(args[0])) {
			if (args[0] < 1 || args[0] > 99) {return client.respond(`Message amount must be between 1 and 99`, {msg:message,id:3})} else amount = args[0];
		};
		
		var messages = await message.channel.bulkDelete(toInteger(amount)+1, true);

		var msgs = {};
		messages.forEach(msg => {
			if (!msgs[msg.author.id]) msgs[msg.author.id] = 0;
			msgs[msg.author.id] = msgs[msg.author.id] + 1;
		})
		
		msgs = (() => {
			var msgs_text = "";
			
			for (const [key, val] of Object.entries(msgs)) {
				msgs_text += `<@${key}> : ${val}\n`;
			}

			return msgs_text;
		})()

		return client.respond(`Deleted ${messages.size} messages. **Only deleted messages that are newer than two weeks.**\n\n${msgs}`, {msg:message,id:1})
	},
};