const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fortnite_login')
    .setDescription('Login using Fortnite API (no OAuth required)')
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
      // Create a simple session without OAuth
      const session = {
        username: username,
        userId: userId,
        loggedIn: true,
        loginTime: Date.now()
      };

      authSessions.set(userId, session);

      const embed = {
        title: '✅ Fortnite API Login Successful',
        description: `Logged in as **${username}**`,
        color: 0x00FF00,
        fields: [
          {
            name: '🎮 Features Available',
            value: '• View public cosmetics\n• Generate mock backup codes\n• Browse categories',
            inline: false
          },
          {
            name: '⚠️ Note',
            value: 'This uses Fortnite API (public data only). Backup codes are simulated for demonstration.',
            inline: false
          }
        ],
        footer: { text: 'You can now use /check_cosmetics and /backup_codes' }
      };

      await interaction.followUp({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error('Fortnite API login error:', error);
      await interaction.followUp({
        content: `❌ Login failed: ${error.message}`,
        ephemeral: true
      });
    }
  }
};
