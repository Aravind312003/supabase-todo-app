import os
import json
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="Supabase Todo API")

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
def get_config_var(name: str) -> Optional[str]:
    val = os.getenv(name, "").strip()
    # Remove quotes if the user accidentally included them
    if val.startswith('"') and val.endswith('"'): val = val[1:-1]
    if val.startswith("'") and val.endswith("'"): val = val[1:-1]
    
    # Check if the user accidentally included the variable name in the value
    if val.startswith(f"{name}="):
        val = val[len(name)+1:]

    return val if val and not is_placeholder(val) else None

def read_config():
    global SUPABASE_URL, SUPABASE_KEY
    url_val = get_config_var("SUPABASE_URL")
    SUPABASE_URL = (url_val or "").rstrip('/')
    if SUPABASE_URL and not SUPABASE_URL.startswith("http"):
        SUPABASE_URL = f"https://{SUPABASE_URL}"

    k = get_config_var("SUPABASE_SERVICE_ROLE_KEY") or get_config_var("SUPABASE_SERVICE_ROLE")
    if not k:
        k = get_config_var("SUPABASE_ANON_KEY") or get_config_var("SUPABASE_KEY")
    
    SUPABASE_KEY = (k or "").strip()
    print(f"🔍 Config Read: URL={'Set' if SUPABASE_URL else 'Missing'}, Key={'Set' if SUPABASE_KEY else 'Missing'}")

def is_placeholder(val: str) -> bool:
    if not val:
        return True
    v = val.lower()
    placeholders = [
        "your-project.supabase.co",
        "example.supabase.co",
        "your_supabase_url",
        "your-supabase-url",
        "your_anon_key",
        "your_service_role_key",
        "my_supabase_url",
        "placeholder",
        "undefined",
        "null",
        "your_url",
        "your_key"
    ]
    # Do not include "eyJ..." in placeholders as it matches all Supabase keys
    if any(p in v for p in placeholders):
        return True
    
    # If it's the exact literal from a template
    if v == "eyJ...".lower():
        return True
        
    return len(val) < 10

# Initial read
read_config()

# State
supabase_client: Optional[Client] = None
is_demo_mode = False
config_error = None
connection_verified = False

# Mock data for demo mode
mock_todos = [
    {
        "id": "1",
        "title": "Connect Supabase to save real data (Python Backend)",
        "completed": False,
        "created_at": datetime.now().isoformat()
    },
    {
        "id": "2",
        "title": "Add your first task above",
        "completed": True,
        "created_at": datetime.now().isoformat()
    },
]

# Initialization
def init_supabase():
    global supabase_client, is_demo_mode, config_error, connection_verified
    
    # Try to load secrets from .env or .env.example with override
    # Look in project root (..) and current dir (.)
    possible_paths = [
        "../.env", "../.env.example",
        ".env", ".env.example"
    ]
    
    loaded_any = False
    for env_path in possible_paths:
        if os.path.exists(env_path):
            print(f"💡 Loading environment from {env_path} (override=True)")
            load_dotenv(env_path, override=True)
            loaded_any = True
            # Re-read after loading
            read_config()
            if SUPABASE_URL and SUPABASE_KEY and not is_placeholder(SUPABASE_URL) and not is_placeholder(SUPABASE_KEY):
                break # Found valid config

    if not SUPABASE_URL or not SUPABASE_KEY:
        is_demo_mode = True
        config_error = "Configuration missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY in the Secrets panel or .env file."
        print(f"⚠️ Supabase not configured. URL set: {bool(SUPABASE_URL)}, Key set: {bool(SUPABASE_KEY)}")
        return

    print(f"🚀 Initializing Supabase: URL={SUPABASE_URL[:15]}..., Key={SUPABASE_KEY[:10]}...")

    try:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        # Test connection
        try:
            supabase_client.table("todos").select("id").limit(1).execute()
            connection_verified = True
            print(f"✅ Supabase connection verified for {SUPABASE_URL}")
            is_demo_mode = False
            config_error = None
        except Exception as conn_err:
            error_msg = str(conn_err)
            print(f"❌ Supabase connection check failed: {error_msg}")
            connection_verified = False
            
            if any(x in error_msg for x in ["Unauthorized", "apikey", "JWT", "Missing"]):
                config_error = "Authentication Failed: Supabase rejected the API key."
                # Allow it to continue to demo mode if auth fails strictly
                is_demo_mode = True
            elif "relation \"todos\" does not exist" in error_msg:
                config_error = "Table 'todos' missing. Please create it in Supabase."
                is_demo_mode = False # Keep the client, maybe they just need to run SQL
            else:
                config_error = f"Connection error: {error_msg}"
                is_demo_mode = True
    except Exception as e:
        print(f"💥 Critical failure initializing Supabase: {e}")
        is_demo_mode = True
        config_error = str(e)


init_supabase()

@app.get("/api/config-status")
async def get_config_status():
    key_type = "None"
    if get_config_var("SUPABASE_SERVICE_ROLE_KEY") or get_config_var("SUPABASE_SERVICE_ROLE"):
        key_type = "Service Role"
    elif get_config_var("SUPABASE_ANON_KEY") or get_config_var("SUPABASE_KEY"):
        key_type = "Anon/Public"

    return {
        "supabaseConfigured": not is_demo_mode and supabase_client is not None,
        "connectionVerified": connection_verified,
        "isDemoMode": is_demo_mode,
        "url": "Demo Server" if is_demo_mode else SUPABASE_URL,
        "keyType": key_type,
        "reason": config_error,
        "backend": "python"
    }

@app.get("/api/todos")
async def get_todos():
    print(f"DEBUG: get_todos. is_demo={is_demo_mode}, verified={connection_verified}, client={supabase_client is not None}")
    
    if is_demo_mode:
        return mock_todos
    
    if not supabase_client:
        return JSONResponse(
            status_code=503,
            content={"error": "Supabase Not Connected", "details": config_error or "Client not initialized"}
        )

    try:
        response = supabase_client.table("todos").select("*").order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        error_msg = str(e)
        print(f"Supabase GET Error: {error_msg}")
        
        # Categorize known errors
        if any(x in error_msg.lower() for x in ["unauthorized", "apikey", "jwt", "missing", "invalid"]):
            return JSONResponse(
                status_code=401,
                content={
                    "error": "Authentication Failed",
                    "details": "Supabase rejected the API key. Ensure you copied the 'anon' or 'service_role' key correctly.",
                    "debug": {
                        "url": SUPABASE_URL,
                        "key_prefix": SUPABASE_KEY[:10] if SUPABASE_KEY else "Empty",
                        "raw_error": error_msg
                    }
                }
            )
        
        if "relation \"todos\" does not exist" in error_msg:
             return JSONResponse(
                status_code=404,
                content={
                    "error": "Table Not Found",
                    "details": "The table 'todos' does not exist in your database. You need to create it with 'id', 'title', and 'completed' columns.",
                    "sql": "CREATE TABLE todos (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, title text, completed boolean DEFAULT false, created_at timestamptz DEFAULT now());"
                }
            )

        raise HTTPException(status_code=500, detail=f"Database error: {error_msg}")

@app.post("/api/todos", status_code=201)
async def create_todo(request: Request):
    payload = await request.json()
    title = payload.get("title")
    
    if not title:
        raise HTTPException(status_code=400, detail="Title is required")

    if is_demo_mode or not supabase_client:
        new_todo = {
            "id": datetime.now().strftime("%f"),
            "title": title,
            "completed": False,
            "created_at": datetime.now().isoformat()
        }
        mock_todos.insert(0, new_todo)
        return new_todo

    try:
        response = supabase_client.table("todos").insert({
            "title": title,
            "completed": False
        }).execute()
        return response.data[0]
    except Exception as e:
        error_msg = str(e)
        print(f"Supabase Error (POST): {error_msg}")
        if any(x in error_msg for x in ["Missing Authorization header", "Unauthorized"]):
             raise HTTPException(status_code=401, detail="Authentication failed with Supabase")
        raise HTTPException(status_code=500, detail=f"Database error: {error_msg}")

@app.put("/api/todos/{todo_id}")
async def update_todo(todo_id: str, request: Request):
    updates = await request.json()
    
    if is_demo_mode:
        for t in mock_todos:
            if t["id"] == todo_id:
                t.update(updates)
                return t
        raise HTTPException(status_code=404, detail="Todo not found")

    try:
        response = supabase_client.table("todos").update(updates).eq("id", todo_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Todo not found")
        return response.data[0]
    except Exception as e:
        print(f"Error updating todo: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/todos/{todo_id}", status_code=204)
async def delete_todo(todo_id: str):
    if is_demo_mode:
        global mock_todos
        mock_todos = [t for t in mock_todos if t["id"] != todo_id]
        return Response(status_code=204)

    try:
        supabase_client.table("todos").delete().eq("id", todo_id).execute()
        return Response(status_code=204)
    except Exception as e:
        print(f"Error deleting todo: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
