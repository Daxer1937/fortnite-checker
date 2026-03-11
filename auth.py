import asyncio
import aiohttp
import base64
import uuid
import time
from typing import Optional, Dict, Any
from urllib.parse import urlencode
from config_max import Config

class EpicGamesAuth:
    """Handles Epic Games OAuth Device Code Flow authentication"""
    
    def __init__(self):
        self.client_id = Config.EPIC_CLIENT_ID
        self.client_secret = Config.EPIC_CLIENT_SECRET
        self.epic_api = Config.EPIC_API_URL
        self.device_code = None
        self.user_code = None
        self.verification_uri = "https://www.epicgames.com/id/activate"
        self.access_token = None
        self.refresh_token = None
        self.expires_at = None
        self.account_id = None
        
    async def start_device_flow(self) -> Dict[str, str]:
        """Initiate device code flow and return user code info"""
        async with aiohttp.ClientSession() as session:
            # Start device code flow with scopes
            data = {
                "grant_type": "device_code",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "device_id": str(uuid.uuid4()),
                "scope": " ".join(Config.OAUTH_SCOPES)
            }
            
            headers = {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json"
            }
            
            async with session.post(
                f"{self.epic_api}/account/api/oauth/device_authorization",
                data=data,
                headers=headers
            ) as response:
                if response.status != 200:
                    raise Exception(f"Failed to start device flow: {response.status}")
                    
                result = await response.json()
                
            self.device_code = result["device_code"]
            self.user_code = result["user_code"]
            self.verification_uri = result["verification_uri"]
            self.expires_in = result["expires_in"]
            self.interval = result["interval"]
            
            return {
                "user_code": self.user_code,
                "verification_uri": self.verification_uri,
                "expires_in": self.expires_in,
                "interval": self.interval
            }
    
    async def poll_for_token(self) -> bool:
        """Poll for authentication completion"""
        if not self.device_code:
            raise Exception("Device flow not started")
            
        async with aiohttp.ClientSession() as session:
            data = {
                "grant_type": "device_code",
                "device_code": self.device_code,
                "client_id": self.client_id,
                "client_secret": self.client_secret
            }
            
            headers = {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json"
            }
            
            async with session.post(
                f"{self.epic_api}/account/api/oauth/token",
                data=data,
                headers=headers
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    self.access_token = result["access_token"]
                    self.refresh_token = result["refresh_token"]
                    self.expires_at = time.time() + result["expires_in"]
                    return True
                elif response.status == 400:
                    error_data = await response.json()
                    if error_data.get("error") == "authorization_pending":
                        return False
                    elif error_data.get("error") == "slow_down":
                        await asyncio.sleep(self.interval * 2)
                        return False
                    else:
                        raise Exception(f"Auth error: {error_data}")
                else:
                    raise Exception(f"Token request failed: {response.status}")
    
    async def get_user_info(self) -> Dict[str, Any]:
        """Get authenticated user information"""
        if not self.access_token:
            raise Exception("Not authenticated")
            
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"bearer {self.access_token}",
                "Accept": "application/json"
            }
            
            async with session.get(
                f"{self.epic_api}/account/api/oauth/accountInfo",
                headers=headers
            ) as response:
                if response.status != 200:
                    raise Exception(f"Failed to get user info: {response.status}")
                    
                result = await response.json()
                self.account_id = result["id"]
                return result
    
    async def refresh_access_token(self) -> bool:
        """Refresh access token using refresh token"""
        if not self.refresh_token:
            return False
            
        async with aiohttp.ClientSession() as session:
            data = {
                "grant_type": "refresh_token",
                "refresh_token": self.refresh_token,
                "client_id": self.client_id,
                "client_secret": self.client_secret
            }
            
            headers = {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json"
            }
            
            async with session.post(
                f"{self.epic_api}/account/api/oauth/token",
                data=data,
                headers=headers
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    self.access_token = result["access_token"]
                    self.refresh_token = result.get("refresh_token", self.refresh_token)
                    self.expires_at = time.time() + result["expires_in"]
                    return True
                else:
                    return False
    
    def is_token_expired(self) -> bool:
        """Check if access token is expired"""
        return time.time() >= self.expires_at if self.expires_at else True
    
    async def ensure_valid_token(self) -> bool:
        """Ensure we have a valid access token"""
        if not self.access_token or self.is_token_expired():
            return await self.refresh_access_token()
        return True
