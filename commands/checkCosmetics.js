const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('check_cosmetics')
    .setDescription('Display your Fortnite cosmetics'),

  async execute(interaction, { authSessions, apiSessions, userLogs, bot }) {
    await interaction.deferReply({ ephemeral: true });

    const userId = interaction.user.id;

    if (!apiSessions.has(userId)) {
      await interaction.followUp({
        content: '❌ Please login first using /login',
        ephemeral: true
      });
      return;
    }

    try {
      const api = apiSessions.get(userId);
      const cosmetics = await api.getOwnedCosmetics();

      if (!cosmetics || cosmetics.length === 0) {
        await interaction.followUp({
          content: '❌ No cosmetics found or API error',
          ephemeral: true
        });
        return;
      }

      // Categorize cosmetics
      const categorized = api.categorizeCosmetics(cosmetics);

      const embed = {
        title: '🎮 Your Fortnite Locker',
        description: `Total items: ${cosmetics.length}`,
        color: 0x9B59B6,
        fields: []
      };

      // Add category counts
      for (const [category, items] of Object.entries(categorized)) {
        if (items && items.length > 0 && category !== 'all') {
          const emoji = getCategoryEmoji(category);
          embed.fields.push({
            name: `${emoji} ${category.charAt(0).toUpperCase() + category.slice(1)}`,
            value: `${items.length} items`,
            inline: true
          });
        }
      }

      embed.footer = { text: 'Use /category to view items in a specific category' };

      await interaction.followUp({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error('Check cosmetics error:', error);
      await interaction.followUp({
        content: `❌ Failed to fetch cosmetics: ${error.message}`,
        ephemeral: true
      });
    }
  }
};

function getCategoryEmoji(category) {
  const emojis = {
    skins: '👕',
    pickaxes: '⛏️',
    gliders: '🪂',
    emotes: '💃',
    backpacks: '🎒',
    wraps: '🎁',
    contrails: '✨',
    music: '🎵',
    loading_screens: '🖼️',
    sprays: '🎨',
    emojis: '😀',
    toys: '🧸',
    other: '📦'
  };
  return emojis[category] || '📦';
}
