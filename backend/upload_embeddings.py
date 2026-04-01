import os
from dotenv import load_dotenv
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import PGVector

load_dotenv()

# 1. We need the sync database URL for the upload script
# This removes the "+asyncpg" part so psycopg2 can use it
DB_URL = os.getenv("DATABASE_URL").replace("+asyncpg", "")

def migrate_to_postgres():
    print("📄 Loading your bureaucracy rules...")
    # Change "bureaucracy_rules.txt" to whatever your actual file is named!
    loader = TextLoader("bureaucracy_rules.txt")
    docs = loader.load()

    print("✂️ Splitting documents into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    splits = text_splitter.split_documents(docs)

    print("🧠 Generating OpenAI Embeddings and uploading to DigitalOcean Postgres...")
    print("⏳ This might take a minute...")
    
    # This automatically creates a table called 'langchain_pg_embedding' and uploads the vectors!
    vectorstore = PGVector.from_documents(
        documents=splits,
        embedding=OpenAIEmbeddings(),
        connection_string=DB_URL,
        collection_name="belgium_expat_rules",
        use_jsonb=True
    )
    
    print("✅ Migration Complete! Your AI's brain is now in the cloud.")

if __name__ == "__main__":
    migrate_to_postgres()