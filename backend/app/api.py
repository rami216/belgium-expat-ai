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
import stripe
load_dotenv()


stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
DOMAIN = "https://belgium-expat-ai.vercel.app"
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
    new_spend: float
    subscription_status: str 
    
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
        "avatar_url": db_user.avatar_url,
        "total_spend": db_user.total_spend or 0.0,
        "max_spend": float(os.getenv("MAX_SPEND_LIMIT", 1.00)),
        "subscription_status": db_user.subscription_status
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


#region checkout
@app.post("/api/create-checkout-session")
async def create_checkout_session(request: Request, db: AsyncSession = Depends(get_db)):
    user_id = request.session.get('user_id')
    if not user_id: raise HTTPException(status_code=401, detail="Not logged in.")
    
    result = await db.execute(select(User).where(User.id == user_id))
    db_user = result.scalars().first()

    try:
        checkout_session = stripe.checkout.Session.create(
            customer_email=db_user.email,
            client_reference_id=str(db_user.id), # Tells the webhook WHO paid
            payment_method_types=['card'],
            line_items=[
                {
                    'price': os.getenv('STRIPE_PRICE_ID'),
                    'quantity': 1,
                },
            ],
            mode='subscription',
            success_url=DOMAIN + '/chat?success=true',
            cancel_url=DOMAIN + '/chat?canceled=true',
        )
        return {"url": checkout_session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/create-portal-session")
async def create_portal_session(request: Request, db: AsyncSession = Depends(get_db)):
    user_id = request.session.get('user_id')
    if not user_id: raise HTTPException(status_code=401, detail="Not logged in.")
    
    result = await db.execute(select(User).where(User.id == user_id))
    db_user = result.scalars().first()

    if not db_user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No active subscription found.")

    try:
        portalSession = stripe.billing_portal.Session.create(
            customer=db_user.stripe_customer_id,
            return_url=DOMAIN + '/chat',
        )
        return {"url": portalSession.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/stripe-webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    try:
        # Construct the event safely
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # 1. Handle the checkout.session.completed event (FIRST TIME PURCHASE)
    if event.type == 'checkout.session.completed':
        session = event.data.object
        
        user_id = session.client_reference_id
        customer_id = session.customer
        
        # 🚀 ADDED: Get the email as a fallback for manual Stripe Dashboard testing
        customer_email = session.customer_details.email if session.customer_details else None

        db_user = None
        
        # Try finding by ID first (Normal App Flow)
        if user_id:
            result = await db.execute(select(User).where(User.id == user_id))
            db_user = result.scalars().first()
        # Fallback to finding by Email (Stripe Test Clock Flow)
        elif customer_email:
            result = await db.execute(select(User).where(User.email == customer_email))
            db_user = result.scalars().first()

        if db_user:
            db_user.stripe_customer_id = customer_id
            db_user.subscription_status = "pro"
            
            # 🌟 THE RESET: Wipe their usage stats clean on day 1!
            db_user.total_spend = 0.0
            db_user.total_tokens = 0
            
            await db.commit()

    
    # 2. Handle the monthly subscription renewal (MONTHLY RESET)
    elif event.type == 'invoice.payment_succeeded':
        invoice = event.data.object
        customer_id = invoice.customer
        
        # 🚀 STRIPE FIX: Safely check if it's a subscription without crashing!
        is_subscription = invoice.get('subscription') or invoice.get('billing_reason') in ['subscription_create', 'subscription_cycle']
        
        if is_subscription:
            result = await db.execute(select(User).where(User.stripe_customer_id == customer_id))
            db_user = result.scalars().first()
            if db_user:
                # 🌟 THE MONTHLY RESET: Wipe stats clean every 30 days!
                db_user.total_spend = 0.0
                db_user.total_tokens = 0
                await db.commit()

    # 3. Handle subscription cancellation (DOWNGRADE)
    elif event.type == 'customer.subscription.deleted':
        subscription = event.data.object
        customer_id = subscription.customer
        
        result = await db.execute(select(User).where(User.stripe_customer_id == customer_id))
        db_user = result.scalars().first()
        if db_user:
            db_user.subscription_status = "free"
            await db.commit()

    return {"status": "success"}
#endregion checkout
@app.post("/api/ask", response_model=ExpatResponse)
async def ask_consultant(request: ExpatRequest, http_request: Request, db: AsyncSession = Depends(get_db)):
    user_id = http_request.session.get('user_id')
    if not user_id: 
        raise HTTPException(status_code=401, detail="Not logged in.")

    # 1. FETCH USER & CHECK SPEND LIMIT
    result = await db.execute(select(User).where(User.id == user_id))
    db_user = result.scalars().first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found.")

    max_limit = float(os.getenv("MAX_SPEND_LIMIT", 1.00))
    
    # 🌟 STRIPE UPDATE: Bypass the credit check if they are on the "pro" plan
    if db_user.subscription_status != "pro" and db_user.total_spend >= max_limit:
        raise HTTPException(status_code=402, detail="Credit limit reached. Please upgrade your plan.")

    try:
        user_msg = ChatMessage(user_id=user_id, role="user", content=request.question)
        db.add(user_msg)

        # 2. CALL AI
        ai_result = await ai_engine.ainvoke({"user_query": request.question})
        ai_advice = ai_result.get("final_advice", "I encountered an error.")
        
        # 3. CALCULATE COST (GPT-4o-mini costs $0.15/1M input & $0.60/1M output)
        total_in = ai_result.get('p_in', 0) + ai_result.get('c_in', 0)
        total_out = ai_result.get('p_out', 0) + ai_result.get('c_out', 0)
        cost = (total_in * 0.00000015) + (total_out * 0.00000060)
        
        # 4. SAVE EVERYTHING
        db_user.total_tokens += (total_in + total_out)
        db_user.total_spend += cost
        
        ai_msg = ChatMessage(user_id=user_id, role="ai", content=ai_advice)
        db.add(ai_msg)
        await db.commit()
        
        return ExpatResponse(
            profile=ai_result.get("profile", "Unknown"),
            category=ai_result.get("category", "general"),
            advice=ai_advice,
            new_spend=db_user.total_spend,
            subscription_status=db_user.subscription_status 
        )
    except Exception as e:
        await db.rollback() # 🛡️ Protects the DB from crashing if the AI fails
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


#  HEALTH CHECK (To prevent Render from sleeping)
@app.get("/health")
async def health_check():
    return {"status": "alive", "message": "Relocation Consultant is awake!"}