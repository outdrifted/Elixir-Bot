module.exports = {
	category: 'utility',
	description: "Creates a poll users can vote on.",
	usage: `"Title" "Option 1" "Option 2" ...`,
	usageExample: `"What color do you like?" "Red" "Green" "Blue"`,
	aliases: ['vote'],
	cooldown: 60,
	async execute(message, args, client) {
		var str = message.content;

        var singleQuoted = str.split(`"`).map(function (substr, i) {
            return i % 2 ? substr : null;
        });

        vote = [];
        singleQuoted.forEach(element => {
            if (!element) return;
            vote.push(element);
        });

        voteTitle = vote[0]; // Vote Title
        vote.shift();
		
        voteOptions = [...new Set(vote)]; // Vote Options

		console.log(voteOptions);

        reacts = []; // Just for calculating reactions
        reactions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

		if (!voteTitle) return client.respond("You must enter a vote title and at least two vote options.", {msg:message, id:3});
		if (voteOptions.length < 1) return client.respond("You must enter 1-10 vote options.", {msg:message, id:3});
		if (voteOptions.length > 10) return client.respond("You can enter no more than 10 vote options.", {msg:message, id:3});

        var desc = [];
        voteOptions.forEach(element => {
            let i = voteOptions.indexOf(element);
            desc.push(reactions[i] + ` ${voteOptions[i]}`);
        });

		var msg = await message.channel.send({embed:{
			description: desc.join('\n'),
			footer: {
				text: `Vote by ${message.author.tag}`,
				iconURL: message.author.displayAvatarURL()
			},
			title: voteTitle
		}});

		client.deleteMessage([message], 0.1)

		voteOptions.forEach(element => {
			let i = voteOptions.indexOf(element);
			reacts.push(reactions[i]);
		});

		reacts.forEach(element => {
			msg.react(element);
		});
	},
};