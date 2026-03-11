from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import uvicorn
import json
import os
from typing import Dict, Any
from fortnite_api import FortniteAPI
from auth import EpicGamesAuth

app = FastAPI(title="Fortnite Cosmetic Checker")

# Setup templates
templates = Jinja2Templates(directory="templates")

# Store sessions (in production, use Redis or database)
sessions: Dict[str, Dict[str, Any]] = {}

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Home page with login prompt"""
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/login")
async def login_page():
    """Start Epic Games device flow"""
    auth = EpicGamesAuth()
    
    try:
        device_info = await auth.start_device_flow()
        
        # Store auth session
        session_id = os.urandom(16).hex()
        sessions[session_id] = {
            "auth": auth,
            "expires_at": None,
            "completed": False
        }
        
        return {
            "session_id": session_id,
            "user_code": device_info["user_code"],
            "verification_uri": device_info["verification_uri"],
            "expires_in": device_info["expires_in"],
            "interval": device_info["interval"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/check/{session_id}")
async def check_auth(session_id: str):
    """Check if authentication is complete"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    auth = session["auth"]
    
    try:
        success = await auth.poll_for_token()
        
        if success:
            await auth.get_user_info()
            api = FortniteAPI(auth)
            
            session["completed"] = True
            session["api"] = api
            
            return {"status": "success", "account_id": auth.account_id}
        else:
            return {"status": "pending"}
            
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/locker/{session_id}", response_class=HTMLResponse)
async def view_locker(request: Request, session_id: str):
    """View Fortnite locker"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    
    if not session.get("completed"):
        raise HTTPException(status_code=400, detail="Authentication not completed")
    
    api = session["api"]
    
    try:
        # Get cosmetics and stats
        cosmetics = await api.get_owned_cosmetics()
        categorized = api.categorize_cosmetics(cosmetics)
        stats = await api.get_account_stats()
        
        # Count exclusives
        exclusive_counts = {}
        total_exclusives = 0
        
        for category, items in categorized.items():
            exclusive_count = sum(1 for item in items if item.get('exclusive', False))
            exclusive_counts[category] = exclusive_count
            total_exclusives += exclusive_count
        
        return templates.TemplateResponse("locker.html", {
            "request": request,
            "cosmetics": categorized,
            "stats": stats,
            "total_items": len(cosmetics),
            "exclusive_counts": exclusive_counts,
            "total_exclusives": total_exclusives
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cosmetics/{session_id}")
async def get_cosmetics_api(session_id: str):
    """Get cosmetics as JSON"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    
    if not session.get("completed"):
        raise HTTPException(status_code=400, detail="Authentication not completed")
    
    api = session["api"]
    
    try:
        cosmetics = await api.get_owned_cosmetics()
        categorized = api.categorize_cosmetics(cosmetics)
        stats = await api.get_account_stats()
        
        return {
            "cosmetics": categorized,
            "stats": stats,
            "total_items": len(cosmetics)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
