const db = require('quick.db');

module.exports = {
	category: 'Custom Voice Channels',
	description: "Displays who the owner of current VC is.",
	usage: " ",
	usageExample: " ",
	aliases: ['vcowner'],
	async execute(message, args, client) {
		var current_channel_id = message.member.voice.channelID;
		var channel_data = db.get(`vcc.${current_channel_id}`);

		if (!current_channel_id) return client.respond("You must be in a voice channel.", {id:3,msg:message})

		if (channel_data) {
			return client.respond(`The owner of this voice channel is <@${channel_data.owner}>`, {msg:message})
		} else {
			return client.respond(`I do not recognise this channel.`, {id:2,msg:message})
		}
	},
};