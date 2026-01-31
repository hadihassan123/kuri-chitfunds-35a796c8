from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import random

from database import get_db, engine, Base
from models import ChitFund, Member, DrawResult, ChitStatus
from schemas import (
    ChitFundCreate, ChitFundResponse, ChitFundListResponse,
    MemberCreate, MemberResponse, DrawResultResponse
)
from config import get_settings

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ChitFund API",
    description="Backend API for Digital Chit Fund Management",
    version="1.0.0"
)

settings = get_settings()

# CORS configuration
origins = [origin.strip() for origin in settings.cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "ChitFund API is running", "version": "1.0.0"}


@app.get("/api/chits", response_model=List[ChitFundListResponse])
def get_chits(db: Session = Depends(get_db)):
    """Get all chit funds"""
    chits = db.query(ChitFund).all()
    return chits


@app.get("/api/chits/{chit_id}", response_model=ChitFundResponse)
def get_chit(chit_id: str, db: Session = Depends(get_db)):
    """Get a single chit fund by ID"""
    chit = db.query(ChitFund).filter(ChitFund.id == chit_id).first()
    if not chit:
        raise HTTPException(status_code=404, detail="Chit fund not found")
    return chit


@app.post("/api/chits", response_model=ChitFundResponse)
def create_chit(payload: ChitFundCreate, db: Session = Depends(get_db)):
    """Create a new chit fund"""
    # Create the chit fund
    chit = ChitFund(
        name=payload.name,
        description=payload.description,
        monthly_amount=payload.monthly_amount,
        currency=payload.currency,
        total_members=payload.total_members,
        duration_months=payload.duration_months,
        organizer_wins_first=payload.organizer_wins_first,
        status=ChitStatus.DRAFT,
        current_month=0
    )
    
    db.add(chit)
    db.flush()  # Get the chit ID
    
    # Create the organizer as first member
    organizer = Member(
        chit_fund_id=chit.id,
        name=payload.organizer_name,
        email=payload.organizer_email,
        country=payload.organizer_country,
        has_won=False
    )
    
    db.add(organizer)
    db.flush()
    
    # Set organizer ID
    chit.organizer_id = organizer.id
    
    db.commit()
    db.refresh(chit)
    
    return chit


@app.post("/api/chits/{chit_id}/members", response_model=MemberResponse)
def add_member(chit_id: str, payload: MemberCreate, db: Session = Depends(get_db)):
    """Add a member to a chit fund"""
    chit = db.query(ChitFund).filter(ChitFund.id == chit_id).first()
    if not chit:
        raise HTTPException(status_code=404, detail="Chit fund not found")
    
    if chit.status != ChitStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Cannot add members to an active chit")
    
    if len(chit.members) >= chit.total_members:
        raise HTTPException(status_code=400, detail="Maximum members reached")
    
    # Check for duplicate email
    existing = db.query(Member).filter(
        Member.chit_fund_id == chit_id,
        Member.email == payload.email
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Member with this email already exists")
    
    member = Member(
        chit_fund_id=chit_id,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        country=payload.country,
        has_won=False
    )
    
    db.add(member)
    db.flush()
    
    # Auto-activate when all members join
    if len(chit.members) + 1 >= chit.total_members:
        chit.status = ChitStatus.ACTIVE
        chit.current_month = 1
    
    db.commit()
    db.refresh(member)
    
    return member


@app.delete("/api/chits/{chit_id}/members/{member_id}")
def remove_member(chit_id: str, member_id: str, db: Session = Depends(get_db)):
    """Remove a member from a chit fund"""
    chit = db.query(ChitFund).filter(ChitFund.id == chit_id).first()
    if not chit:
        raise HTTPException(status_code=404, detail="Chit fund not found")
    
    if chit.status != ChitStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Cannot remove members from an active chit")
    
    if member_id == chit.organizer_id:
        raise HTTPException(status_code=400, detail="Cannot remove the organizer")
    
    member = db.query(Member).filter(
        Member.id == member_id,
        Member.chit_fund_id == chit_id
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    db.delete(member)
    db.commit()
    
    return {"message": "Member removed successfully"}


@app.get("/api/chits/{chit_id}/eligible", response_model=List[MemberResponse])
def get_eligible_members(chit_id: str, db: Session = Depends(get_db)):
    """Get members eligible for the next draw"""
    chit = db.query(ChitFund).filter(ChitFund.id == chit_id).first()
    if not chit:
        raise HTTPException(status_code=404, detail="Chit fund not found")
    
    eligible = [m for m in chit.members if not m.has_won]
    
    # If organizer must win last, exclude them until last month
    if not chit.organizer_wins_first and chit.current_month < chit.duration_months:
        eligible = [m for m in eligible if m.id != chit.organizer_id]
    
    return eligible


@app.post("/api/chits/{chit_id}/draw", response_model=DrawResultResponse)
def conduct_draw(chit_id: str, db: Session = Depends(get_db)):
    """Conduct the monthly draw"""
    chit = db.query(ChitFund).filter(ChitFund.id == chit_id).first()
    if not chit:
        raise HTTPException(status_code=404, detail="Chit fund not found")
    
    if chit.status != ChitStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Chit is not active")
    
    if chit.current_month > chit.duration_months:
        raise HTTPException(status_code=400, detail="All draws completed")
    
    # Get eligible members
    eligible = [m for m in chit.members if not m.has_won]
    
    if not eligible:
        raise HTTPException(status_code=400, detail="No eligible members")
    
    # Determine winner based on rules
    organizer = next((m for m in chit.members if m.id == chit.organizer_id), None)
    is_first_month = chit.current_month == 1
    is_last_month = chit.current_month == chit.duration_months
    
    winner = None
    
    if chit.organizer_wins_first and is_first_month and organizer and not organizer.has_won:
        # Organizer must win first month
        winner = organizer
    elif not chit.organizer_wins_first and is_last_month and organizer and not organizer.has_won:
        # Organizer must win last month
        winner = organizer
    elif not chit.organizer_wins_first and len(eligible) == 1:
        # Only organizer left
        winner = eligible[0]
    else:
        # Random selection
        pool = eligible
        if not chit.organizer_wins_first and organizer and not organizer.has_won:
            pool = [m for m in eligible if m.id != chit.organizer_id]
        
        if pool:
            winner = random.choice(pool)
        else:
            winner = random.choice(eligible)
    
    # Update winner
    winner.has_won = True
    winner.won_in_month = chit.current_month
    
    # Create draw result
    draw_result = DrawResult(
        chit_fund_id=chit.id,
        month=chit.current_month,
        winner_id=winner.id,
        winner_name=winner.name
    )
    
    db.add(draw_result)
    
    # Advance month
    chit.current_month += 1
    
    # Check if completed
    if chit.current_month > chit.duration_months:
        chit.status = ChitStatus.COMPLETED
    
    db.commit()
    db.refresh(draw_result)
    
    return draw_result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
