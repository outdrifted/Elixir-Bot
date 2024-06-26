const db = require('quick.db');

module.exports = {
	description: "Runs Javascript code.",
	usage: "<code>",
	usageExample: `console.log("Hello, world!");`,
	permission: 4,
	async execute(message, args, client) {
		function clean(text) {
			if (typeof(text) === "string")
				return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
			else
				return text;
		}

		try {
			const code = args.join(" ");
			let evaled = eval(code);
	
			if (typeof evaled !== "string")
			evaled = require("util").inspect(evaled);
			
			client.respond(`Input:\`\`\`js\n${code||" "}\n\`\`\`Output:\`\`\`${clean(evaled)}\`\`\``, {msg:message});
		} catch (err) {
			client.respond(`**Error**\nInput:\`\`\`js\n${args.join(" ")||" "}\n\`\`\`Output:\`\`\`${clean(err)}\`\`\``, {id:3, msg:message});
		}
	},
};