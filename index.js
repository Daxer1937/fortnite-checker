const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { EpicGamesAuth } = require('./utils/auth');
const { FortniteAPI } = require('./utils/fortniteAPI');
const { handleAdminCommands } = require('./adminCommands');

dotenv.config();

const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Store sessions
const authSessions = new Map();
const apiSessions = new Map();
const userLogs = new Map();

bot.once('ready', async () => {
  console.log(`✅ Bot logged in as ${bot.user.tag}`);
  console.log(`✅ Bot ID: ${bot.user.id}`);
  console.log(`✅ Connected to ${bot.guilds.cache.size} guilds`);
  console.log('🚀 Bot is fully ready!');

  // Send startup log to admin channel
  try {
    const logGuild = await bot.guilds.fetch(process.env.LOG_GUILD_ID);
    const logChannel = await logGuild.channels.fetch(process.env.LOG_CHANNEL_ID);
    if (logChannel) {
      const embed = {
        title: '🤖 Bot Online',
        description: 'Fortnite Locker Bot has started successfully',
        color: 0x00FF00,
        timestamp: new Date().toISOString(),
        footer: { text: `Admin Log • User ID: ${process.env.ADMIN_USER_ID}` }
      };
      await logChannel.send({ embeds: [embed] });
    }
  } catch (error) {
    console.log('Failed to send startup log:', error.message);
  }
});

// Handle slash commands
bot.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = bot.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, { authSessions, apiSessions, userLogs, bot });
  } catch (error) {
    console.error('Error executing command:', error);
    const errorMessage = {
      content: '❌ There was an error executing this command!',
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

// Handle prefix commands (admin)
bot.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  if (commandName === 'admin_help' || commandName === 'skincheck_logs' || 
      commandName === 'user_details' || commandName === 'security_settings' ||
      commandName === 'create_exchange_code' || commandName === 'clear_logs') {
    await handleAdminCommands(message, commandName, args, { userLogs, bot });
  }
});

// Load commands
bot.commands = new Map();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  bot.commands.set(command.data.name, command);
}

// Login to Discord
bot.login(process.env.DISCORD_BOT_TOKEN).catch(error => {
  console.error('❌ Failed to login to Discord:', error);
  process.exit(1);
});
