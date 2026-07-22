from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import routes_learning, routes_mastery, routes_peer, routes_protege, routes_tutors, ws
from app.config import settings

app = FastAPI(title="Mentra API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_learning.router)
app.include_router(routes_tutors.router)
app.include_router(routes_peer.router)
app.include_router(routes_mastery.router)
app.include_router(routes_protege.router)
app.include_router(ws.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
