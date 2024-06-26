import { Client, Events, GatewayIntentBits, Collection } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from 'url';
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory
import 'dotenv/config';
const token = process.env.BOT_TOKEN;

const client = new Client({ 
	presence: { activity: { name: `/help | Pajebat Land`, type: "WATCHING" }, status: "online" },
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

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
        await command.execute(client, interaction);
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

client.login(token);