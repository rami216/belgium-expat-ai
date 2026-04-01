import os
from typing import TypedDict
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI, OpenAIEmbeddings
# 🚀 SWAPPED CHROMA FOR PGVECTOR
from langchain_community.vectorstores import PGVector
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, START, END

# Load environment variables
load_dotenv()

# ==========================================
# 1. AI & CLOUD DATABASE SETUP
# ==========================================
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
embeddings = OpenAIEmbeddings()

# 🚀 FORMAT THE URL FOR PGVECTOR
# We strip "+asyncpg" because PGVector uses standard psycopg2 for the connection string
DB_URL = os.getenv("DATABASE_URL").replace("+asyncpg", "")

if not DB_URL:
    print("❌ ERROR: DATABASE_URL is missing from your .env file!")

# 🚀 CONNECT TO DIGITALOCEAN SUPABASE
vectorstore = PGVector(
    connection_string=DB_URL,
    embedding_function=embeddings,
    collection_name="belgium_expat_rules",
    use_jsonb=True
)

class ExpatState(TypedDict):
    user_query: str
    profile: str
    category: str
    legal_context: str
    final_advice: str

# ==========================================
# 2. THE ASYNC AGENT NODES
# ==========================================
async def profiler_node(state: ExpatState):
    print("🕵️  [PROFILER]: Analyzing expat profile and request...")
    prompt = f"""Analyze this question from someone moving to Belgium: "{state['user_query']}"
    1. Extract their profile (e.g., Non-EU Student, EU Worker). If not mentioned, output 'Unknown'.
    2. Classify the topic into one word: COMMUNE, FINANCE, VISA, HEALTH, or GENERAL.
    
    Format exactly like:
    Profile: [Profile]
    Topic: [Topic]"""
    
    response = await llm.ainvoke([HumanMessage(content=prompt)])
    lines = response.content.split('\n')
    profile = lines[0].replace("Profile: ", "").strip()
    topic = lines[1].replace("Topic: ", "").strip().lower()
    return {"profile": profile, "category": topic}

async def retriever_node(state: ExpatState):
    print("☁️ [RETRIEVER]: Searching DigitalOcean Postgres for rules...")
    search_query = f"{state['category']} rules for {state['profile']}"
    
    # This automatically searches the 'langchain_pg_embedding' table in Supabase!
    results = await vectorstore.asimilarity_search(search_query, k=1)
    legal_text = results[0].page_content if results else "No specific rules found."
    return {"legal_context": legal_text}

async def consultant_node(state: ExpatState):
    print("💡 [CONSULTANT]: Drafting the relocation advice...")
    prompt = f"""You are a friendly relocation consultant for expats in Belgium.
    Question: "{state['user_query']}"
    Profile: {state['profile']}
    Rule: {state['legal_context']}
    
    Draft a helpful, clear response. Explain any French/Dutch terms."""
    
    response = await llm.ainvoke([HumanMessage(content=prompt)])
    return {"final_advice": response.content}

# ==========================================
# 3. COMPILE THE ASYNC GRAPH
# ==========================================
workflow = StateGraph(ExpatState)
workflow.add_node("profiler", profiler_node)
workflow.add_node("retriever", retriever_node)
workflow.add_node("consultant", consultant_node)

workflow.add_edge(START, "profiler")
workflow.add_edge("profiler", "retriever")
workflow.add_edge("retriever", "consultant")
workflow.add_edge("consultant", END)

# We export this as 'engine' so api.py can import it!
engine = workflow.compile()