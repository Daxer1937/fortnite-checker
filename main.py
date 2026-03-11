#!/usr/bin/env python3
"""
Fortnite Cosmetic Checker - Main Entry Point
A Discord bot and web interface for checking Fortnite account cosmetics
"""

import asyncio
import sys
import os
from typing import Optional

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Use maximum permissions config for testing
from config_max import Config
from discord_bot import FortniteCheckerBot
from web_interface import app
import uvicorn

def print_banner():
    """Print application banner"""
    banner = """
    ╔══════════════════════════════════════════════════════════════╗
    ║                Fortnite Cosmetic Checker                     ║
    ║                                                              ║
    ║  🎮 Discord Bot + Web Interface for Fortnite Cosmetics     ║
    ║  🔒 Safe Epic Games OAuth Authentication                   ║
    ║  ⭐ Exclusive Item Detection                               ║
    ║                                                              ║
    ║  🚨 MAXIMUM PERMISSIONS MODE - TESTING ONLY 🚨              ║
    ║  🔓 All Epic Games Scopes Enabled                           ║
    ╚══════════════════════════════════════════════════════════════╝
    """
    print(banner)
    
    # Show permission summary
    if Config.MAX_PERMISSIONS:
        print("\n" + "="*60)
        print(Config.get_permission_summary())
        print("="*60)
        print("⚠️  WARNING: This will request extensive permissions from users!")
        print("⚠️  Use only for testing with your own account!")
        print("="*60)

def print_usage():
    """Print usage instructions"""
    usage = """
    Usage: python main.py [mode]
    
    Modes:
      discord    - Run Discord bot only
      web        - Run web interface only  
      both       - Run both Discord bot and web interface (default)
    
    Environment Variables:
      DISCORD_BOT_TOKEN    - Your Discord bot token
      DISCORD_BOT_ID       - Your Discord application ID
      WEB_HOST             - Web interface host (default: 0.0.0.0)
      WEB_PORT             - Web interface port (default: 8000)
    
    Setup Instructions:
    
    1. Discord Bot Setup:
       - Create a bot at https://discord.com/developers/applications
       - Enable Server Members Intent and Message Content Intent
       - Copy your bot token and application ID
       - Invite bot to your server with proper permissions
    
    2. Configuration:
       - Edit config.py or set environment variables
       - Make sure to set DISCORD_BOT_TOKEN and DISCORD_BOT_ID
    
    3. Run the application:
       python main.py both
    
    Features:
    - ✅ Safe Epic Games OAuth device code authentication
    - 🎮 Complete Discord bot with slash commands
    - 🌐 Beautiful web interface for viewing cosmetics
    - 🔒 Automatic exclusive item detection
    - ⭐ Favorite item highlighting
    - 📊 Account statistics display
    - 📱 Mobile-responsive design
    """
    print(usage)

async def run_discord_bot():
    """Run Discord bot"""
    print("🤖 Starting Discord bot...")
    
    if not Config.validate_config():
        print("❌ Invalid configuration. Please check your settings.")
        return
    
    # Update bot configuration
    bot = FortniteCheckerBot()
    bot.application_id = Config.DISCORD_BOT_ID
    
    try:
        await bot.start(Config.DISCORD_BOT_TOKEN)
    except Exception as e:
        print(f"❌ Discord bot error: {e}")
        return

def run_web_interface():
    """Run web interface"""
    print("🌐 Starting web interface...")
    
    try:
        uvicorn.run(
            app,
            host=Config.WEB_HOST,
            port=Config.WEB_PORT,
            log_level="info"
        )
    except Exception as e:
        print(f"❌ Web interface error: {e}")
        return

async def run_both():
    """Run both Discord bot and web interface"""
    print("🚀 Starting both Discord bot and web interface...")
    
    if not Config.validate_config():
        print("❌ Invalid configuration. Please check your settings.")
        return
    
    # Start web interface in background
    web_task = asyncio.create_task(
        asyncio.to_thread(run_web_interface)
    )
    
    # Give web interface a moment to start
    await asyncio.sleep(2)
    
    # Start Discord bot
    await run_discord_bot()

def main():
    """Main entry point"""
    print_banner()
    
    if len(sys.argv) > 1:
        mode = sys.argv[1].lower()
    else:
        mode = "both"
    
    if mode in ["help", "-h", "--help"]:
        print_usage()
        return
    
    if mode == "discord":
        asyncio.run(run_discord_bot())
    elif mode == "web":
        run_web_interface()
    elif mode == "both":
        asyncio.run(run_both())
    else:
        print(f"❌ Unknown mode: {mode}")
        print_usage()
        sys.exit(1)

if __name__ == "__main__":
    main()
