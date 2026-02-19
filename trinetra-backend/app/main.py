"""
Trinetra Backend — Main Application Entry Point
FastAPI application with auto-discovery of routers, CORS configuration,
Firebase initialization, and background crawler engine start.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.firebase_client import initialize_firebase
from app.config import settings
from app.crawler.engine import get_engine
from app.routers import auth, threats, entities, sectors, sources, keywords, stats, websocket

# ═══ Logging Configuration ═══
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-8s │ %(name)-25s │ %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("trinetra")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifecycle manager.
    - On startup: Initialize Firebase, seed data, start crawler
    - On shutdown: Stop crawler gracefully
    """
    # ═══ STARTUP ═══
    logger.info("═══ Trinetra Backend Starting ═══")

    engine = None
    try:
        # Initialize Firebase Admin SDK
        initialize_firebase()
        logger.info("Firebase initialized")

        # Seed default data if collections are empty
        from app.utils.seed import seed_initial_data
        await seed_initial_data()

        # Start the background crawler engine
        engine = get_engine()
        await engine.start()
        logger.info("Crawler engine started")
    except Exception as exc:
        logger.warning(
            f"Non-fatal startup error (Firestore may still be activating): {exc}"
        )
        logger.info("Server will start — Firestore endpoints will retry on demand")

    yield  # Application is running

    # ═══ SHUTDOWN ═══
    logger.info("═══ Trinetra Backend Shutting Down ═══")
    if engine:
        await engine.stop()
        logger.info("Crawler engine stopped")


# ═══ FastAPI App ═══
app = FastAPI(
    title="Trinetra Threat Intelligence API",
    description=(
        "Backend for the Trinetra Web Forum Threat Intelligence Scraper & Analyzer. "
        "Monitors web forums, detects leaked credentials, identifies cyber-attack discussions "
        "targeting Indian infrastructure, and provides real-time intelligence."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ═══ CORS Configuration ═══
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══ Register Routers ═══
app.include_router(auth.router, prefix="/api")
app.include_router(threats.router, prefix="/api")
app.include_router(entities.router, prefix="/api")
app.include_router(sectors.router, prefix="/api")
app.include_router(sources.router, prefix="/api")
app.include_router(keywords.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(websocket.router)


# ═══ Health Check ═══
@app.get("/api/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "service": "Trinetra Threat Intelligence",
        "version": "1.0.0",
    }


@app.get("/")
async def root():
    """Root endpoint — redirects to API docs."""
    return {
        "message": "Trinetra Threat Intelligence API",
        "docs": "/docs",
        "health": "/api/health",
    }
