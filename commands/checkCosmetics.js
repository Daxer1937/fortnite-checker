const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('check_cosmetics')
    .setDescription('Check available Fortnite cosmetics'),

  async execute(interaction, { authSessions, apiSessions, userLogs, bot }) {
    await interaction.deferReply({ ephemeral: true });

    try {
      // Use public Fortnite API
      const response = await axios.get('https://fortnite-api.com/v2/cosmetics/br/new');
      
      if (response.status === 200 && response.data.data) {
        const cosmetics = response.data.data.slice(0, 10); // Show first 10
        
        const embed = {
          title: '🎮 Fortnite Cosmetics',
          description: `Showing ${cosmetics.length} newest cosmetics`,
          color: 0x0099FF,
          fields: [],
          footer: { text: 'Data from Fortnite API' }
        };

        cosmetics.forEach((cosmetic, index) => {
          embed.fields.push({
            name: `${index + 1}. ${cosmetic.name}`,
            value: `**Type:** ${cosmetic.type.value}\n**Rarity:** ${cosmetic.rarity.value}\n**ID:** ${cosmetic.id}`,
            inline: false
          });
        });

        await interaction.followUp({ embeds: [embed], ephemeral: true });
      } else {
        throw new Error('Failed to fetch cosmetics');
      }
    } catch (error) {
      console.error('Cosmetics error:', error);
      await interaction.followUp({
        content: `❌ Failed to fetch cosmetics: ${error.message}`,
        ephemeral: true
      });
    }
  }
};
