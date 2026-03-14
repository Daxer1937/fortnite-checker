const { SlashCommandBuilder } = require('discord.js');
const { EpicGamesAuth } = require('../utils/auth');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('login_complete')
    .setDescription('Complete Epic Games login with authorization code')
    .addStringOption(option =>
      option.setName('code')
        .setDescription('The authorization code from Epic Games')
        .setRequired(true)
    ),

  async execute(interaction, { authSessions, apiSessions, userLogs, bot }) {
    await interaction.deferReply({ ephemeral: true });

    const userId = interaction.user.id;
    const authorizationCode = interaction.options.getString('code');

    if (!authSessions.has(userId)) {
      await interaction.followUp({
        content: '❌ Please start the login process first using `/login`',
        ephemeral: true
      });
      return;
    }

    try {
      const auth = authSessions.get(userId);
      
      // Exchange authorization code for access token
      console.log(`🔄 Exchanging code for token user_id=${userId}`);
      await auth.exchangeCodeForToken(authorizationCode);
      console.log(`✅ User authenticated: ${userId} (${auth.displayName})`);

      const embed = {
        title: '✅ Epic Games Login Successful!',
        description: `Successfully authenticated as **${auth.displayName}**`,
        color: 0x00FF00,
        fields: [
          {
            name: '🎮 Account ID',
            value: auth.accountId,
            inline: false
          },
          {
            name: '🔑 Backup Codes Access',
            value: '✅ You can now view your REAL Epic Games backup codes',
            inline: false
          },
          {
            name: '🎯 Next Steps',
            value: 'Use `/backup_codes view` to see your actual backup codes',
            inline: false
          }
        ],
        footer: { text: 'REAL Epic Games authentication - Full access enabled' }
      };

      await interaction.followUp({ embeds: [embed], ephemeral: true });

      // Log user login
      logUserLogin(userId, auth.displayName, auth, { userLogs, bot });

    } catch (error) {
      console.error('Login completion error:', error);
      await interaction.followUp({
        content: `❌ Failed to complete authentication: ${error.message}`,
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
    exclusivesCount: 'Unknown',
    authType: 'REAL Epic Games OAuth'
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
                title: '✅ REAL User Login (Epic Games OAuth)',
                description: `👤 ${username} (${userId}) logged in with REAL Epic Games access`,
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
