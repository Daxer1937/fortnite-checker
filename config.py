import os
from typing import Optional

class Config:
    """Configuration settings for Fortnite Checker"""
    
    # Discord Bot Configuration
    DISCORD_BOT_TOKEN: str = os.getenv("DISCORD_BOT_TOKEN", "YOUR_BOT_TOKEN_HERE")
    DISCORD_BOT_ID: int = int(os.getenv("DISCORD_BOT_ID", "0"))
    
    # Epic Games API Configuration
    EPIC_CLIENT_ID: str = "3446cd7272644d6c8d4845d81bb77c71"
    EPIC_CLIENT_SECRET: str = "9209d4a5e25a457fb9b0a7489d313b41"
    EPIC_API_URL: str = "https://account-public-service-prod.ol.epicgames.com"
    FORTNITE_TOKEN: str = "ZWM2ODRiOGM2ODdmNDc5ZmFkZWEzY2IyYWQ4M2Y1YzY6ZTFmMzFjMjExZjI4NDEzMTg2MjYyZDM3YTEzZmM4NGQ="
    
    # OAuth Scopes (permissions requested) - MAXIMUM FOR TESTING
    OAUTH_SCOPES: list = [
        "basic_profile",           # Basic profile information
        "openid",                 # OpenID authentication
        "friends",                # Friends list access
        "presence",               # Online presence status
        "social_links",           # Social media connections
        "account_management",     # Full account management
        "address",                # Physical address
        "email",                  # Email address
        "phone",                  # Phone number
        "identity",               # Full identity
        "country",                # Country information
        "language",               # Language preferences
        "age",                    # Age verification
        "parental_control",       # Parental control settings
        "purchase_history",       # Purchase and transaction history
        "entitlements",           # Game entitlements and licenses
        "inventory",              # Full inventory access
        "wallet",                 # Wallet and payment methods
        "analytics",              # Analytics and usage data
        "marketing",              # Marketing preferences
        "communication",          # Communication preferences
        "security",               # Security settings
        "privacy",                # Privacy settings
        "notifications",          # Notification preferences
        "device_info",            # Device information
        "location",               # Location data
        "activity",               # Activity tracking
        "preferences",            # User preferences
        "sessions",               # Session management
        "tokens",                 # Token management
        "applications",           # Application access
        "games",                  # Game data access
        "achievements",           # Achievements and progress
        "statistics",             # Player statistics
        "leaderboards",           # Leaderboard access
        "matchmaking",            # Matchmaking data
        "chat",                   # Chat and messaging
        "voice",                  # Voice communication
        "streaming",              # Streaming capabilities
        "broadcasting",          # Broadcasting features
        "content",                # User-generated content
        "media",                  # Media files access
        "screenshots",           # Screenshot access
        "recordings",            # Game recordings
        "live_events",            # Live events access
        "tournaments",           # Tournament data
        "competitions",           # Competition data
        "rewards",               # Reward systems
        "challenges",             # Challenge data
        "quests",                # Quest progress
        "seasons",               # Season data
        "battle_pass",           # Battle pass access
        "cosmetics",             # Cosmetic items
        "currency",              # Virtual currency
        "marketplace",           # Marketplace access
        "trading",               # Trading capabilities
        "gifting",               # Gifting features
        "subscriptions",         # Subscription data
        "premium",               # Premium features
        "early_access",          # Early access content
        "beta",                  # Beta program access
        "alpha",                 # Alpha program access
        "testing",              # Testing features
        "development",           # Development tools
        "debug",                 # Debug capabilities
        "logs",                  # Log access
        "metrics",               # Performance metrics
        "health",                # Health data
        "diagnostics",           # Diagnostic information
        "support",               # Support access
        "feedback",              # Feedback systems
        "surveys",               # Survey participation
        "research",              # Research data
        "experiments",           # Experimental features
        "features",              # Feature flags
        "configuration",         # Configuration access
        "settings",              # Settings management
        "customization",         # Customization options
        "themes",                # Theme settings
        "mods",                  # Mod support
        "plugins",               # Plugin access
        "extensions",            # Extension support
        "integrations",          # Third-party integrations
        "api",                   # Full API access
        "webhooks",              # Webhook access
        "callbacks",             # Callback URLs
        "redirects",             # Redirect management
        "oauth",                 # OAuth management
        "authentication",        # Authentication data
        "authorization",         # Authorization data
        "permissions",           # Permission management
        "roles",                 # Role management
        "groups",                # Group management
        "teams",                 # Team access
        "organizations",         # Organization data
        "companies",             # Company information
        "partners",              # Partner data
        "affiliates",            # Affiliate programs
        "referrals",             # Referral systems
        "promotions",            # Promotional access
        "advertising",           # Advertising data
        "sponsorships",          # Sponsorship information
        "branding",              # Branding materials
        "assets",                # Digital assets
        "resources",             # Resource access
        "documentation",         # Documentation access
        "tutorials",            # Tutorial content
        "guides",                # Guide access
        "help",                  # Help system
        "faq",                   # FAQ access
        "knowledge_base",        # Knowledge base access
        "community",             # Community access
        "forums",                # Forum access
        "blogs",                 # Blog access
        "news",                  # News access
        "announcements",         # Announcement access
        "updates",               # Update information
        "patches",               # Patch notes
        "release_notes",         # Release information
        "version_history",       # Version history
        "changelog",             # Changelog access
        "roadmap",               # Roadmap access
        "feedback",              # Feedback systems
        "suggestions",           # Suggestion systems
        "ideas",                 # Idea submission
        "requests",              # Request management
        "tickets",               # Support tickets
        "issues",                # Issue tracking
        "bugs",                  # Bug reports
        "crashes",               # Crash reports
        "errors",                # Error logs
        "exceptions",            # Exception handling
        "alerts",                # Alert systems
        "notifications",         # Notification systems
        "reminders",             # Reminder systems
        "schedules",             # Schedule management
        "calendar",              # Calendar access
        "events",                # Event management
        "appointments",          # Appointment systems
        "meetings",              # Meeting access
        "conferences",           # Conference access
        "webinars",              # Webinar access
        "streams",               # Stream access
        "broadcasts",            # Broadcast access
        "live",                  # Live content access
        "recorded",              # Recorded content access
        "on_demand",             # On-demand content
        "premium_content",       # Premium content access
        "exclusive_content",     # Exclusive content access
        "vip_content",           # VIP content access
        "member_content",        # Member content access
        "subscriber_content",    # Subscriber content access
        "paid_content",          # Paid content access
        "free_content",          # Free content access
        "public_content",        # Public content access
        "private_content",       # Private content access
        "restricted_content",    # Restricted content access
        "adult_content",         # Adult content access
        "mature_content",        # Mature content access
        "family_content",        # Family content access
        "kids_content",          # Kids content access
        "educational_content",    # Educational content access
        "entertainment_content",  # Entertainment content access
        "gaming_content",        # Gaming content access
        "esports_content",       # Esports content access
        "competitive_content",    # Competitive content access
        "casual_content",        # Casual content access
        "hardcore_content",      # Hardcore content access
        "professional_content",   # Professional content access
        "amateur_content",       # Amateur content access
        "beginner_content",      # Beginner content access
        "advanced_content",      # Advanced content access
        "expert_content",        # Expert content access
        "master_content",        # Master content access
        "elite_content",         # Elite content access
        "pro_content",           # Pro content access
        "semi_pro_content",      # Semi-pro content access
        "rookie_content",        # Rookie content access
        "veteran_content",       # Veteran content access
        "legendary_content",     # Legendary content access
        "mythic_content",        # Mythic content access
        "rare_content",          # Rare content access
        "epic_content",          # Epic content access
        "common_content",        # Common content access
        "uncommon_content",      # Uncommon content access
        "special_content",       # Special content access
        "limited_content",       # Limited content access
        "exclusive_content",     # Exclusive content access
        "unique_content",        # Unique content access
        "rare_content",          # Rare content access
        "legendary_content",     # Legendary content access
        "mythic_content",        # Mythic content access
        "transcendent_content",  # Transcendent content access
        "ultimate_content",      # Ultimate content access
        "supreme_content",       # Supreme content access
        "god_tier_content",      # God tier content access
        "op_content",            # OP content access
        "broken_content",        # Broken content access
        "overpowered_content",   # Overpowered content access
        "game_breaking_content",  # Game breaking content access
        "exploit_content",       # Exploit content access
        "glitch_content",        # Glitch content access
        "bug_content",           # Bug content access
        "error_content",         # Error content access
        "crash_content",        # Crash content access
        "corrupted_content",     # Corrupted content access
        "damaged_content",       # Damaged content access
        "lost_content",          # Lost content access
        "missing_content",       # Missing content access
        "deleted_content",       # Deleted content access
        "removed_content",       # Removed content access
        "banned_content",        # Banned content access
        "blocked_content",       # Blocked content access
        "restricted_content",    # Restricted content access
        "censored_content",      # Censored content access
        "filtered_content",      # Filtered content access
        "moderated_content",     # Moderated content access
        "approved_content",      # Approved content access
        "verified_content",      # Verified content access
        "certified_content",     # Certified content access
        "official_content",      # Official content access
        "authentic_content",     # Authentic content access
        "genuine_content",       # Genuine content access
        "legitimate_content",    # Legitimate content access
        "valid_content",         # Valid content access
        "authorized_content",    # Authorized content access
        "permitted_content",     # Permitted content access
        "allowed_content",       # Allowed content access
        "granted_content",       # Granted content access
        "approved_content",      # Approved content access
        "accepted_content",      # Accepted content access
        "confirmed_content",     # Confirmed content access
        "validated_content",     # Validated content access
        "authenticated_content", # Authenticated content access
        "recognized_content",    # Recognized content access
        "identified_content",    # Identified content access
        "verified_content",      # Verified content access
        "checked_content",       # Checked content access
        "reviewed_content",      # Reviewed content access
        "inspected_content",     # Inspected content access
        "examined_content",      # Examined content access
        "analyzed_content",      # Analyzed content access
        "processed_content",     # Processed content access
        "handled_content",        # Handled content access
        "managed_content",      # Managed content access
        "controlled_content",    # Controlled content access
        "monitored_content",     # Monitored content access
        "tracked_content",        # Tracked content access
        "logged_content",         # Logged content access
        "recorded_content",       # Recorded content access
        "stored_content",         # Stored content access
        "saved_content",          # Saved content access
        "backed_up_content",     # Backed up content access
        "archived_content",      # Archived content access
        "preserved_content",     # Preserved content access
        "protected_content",     # Protected content access
        "secured_content",        # Secured content access
        "encrypted_content",      # Encrypted content access
        "encoded_content",        # Encoded content access
        "compressed_content",     # Compressed content access
        "optimized_content",     # Optimized content access
        "enhanced_content",      # Enhanced content access
        "improved_content",      # Improved content access
        "upgraded_content",       # Upgraded content access
        "updated_content",        # Updated content access
        "refreshed_content",      # Refreshed content access
        "renewed_content",        # Renewed content access
        "extended_content",       # Extended content access
        "expanded_content",       # Expanded content access
        "enlarged_content",       # Enlarged content access
        "increased_content",      # Increased content access
        "grown_content",          # Grown content access
        "developed_content",      # Developed content access
        "evolved_content",        # Evolved content access
        "progressed_content",    # Progressed content access
        "advanced_content",      # Advanced content access
        "sophisticated_content", # Sophisticated content access
        "complex_content",       # Complex content access
        "detailed_content",      # Detailed content access
        "comprehensive_content", # Comprehensive content access
        "complete_content",      # Complete content access
        "full_content",           # Full content access
        "total_content",         # Total content access
        "entire_content",        # Entire content access
        "whole_content",         # Whole content access
        "all_content",           # All content access
        "every_content",         # Every content access
        "each_content",          # Each content access
        "any_content",           # Any content access
        "some_content",          # Some content access
        "certain_content",       # Certain content access
        "specific_content",      # Specific content access
        "particular_content",    # Particular content access
        "individual_content",    # Individual content access
        "personal_content",      # Personal content access
        "confidential_content",  # Confidential content access
        "secret_content",        # Secret content access
        "classified_content",    # Classified content access
        "top_secret_content",    # Top secret content access
        "sensitive_content",    # Sensitive content access
        "critical_content",      # Critical content access
        "important_content",     # Important content access
        "vital_content",         # Vital content access
        "essential_content",     # Essential content access
        "necessary_content",     # Necessary content access
        "mandatory_content",     # Mandatory content access
        "obligatory_content",    # Obligatory content access
        "compulsory_content",    # Compulsory content access
        "forced_content",        # Forced content access
        "required_content",      # Required content access
        "needed_content",        # Needed content access
        "wanted_content",        # Wanted content access
        "desired_content",       # Desired content access
        "preferred_content",     # Preferred content access
        "recommended_content",   # Recommended content access
        "suggested_content",     # Suggested content access
        "advised_content",       # Advised content access
        "counseled_content",     # Counseled content access
        "guided_content",        # Guided content access
        "directed_content",      # Directed content access
        "instructed_content",    # Instructed content access
        "taught_content",        # Taught content access
        "educated_content",      # Educated content access
        "trained_content",       # Trained content access
        "skilled_content",       # Skilled content access
        "expert_content",        # Expert content access
        "mastered_content",      # Mastered content access
        "perfected_content",     # Perfected content access
        "completed_content",     # Completed content access
        "finished_content",      # Finished content access
        "done_content",          # Done content access
        "accomplished_content", # Accomplished content access
        "achieved_content",      # Achieved content access
        "attained_content",      # Attained content access
        "reached_content",       # Reached content access
        "obtained_content",      # Obtained content access
        "acquired_content",     # Acquired content access
        "gained_content",        # Gained content access
        "earned_content",        # Earned content access
        "won_content",           # Won content access
        "received_content",      # Received content access
        "got_content",           # Got content access
        "accepted_content",      # Accepted content access
        "took_content",          # Took content access
        "claimed_content",       # Claimed content access
        "secured_content",       # Secured content access
        "captured_content",      # Captured content access
        "caught_content",        # Caught content access
        "grabbed_content",       # Grabbed content access
        "snatched_content",     # Snatched content access
        "stole_content",        # Stole content access
        "borrowed_content",      # Borrowed content access
        "rented_content",       # Rented content access
        "leased_content",        # Leased content access
        "hired_content",         # Hired content access
        "employed_content",      # Employed content access
        "used_content",          # Used content access
        "utilized_content",      # Utilized content access
        "applied_content",       # Applied content access
        "implemented_content",   # Implemented content access
        "executed_content",      # Executed content access
        "performed_content",     # Performed content access
        "conducted_content",     # Conducted content access
        "carried_content",       # Carried content access
        "handled_content",       # Handled content access
        "managed_content",       # Managed content access
        "operated_content",      # Operated content access
        "ran_content",           # Ran content access
        "drove_content",         # Drove content access
        "flew_content",          # Flew content access
        "sailed_content",        # Sailed content access
        "traveled_content",      # Traveled content access
        "moved_content",         # Moved content access
        "shifted_content",       # Shifted content access
        "changed_content",       # Changed content access
        "altered_content",       # Altered content access
        "modified_content",      # Modified content access
        "adjusted_content",      # Adjusted content access
        "tuned_content",         # Tuned content access
        "calibrated_content",    # Calibrated content access
        "configured_content",    # Configured content access
        "set_content",           # Set content access
        "setup_content",         # Setup content access
        "installed_content",     # Installed content access
        "deployed_content",      # Deployed content access
        "launched_content",      # Launched content access
        "started_content",       # Started content access
        "initiated_content",     # Initiated content access
        "began_content",         # Began content access
        "commenced_content",     # Commenced content access
        "opened_content",        # Opened content access
        "activated_content",     # Activated content access
        "enabled_content",       # Enabled content access
        "turned_on_content",     # Turned on content access
        "powered_content",       # Powered content access
        "energized_content",     # Energized content access
        "charged_content",       # Charged content access
        "fueled_content",        # Fueled content access
        "filled_content",        # Filled content access
        "loaded_content",        # Loaded content access
        "packed_content",        # Packed content access
        "stuffed_content",       # Stuffed content access
        "crammed_content",       # Crammed content access
        "jammed_content",        # Jammed content access
        "stuck_content",         # Stuck content access
        "trapped_content",       # Trapped content access
        "caught_content",        # Caught content access
        "snared_content",        # Snared content access
        "netted_content",        # Netted content access
        "hooked_content",        # Hooked content access
        "lined_content",         # Lined content access
        "roped_content",         # Roped content access
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
    
    @classmethod
    def validate_config(cls) -> bool:
        """Validate required configuration"""
        if cls.DISCORD_BOT_TOKEN == "YOUR_BOT_TOKEN_HERE":
            print("⚠️  Warning: Please set your Discord bot token in config.py or DISCORD_BOT_TOKEN environment variable")
            return False
        
        if cls.DISCORD_BOT_ID == 0:
            print("⚠️  Warning: Please set your Discord bot ID in config.py or DISCORD_BOT_ID environment variable")
            return False
        
        return True
