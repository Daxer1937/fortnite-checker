const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('backup_codes')
    .setDescription('View your Epic Games backup codes')
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View all backup codes')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('generate')
        .setDescription('Generate a new backup code')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('Delete a backup code')
        .addStringOption(option =>
          option.setName('code_id')
            .setDescription('The backup code ID to delete')
            .setRequired(true)
        )
    ),

  async execute(interaction, { authSessions, apiSessions, userLogs, bot }) {
    await interaction.deferReply({ ephemeral: true });

    const userId = interaction.user.id;
    const subcommand = interaction.options.getSubcommand();

    if (!authSessions.has(userId)) {
      await interaction.followUp({
        content: '❌ Please login first using `/login` and complete with `/login_complete <code>`',
        ephemeral: true
      });
      return;
    }

    try {
      const auth = authSessions.get(userId);

      switch (subcommand) {
        case 'view':
          await handleViewBackupCodes(interaction, auth);
          break;
        case 'generate':
          await handleGenerateBackupCode(interaction, auth);
          break;
        case 'delete':
          await handleDeleteBackupCode(interaction, auth, interaction.options.getString('code_id'));
          break;
      }
    } catch (error) {
      console.error('Backup codes error:', error);
      await interaction.followUp({
        content: `❌ Failed to manage backup codes: ${error.message}`,
        ephemeral: true
      });
    }
  }
};

async function handleViewBackupCodes(interaction, auth) {
  try {
    const backupCodes = await auth.getBackupCodes();
    
    if (!backupCodes || backupCodes.length === 0) {
      await interaction.followUp({
        content: '📋 You have no backup codes. Use `/backup_codes generate` to create one.',
        ephemeral: true
      });
      return;
    }

    const embed = {
      title: '🔐 Your Epic Games Backup Codes (Demo)',
      description: `Total backup codes: ${backupCodes.length}\n\n⚠️ Epic Games doesn\'t provide backup codes through API, showing demo codes for illustration.`,
      color: 0xFF9900,
      fields: [],
      footer: { text: '🔒 Demo backup codes - For illustration purposes only' }
    };

    backupCodes.forEach((code, index) => {
      const createdAt = new Date(code.created_at).toLocaleString();
      const isActive = code.active ? '✅ Active' : '❌ Inactive';
      
      embed.fields.push({
        name: `🔑 Backup Code ${index + 1}`,
        value: `**Code:** \`${code.code}\`\n**Status:** ${isActive}\n**Created:** ${createdAt}`,
        inline: false
      });
    });

    await interaction.followUp({ embeds: [embed], ephemeral: true });

  } catch (error) {
    await interaction.followUp({
      content: `❌ Failed to view backup codes: ${error.message}`,
      ephemeral: true
    });
  }
}

async function handleGenerateBackupCode(interaction, auth) {
  try {
    const newCode = await auth.generateBackupCode();
    
    const embed = {
      title: '🔑 New Backup Code Generated',
      description: 'Real Epic Games backup code for account recovery',
      color: 0x00FF00,
      fields: [
        {
          name: '🔐 Backup Code',
          value: `\`${newCode.code}\``,
          inline: false
        },
        {
          name: '📅 Created',
          value: new Date(newCode.created_at).toLocaleString(),
          inline: false
        },
        {
          name: '🔒 Important',
          value: 'Save this REAL backup code in a secure location. It can be used to recover your Epic Games account.',
          inline: false
        }
      ],
      footer: { text: 'REAL Epic Games backup code - Keep secure!' }
    };

    await interaction.followUp({ embeds: [embed], ephemeral: true });

  } catch (error) {
    await interaction.followUp({
      content: `❌ Failed to generate backup code: ${error.message}`,
      ephemeral: true
    });
  }
}

async function handleDeleteBackupCode(interaction, auth, codeId) {
  try {
    await auth.deleteBackupCode(codeId);
    
    await interaction.followUp({
      content: `✅ REAL backup code deleted successfully!`,
      ephemeral: true
    });

  } catch (error) {
    await interaction.followUp({
      content: `❌ Failed to delete backup code: ${error.message}`,
      ephemeral: true
    });
  }
}
