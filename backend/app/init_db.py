import os
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document

# Load our API keys from the .env file
load_dotenv()

def build_knowledge_base():
    print("📚 Initializing Belgian Expat Knowledge Base...")
    
    # These are the "Facts" our AI will use to answer user questions.
    # Later, we will swap this out to read actual PDFs from the IBZ.
    bureaucracy_rules = [
        Document(
            page_content="COMMUNE REGISTRATION (Non-EU Student): You must register at your local commune administration (e.g., Molenbeek-Saint-Jean) within 8 days of arriving in Belgium. You must bring: Passport with Type D Visa, signed lease agreement (contrat de bail), and university proof of enrollment.", 
            metadata={"category": "commune", "audience": "non-eu-student"}
        ),
        Document(
            page_content="A-CARD RENEWAL: The A-Card (Electronic residence permit for temporary stay) must be renewed between 45 and 30 days before its expiration date. You must provide a standard transcript of records proving you participated in exams.", 
            metadata={"category": "visa", "audience": "non-eu-student"}
        ),
        Document(
            page_content="BLOCKED ACCOUNT (Solvency): To prove financial solvency for a student visa, the easiest method is a blocked account via the university (e.g., VUB). You must transfer enough to cover roughly €850 per month, which is paid back to you in monthly installments.", 
            metadata={"category": "finance", "audience": "non-eu-student"}
        ),
        Document(
            page_content="HEALTH INSURANCE (Mutuelle): Registration with a health insurance fund (Mutuelle/Ziekenfonds) is mandatory. It costs roughly €100 per year and covers about 75% of standard medical expenses.", 
            metadata={"category": "health", "audience": "all"}
        )
    ]
    
    # Set up OpenAI Embeddings to turn this text into math
    embeddings = OpenAIEmbeddings()
    
    # Define where we want to save the database locally
    db_path = "./data/chroma_db"
    
    print("⚙️  Processing documents into vector embeddings...")
    # Build and save the database
    vectorstore = Chroma.from_documents(
        documents=bureaucracy_rules,
        embedding=embeddings,
        persist_directory=db_path
    )
    
    print(f"✅ Knowledge Base built successfully! Database saved to: {db_path}")

if __name__ == "__main__":
    # Make sure we have an API key before trying to run
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ ERROR: OPENAI_API_KEY is missing. Please add it to your .env file.")
    else:
        build_knowledge_base()