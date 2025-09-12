from sqlalchemy.orm import DeclarativeBase, relationship, Mapped, mapped_column
from sqlalchemy import BigInteger, Text, Boolean, ForeignKey, DateTime, func, Identity

class Base(DeclarativeBase): pass

class User(Base):
    __tablename__ = "user"

    user_id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(always=False),   # PG: BIGSERIAL-style
        primary_key=True,
    )
    email: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    firstname: Mapped[str] = mapped_column(Text, nullable=False)
    lastname: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    is_admin: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

class Category(Base):
    __tablename__ = "category"
    category_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(Text, unique=True, nullable=False)

class Question(Base):
    __tablename__ = "question"
    question_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    category_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("category.category_id", ondelete="RESTRICT"), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class Choice(Base):
    __tablename__ = "choice"
    choice_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    question_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("question.question_id", ondelete="CASCADE"), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

class Quiz(Base):
    __tablename__ = "quiz"
    quiz_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False)
    category_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("category.category_id", ondelete="RESTRICT"), nullable=False)
    name: Mapped[str | None] = mapped_column(Text)
    time_start: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    time_end: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True))

class QuizQuestion(Base):
    __tablename__ = "quizquestion"
    qq_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    quiz_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("quiz.quiz_id", ondelete="CASCADE"), nullable=False)
    question_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("question.question_id", ondelete="RESTRICT"), nullable=False)
    user_choice_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("choice.choice_id", ondelete="SET NULL"))
