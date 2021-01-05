const Discord = require("discord.js");
const client = new Discord.Client();
const rl = require("./src/functions/reactionRoles")
const config = require("./config.json");
client.login(config.token);

client.on("ready", () => {
  console.log("I am ready!");
});

client.on('raw', async msg => {

  if ((msg.t === "MESSAGE_REACTION_ADD" || msg.t === "MESSAGE_REACTION_REMOVE" || msg.t == 'MESSAGE_CREATE') && msg.d != null) {
  
    var info = new Object()
    info.messageT = msg.t
    info.messageId = msg.d.id || msg.d.message_id
    info.channelId = msg.d.channel_id
    info.server = client.guilds.resolve(msg.d.guild_id)

    //if its   a reaction
    if (msg.t != "MESSAGE_CREATE") {
      info.user = await info.server.members.fetch(msg.d.user_id)
      info.emojiName = msg.d.emoji.name
      rl.setRole(info)
    } else if (!msg.d.author.bot) {
      //gets the message itself
      await client.channels.fetch(info.channelId).then(channel => {
        channel.messages.fetch(info.messageId).then(m => info.message = m)
      })

      //if it is not a private message
      if (msg.d.guild_id) {
        info.user = await client.users.cache.get(msg.d.author.id)

        if (!msg.d.content.startsWith(config.prefix)) return;

        const arguments = msg.d.content.slice(config.prefix.length).trim().split(/ +/g);
        const command = arguments.shift().toLowerCase();

        if (command == config.createRuleCommand)
          await rl.createRule(info)

      }

    }

  }


})