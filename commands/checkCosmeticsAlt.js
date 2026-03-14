const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('check_cosmetics_alt')
    .setDescription('View Fortnite cosmetics using Fortnite API'),

  async execute(interaction, { authSessions, apiSessions, userLogs, bot }) {
    await interaction.deferReply({ ephemeral: true });

    try {
      // Using Fortnite API (no OAuth needed)
      const response = await axios.get('https://fortnite-api.com/v2/cosmetics/br');
      const cosmetics = response.data.data;

      const embed = {
        title: '🎮 Fortnite Cosmetics (Fortnite API)',
        description: `Available cosmetics: ${cosmetics.length}`,
        color: 0x0099FF,
        fields: [
          {
            name: '📊 Categories',
            value: 'Skins, Pickaxes, Gliders, Emotes, Backblings, etc.',
            inline: false
          },
          {
            name: '⚠️ Note',
            value: 'This shows all available cosmetics, not your personal locker',
            inline: false
          }
        ],
        footer: { text: 'Powered by Fortnite-API.com' }
      };

      await interaction.followUp({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error('Fortnite API error:', error);
      await interaction.followUp({
        content: `❌ Failed to fetch cosmetics: ${error.message}`,
        ephemeral: true
      });
    }
  }
};
