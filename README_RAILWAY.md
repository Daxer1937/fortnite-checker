# 🚀 Railway Deployment Guide

## 📋 Quick Setup for Railway Hosting

### 1. 🍴 Fork to GitHub
```bash
# Fork this repository to your GitHub account
# Railway will deploy from your fork
```

### 2. ⚙️ Environment Variables
Set these in Railway dashboard:

```env
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_BOT_ID=your_discord_application_id
WEB_HOST=0.0.0.0
WEB_PORT=8000
```

### 3. 🚀 Deploy to Railway

1. Connect your GitHub account to Railway
2. Select this repository
3. Railway will automatically detect the `Procfile`
4. Deploy with default settings

### 4. 🔧 Configuration Files

- **`Procfile`**: Tells Railway how to run your app
- **`railway.json`**: Railway deployment configuration
- **`.gitignore`**: Excludes sensitive files from Git

## 📊 Admin Commands (Your User ID Only)

Once deployed, use these commands with `!` prefix:

- **`!skincheck_logs`** - View all user login logs
- **`!user_details [user_id]`** - Get detailed user information
- **`!security_settings`** - View current configuration
- **`!create_exchange_code`** - Generate new authentication code
- **`!clear_logs CONFIRM`** - Clear all user logs
- **`!export_logs`** - Export logs as JSON file

## 🎮 Bot Commands (Slash Commands)

- **`/login`** - Start Epic Games authentication
- **`/check_cosmetics`** - View your Fortnite locker
- **`/category [name]`** - Browse specific categories
- **`/logout`** - Logout from Epic Games

## 🔐 Logging Features

The bot automatically logs to your specified channel:
- **Guild ID**: `1271653225895825471`
- **Channel ID**: `1280338968923078878`
- **Admin User ID**: `1399638881078345819`

Each login logs:
- Username and User ID
- Timestamp of login
- Total cosmetics count
- Exclusive items count
- Categories breakdown
- Account statistics

## 🌐 Web Interface

Your Railway app will also host the web interface at:
`https://your-app-name.railway.app`

Features:
- Same Epic Games authentication
- Mobile-friendly cosmetic viewer
- Search and filtering
- Real-time updates

## 📝 Maximum Permissions Mode

The bot runs in maximum permissions mode for testing:
- 70+ Epic Games OAuth scopes
- Comprehensive data access
- Full API capabilities
- Admin logging features

## ⚠️ Important Notes

- Use only with your test account initially
- Users will see extensive permission requests
- All data is logged to your admin channel
- Bot respects Discord rate limits
- Automatic token refresh included

## 🔍 Troubleshooting

If deployment fails:
1. Check environment variables are set
2. Ensure Discord bot token is valid
3. Verify bot has proper intents
4. Check Railway logs for errors

## 📞 Support

For issues:
1. Check Railway deployment logs
2. Verify Discord bot permissions
3. Ensure admin channel is accessible
4. Review environment variables
