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

4. **Set up configuration**
   ```bash
   # Option 1: Edit config.py
   # Update DISCORD_BOT_TOKEN and DISCORD_BOT_ID
   
   # Option 2: Use environment variables
   export DISCORD_BOT_TOKEN="your_bot_token_here"
   export DISCORD_BOT_ID="your_application_id"
   ```

5. **Run the application**
   ```bash
   # Run both Discord bot and web interface
   python main.py both
   
   # Or run separately
   python main.py discord  # Discord bot only
   python main.py web      # Web interface only
   ```

## 📋 Commands

### Discord Bot Commands

- `/login` - Start Epic Games authentication
- `/check_cosmetics` - Display your Fortnite locker summary
- `/category [name]` - View items in a specific category
- `/logout` - Logout from Epic Games

### Categories Available

- skins (Outfits)
- backblings (Back Blings)
- pickaxes (Harvesting Tools)
- emotes (Dances & Emotes)
- wraps (Weapon Wraps)
- gliders (Glider Trail)
- music (Music Packs)
- loading_screens (Loading Screens)
- contrails (Contrails)
- sprays (Sprays)
- emojis (Emojis)
- toys (Toys)

## 🌐 Web Interface

The web interface provides a complete view of your Fortnite locker:

1. **Authentication Flow**
   - Visit `http://localhost:8000`
   - Click "Login with Epic Games"
   - Follow the secure OAuth flow
   - Automatically redirected to your locker

2. **Features**
   - Search cosmetics by name
   - Filter by rarity (Common, Rare, Epic, Legendary)
   - Filter by favorites and exclusives
   - Responsive grid layout
   - Item hover effects and details

## 🔒 Authentication Safety

This application uses the **official Epic Games OAuth device code flow**:

- ✅ No username/password storage
- ✅ Uses official Epic Games endpoints
- ✅ Secure token exchange
- ✅ Automatic token refresh
- ✅ Session-based authentication

The same authentication method used by:
- Epic Games Launcher
- Fortnite mobile apps
- Official Epic Games services

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
