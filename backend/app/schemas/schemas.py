from pydantic import BaseModel, EmailStr, Field, computed_field, ConfigDict
from datetime import datetime, timezone
from typing import List, Optional

class UserOut(BaseModel):
    user_id: int
    email: EmailStr
    firstname: str
    lastname: str
    is_admin: bool
    is_active: bool
    
    @computed_field(return_type=str)
    @property
    def full_name(self) -> str:
        return f"{self.firstname} {self.lastname}"
    
    model_config = ConfigDict(from_attributes=True)
    
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
    timeStart: Optional[datetime] = None
    timeEnd: Optional[datetime] = None

class QuizRow(BaseModel):
    quiz_id: int
    category: str
    time_start: str
    time_end: Optional[str]
    question_count: int
    score_percent: float

class AnswerIn(BaseModel):
    question_id: int
    choice_id: int

class ContactIn(BaseModel):
    subject: str
    email: EmailStr
    message: str

class ChoiceIn(BaseModel):
    description: str
    isCorrect: bool = Field(False, alias="isCorrect")

class QuestionCreateIn(BaseModel):
    categoryId: int = Field(..., alias="categoryId")
    description: str
    choices: List[ChoiceIn]  # at least one, typically 4 with exactly one correct

class QuestionUpdateIn(BaseModel):
    categoryId: Optional[int] = Field(None, alias="categoryId")
    description: Optional[str] = None
    isActive: Optional[bool] = Field(None, alias="isActive")
    # If provided, we REPLACE all choices in a simple, atomic way
    choices: Optional[List[ChoiceIn]] = None

class ChoicePutIn(BaseModel):
    choiceId: Optional[int] = Field(default=None, description="Existing choice id; omit for new")
    description: str
    isCorrect: bool = False

class QuestionPutIn(BaseModel):
    description: str
    categoryId: int
    isActive: bool = True
    choices: List[ChoicePutIn]

    model_config = ConfigDict(from_attributes=True)