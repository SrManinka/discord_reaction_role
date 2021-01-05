const fs = require('fs');
const server = require("../data/server.json")
let channelsIds = Object.keys(server)
const config = require("../../config.json");

module.exports = {

    async saveRule(rule) {
        let ruleChannelId = Object.keys(rule)[0]
        let newObject = server

        //if channel 
        newObject[ruleChannelId] = server[ruleChannelId]

        for (var channelId in server) {
            if (channelId == ruleChannelId) {
                let ruleMessageId = Object.keys(rule[ruleChannelId])[0]
                let ruleReactionName = Object.keys(rule[ruleChannelId][ruleMessageId])[0]
                newObject[ruleChannelId][ruleMessageId] = rule[ruleChannelId][ruleMessageId]
                newObject[ruleChannelId][ruleMessageId][ruleReactionName] = rule[ruleChannelId][ruleMessageId][ruleReactionName]

            }
        }
        fs.writeFileSync(__dirname + "/../data/server.json",JSON.stringify(newObject)); 
    },

    //set a role for an user
    async setRole(info) {

        let role, roleId

        if (channelsIds.includes(info.channelId)) {
            let msgIds = Object.keys(server[info.channelId])
            if (msgIds.includes(info.messageId)) {
                let reaction = Object.keys(server[info.channelId][info.messageId])
                if (reaction.includes(info.emojiName))
                    roleId = server[info.channelId][info.messageId][info.emojiName]
            }
        }

        if (roleId) {
            role = await info.server.roles.fetch(roleId)

            if (info.messageT === "MESSAGE_REACTION_REMOVE")
                await info.user.roles.remove(role)

            if (info.messageT === "MESSAGE_REACTION_ADD")
                await info.user.roles.add(role)
        }
    },

    //creates a new reaction role
    async createRule(info) {
        let reactionRole = new Object
        const cancelOptions = { max: 1, time: config.cancelTime, errors: ['time'] }
        const cancelFilter = c => c.first().content.toLowerCase() == config.cancelCommand1 || c.first().content.toLowerCase() == config.cancelCommand2
        const cancelFunction = function (collected, botMsg) {
            if (cancelFilter(collected)) {
                botMsg.edit("creation canceled by user").then(() => collected.first().delete())
                return true
            }
        }
        const filter = m => m.author.id == info.user.id
        const reactionFilter = (reaction, user) => user.id == info.user.id

        let botMsg = await info.message.channel.send("tag the channel where the message is. \
        write cancel or wait 3 minutes to stop this command.")

        botMsg.channel.awaitMessages(filter, cancelOptions)
            .then((collected1) => {

                if (cancelFunction(collected1, botMsg)) return
                let channelId = collected1.first().content.slice(2, -1)
                let channel = info.server.channels.cache.get(channelId)

                if (!channel) {
                    botMsg.edit("channel not found").then(() => collected1.first().delete())
                    return
                }

                botMsg.edit("now send message Id. write cancel or wait 3 minutes to stop this command.").then(() => collected1.first().delete())
                botMsg.channel.awaitMessages(filter, cancelOptions)
                    .then((collected2) => {

                        if (cancelFunction(collected2, botMsg)) return
                        let msgId = collected2.first().content

                        channel.messages.fetch(msgId).then(msg => {

                            botMsg.edit("write the role name. write cancel or wait 3 minutes to stop this command.").then(() => collected2.first().delete())
                            botMsg.channel.awaitMessages(filter, cancelOptions)
                                .then(collected3 => {
                                    if (cancelFunction(collected3, botMsg)) return

                                    let roleName = collected3.first().content
                                    let newRole = null

                                    msg.guild.roles.cache.forEach(role => {
                                        if (role.name.toLowerCase() == roleName.toLowerCase()) {
                                            newRole = role
                                        }
                                    })

                                    if (!newRole) {
                                        botMsg.edit("role not found").then(() => collected3.first().delete())
                                        return
                                    } else {
                                        botMsg.edit("react this message with the emoji you want to use. write cancel or wait 3 minutes to stop this command.").then(() => collected3.first().delete())

                                        botMsg.awaitReactions(reactionFilter, cancelOptions)
                                            .then((reaction) => {
                                                (async () => {
                                                    let a = new Object
                                                    let b = new Object
                                                    a[reaction.first()._emoji.name] = newRole.id
                                                    b[msgId] = a
                                                    reactionRole[channelId] = b
                                                this.saveRule(reactionRole)
                                                botMsg.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
                                                botMsg.edit("Saved")
                                                })()
                                                msg.react(reaction.first()._emoji)
                                            }).catch((e) => {
                                                console.log(e)
                                                botMsg.edit("reaction was not given. Reaction Role creation canceled").then(() => collected1.first().delete())
                                                return
                                            })
                                    }
                                }).catch((e) => {
                                    console.log(e)
                                    botMsg.edit("role was not given. Reaction Role creation canceled").then(() => collected1.first().delete())
                                    return
                                })

                        }).catch((e) => {
                            botMsg.edit("message not found").then(() => collected2.first().delete())
                            return
                        })
                        
                    }).catch((e) => {
                        //console.log(e)
                        botMsg.edit("message was not given. Reaction Role creation canceled").then(() => collected1.first().delete())
                        return
                    })
            })
            .catch(() => botMsg.edit("answer was not given. Reaction Role creation canceled"));


    }

}