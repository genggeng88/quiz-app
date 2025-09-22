from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import auth, categories, quiz, contact
from app.routers import user as user_router
from app.routers import quiz_manage as quiz_router
from app.routers import question as question_router

app = FastAPI(title="Quiz API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/healthz")
def health(): return {"ok": True}

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(quiz.router)
app.include_router(contact.router)
app.include_router(user_router.router)
app.include_router(quiz_router.router)
app.include_router(question_router.router)
