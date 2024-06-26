import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Gets bot\'s latency.'),
    async execute(client, interaction) {
		await interaction.deferReply();
		const reply = await interaction.fetchReply();
		const ping = reply.createdTimestamp - interaction.createdTimestamp;
		interaction.editReply(`Client ${ping}ms | Websocket: ${client.ws.ping}ms`);
    },
};
