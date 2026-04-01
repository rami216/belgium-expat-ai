# 🇧🇪 Belgium Expat AI: Digital Relocation Consultant

A professional, full-stack AI agent designed to help expats navigate the complex bureaucracy of moving to Belgium. This project features a RAG-based (Retrieval-Augmented Generation) AI engine, secure Google Authentication, and a custom credit-tracking system.

**🔗 Live Demo:** [https://belgium-expat-ai.vercel.app/](https://belgium-expat-ai.vercel.app/)

---

## 🚀 The Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **State Management:** React Context API (Global Auth & UI State)
- **Deployment:** Vercel

### Backend
- **Framework:** FastAPI (Python)
- **AI Orchestration:** LangGraph & LangChain
- **LLM:** OpenAI GPT-4o-mini
- **Database (Relational):** PostgreSQL (Hosted on DigitalOcean)
- **Vector Store:** PGVector for RAG (Retrieval of Belgian bureaucracy rules)
- **Authentication:** Google OAuth 2.0 (Authlib)
- **Deployment:** Render

---

## ✨ Key Features

- **AI Relocation Agent:** An intelligent consultant that classifies user profiles (Non-EU Student, EU Worker, etc.) and retrieves specific legal rules from a vector database.
- **Personal Notebook:** Users can highlight any text within the AI chat to instantly save it to their personal notebook for future reference.
- **Smart Categorization:** A full management system for saved snippets, allowing users to create custom categories and organize their relocation data.
- **Virtual Credit System:** A custom-built usage tracker that calculates real-time API costs (input/output tokens) and converts them into a user-friendly "Credits" display.
- **Global Auth Context:** Professional-grade authentication flow that persists user sessions across the entire application using cross-domain secure cookies.

---

## 🏗️ Architecture Overview

The project is built as a **Monorepo** with a decoupled architecture:

1.  **`frontend/`**: A React-based SPA that handles the conversational UI and notebook management.
2.  **`backend/`**: A Python API that manages the LangGraph workflow. 
    - **Node 1 (Profiler):** Analyzes the query to identify the expat's legal profile.
    - **Node 2 (Retriever):** Performs a semantic search against a PostgreSQL vector store to find relevant Belgian rules.
    - **Node 3 (Consultant):** Synthesizes the legal context into a friendly, actionable response.

---

## 🛠️ Local Development

### 1. Clone the repo
```bash
git clone [https://github.com/rami216/belgium-expat-ai.git](https://github.com/rami216/belgium-expat-ai.git)
2. Backend Setup
Bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Add your .env variables (DATABASE_URL, OPENAI_API_KEY, etc.)
uvicorn app.api:app --reload
3. Frontend Setup
Bash
cd frontend
npm install
npm run dev
⚖️ License
MIT License - feel free to use this project for your own learning!


### 📤 How to upload it:
1. Save the file.
2. In VS Code, commit the change with the message: `"docs: add professional readme"`.
3. Click **Sync Changes**.
4. Refresh your GitHub page—the repo will instantly look 10x more professional!

How does it feel to see th
