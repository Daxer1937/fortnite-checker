import aiohttp
import json
from typing import Dict, List, Any, Optional
from auth import EpicGamesAuth

class FortniteAPI:
    """Handles Fortnite API requests for cosmetics and profile data"""
    
    def __init__(self, auth: EpicGamesAuth):
        self.auth = auth
        self.fortnite_api = "https://fortnite-api.com/v2"
        self.epic_api = "https://account-public-service-prod.ol.epicgames.com"
        self.fortnite_token = "ZWM2ODRiOGM2ODdmNDc5ZmFkZWEzY2IyYWQ4M2Y1YzY6ZTFmMzFjMjExZjI4NDEzMTg2MjYyZDM3YTEzZmM4NGQ="
        
    async def get_profile_cosmetics(self) -> Dict[str, Any]:
        """Get all cosmetics from user's profile"""
        if not await self.auth.ensure_valid_token():
            raise Exception("Invalid authentication")
            
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"bearer {self.auth.access_token}",
                "Accept": "application/json"
            }
            
            # Get profile data
            profile_url = f"{self.epic_api}/fortnite/api/game/v2/profile/{self.auth.account_id}"
            params = {
                "profileId": "athena",
                "rvn": 2,
                "profileId2": "athena"
            }
            
            async with session.get(profile_url, headers=headers, params=params) as response:
                if response.status != 200:
                    raise Exception(f"Failed to get profile: {response.status}")
                    
                profile_data = await response.json()
                return profile_data
    
    async def get_cosmetic_definitions(self) -> Dict[str, Any]:
        """Get all cosmetic definitions from Fortnite API"""
        async with aiohttp.ClientSession() as session:
            url = f"{self.fortnite_api}/cosmetics/br"
            params = {
                "language": "en"
            }
            
            async with session.get(url, params=params) as response:
                if response.status != 200:
                    raise Exception(f"Failed to get cosmetics: {response.status}")
                    
                data = await response.json()
                return data
    
    async def get_owned_cosmetics(self) -> List[Dict[str, Any]]:
        """Parse owned cosmetics from profile data"""
        profile_data = await self.get_profile_cosmetics()
        cosmetics_data = await self.get_cosmetic_definitions()
        
        owned_cosmetics = []
        
        # Get cosmetic items from profile
        if "profileChanges" in profile_data and profile_data["profileChanges"]:
            profile = profile_data["profileChanges"][0]["profile"]
            
            # Get items from profile
            items = profile.get("items", {})
            stats = profile.get("stats", {})
            
            # Create lookup for cosmetic definitions
            cosmetic_lookup = {}
            for cosmetic in cosmetics_data.get("data", []):
                cosmetic_lookup[cosmetic["id"]] = cosmetic
            
            # Process owned items
            for item_id, item_data in items.items():
                if "templateId" in item_data:
                    template_id = item_data["templateId"]
                    
                    # Extract cosmetic ID from template ID
                    if ":" in template_id:
                        cosmetic_id = template_id.split(":")[-1]
                        
                        if cosmetic_id in cosmetic_lookup:
                            cosmetic_info = cosmetic_lookup[cosmetic_id].copy()
                            
                            # Add profile-specific data
                            cosmetic_info["owned"] = True
                            cosmetic_info["item_id"] = item_id
                            cosmetic_info["variants"] = item_data.get("variants", [])
                            cosmetic_info["favorite"] = item_data.get("favorite", False)
                            
                            # Check if exclusive (special series or limited)
                            cosmetic_info["exclusive"] = self._is_exclusive(cosmetic_info)
                            
                            owned_cosmetics.append(cosmetic_info)
        
        return owned_cosmetics
    
    def _is_exclusive(self, cosmetic: Dict[str, Any]) -> bool:
        """Determine if a cosmetic is exclusive"""
        exclusive_series = [
            "Icon Series",
            "Gaming Legends Series", 
            "Marvel Series",
            "DC Series",
            "Star Wars Series",
            "Lego Fortnite",
            "Rocket Racing",
            "Fortnite Festival",
            "OG"
        ]
        
        exclusive_rarity = ["mythic", "legendary"]
        
        series = cosmetic.get("series", {}).get("name", "")
        rarity = cosmetic.get("rarity", {}).get("value", "")
        
        return (series in exclusive_series or 
                rarity in exclusive_rarity or
                "exclusive" in cosmetic.get("description", "").lower())
    
    def categorize_cosmetics(self, cosmetics: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Categorize cosmetics by type"""
        categories = {
            "skins": [],
            "backblings": [],
            "pickaxes": [],
            "emotes": [],
            "wraps": [],
            "gliders": [],
            "music": [],
            "loading_screens": [],
            "contrails": [],
            "sprays": [],
            "emojis": [],
            "toys": []
        }
        
        for cosmetic in cosmetics:
            cosmetic_type = cosmetic.get("type", {}).get("value", "").lower()
            
            if cosmetic_type == "outfit":
                categories["skins"].append(cosmetic)
            elif cosmetic_type == "backpack":
                categories["backblings"].append(cosmetic)
            elif cosmetic_type == "pickaxe":
                categories["pickaxes"].append(cosmetic)
            elif cosmetic_type == "emote":
                categories["emotes"].append(cosmetic)
            elif cosmetic_type == "wrap":
                categories["wraps"].append(cosmetic)
            elif cosmetic_type == "glider":
                categories["gliders"].append(cosmetic)
            elif cosmetic_type == "music":
                categories["music"].append(cosmetic)
            elif cosmetic_type == "loadingscreen":
                categories["loading_screens"].append(cosmetic)
            elif cosmetic_type == "contrail":
                categories["contrails"].append(cosmetic)
            elif cosmetic_type == "spray":
                categories["sprays"].append(cosmetic)
            elif cosmetic_type == "emoji":
                categories["emojis"].append(cosmetic)
            elif cosmetic_type == "toy":
                categories["toys"].append(cosmetic)
        
        return categories
    
    async def get_account_stats(self) -> Dict[str, Any]:
        """Get account statistics"""
        profile_data = await self.get_profile_cosmetics()
        
        if "profileChanges" in profile_data and profile_data["profileChanges"]:
            profile = profile_data["profileChanges"][0]["profile"]
            stats = profile.get("stats", {})
            
            return {
                "vbucks": stats.get("vbucks", 0),
                "lifetime_wins": stats.get("wins", 0),
                "gifts_sent": stats.get("gifts_sent", 0),
                "gifts_received": stats.get("gifts_received", 0),
                "account_level": stats.get("level", 0),
                "season_level": stats.get("season_level", 0)
            }
        
        return {}
