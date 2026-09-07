"""
HeartBeat 360 — Root Entrypoint
Exports FastAPI 'app' instance for platforms searching default root locations.
"""

import os
from backend.app.main import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("backend.app.main:app", host=host, port=port, reload=False)
