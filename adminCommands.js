const { EpicGamesAuth } = require('./utils/auth');

async function handleAdminCommands(message, commandName, args, { userLogs, bot }) {
  const adminUserId = process.env.ADMIN_USER_ID;
  
  if (message.author.id !== adminUserId) {
    await message.reply('❌ Admin only command');
    return;
  }

  switch (commandName) {
    case 'admin_help':
      await showAdminHelp(message);
      break;
    
    case 'skincheck_logs':
      await showSkincheckLogs(message, { userLogs });
      break;
    
    case 'user_details':
      await showUserDetails(message, args, { userLogs });
      break;
    
    case 'security_settings':
      await showSecuritySettings(message);
      break;
    
    case 'create_exchange_code':
      await createExchangeCode(message);
      break;
    
    case 'clear_logs':
      await clearLogs(message, args, { userLogs });
      break;
  }
}

async function showAdminHelp(message) {
  const embed = {
    title: '🎮 Fortnite Cosmetic Checker - Admin Commands',
    description: 'Available admin commands:',
    color: 0x0099FF,
    fields: [
      {
        name: 'Slash Commands (Everyone)',
        value: '`/login` - Start Epic Games authentication\n'
              + '`/check_cosmetics` - View your Fortnite locker\n'
              + '`/category [name]` - Browse specific categories\n'
              + '`/logout` - Logout from Epic Games\n'
              + '`/backup_codes view` - View backup codes\n'
              + '`/backup_codes generate` - Generate new backup code\n'
              + '`/backup_codes delete [id]` - Delete backup code',
        inline: false
      },
      {
        name: 'Admin Commands (! prefix)',
        value: '`!admin_help` - Show this help\n'
              + '`!skincheck_logs` - View all user logs\n'
              + '`!user_details [user_id]` - Get user details\n'
              + '`!security_settings` - View configuration\n'
              + '`!create_exchange_code` - Generate auth code\n'
              + '`!clear_logs CONFIRM` - Clear all logs',
        inline: false
      }
    ],
    footer: { text: '🚨 MAXIMUM PERMISSIONS MODE - TESTING ONLY' }
  };

  await message.reply({ embeds: [embed] });
}

async function showSkincheckLogs(message, { userLogs }) {
  if (userLogs.size === 0) {
    await message.reply('📋 No user logs available');
    return;
  }

  const embed = {
    title: '📊 User Skincheck Logs',
    description: `Total users logged: ${userLogs.size}`,
    color: 0x0099FF,
    fields: []
  };

  for (const [userId, logData] of userLogs.entries()) {
    const timeStr = new Date(logData.timestamp).toLocaleString();
    embed.fields.push({
      name: `👤 ${logData.username} (${userId})`,
      value: `🕐 ${timeStr}\n🎮 ${logData.cosmeticsCount} cosmetics\n🔒 ${logData.exclusivesCount} exclusives`,
      inline: false
    });
  }

  await message.reply({ embeds: [embed] });
}

async function showUserDetails(message, args, { userLogs }) {
  const userId = args[0];
  
  if (!userId) {
    await message.reply('❌ Please provide a user ID');
    return;
  }

  if (!userLogs.has(userId)) {
    await message.reply(`❌ No logs found for user ${userId}`);
    return;
  }

  const logData = userLogs.get(userId);

  const embed = {
    title: `🔍 User Details: ${logData.username}`,
    color: 0x00FF00,
    fields: [
      {
        name: '🆔 User ID',
        value: userId,
        inline: false
      },
      {
        name: '🕐 Login Time',
        value: new Date(logData.timestamp).toLocaleString(),
        inline: false
      },
      {
        name: '🎮 Total Cosmetics',
        value: logData.cosmeticsCount,
        inline: true
      },
      {
        name: '🔒 Exclusives',
        value: logData.exclusivesCount,
        inline: true
      }
    ]
  };

  await message.reply({ embeds: [embed] });
}

async function showSecuritySettings(message) {
  const embed = {
    title: '🔐 Security Settings',
    color: 0xFFD700,
    fields: [
      {
        name: '🚨 Testing Mode',
        value: process.env.TESTING_MODE || 'false',
        inline: true
      },
      {
        name: '🔓 Max Permissions',
        value: process.env.MAX_PERMISSIONS || 'false',
        inline: true
      },
      {
        name: '🆔 Client ID',
        value: `\`\`\`${process.env.EPIC_CLIENT_ID}\`\`\``,
        inline: false
      },
      {
        name: '🌐 API URL',
        value: `\`\`\`${process.env.EPIC_API_URL}\`\`\``,
        inline: false
      },
      {
        name: '👥 Active Sessions',
        value: '0', // This would need to be tracked
        inline: true
      }
    ]
  };

  await message.reply({ embeds: [embed] });
}

async function createExchangeCode(message) {
  await message.reply('🔄 Creating exchange code...');

  try {
    const auth = new EpicGamesAuth();
    const deviceInfo = await auth.startDeviceFlow();

    const embed = {
      title: '🔗 Exchange Code Created',
      description: 'Use this code for testing authentication',
      color: 0x00FF00,
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
          inline: false
        },
        {
          name: '🔄 Check Interval',
          value: `${deviceInfo.interval} seconds`,
          inline: false
        }
      ]
    };

    await message.reply({ embeds: [embed] });

  } catch (error) {
    await message.reply(`❌ Failed to create exchange code: ${error.message}`);
  }
}

async function clearLogs(message, args, { userLogs }) {
  const confirm = args[0];
  
  if (confirm !== 'CONFIRM') {
    await message.reply('⚠️ Type `!clear_logs CONFIRM` to clear all logs');
    return;
  }

  const logCount = userLogs.size;
  userLogs.clear();

  await message.reply(`✅ Cleared ${logCount} user logs`);
}

module.exports = { handleAdminCommands };
