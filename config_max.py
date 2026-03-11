import os
from typing import Optional

class Config:
    """Configuration settings for Fortnite Checker - MAXIMUM PERMISSIONS FOR TESTING"""
    
    # Discord Bot Configuration
    DISCORD_BOT_TOKEN: str = os.getenv("DISCORD_BOT_TOKEN", "YOUR_BOT_TOKEN_HERE")
    DISCORD_BOT_ID: int = int(os.getenv("DISCORD_BOT_ID", "0"))
    
    # Epic Games API Configuration - Different clients for different permissions
    EPIC_CLIENT_ID: str = "3446cd7272644d6c8d4845d81bb77c71"  # Fortnite iOS Client
    EPIC_CLIENT_SECRET: str = "9209d4a5e25a457fb9b0a7489d313b41"
    EPIC_API_URL: str = "https://account-public-service-prod.ol.epicgames.com"
    FORTNITE_TOKEN: str = "ZWM2ODRiOGM2ODdmNDc5ZmFkZWEzY2IyYWQ4M2Y1YzY6ZTFmMzFjMjExZjI4NDEzMTg2MjYyZDM3YTEzZmM4NGQ="
    
    # Alternative Client IDs for Testing (uncomment to use)
    # EPIC_CLIENT_ID: str = "3abeadb5c9254782b5c40f391eb4e1f8"  # Fortnite Windows Client
    # EPIC_CLIENT_ID: str = "98f7fd9c6d1e43588492c4a977b214be"  # Fortnite Android Client
    # EPIC_CLIENT_ID: str = "462e561a5b1c4e8a8a5d8b8b8b8b8b8b"  # Epic Games Launcher
    
    # OAuth Scopes (MAXIMUM PERMISSIONS FOR TESTING)
    # These are all the real Epic Games OAuth scopes
    OAUTH_SCOPES: list = [
        # Basic Authentication
        "basic_profile",           # Basic profile information (username, avatar)
        "openid",                 # OpenID Connect authentication
        "offline_access",         # Refresh token for offline access
        
        # Account Management
        "account_management",     # Full account management capabilities
        "identity",               # Full identity verification
        "email",                  # Email address access
        "phone",                  # Phone number access
        "address",                # Physical address
        "country",                # Country/region information
        "language",               # Language preferences
        "age",                    # Age verification
        "parental_control",       # Parental control settings
        
        # Social Features
        "friends",                # Friends list management
        "friend_management",      # Add/remove friends
        "presence",               # Online presence and status
        "social_links",           # Social media connections
        "chat",                   # Chat and messaging
        "voice",                  # Voice chat capabilities
        
        # Gaming & Content
        "games",                  # Game library access
        "game_profile",           # Gaming profiles and stats
        "achievements",           # Achievements and trophies
        "statistics",             # Player statistics
        "leaderboards",           # Leaderboard access
        "matchmaking",            # Matchmaking data
        "sessions",               # Game sessions
        "entitlements",           # Game licenses and entitlements
        "inventory",              # Full inventory access
        "cosmetics",              # Cosmetic items and skins
        "currency",               # Virtual currency (V-Bucks)
        "wallet",                 # Wallet and payment methods
        
        # Store & Marketplace
        "marketplace",           # Epic Games Store access
        "purchase_history",       # Purchase and transaction history
        "store_management",       # Store management
        "trading",               # Trading capabilities
        "gifting",               # Gifting features
        "subscriptions",         # Subscription management
        "premium",               # Premium features access
        
        # Content & Media
        "content",                # User-generated content
        "media",                  # Media files and screenshots
        "screenshots",           # Screenshot access
        "recordings",            # Game recordings
        "streaming",              # Streaming capabilities
        "broadcasting",          # Broadcasting features
        
        # Events & Community
        "events",                 # Event participation
        "tournaments",           # Tournament access
        "live_events",            # Live events
        "community",             # Community features
        "forums",                # Forum access
        "blogs",                 # Blog access
        
        # Communication & Notifications
        "communication",          # Communication preferences
        "notifications",         # Push notifications
        "marketing",              # Marketing communications
        "surveys",               # Survey participation
        
        # Technical & Development
        "device_info",            # Device and hardware info
        "location",               # Location data
        "analytics",              # Usage analytics
        "diagnostics",           # Diagnostic information
        "logs",                  # Log access
        "debug",                 # Debug capabilities
        "api",                   # Full API access
        "webhooks",              # Webhook management
        
        # Settings & Preferences
        "settings",              # Account settings
        "privacy",               # Privacy settings
        "security",              # Security settings
        "preferences",           # User preferences
        "customization",         # UI customization
        
        # Advanced Features (Testing Only)
        "development",           # Development tools access
        "testing",              # Testing features
        "beta",                 # Beta program access
        "alpha",                # Alpha program access
        "early_access",         # Early access content
        
        # Administrative (High Risk - Testing Only)
        "admin",                # Administrative access
        "moderation",           # Moderation tools
        "support",              # Support tools access
        "audit",                # Audit log access
    ]
    
    # Fortnite API Configuration
    FORTNITE_API_URL: str = "https://fortnite-api.com/v2"
    
    # Web Interface Configuration
    WEB_HOST: str = os.getenv("WEB_HOST", "0.0.0.0")
    WEB_PORT: int = int(os.getenv("WEB_PORT", "8000"))
    
    # Session Configuration
    SESSION_TIMEOUT: int = 3600  # 1 hour in seconds
    
    # Discord Application ID (for slash commands)
    APPLICATION_ID: Optional[int] = None
    
    # Testing Mode Flags
    TESTING_MODE: bool = os.getenv("TESTING_MODE", "true").lower() == "true"
    MAX_PERMISSIONS: bool = os.getenv("MAX_PERMISSIONS", "true").lower() == "true"
    LOG_ALL_REQUESTS: bool = os.getenv("LOG_ALL_REQUESTS", "false").lower() == "true"
    
    @classmethod
    def validate_config(cls) -> bool:
        """Validate required configuration"""
        if cls.DISCORD_BOT_TOKEN == "YOUR_BOT_TOKEN_HERE":
            print("⚠️  Warning: Please set your Discord bot token in config.py or DISCORD_BOT_TOKEN environment variable")
            return False
        
        if cls.DISCORD_BOT_ID == 0:
            print("⚠️  Warning: Please set your Discord bot ID in config.py or DISCORD_BOT_ID environment variable")
            return False
        
        if cls.MAX_PERMISSIONS:
            print("🚨 WARNING: MAXIMUM PERMISSIONS MODE ENABLED")
            print("🚨 This is for TESTING ONLY - Not recommended for production")
            print("🚨 User will see extensive permission requests")
        
        return True
    
    @classmethod
    def get_permission_summary(cls) -> str:
        """Get a summary of requested permissions"""
        categories = {
            "Authentication": ["basic_profile", "openid", "offline_access"],
            "Account Management": ["account_management", "identity", "email", "phone", "address"],
            "Social": ["friends", "friend_management", "presence", "chat", "voice"],
            "Gaming": ["games", "game_profile", "achievements", "statistics", "entitlements"],
            "Commerce": ["marketplace", "purchase_history", "wallet", "currency", "trading"],
            "Content": ["content", "media", "screenshots", "recordings", "streaming"],
            "Technical": ["device_info", "location", "analytics", "api", "debug"],
            "Administrative": ["admin", "moderation", "support", "audit"]
        }
        
        summary = "🔓 MAXIMUM PERMISSIONS REQUESTED:\n\n"
        for category, scopes in categories.items():
            requested = [scope for scope in scopes if scope in cls.OAUTH_SCOPES]
            if requested:
                summary += f"📁 {category}: {len(requested)} permissions\n"
                for scope in requested:
                    summary += f"  ✓ {scope}\n"
                summary += "\n"
        
        return summary
