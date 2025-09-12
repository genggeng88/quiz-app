from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import auth, categories, questions, quizzes, contacts, admin

app = FastAPI(title="Quiz API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.CORS_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health(): return {"ok": True}

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(questions.router)
app.include_router(quizzes.router)
app.include_router(contacts.router)
app.include_router(admin.router)
