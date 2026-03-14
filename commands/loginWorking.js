const { SlashCommandBuilder } = require('discord.js');
const { FortniteAPIAuth } = require('../utils/fortniteAuth');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('login')
    .setDescription('Login to Fortnite (bypass Epic Games OAuth issues)')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Your Epic Games username')
        .setRequired(true)
    ),

  async execute(interaction, { authSessions, apiSessions, userLogs, bot }) {
    await interaction.deferReply({ ephemeral: true });

    const username = interaction.options.getString('username');
    const userId = interaction.user.id;

    try {
      // Use Fortnite API Auth (bypasses Epic Games OAuth)
      const auth = new FortniteAPIAuth();
      const session = await auth.createSession(userId, username);
      
      // Store session
      authSessions.set(userId, auth);
      apiSessions.set(userId, auth);

      // Log user login
      logUserLogin(userId, username, auth, { userLogs, bot });

      const embed = {
        title: '✅ Fortnite Login Successful',
        description: `Logged in as **${username}**`,
        color: 0x00FF00,
        fields: [
          {
            name: '🎮 Features Available',
            value: '• View cosmetics collection\n• Manage backup codes\n• Browse categories',
            inline: false
          },
          {
            name: '🔐 Authentication Method',
            value: 'Fortnite API (bypasses Epic Games OAuth restrictions)',
            inline: false
          },
          {
            name: '📊 Cosmetics Found',
            value: `${session.cosmetics.length} items available`,
            inline: true
          }
        ],
        footer: { text: 'Use /check_cosmetics and /backup_codes to continue' }
      };

      await interaction.followUp({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error('Fortnite login error:', error);
      await interaction.followUp({
        content: `❌ Login failed: ${error.message}`,
        ephemeral: true
      });
    }
  }
};

function logUserLogin(userId, username, auth, { userLogs, bot }) {
  userLogs.set(userId, {
    timestamp: Date.now(),
    username: username,
    cosmeticsCount: 'Unknown',
    exclusivesCount: 'Unknown'
  });

  // Send to admin log channel (if configured)
  try {
    const logGuildId = process.env.LOG_GUILD_ID;
    const logChannelId = process.env.LOG_CHANNEL_ID;
    const adminUserId = process.env.ADMIN_USER_ID;

    if (logGuildId && logChannelId) {
      bot.guilds.fetch(logGuildId).then(guild => {
        if (guild) {
          guild.channels.fetch(logChannelId).then(channel => {
            if (channel) {
              const embed = {
                title: '✅ User Login (Fortnite API)',
                description: `👤 ${username} (${userId}) logged in successfully`,
                color: 0x00FF00,
                timestamp: new Date().toISOString(),
                footer: { text: `Admin Log • User ID: ${adminUserId}` }
              };
              channel.send({ embeds: [embed] });
            }
          }).catch(console.error);
        }
      }).catch(console.error);
    }
  } catch (error) {
    console.log('Failed to send admin log:', error.message);
  }
}
