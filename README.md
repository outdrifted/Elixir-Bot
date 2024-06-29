# Custom Voice Channels Bot
Discord temporary voice channels bot, that allows users to dynamically create and edit their own channels. Made using the Discord.js library in Node.js.

![Bot](https://i.imgur.com/Mhorgh2.gif)

## Prerequisites
* [Node.js and npm](https://nodejs.org/en)
* [git](https://git-scm.com/downloads) (or download repository manually)

## How to install
### Linux:
* Clone the repository (``git clone https://github.com/outdrifted/Elixir-Bot``)
* Navigate to the repo (``cd Elixir-Bot``)
* Install all required NPM packages (``npm i``)
* Configuration files:
    * Edit guilds.json based on your guild. Template:
        ```
        {
            "guild_id": {
                "enabled": true,
                "roles": {
                    "blacklist": "role_id"
                },
                "vc": {
                    "channel": "role_id",
                    "category": "role_id"
                }
            }
        }
        ```
        * Replace `guild_id` with your guild ID.
        * `enabled` enables/disables the bot in a specific guild.
        * `roles.blacklist` is the ID of the role, that is not permitted to create voice channels.
        * `vc.channel` is the channel that a user joins to create a voice channel.
        * `vc.category` is the category the channel specified above is in.
    * In the bot's root directory, create a `.env` file. Contents:
        ```
        # Credentials
        BOT_TOKEN=your_token

        # Bot ID
        BOT_CLIENT_ID=811605881971671051

        # Bot owner ID
        OWNER_ID=243436321018871810

        # Repeated channel creation cooldown (in seconds)
        VC_COOLDOWN=20
        ```
    * `deploy-commands.js` is used to register slash commands. The bot doesn't have any commands except for /ping, so it's not necessary to run it.
    * Run the bot: ``node bot.js``. On sucessfull launch, you should see "Ready! Logged in as ..." in the terminal.
#### Optional:
* Install pm2 (``npm install pm2@latest -g``). This package allows your bot to run on system startup and automatically restarts it if it crashes:
    * While in the bot's directory, run it with: ``pm2 start bot.js``
    * Create startup script: ``pm2 startup``
    * Freeze process list: ``pm2 save``