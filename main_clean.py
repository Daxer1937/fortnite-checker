#!/usr/bin/env python3
"""
Fortnite Cosmetic Checker - Discord Bot Only (Clean Version)
A Discord bot for checking Fortnite account cosmetics
"""

import sys
import os
import discord
from typing import Optional

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Use maximum permissions config as default
from config_max import Config
from discord_bot_clean import FortniteCheckerBot

def print_banner():
    """Print application banner"""
    banner = """
    ╔══════════════════════════════════════════════════════════════╗
    ║                Fortnite Cosmetic Checker                     ║
    ║                                                              ║
    ║  🎮 Discord Bot for Fortnite Cosmetics                      ║
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

def run_discord_bot():
    """Run Discord bot only"""
    print("🚀 Starting Fortnite Cosmetic Checker...")
    print(f"🔧 Bot ID: {Config.DISCORD_BOT_ID}")
    print(f"🔧 Testing Mode: {getattr(Config, 'TESTING_MODE', False)}")
    print(f"🔧 Max Permissions: {getattr(Config, 'MAX_PERMISSIONS', False)}")
    
    if not Config.validate_config():
        print("❌ Configuration validation failed!")
        return
    
    bot = FortniteCheckerBot()
    
    # Add simple admin commands
    from discord_bot_clean import SimpleAdminCommands
    bot.add_cog(SimpleAdminCommands(bot))
    
    # Retry connection logic
    max_retries = 3
    for attempt in range(max_retries):
        try:
            print(f"🤖 Attempting Discord connection (attempt {attempt + 1}/{max_retries})...")
            # Use bot.run() directly - it handles its own event loop
            bot.run(Config.DISCORD_BOT_TOKEN)
            break
        except discord.errors.LoginFailure:
            print("❌ Login failed: Invalid bot token")
            break
        except discord.errors.PrivilegedIntentsRequired:
            print("❌ Privileged intents required - enable them in Discord Developer Portal")
            break
        except Exception as e:
            print(f"❌ Connection attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                print(f"⏳ Retrying in 5 seconds...")
                import time
                time.sleep(5)
            else:
                print("❌ All connection attempts failed")
                import traceback
                traceback.print_exc()

def main():
    """Main entry point - Discord bot only"""
    print_banner()
    run_discord_bot()

if __name__ == "__main__":
    main()
