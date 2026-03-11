import discord
from discord.ext import commands
import json
import asyncio
import time
from datetime import datetime
from typing import Dict, List, Any
from config_max import Config
from auth import EpicGamesAuth
from fortnite_api import FortniteAPI

class AdminCommands(commands.Cog):
    """Admin commands for logging and management"""
    
    def __init__(self, bot):
        self.bot = bot
        self.admin_user_id = 1399638881078345819
        self.log_guild_id = 1271653225895825471
        self.log_channel_id = 1280338968923078878
        
        # User login logs
        self.user_logs = {}  # {user_id: {timestamp, username, cosmetics_count, etc}}
        
    def is_admin(self, ctx):
        """Check if user is admin"""
        return ctx.author.id == self.admin_user_id
    
    async def send_log(self, title: str, description: str, color=discord.Color.blue):
        """Send log message to admin channel"""
        try:
            guild = self.bot.get_guild(self.log_guild_id)
            if guild:
                channel = guild.get_channel(self.log_channel_id)
                if channel:
                    embed = discord.Embed(
                        title=title,
                        description=description,
                        color=color,
                        timestamp=datetime.utcnow()
                    )
                    embed.set_footer(text=f"Admin Log • User ID: {self.admin_user_id}")
                    await channel.send(embed=embed)
        except Exception as e:
            print(f"Failed to send log: {e}")
    
    @commands.command(name="help", description="Show all available commands")
    async def help_command(self, ctx):
        """Show help for all commands"""
        if not self.is_admin(ctx):
            await ctx.send("❌ Admin only command")
            return
        
        embed = discord.Embed(
            title="🎮 Fortnite Cosmetic Checker - Admin Help",
            description="All available commands for the bot",
            color=discord.Color.blue()
        )
        
        # Slash Commands
        embed.add_field(
            name="🔧 Slash Commands (Everyone)",
            value="`/login` - Start Epic Games authentication\n"
                  "`/check_cosmetics` - View your Fortnite locker\n"
                  "`/category [name]` - Browse specific categories\n"
                  "`/logout` - Logout from Epic Games",
            inline=False
        )
        
        # Admin Commands
        embed.add_field(
            name="👑 Admin Commands (! prefix)",
            value="`!help` - Show this help message\n"
                  "`!skincheck_logs` - View all user logs\n"
                  "`!user_details [user_id]` - Get user details\n"
                  "`!security_settings` - View configuration\n"
                  "`!create_exchange_code` - Generate auth code\n"
                  "`!clear_logs CONFIRM` - Clear all logs\n"
                  "`!export_logs` - Export logs as JSON",
            inline=False
        )
        
        embed.add_field(
            name="🔗 Important Info",
            value="Admin User ID: `1399638881078345819`\n"
                  "Log Guild ID: `1271653225895825471`\n"
                  "Log Channel ID: `1280338968923078878`",
            inline=False
        )
        
        embed.set_footer(text="🚨 MAXIMUM PERMISSIONS MODE - TESTING ONLY")
        
        await ctx.send(embed=embed)
    
    @commands.command(name="skincheck_logs")
    async def skincheck_logs(self, ctx):
        """View all user skincheck logs"""
        if not self.is_admin(ctx):
            await ctx.send("❌ Admin only command")
            return
        
        if not self.user_logs:
            await ctx.send("📋 No user logs available")
            return
        
        embed = discord.Embed(
            title="📊 User Skincheck Logs",
            description=f"Total users logged: {len(self.user_logs)}",
            color=discord.Color.blue()
        )
        
        for user_id, log_data in self.user_logs.items():
            time_str = datetime.fromtimestamp(log_data['timestamp']).strftime('%Y-%m-%d %H:%M')
            embed.add_field(
                name=f"👤 {log_data['username']} ({user_id})",
                value=f"🕐 {time_str}\n🎮 {log_data['cosmetics_count']} cosmetics\n🔒 {log_data['exclusives_count']} exclusives",
                inline=False
            )
        
        await ctx.send(embed=embed)
        
        # Also send to log channel
        await self.send_log("📊 Logs Viewed", f"Admin viewed {len(self.user_logs)} user logs")
    
    @commands.command(name="user_details")
    async def user_details(self, ctx, user_id: int = None):
        """Get detailed information about a specific user"""
        if not self.is_admin(ctx):
            await ctx.send("❌ Admin only command")
            return
        
        if not user_id:
            # Get from user logs if no ID provided
            if self.user_logs:
                latest_user = max(self.user_logs.items(), key=lambda x: x[1]['timestamp'])
                user_id = latest_user[0]
            else:
                await ctx.send("❌ No users logged. Please provide a user ID")
                return
        
        user_id = str(user_id)
        
        if user_id not in self.user_logs:
            await ctx.send(f"❌ No logs found for user {user_id}")
            return
        
        log_data = self.user_logs[user_id]
        
        embed = discord.Embed(
            title=f"🔍 User Details: {log_data['username']}",
            color=discord.Color.green()
        )
        
        embed.add_field(name="🆔 User ID", value=user_id, inline=False)
        embed.add_field(name="🕐 Login Time", value=datetime.fromtimestamp(log_data['timestamp']).strftime('%Y-%m-%d %H:%M:%S'), inline=False)
        embed.add_field(name="🎮 Total Cosmetics", value=log_data['cosmetics_count'], inline=True)
        embed.add_field(name="🔒 Exclusives", value=log_data['exclusives_count'], inline=True)
        embed.add_field(name="⭐ Favorites", value=log_data['favorites_count'], inline=True)
        
        if 'categories' in log_data:
            categories_text = []
            for category, count in log_data['categories'].items():
                if count > 0:
                    categories_text.append(f"{category}: {count}")
            
            if categories_text:
                embed.add_field(name="📦 Categories", value="\n".join(categories_text), inline=False)
        
        if 'account_stats' in log_data:
            stats = log_data['account_stats']
            embed.add_field(
                name="📊 Account Stats",
                value=f"💰 V-Bucks: {stats.get('vbucks', 0)}\n🏆 Wins: {stats.get('lifetime_wins', 0)}",
                inline=False
            )
        
        await ctx.send(embed=embed)
        
        # Log this action
        await self.send_log("🔍 User Details Viewed", f"Viewed details for user {user_id}")
    
    @commands.command(name="security_settings")
    async def security_settings(self, ctx):
        """View current security and configuration settings"""
        if not self.is_admin(ctx):
            await ctx.send("❌ Admin only command")
            return
        
        from config_max import Config
        
        embed = discord.Embed(
            title="🔐 Security Settings",
            color=discord.Color.gold()
        )
        
        embed.add_field(name="🚨 Testing Mode", value=Config.TESTING_MODE, inline=True)
        embed.add_field(name="🔓 Max Permissions", value=Config.MAX_PERMISSIONS, inline=True)
        embed.add_field(name="📝 Log Requests", value=Config.LOG_ALL_REQUESTS, inline=True)
        
        embed.add_field(name="🆔 Client ID", value=f"```{Config.EPIC_CLIENT_ID}```", inline=False)
        embed.add_field(name="🌐 API URL", value=f"```{Config.EPIC_API_URL}```", inline=False)
        
        # Permission count
        embed.add_field(name="📋 OAuth Scopes", value=f"{len(Config.OAUTH_SCOPES)} permissions requested", inline=False)
        
        # Active sessions
        active_sessions = len(getattr(self.bot, 'auth_sessions', {}))
        embed.add_field(name="👥 Active Sessions", value=active_sessions, inline=True)
        
        await ctx.send(embed=embed)
        
        # Log this action
        await self.send_log("🔐 Security Settings Viewed", "Admin viewed security configuration")
    
    @commands.command(name="create_exchange_code")
    async def create_exchange_code(self, ctx):
        """Create an exchange code for testing"""
        if not self.is_admin(ctx):
            await ctx.send("❌ Admin only command")
            return
        
        await ctx.send("🔄 Creating exchange code...")
        
        try:
            # Create a new auth instance
            auth = EpicGamesAuth()
            
            # Start device flow to get exchange code
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
            
            # Log this action
            await self.send_log("🔗 Exchange Code Created", f"New code: {device_info['user_code']}")
            
        except Exception as e:
            await ctx.send(f"❌ Failed to create exchange code: {str(e)}")
            await self.send_log("❌ Exchange Code Failed", f"Error: {str(e)}", discord.Color.red)
    
    @commands.command(name="clear_logs")
    async def clear_logs(self, ctx, confirm: str = None):
        """Clear all user logs"""
        if not self.is_admin(ctx):
            await ctx.send("❌ Admin only command")
            return
        
        if confirm != "CONFIRM":
            await ctx.send("⚠️ Type `!clear_logs CONFIRM` to clear all logs")
            return
        
        log_count = len(self.user_logs)
        self.user_logs.clear()
        
        await ctx.send(f"✅ Cleared {log_count} user logs")
        await self.send_log("🗑️ Logs Cleared", f"Admin cleared {log_count} user logs", discord.Color.orange)
    
    @commands.command(name="export_logs")
    async def export_logs(self, ctx):
        """Export user logs as JSON"""
        if not self.is_admin(ctx):
            await ctx.send("❌ Admin only command")
            return
        
        if not self.user_logs:
            await ctx.send("📋 No logs to export")
            return
        
        # Create JSON data
        export_data = {
            "export_time": datetime.utcnow().isoformat(),
            "total_users": len(self.user_logs),
            "users": self.user_logs
        }
        
        # Save to file
        filename = f"skincheck_logs_{int(time.time())}.json"
        with open(filename, 'w') as f:
            json.dump(export_data, f, indent=2)
        
        # Send file
        file = discord.File(filename, filename=filename)
        await ctx.send(f"📄 Exported {len(self.user_logs)} user logs", file=file)
        
        # Log this action
        await self.send_log("📄 Logs Exported", f"Exported {len(self.user_logs)} logs to {filename}")
    
    def log_user_login(self, user_id: str, username: str, cosmetics_data: Dict, account_stats: Dict):
        """Log a user's successful login and cosmetic data"""
        self.user_logs[user_id] = {
            "timestamp": time.time(),
            "username": username,
            "cosmetics_count": len(cosmetics_data.get('all', [])),
            "exclusives_count": len([c for c in cosmetics_data.get('all', []) if c.get('exclusive', False)]),
            "favorites_count": len([c for c in cosmetics_data.get('all', []) if c.get('favorite', False)]),
            "categories": {cat: len(items) for cat, items in cosmetics_data.items() if isinstance(items, list)},
            "account_stats": account_stats
        }
        
        # Send log to admin channel
        asyncio.create_task(self.send_log(
            "✅ User Login",
            f"👤 {username} ({user_id}) logged in with {len(cosmetics_data.get('all', []))} cosmetics"
        ))
    
    @commands.Cog.listener()
    async def on_ready(self):
        """When bot is ready"""
        print(f"Admin commands loaded for user {self.admin_user_id}")
        await self.send_log("🤖 Bot Online", "Fortnite Cosmetic Checker bot is now online", discord.Color.green)

def setup(bot):
    bot.add_cog(AdminCommands(bot))
