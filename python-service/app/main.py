from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from dotenv import load_dotenv

from . import auth
from .routers import audit, fix, teach

load_dotenv()

app = FastAPI(title="GM Teach-Audit-Fix API", default_response_class=ORJSONResponse)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(teach.router, prefix="/teach", tags=["teach"])
app.include_router(audit.router, prefix="/audit", tags=["audit"])
app.include_router(fix.router, prefix="/fix", tags=["fix"])
app.include_router(auth.router, tags=["auth"])


@app.get("/health")
def health():
    return {"status": "ok"}

