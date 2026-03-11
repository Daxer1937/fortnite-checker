# Fortnite Cosmetic Checker

A comprehensive Discord bot and web interface for checking Fortnite account cosmetics using safe Epic Games OAuth authentication.

## 🌟 Features

- **🔐 Safe Authentication**: Uses official Epic Games OAuth device code flow
- **🎮 Discord Bot**: Complete slash command interface for Discord
- **🌐 Web Interface**: Beautiful, mobile-friendly web viewer
- **🔒 Exclusive Detection**: Automatically marks exclusive items
- **⭐ Favorites Support**: Highlights favorited cosmetics
- **📊 Account Stats**: Shows V-Bucks, wins, and gift statistics
- **📱 Responsive Design**: Works on all devices
- **🎨 Modern UI**: Clean, intuitive interface

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Discord Bot Token
- Epic Games Account (for testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fortnite-cosmetic-checker
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Discord Bot**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application and bot
   - Enable **Server Members Intent** and **Message Content Intent**
   - Copy your **Bot Token** and **Application ID**

- `/login` - Start Epic Games authentication
- `/check_cosmetics` - View your Fortnite locker
- `/category [name]` - Browse specific categories
- `/logout` - Logout from Epic Games

### Admin Commands (! prefix)
- `!admin_help` - Show this help
- `!skincheck_logs` - View all user logs
- `!user_details [user_id]` - Get user details
- `!security_settings` - View configuration
- `!create_exchange_code` - Generate auth code
- `!clear_logs CONFIRM` - Clear all logs

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your credentials
4. Deploy slash commands:
   ```bash
   npm run deploy-commands
   ```
5. Start the bot:
   ```bash
   npm start
   ```

## Environment Variables

- `DISCORD_BOT_TOKEN` - Your Discord bot token
- `DISCORD_BOT_ID` - Your Discord application ID
- `EPIC_CLIENT_ID` - Epic Games client ID
- `EPIC_CLIENT_SECRET` - Epic Games client secret
- `EPIC_API_URL` - Epic Games API URL
- `ADMIN_USER_ID` - Admin user ID for admin commands
- `LOG_GUILD_ID` - Guild ID for admin logs
- `LOG_CHANNEL_ID` - Channel ID for admin logs
- `MAX_PERMISSIONS` - Enable maximum permissions (true/false)
- `TESTING_MODE` - Enable testing mode (true/false)

## Railway Deployment

This project is configured for Railway deployment. Simply connect your GitHub repository and Railway will automatically deploy the Node.js application.

## Project Structure

## 🛠️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DISCORD_BOT_TOKEN` | Discord bot token | Required |
| `DISCORD_BOT_ID` | Discord application ID | Required |
| `WEB_HOST` | Web interface host | `0.0.0.0` |
| `WEB_PORT` | Web interface port | `8000` |

### Discord Bot Permissions

Your bot needs these permissions:
- Read Messages/View Channels
- Send Messages
- Embed Links
- Use Slash Commands

## 📊 API Integration

The application integrates with:

- **Epic Games API**: Authentication and profile data
- **Fortnite API**: Cosmetic definitions and metadata
- **Discord API**: Bot functionality and commands

## 🔧 Development

### Project Structure

```
fortnite-cosmetic-checker/
├── main.py              # Entry point
├── config.py            # Configuration settings
├── auth.py              # Epic Games OAuth
├── fortnite_api.py      # Fortnite API client
├── discord_bot.py       # Discord bot implementation
├── web_interface.py     # FastAPI web server
├── templates/           # HTML templates
│   ├── index.html       # Login page
│   └── locker.html      # Locker viewer
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

### Adding New Features

1. **New Cosmetic Types**: Update `categorize_cosmetics()` in `fortnite_api.py`
2. **New Discord Commands**: Add to `discord_bot.py`
3. **New Web Pages**: Add templates and routes to `web_interface.py`

## 🐛 Troubleshooting

### Common Issues

1. **Discord Bot Not Responding**
   - Check bot token and permissions
   - Ensure intents are enabled
   - Verify bot is online

2. **Authentication Fails**
   - Check Epic Games services status
   - Ensure OAuth credentials are correct
   - Try refreshing the page

3. **Web Interface Not Loading**
   - Check if port 8000 is available
   - Verify all dependencies are installed
   - Check console logs for errors

### Debug Mode

Enable debug logging:
```bash
export DEBUG=1
python main.py both
```

## 📄 License

This project is for educational purposes only. Please respect Epic Games' terms of service and API usage guidelines.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## ⚠️ Disclaimer

- This is an unofficial project and not affiliated with Epic Games
- Use responsibly and in accordance with Epic Games' terms of service
- Never share your authentication tokens with others
- This tool is for viewing your own cosmetics only

## 📞 Support

If you encounter issues:
1. Check this README for solutions
2. Review the troubleshooting section
3. Create an issue with detailed information
4. Include error logs and steps to reproduce

---

**Enjoy viewing your Fortnite cosmetics! 🎮✨**
