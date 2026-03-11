import discord
from discord import app_commands
from discord.ext import commands
import asyncio
import json
import time
from typing import Optional
from auth import EpicGamesAuth
from fortnite_api import FortniteAPI
from admin_commands import AdminCommands
from config_max import Config

class FortniteCheckerBot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        intents.guilds = True
        intents.members = True
        
        super().__init__(
            command_prefix="!",
            intents=intents,
            application_id=Config.DISCORD_BOT_ID  # Use from config
        )
        
        self.auth_sessions = {}  # Store auth sessions per user
        self.api_sessions = {}   # Store API sessions per user
        
    async def on_ready(self):
        print(f"✅ Bot logged in as {self.user}")
        print(f"✅ Bot ID: {self.user.id}")
        print(f"✅ Connected to {len(self.guilds)} guilds")
        
        try:
            await self.tree.sync()
            print("✅ Commands synced successfully")
        except Exception as e:
            print(f"❌ Failed to sync commands: {e}")
        
        # Load admin commands
        try:
            await self.add_cog(AdminCommands(self))
            print("✅ Admin commands loaded")
            # Send admin log
            admin_cog = self.get_cog('AdminCommands')
            if admin_cog:
                await admin_cog.send_log("🤖 Bot Online", "Fortnite Cosmetic Checker bot is now online", discord.Color.green)
        except Exception as e:
            print(f"❌ Failed to load admin commands: {e}")
        
        print("🚀 Bot is fully ready!")
    
    @app_commands.command(name="login", description="Start Epic Games login process")
    async def login(self, interaction: discord.Interaction):
        """Start the Epic Games authentication process"""
        user_id = interaction.user.id
        
        # Create new auth session
        auth = EpicGamesAuth()
        self.auth_sessions[user_id] = auth
        
        try:
            # Start device flow
            device_info = await auth.start_device_flow()
            
            # Create embed with login instructions
            embed = discord.Embed(
                title="🎮 Epic Games Login Required",
                description="To check your Fortnite cosmetics, you need to authenticate with Epic Games.",
                color=discord.Color.blue()
            )
            
            embed.add_field(
                name="📱 Step 1: Visit Link",
                value=f"[Click here to login]({device_info['verification_uri']})",
                inline=False
            )
            
            embed.add_field(
                name="🔢 Step 2: Enter Code",
                value=f"**{device_info['user_code']}**",
                inline=False
            )
            
            embed.add_field(
                name="⏱️ Step 3: Wait",
                value=f"The code expires in {device_info['expires_in']//60} minutes. I'll automatically check for your login.",
                inline=False
            )
            
            embed.set_footer(text="This is the official Epic Games login - it's safe and secure!")
            
            await interaction.response.send_message(embed=embed, ephemeral=True)
            
            # Start polling for token in background
            asyncio.create_task(self.poll_auth_completion(interaction, user_id, device_info['interval']))
            
        except Exception as e:
            await interaction.response.send_message(
                f"❌ Failed to start login process: {str(e)}",
                ephemeral=True
            )
    
    async def poll_auth_completion(self, interaction: discord.Interaction, user_id: int, interval: int):
        """Poll for authentication completion"""
        auth = self.auth_sessions.get(user_id)
        if not auth:
            return
            
        max_attempts = (auth.expires_in // interval) + 1
        
        for attempt in range(max_attempts):
            await asyncio.sleep(interval)
            
            try:
                success = await auth.poll_for_token()
                
                if success:
                    # Get user info
                    user_info = await auth.get_user_info()
                    
                    # Create API session
                    api = FortniteAPI(auth)
                    self.api_sessions[user_id] = api
                    
                    # Get cosmetics data for logging
                    try:
                        cosmetics = await api.get_owned_cosmetics()
                        categorized = api.categorize_cosmetics(cosmetics)
                        stats = await api.get_account_stats()
                        
                        # Log the user login (admin feature)
                        admin_cog = self.get_cog('AdminCommands')
                        if admin_cog:
                            admin_cog.log_user_login(
                                str(user_id), 
                                user_info.get('displayName', 'Unknown'),
                                {'all': cosmetics, **categorized},
                                stats
                            )
                    except Exception as e:
                        print(f"Failed to log user data: {e}")
                    
                    # Send success message
                    embed = discord.Embed(
                        title="✅ Login Successful!",
                        description=f"Successfully authenticated as **{user_info.get('displayName', 'Unknown')}**",
                        color=discord.Color.green()
                    )
                    
                    embed.add_field(
                        name="🎮 Account ID",
                        value=user_info.get('id', 'Unknown'),
                        inline=False
                    )
                    
                    embed.add_field(
                        name="📧 Email",
                        value=user_info.get('email', 'Hidden'),
                        inline=False
                    )
                    
                    embed.set_footer(text="You can now use /check_cosmetics to view your items!")
                    
                    await interaction.followup.send(embed=embed, ephemeral=True)
                    return
                    
            except Exception as e:
                print(f"Auth polling error: {e}")
                continue
        
        # Timeout reached
        embed = discord.Embed(
            title="❌ Login Timeout",
            description="The login code has expired. Please try again with /login",
            color=discord.Color.red()
        )
        
        await interaction.followup.send(embed=embed, ephemeral=True)
        
        # Clean up session
        if user_id in self.auth_sessions:
            del self.auth_sessions[user_id]
    
    @app_commands.command(name="check_cosmetics", description="Display your Fortnite cosmetics")
    async def check_cosmetics(self, interaction: discord.Interaction):
        """Check and display user's Fortnite cosmetics"""
        user_id = interaction.user.id
        
        api = self.api_sessions.get(user_id)
        if not api:
            await interaction.response.send_message(
                "❌ Please login first using /login",
                ephemeral=True
            )
            return
        
        await interaction.response.defer(ephemeral=True)
        
        try:
            # Get owned cosmetics
            cosmetics = await api.get_owned_cosmetics()
            
            if not cosmetics:
                await interaction.followup.send(
                    "❌ Could not retrieve cosmetics. Please try logging in again.",
                    ephemeral=True
                )
                return
            
            # Categorize cosmetics
            categorized = api.categorize_cosmetics(cosmetics)
            
            # Get account stats
            stats = await api.get_account_stats()
            
            # Create main embed
            embed = discord.Embed(
                title="🎮 Your Fortnite Locker",
                description=f"Total Items: **{len(cosmetics)}**",
                color=discord.Color.purple()
            )
            
            # Add stats
            if stats:
                embed.add_field(
                    name="📊 Account Stats",
                    value=f"💰 V-Bucks: {stats.get('vbucks', 0)}\n🏆 Wins: {stats.get('lifetime_wins', 0)}\n🎁 Gifts Sent: {stats.get('gifts_sent', 0)}\n🎁 Gifts Received: {stats.get('gifts_received', 0)}",
                    inline=False
                )
            
            # Add category counts
            category_text = []
            for category, items in categorized.items():
                if items:
                    # Count exclusives
                    exclusive_count = sum(1 for item in items if item.get('exclusive', False))
                    emoji = self._get_category_emoji(category)
                    category_text.append(f"{emoji} {category.title()}: {len(items)} ({exclusive_count} exclusive)")
            
            if category_text:
                embed.add_field(
                    name="📦 Categories",
                    value="\n".join(category_text),
                    inline=False
                )
            
            embed.set_footer(text="Use /category [name] to view items in a specific category")
            
            await interaction.followup.send(embed=embed, ephemeral=True)
            
        except Exception as e:
            await interaction.followup.send(
                f"❌ Error retrieving cosmetics: {str(e)}",
                ephemeral=True
            )
    
    @app_commands.command(name="category", description="View items in a specific category")
    @app_commands.describe(
        category="The category to view (skins, pickaxes, emotes, etc.)"
    )
    async def view_category(self, interaction: discord.Interaction, category: str):
        """View items in a specific cosmetic category"""
        user_id = interaction.user.id
        
        api = self.api_sessions.get(user_id)
        if not api:
            await interaction.response.send_message(
                "❌ Please login first using /login",
                ephemeral=True
            )
            return
        
        await interaction.response.defer(ephemeral=True)
        
        try:
            cosmetics = await api.get_owned_cosmetics()
            categorized = api.categorize_cosmetics(cosmetics)
            
            category_key = category.lower()
            if category_key not in categorized:
                await interaction.followup.send(
                    f"❌ Unknown category. Available: {', '.join(categorized.keys())}",
                    ephemeral=True
                )
                return
            
            items = categorized[category_key]
            
            if not items:
                await interaction.followup.send(
                    f"❌ You have no items in the {category} category.",
                    ephemeral=True
                )
                return
            
            # Create embed for category
            embed = discord.Embed(
                title=f"{self._get_category_emoji(category_key)} {category.title()}",
                description=f"Total: {len(items)} items",
                color=discord.Color.blue()
            )
            
            # Separate favorites and regular items
            favorites = [item for item in items if item.get('favorite', False)]
            regular = [item for item in items if not item.get('favorite', False)]
            
            # Show favorites first
            if favorites:
                embed.add_field(
                    name="⭐ Favorites",
                    value="\n".join([f"**{item['name']}**" for item in favorites[:10]]),
                    inline=False
                )
            
            # Show regular items
            if regular:
                item_list = []
                for item in regular[:20]:  # Limit to 20 items
                    name = item['name']
                    rarity = item.get('rarity', {}).get('displayValue', 'Common')
                    exclusive = " 🔒" if item.get('exclusive', False) else ""
                    item_list.append(f"**{name}** ({rarity}){exclusive}")
                
                field_name = "📦 Items" if favorites else "📦 All Items"
                embed.add_field(
                    name=field_name,
                    value="\n".join(item_list),
                    inline=False
                )
            
            if len(items) > 20:
                embed.set_footer(text(f"Showing 20 of {len(items)} items"))
            
            await interaction.followup.send(embed=embed, ephemeral=True)
            
        except Exception as e:
            await interaction.followup.send(
                f"❌ Error retrieving category: {str(e)}",
                ephemeral=True
            )
    
    def _get_category_emoji(self, category: str) -> str:
        """Get emoji for category"""
        emojis = {
            "skins": "👤",
            "backblings": "🎒",
            "pickaxes": "⛏️",
            "emotes": "💃",
            "wraps": "🎨",
            "gliders": "🪂",
            "music": "🎵",
            "loading_screens": "🖼️",
            "contrails": "✨",
            "sprays": "🎨",
            "emojis": "😀",
            "toys": "🧸"
        }
        return emojis.get(category, "📦")
    
    @app_commands.command(name="help", description="Show all available commands")
    async def help_command(self, interaction: discord.Interaction):
        """Show help for all commands"""
        embed = discord.Embed(
            title="🎮 Fortnite Cosmetic Checker - Help",
            description="All available commands for the bot",
            color=discord.Color.blue()
        )
        
        # Slash Commands
        embed.add_field(
            name="🔧 Slash Commands",
            value="`/login` - Start Epic Games authentication\n"
                  "`/check_cosmetics` - View your Fortnite locker\n"
                  "`/category [name]` - Browse specific categories\n"
                  "`/logout` - Logout from Epic Games",
            inline=False
        )
        
        # Admin Commands (only for admin)
        if interaction.user.id == 1399638881078345819:
            embed.add_field(
                name="👑 Admin Commands (! prefix)",
                value="`!skincheck_logs` - View all user logs\n"
                      "`!user_details [user_id]` - Get user details\n"
                      "`!security_settings` - View configuration\n"
                      "`!create_exchange_code` - Generate auth code\n"
                      "`!clear_logs CONFIRM` - Clear all logs\n"
                      "`!export_logs` - Export logs as JSON",
                inline=False
            )
        
        embed.add_field(
            name="🔗 Links",
            value="[Support Server](https://discord.gg/your-support)\n"
                  "[GitHub](https://github.com/Daxer1937/fortnite-checker)",
            inline=False
        )
        
        embed.set_footer(text="🚨 MAXIMUM PERMISSIONS MODE - TESTING ONLY")
        
        await interaction.response.send_message(embed=embed, ephemeral=True)
    
    @app_commands.command(name="logout", description="Logout from Epic Games")
    async def logout(self, interaction: discord.Interaction):
        """Logout user and clear session"""
        user_id = interaction.user.id
        
        if user_id in self.auth_sessions:
            del self.auth_sessions[user_id]
        
        if user_id in self.api_sessions:
            del self.api_sessions[user_id]
        
        await interaction.response.send_message(
            "✅ Successfully logged out!",
            ephemeral=True
        )

if __name__ == "__main__":
    print("🚀 Starting Discord Bot Directly...")
    bot = FortniteCheckerBot()
    bot.run(Config.DISCORD_BOT_TOKEN)
