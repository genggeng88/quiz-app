from pydantic import BaseModel, EmailStr
from typing import List, Optional

class UserOut(BaseModel):
    user_id: int
    email: EmailStr
    firstname: str
    lastname: str
    is_admin: bool
    is_active: bool
    admin_secret: Optional[str] = None
    
class Config: from_attributes = True

class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    firstname: str
    lastname: str
    is_admin: Optional[bool] = None
    is_active: Optional[bool] = None

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class CategoryOut(BaseModel):
    category_id: int
    name: str
    class Config: from_attributes = True

class OptionOut(BaseModel):
    choice_id: int
    description: str

class QuestionOut(BaseModel):
    question_id: int
    description: str
    options: List[OptionOut]

class QuizSubmitAnswer(BaseModel):
    questionId: int
    choiceId: int

class QuizSubmitIn(BaseModel):
    categoryId: int
    answers: List[QuizSubmitAnswer]

class QuizRow(BaseModel):
    quiz_id: int
    category: str
    time_start: str
    time_end: Optional[str]
    question_count: int
    score_percent: float

class ContactIn(BaseModel):
    subject: str
    email: EmailStr
    message: str
