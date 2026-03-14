const { SlashCommandBuilder } = require('discord.js');
const { EpicGamesAuth } = require('../utils/auth');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('login')
    .setDescription('Login with Epic Games for REAL backup codes'),

  async execute(interaction, { authSessions, apiSessions, userLogs, bot }) {
    await interaction.deferReply({ ephemeral: true });

    const userId = interaction.user.id;
    
    // Create new Epic Games auth session
    const auth = new EpicGamesAuth();
    authSessions.set(userId, auth);

    try {
      // Get Epic Games authorization URL
      const authUrl = await auth.getAuthUrl();
      console.log(`🔄 Generated auth URL for user_id=${userId}`);

      const embed = {
        title: '🔗 Epic Games Authentication',
        description: 'Click the link below to authenticate with Epic Games for REAL backup codes:',
        color: 0x0099FF,
        fields: [
          {
            name: '🌐 Login Link',
            value: `[Click here to authenticate](${authUrl})`,
            inline: false
          },
          {
            name: '📋 Instructions',
            value: '1. Click the link above\n2. Login to your Epic Games account\n3. Authorize the application\n4. You will be redirected to a page with a code in the URL\n5. Copy the code (the part after `code=`)\n6. Come back here and use `/login_complete <code>`',
            inline: false
          },
          {
            name: '🔍 Example',
            value: 'If redirected to: `https://accounts.epicgames.com/fnauth?code=ABC123XYZ`\nYour code is: `ABC123XYZ`',
            inline: false
          },
          {
            name: '⚠️ Important',
            value: 'This will give you access to your REAL Epic Games backup codes',
            inline: false
          }
        ],
        footer: { text: 'REAL Epic Games authentication - Full access enabled' }
      };

      await interaction.followUp({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error('Login error:', error);
      await interaction.followUp({
        content: `❌ Failed to generate authentication link: ${error.message}`,
        ephemeral: true
      });
    }
  }
};
