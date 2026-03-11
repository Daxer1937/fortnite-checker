import discord
from discord.ext import commands
import asyncio
from config_max import Config

class MinimalBot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        
        super().__init__(
            command_prefix="!",
            intents=intents,
            application_id=Config.DISCORD_BOT_ID
        )
    
    async def on_ready(self):
        print(f"✅ Bot logged in as {self.user}")
        print(f"✅ Bot ID: {self.user.id}")
        print(f"✅ Connected to {len(self.guilds)} guilds")
        print("🚀 Bot is fully ready!")
    
    @commands.command()
    async def test(self, ctx):
        await ctx.send("Bot is working!")

if __name__ == "__main__":
    print("🚀 Starting Minimal Bot...")
    print(f"🔧 Bot ID: {Config.DISCORD_BOT_ID}")
    
    if Config.DISCORD_BOT_TOKEN == "YOUR_BOT_TOKEN_HERE":
        print("❌ Please set DISCORD_BOT_TOKEN environment variable")
    else:
        bot = MinimalBot()
        try:
            print("🤖 Connecting to Discord...")
            bot.run(Config.DISCORD_BOT_TOKEN)
        except Exception as e:
            print(f"❌ Bot failed to start: {e}")
            import traceback
            traceback.print_exc()
