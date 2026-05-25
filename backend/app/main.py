from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import settings
from .database import engine, Base
from .routers import auth, categories, notes, reminders, gamification, habits, finance, metrics, admin



@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    description="TaskFlow API - Quản lý công việc, thói quen, tài chính",
    version="2.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(categories.router, prefix="/api", tags=["Categories"])
app.include_router(notes.router, prefix="/api", tags=["Notes"])
app.include_router(reminders.router, prefix="/api", tags=["Reminders"])

# New routers
app.include_router(gamification.router, prefix="/api", tags=["Gamification"])
app.include_router(habits.router, prefix="/api", tags=["Habits"])
app.include_router(finance.router, prefix="/api", tags=["Finance"])
app.include_router(metrics.router, prefix="/api", tags=["Daily Metrics & Focus"])
app.include_router(admin.router, prefix="/api", tags=["Admin Management"])


@app.get("/")
async def root():
    return {
        "message": "Welcome to TaskFlow API",
        "version": "2.0.0",
        "features": [
            "Authentication",
            "Notes & Tasks",
            "Categories",
            "Reminders",
            "Gamification (XP, Levels, Badges)",
            "Habits & Streaks",
            "Finance Hub",
            "Daily Metrics",
            "Focus Mode"
        ]
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}