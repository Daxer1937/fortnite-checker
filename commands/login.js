const { SlashCommandBuilder } = require('discord.js');
const { EpicGamesAuth } = require('../utils/auth');
const { FortniteAPI } = require('../utils/fortniteAPI');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('login')
    .setDescription('Start Epic Games login process'),

  async execute(interaction, { authSessions, apiSessions, userLogs, bot }) {
    await interaction.deferReply({ ephemeral: true });

    const userId = interaction.user.id;
    
    // Create new auth session
    const auth = new EpicGamesAuth();
    authSessions.set(userId, auth);

    try {
      // Start device code flow
      console.log(`🔄 Starting Epic device flow for user_id=${userId}`);
      const deviceInfo = await auth.startDeviceFlow();
      console.log(`✅ Epic device flow started for user_id=${userId}`);

      const embed = {
        title: '🔗 Epic Games Authentication',
        description: 'Please complete the authentication process:',
        color: 0x0099FF,
        fields: [
          {
            name: '📱 User Code',
            value: `**${deviceInfo.user_code}**`,
            inline: false
          },
          {
            name: '🌐 Login URL',
            value: deviceInfo.verification_uri,
            inline: false
          },
          {
            name: '⏰ Expires In',
            value: `${deviceInfo.expires_in} seconds`,
            inline: true
          },
          {
            name: '🔄 Check Interval',
            value: `${deviceInfo.interval} seconds`,
            inline: true
          }
        ],
        footer: { text: 'Enter the code on the Epic Games website to continue' }
      };

      await interaction.followUp({ embeds: [embed], ephemeral: true });

      // Start polling for token in background
      pollForAuth(userId, auth, interaction, { authSessions, apiSessions, userLogs, bot });

    } catch (error) {
      console.error('Login error:', error);
      await interaction.followUp({
        content: `❌ Failed to start authentication: ${error.message}`,
        ephemeral: true
      });
    }
  }
};

async function pollForAuth(userId, auth, interaction, { authSessions, apiSessions, userLogs, bot }) {
  try {
    const success = await auth.pollForToken();

    if (success) {
      // Get user info
      const userInfo = await auth.getUserInfo();

      // Create API session
      const api = new FortniteAPI(auth);
      apiSessions.set(userId, api);

      // Log the user login
      logUserLogin(userId, userInfo.displayName, api, { userLogs, bot });

      // Send success message
      const embed = {
        title: '✅ Login Successful!',
        description: `Successfully authenticated as **${userInfo.displayName}**`,
        color: 0x00FF00,
        fields: [
          {
            name: '🎮 Account ID',
            value: userInfo.id || 'Unknown',
            inline: false
          }
        ],
        footer: { text: 'You can now use /check_cosmetics to view your items' }
      };

      await interaction.followUp({ embeds: [embed], ephemeral: true });
    } else {
      await interaction.followUp({
        content: '❌ Authentication failed or timed out',
        ephemeral: true
      });
    }
  } catch (error) {
    console.error('Polling error:', error);
    await interaction.followUp({
      content: `❌ Authentication error: ${error.message}`,
      ephemeral: true
    });
  }
}

function logUserLogin(userId, username, api, { userLogs, bot }) {
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
                title: '✅ User Login',
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
