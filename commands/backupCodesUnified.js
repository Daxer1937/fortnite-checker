const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('backup_codes')
    .setDescription('View your backup codes')
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
        content: '❌ Please login first using `/login` (demo) or `/real_login` (real backup codes)',
        ephemeral: true
      });
      return;
    }

    try {
      const auth = authSessions.get(userId);
      
      // Check if this is real Epic Games auth or demo
      const isRealAuth = auth.constructor.name === 'EpicGamesAuthReal' && auth.accessToken;

      switch (subcommand) {
        case 'view':
          await handleViewBackupCodes(interaction, auth, isRealAuth);
          break;
        case 'generate':
          await handleGenerateBackupCode(interaction, auth, isRealAuth);
          break;
        case 'delete':
          await handleDeleteBackupCode(interaction, auth, interaction.options.getString('code_id'), isRealAuth);
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

async function handleViewBackupCodes(interaction, auth, isRealAuth) {
  try {
    const backupCodes = await auth.getBackupCodes(interaction.user.id);
    
    if (!backupCodes || backupCodes.length === 0) {
      await interaction.followUp({
        content: '📋 You have no backup codes. Use `/backup_codes generate` to create one.',
        ephemeral: true
      });
      return;
    }

    const embed = {
      title: isRealAuth ? '🔐 Your REAL Epic Games Backup Codes' : '🔐 Your Demo Backup Codes',
      description: `Total backup codes: ${backupCodes.length}`,
      color: isRealAuth ? 0x00FF00 : 0x0099FF,
      fields: [],
      footer: { 
        text: isRealAuth ? '🔒 REAL Epic Games backup codes - Keep secure!' : '⚠️ Demo codes - For illustration only'
      }
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

async function handleGenerateBackupCode(interaction, auth, isRealAuth) {
  try {
    const newCode = await auth.generateBackupCode(interaction.user.id);
    
    const embed = {
      title: isRealAuth ? '🔑 New REAL Backup Code Generated' : '🔑 New Demo Backup Code Generated',
      description: isRealAuth ? 'Real Epic Games backup code for account recovery' : 'Demo backup code for illustration purposes',
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
          name: isRealAuth ? '🔒 Important' : '⚠️ Important',
          value: isRealAuth 
            ? 'Save this REAL backup code in a secure location. It can be used to recover your Epic Games account.'
            : 'This is a demo code for illustration. Real backup codes are managed through Epic Games account settings.',
          inline: false
        }
      ],
      footer: { 
        text: isRealAuth ? 'REAL Epic Games backup code - Keep secure!' : 'Demo functionality - Not actual Epic Games backup codes'
      }
    };

    await interaction.followUp({ embeds: [embed], ephemeral: true });

  } catch (error) {
    await interaction.followUp({
      content: `❌ Failed to generate backup code: ${error.message}`,
      ephemeral: true
    });
  }
}

async function handleDeleteBackupCode(interaction, auth, codeId, isRealAuth) {
  try {
    await auth.deleteBackupCode(interaction.user.id, codeId);
    
    await interaction.followUp({
      content: isRealAuth 
        ? `✅ REAL backup code deleted successfully!` 
        : `✅ Demo backup code deleted successfully!`,
      ephemeral: true
    });

  } catch (error) {
    await interaction.followUp({
      content: `❌ Failed to delete backup code: ${error.message}`,
      ephemeral: true
    });
  }
}
