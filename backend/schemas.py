from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ChitStatusEnum(str, Enum):
    draft = "draft"
    active = "active"
    completed = "completed"


# Member schemas
class MemberCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    country: str


class MemberResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str]
    country: str
    has_won: bool
    won_in_month: Optional[int]

    class Config:
        from_attributes = True


# Draw schemas
class DrawResultResponse(BaseModel):
    id: str
    month: int
    winner_id: str
    winner_name: str
    drawn_at: datetime

    class Config:
        from_attributes = True


# Chit Fund schemas
class ChitFundCreate(BaseModel):
    name: str
    description: Optional[str] = None
    monthly_amount: int
    currency: str = "INR"
    total_members: int
    duration_months: int
    organizer_name: str
    organizer_email: EmailStr
    organizer_country: str
    organizer_wins_first: bool = True


class ChitFundResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    monthly_amount: int
    currency: str
    total_members: int
    duration_months: int
    current_month: int
    organizer_id: str
    organizer_wins_first: bool
    status: ChitStatusEnum
    created_at: datetime
    members: List[MemberResponse]
    draws: List[DrawResultResponse]

    class Config:
        from_attributes = True


class ChitFundListResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    monthly_amount: int
    currency: str
    total_members: int
    duration_months: int
    current_month: int
    organizer_id: str
    organizer_wins_first: bool
    status: ChitStatusEnum
    created_at: datetime
    members: List[MemberResponse]
    draws: List[DrawResultResponse]

    class Config:
        from_attributes = True
