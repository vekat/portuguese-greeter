const Discord = require('discord.js')
const logger = require('debug-level').log('greeter')

const settings = require('./settings')

const { BOT_TOKEN } = process.env

const client = new Discord.Client({ partials: ['GUILD_MEMBER'] })

client.on('ready', async () => {
  const TAG = '[ready]'
  logger.info(TAG, `user: ${client.user.tag}`)
})

client.on('guildMemberUpdate', async (before, after) => {
  const TAG = '[guildMemberUpdate]'

  // ignore partials or bots
  if (before.partial || after.user.bot) {
    return
  }

  // filter for role additions
  if (before.roles.cache.size >= after.roles.cache.size) {
    return
  }

  const diff = after.roles.cache.filter((_, k) => !before.roles.cache.has(k))
  // require member role addition
  if (!diff.has(settings.roles.member)) {
    return
  }

  const yesterday = new Date(Date.now() - 24 * 3600 * 1000)
  // require joining recently
  if (after.joinedAt < yesterday) {
    return
  }

  if (!after.guild.channels.cache.has(settings.channels.greetings)) {
    return logger.error(TAG, 'missing greetings channel')
  }

  logger.info(TAG, 'greeting member', after.toString(), after.displayName)

  const greetingsChannel = after.guild.channels.cache.get(settings.channels.greetings)
  message = await greetingsChannel.send(settings.introductionMessage(after))
  return message.delete({ timeout: 5 * 60 * 1000, reason: 'greeting message timeout' })
})

client.login(BOT_TOKEN)

process.once('SIGINT', (_) => client.destroy())
