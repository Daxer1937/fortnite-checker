const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('category')
    .setDescription('View items in a specific category')
    .addStringOption(option =>
      option.setName('category')
        .setDescription('The category to view (skins, pickaxes, emotes, etc.)')
        .setRequired(true)
    ),

  async execute(interaction, { authSessions, apiSessions, userLogs, bot }) {
    await interaction.deferReply({ ephemeral: true });

    const userId = interaction.user.id;
    const category = interaction.options.getString('category').toLowerCase();

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
      const categorized = api.categorizeCosmetics(cosmetics);

      if (!categorized[category] || categorized[category].length === 0) {
        const availableCategories = Object.keys(categorized)
          .filter(cat => categorized[cat] && categorized[cat].length > 0 && cat !== 'all');
        
        await interaction.followUp({
          content: `❌ Category '${category}' not found. Available: ${availableCategories.join(', ')}`,
          ephemeral: true
        });
        return;
      }

      const items = categorized[category];
      const embed = {
        title: `${getCategoryEmoji(category)} ${category.charAt(0).toUpperCase() + category.slice(1)}`,
        description: `${items.length} items found`,
        color: 0x0099FF,
        fields: []
      };

      // Show first 10 items
      for (let i = 0; i < Math.min(10, items.length); i++) {
        const item = items[i];
        const name = item.name || 'Unknown';
        const rarity = item.rarity || 'Common';
        const exclusive = item.exclusive ? '🔒' : '';
        
        embed.fields.push({
          name: `${name} ${exclusive}`,
          value: `Rarity: ${rarity}`,
          inline: false
        });
      }

      if (items.length > 10) {
        embed.footer = { text: `Showing 10 of ${items.length} items` };
      }

      await interaction.followUp({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error('Category error:', error);
      await interaction.followUp({
        content: `❌ Failed to fetch category: ${error.message}`,
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
