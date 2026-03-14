const { SlashCommandBuilder } = require('discord.js');
const { EpicGamesAuthReal } = require('../utils/authReal');
const { FortniteAPI } = require('../utils/fortniteAPI');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('real_login')
    .setDescription('Login with Epic Games OAuth to get REAL backup codes'),

  async execute(interaction, { authSessions, apiSessions, userLogs, bot }) {
    await interaction.deferReply({ ephemeral: true });

    const userId = interaction.user.id;
    
    // Create new auth session
    const auth = new EpicGamesAuthReal();
    authSessions.set(userId, auth);

    try {
      // Start device code flow
      console.log(`🔄 Starting REAL Epic device flow for user_id=${userId}`);
      const deviceInfo = await auth.startDeviceFlow();
      console.log(`✅ REAL Epic device flow started for user_id=${userId}`);

      const embed = {
        title: '🔗 Epic Games Authentication (REAL)',
        description: 'Please complete the authentication process to access REAL backup codes:',
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
          },
          {
            name: '⚠️ Important',
            value: 'This will give you access to your REAL Epic Games backup codes, not demo codes.',
            inline: false
          }
        ],
        footer: { text: 'Enter the code on the Epic Games website to continue' }
      };

      await interaction.followUp({ embeds: [embed], ephemeral: true });

      // Start polling for token in background
      pollForAuth(userId, auth, interaction, { authSessions, apiSessions, userLogs, bot });

    } catch (error) {
      console.error('REAL Login error:', error);
      await interaction.followUp({
        content: `❌ Failed to start REAL authentication: ${error.message}\n\nTry using \`/login\` for demo functionality instead.`,
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
        title: '✅ REAL Login Successful!',
        description: `Successfully authenticated as **${userInfo.displayName}** with REAL Epic Games access`,
        color: 0x00FF00,
        fields: [
          {
            name: '🎮 Account ID',
            value: userInfo.id || 'Unknown',
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
    } else {
      await interaction.followUp({
        content: '❌ REAL authentication failed or timed out\n\nTry using `/login` for demo functionality.',
        ephemeral: true
      });
    }
  } catch (error) {
    console.error('REAL Polling error:', error);
    await interaction.followUp({
      content: `❌ REAL authentication error: ${error.message}\n\nTry using `/login` for demo functionality.`,
      ephemeral: true
    });
  }
}

function logUserLogin(userId, username, api, { userLogs, bot }) {
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
