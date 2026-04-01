import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from starlette.middleware.sessions import SessionMiddleware
from authlib.integrations.starlette_client import OAuth
from pydantic import BaseModel

# 🚀 IMPORT SQLALCHEMY & MODELS
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import engine, Base, get_db
from app.models import User, ChatMessage,SavedText,Category

# 🚀 IMPORT THE SEPARATED AI ENGINE
from app.ai_engine import engine as ai_engine

load_dotenv()

# ==========================================
# 1. ASYNC DATABASE STARTUP (SQLAlchemy)
# ==========================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🔌 Connecting to DigitalOcean Postgres via SQLAlchemy...")
    # This automatically creates your tables if they don't exist yet!
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Backend Server Ready!")
    yield

# ==========================================
# 2. FASTAPI & AUTH SETUP
# ==========================================
app = FastAPI(title="Belgian Expat Backend API", lifespan=lifespan)

app.add_middleware(
    SessionMiddleware, 
    secret_key=os.getenv("SECRET_KEY", "fallback-secret-key"),
    max_age=2592000,
    same_site="none",
    https_only=True
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000","https://belgium-expat-ai.vercel.app"],
    allow_credentials=True, 
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth = OAuth()
oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'},
)

# ==========================================
# 3. PYDANTIC MODELS
# ==========================================
class ExpatRequest(BaseModel):
    question: str

class ExpatResponse(BaseModel):
    profile: str
    category: str
    advice: str
    
class SaveTextRequest(BaseModel):
    content: str

class CategoryCreateRequest(BaseModel):
    name: str

class UpdateTextCategoryRequest(BaseModel):
    category_id: str | None
# ==========================================
# 4. AUTH ROUTES (Google -> SQLAlchemy)
# ==========================================
@app.get("/login")
async def login(request: Request):
    redirect_uri = request.url_for('auth_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/logout")
async def logout(request: Request):
    request.session.pop('user_id', None) # Clear the secure cookie
    return RedirectResponse(url="https://belgium-expat-ai.vercel.app/")

@app.get("/auth/callback")
# Notice how we inject the database session here: `db: AsyncSession = Depends(get_db)`
async def auth_callback(request: Request, db: AsyncSession = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')
        google_id = user_info.get("sub")
        
        # 1. Query the database to see if the user exists
        result = await db.execute(select(User).where(User.google_id == google_id))
        db_user = result.scalars().first()

        # 2. If they don't exist, create a new record
        if not db_user:
            db_user = User(
                google_id=google_id,
                email=user_info.get("email"),
                full_name=user_info.get("name"),
                avatar_url=user_info.get("picture")
            )
            db.add(db_user)
            await db.commit()
            await db.refresh(db_user)

        # 3. Save their UUID into the secure session cookie
        request.session['user_id'] = str(db_user.id)
        return RedirectResponse(url="https://belgium-expat-ai.vercel.app/")
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")

@app.get("/me")
async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)):
    user_id = request.session.get('user_id')
    if not user_id:
        raise HTTPException(status_code=401, detail="Not logged in.")

    # Query the database for the user by their UUID
    result = await db.execute(select(User).where(User.id == user_id))
    db_user = result.scalars().first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    # We return a dictionary so FastAPI automatically converts it to JSON
    return {
        "id": str(db_user.id),
        "email": db_user.email,
        "full_name": db_user.full_name,
        "profile_type": db_user.profile_type,
        "avatar_url": db_user.avatar_url
    }

# ==========================================
# 5. AI & CHAT ROUTES
# ==========================================
@app.get("/api/history")
async def get_chat_history(request: Request, db: AsyncSession = Depends(get_db)):
    user_id = request.session.get('user_id')
    if not user_id:
        return []

    # Fetch all messages belonging to this user, ordered by time
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at)
    )
    messages = result.scalars().all()
    
    # Format the SQLAlchemy objects into JSON-friendly dictionaries
    return [
        {
            "id": str(msg.id),
            "role": msg.role,
            "content": msg.content,
            "created_at": msg.created_at.isoformat() if msg.created_at else None
        }
        for msg in messages
    ]

@app.post("/api/ask", response_model=ExpatResponse)
async def ask_consultant(request: ExpatRequest, http_request: Request, db: AsyncSession = Depends(get_db)):
    user_id = http_request.session.get('user_id')
    if not user_id:
        raise HTTPException(status_code=401, detail="Not logged in.")

    try:
        # 1. Save the USER'S question using SQLAlchemy
        user_msg = ChatMessage(user_id=user_id, role="user", content=request.question)
        db.add(user_msg)
        await db.commit()

        # 2. Call the AI Engine
        result = await ai_engine.ainvoke({"user_query": request.question})
        ai_advice = result.get("final_advice", "I encountered an error.")

        # 3. Save the AI'S answer using SQLAlchemy
        ai_msg = ChatMessage(user_id=user_id, role="ai", content=ai_advice)
        db.add(ai_msg)
        await db.commit()
        
        return ExpatResponse(
            profile=result.get("profile", "Unknown"),
            category=result.get("category", "general"),
            advice=ai_advice
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
@app.post("/api/saved-texts")
async def save_highlighted_text(req: SaveTextRequest, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = request.session.get('user_id')
    if not user_id: raise HTTPException(status_code=401)
    
    new_text = SavedText(user_id=user_id, content=req.content)
    db.add(new_text)
    await db.commit()
    return {"status": "success"}


@app.get("/api/saved-texts")
async def get_saved_texts(request: Request, db: AsyncSession = Depends(get_db)):
    user_id = request.session.get('user_id')
    if not user_id: raise HTTPException(status_code=401)

    # Perform a SQL JOIN to get the text AND its category name!
    stmt = (
        select(SavedText, Category.name.label("category_name"))
        .outerjoin(Category, SavedText.category_id == Category.id)
        .where(SavedText.user_id == user_id)
        .order_by(SavedText.created_at.desc())
    )
    result = await db.execute(stmt)
    rows = result.all()
    
    return [
        {
            "id": str(row.SavedText.id),
            "content": row.SavedText.content,
            "category_id": str(row.SavedText.category_id) if row.SavedText.category_id else None,
            "category_name": row.category_name,
            "created_at": row.SavedText.created_at.isoformat() if row.SavedText.created_at else None
        }
        for row in rows
    ]
    
@app.patch("/api/saved-texts/{item_id}")
async def assign_category_to_text(item_id: str, req: UpdateTextCategoryRequest, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = request.session.get('user_id')
    if not user_id: raise HTTPException(status_code=401)

    result = await db.execute(select(SavedText).where(SavedText.id == item_id, SavedText.user_id == user_id))
    saved_text = result.scalars().first()
    if not saved_text: raise HTTPException(status_code=404)

    saved_text.category_id = req.category_id
    await db.commit()
    return {"status": "success"}    
    
# --- CATEGORY ROUTES ---
@app.get("/api/categories")
async def get_categories(request: Request, db: AsyncSession = Depends(get_db)):
    user_id = request.session.get('user_id')
    if not user_id: return []
    result = await db.execute(select(Category).where(Category.user_id == user_id).order_by(Category.name))
    cats = result.scalars().all()
    return [{"id": str(c.id), "name": c.name} for c in cats]

@app.post("/api/categories")
async def create_category(req: CategoryCreateRequest, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = request.session.get('user_id')
    if not user_id: raise HTTPException(status_code=401)
    
    new_cat = Category(user_id=user_id, name=req.name)
    db.add(new_cat)
    await db.commit()
    await db.refresh(new_cat)
    return {"id": str(new_cat.id), "name": new_cat.name}


