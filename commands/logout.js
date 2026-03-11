const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logout')
    .setDescription('Logout from Epic Games'),

  async execute(interaction, { authSessions, apiSessions, userLogs, bot }) {
    const userId = interaction.user.id;

    if (authSessions.has(userId)) {
      authSessions.delete(userId);
    }

    if (apiSessions.has(userId)) {
      apiSessions.delete(userId);
    }

    await interaction.reply({
      content: '✅ Successfully logged out!',
      ephemeral: true
    });
  }
};
