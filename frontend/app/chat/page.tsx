"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

export default function ChatPage() {
  const { user, loadingAuth } = useAuth();

  const [question, setQuestion] = useState("");

  const [chatHistory, setChatHistory] = useState<
    { role: "user" | "ai"; content: string; created_at?: string }[]
  >([]);
  const [isTyping, setIsTyping] = useState(false);

  const [highlightedText, setHighlightedText] = useState("");
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [currentSpend, setCurrentSpend] = useState<number>(0);

  useEffect(() => {
    if (user) {
      setCurrentSpend(user.total_spend || 0);
      fetch("https://belgium-expat-ai-backend.onrender.com/api/history", {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((history) => setChatHistory(history))
        .catch(() => {});
    }
  }, [user]);

  // Helper function to format the timestamp into a nice readable time
  const formatTime = (dateString?: string) => {
    if (!dateString) return "Just now";
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const askConsultant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    // Add temporarily to screen
    const newChat = [
      ...chatHistory,
      { role: "user" as const, content: question },
    ];
    setChatHistory(newChat);
    const currentQuestion = question;
    setQuestion("");
    setIsTyping(true);

    try {
      const response = await fetch(
        "https://belgium-expat-ai-backend.onrender.com/api/ask",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: currentQuestion }),
          credentials: "include",
        },
      );

      // 🛑 HANDLE CREDIT LIMIT ERRORS
      if (!response.ok) {
        if (response.status === 402)
          throw new Error(
            "Out of credits! 💳 Please upgrade your plan to continue.",
          );
        throw new Error("API Error");
      }

      const data = await response.json();

      setChatHistory((prev) => [...prev, { role: "ai", content: data.advice }]);
      setCurrentSpend(data.new_spend);

      // If we wanted to update global user state instantly here, we could,
      // but for now relying on the page refresh / AuthContext works perfectly!
    } catch (error: any) {
      setChatHistory((prev) => [
        ...prev,
        { role: "ai", content: error.message || "Connection error." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // 💳 STRIPE: Handle Upgrading to Pro
  const handleUpgrade = async () => {
    try {
      const res = await fetch(
        "https://belgium-expat-ai-backend.onrender.com/api/create-checkout-session",
        {
          method: "POST",
          credentials: "include",
        },
      );
      const data = await res.json();
      if (data.url) window.location.href = data.url; // Redirect to Stripe!
    } catch (error) {
      console.error("Checkout failed");
    }
  };

  //  STRIPE: Handle Managing Billing (Cancel/Update)
  const handleManageBilling = async () => {
    try {
      const res = await fetch(
        "https://belgium-expat-ai-backend.onrender.com/api/create-portal-session",
        {
          method: "POST",
          credentials: "include",
        },
      );
      const data = await res.json();
      if (data.url) window.location.href = data.url; // Redirect to Stripe Portal!
    } catch (error) {
      console.error("Portal failed");
    }
  };

  // Listens for text selection
  const handleSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 0) {
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      if (rect) {
        setHighlightedText(text);

        setPopupPos({
          x: rect.left + rect.width / 2,
          y: rect.top - 50,
        });
      }
    } else {
      setHighlightedText("");
      setSaveSuccess(false);
    }
  };

  const saveSnippet = async () => {
    try {
      await fetch(
        "https://belgium-expat-ai-backend.onrender.com/api/saved-texts",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: highlightedText }),
          credentials: "include",
        },
      );
      setSaveSuccess(true);
      setTimeout(() => {
        setHighlightedText("");
        setSaveSuccess(false);
        window.getSelection()?.removeAllRanges();
      }, 1000);
    } catch (error) {
      console.error("Failed to save snippet");
    }
  };

  if (loadingAuth)
    return (
      <div className="text-center mt-20 text-gray-500">
        Checking credentials...
      </div>
    );

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 text-center max-w-md">
          <div className="text-5xl mb-6">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Members Only
          </h2>
          <a
            href="https://belgium-expat-ai-backend.onrender.com/login"
            className="bg-blue-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-blue-700 transition w-full block"
          >
            Sign in with Google
          </a>
        </div>
      </div>
    );
  }

  const maxSpend = user.max_spend || 1.0;
  const spendPercent = Math.min((currentSpend / maxSpend) * 100, 100);

  const CREDIT_MULTIPLIER = 10000;
  const usedCredits = Math.round(currentSpend * CREDIT_MULTIPLIER);
  const totalCredits = Math.round(maxSpend * CREDIT_MULTIPLIER);

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[80vh]">
      <div className="bg-white border-b border-gray-200 p-6 rounded-t-2xl shadow-sm flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Digital Relocation Consultant
        </h1>

        {/* 🪙 VIRTUAL CREDIT TRACKER UI OR PRO BADGE */}
        <div className="flex flex-col items-end">
          {user.subscription_status === "pro" ? (
            <div className="flex flex-col items-end space-y-2">
              <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide border border-yellow-300 shadow-sm">
                ⭐ Pro Consultant Plan
              </span>
              <button
                onClick={handleManageBilling}
                className="text-xs text-gray-500 hover:text-gray-800 underline"
              >
                Manage Billing
              </button>
            </div>
          ) : (
            <>
              <span className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                Credits: {usedCredits.toLocaleString()} /{" "}
                {totalCredits.toLocaleString()}
              </span>
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full transition-all duration-500 ${
                    spendPercent > 80 ? "bg-red-500" : "bg-blue-600"
                  }`}
                  style={{ width: `${spendPercent}%` }}
                ></div>
              </div>
              <button
                onClick={handleUpgrade}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-md transition-all"
              >
                Upgrade to Pro
              </button>
            </>
          )}
        </div>
      </div>

      <div
        className="flex-1 bg-gray-50 p-6 overflow-y-auto border-x border-gray-200 flex flex-col space-y-6"
        onMouseUp={handleSelection}
      >
        {chatHistory.length === 0 && (
          <div className="text-center text-gray-500 my-auto">
            <div className="text-4xl mb-4">🇧🇪</div>
            <p>
              Bonjour {user.full_name.split(" ")[0]}! Ask me anything about
              moving to Belgium.
            </p>
          </div>
        )}

        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-2xl ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-sm shadow-md"
                  : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm whitespace-pre-wrap"
              }`}
            >
              {msg.content}
            </div>
            {/* The Timestamp Display */}
            <span className="text-xs text-gray-400 mt-1 px-1">
              {formatTime(msg.created_at)}
            </span>
          </div>
        ))}

        {isTyping && (
          <div className="text-gray-500 animate-pulse text-sm">
            Consulting the rulebook...
          </div>
        )}
      </div>

      {/* THE FLOATING POPUP BUTTON */}
      {highlightedText && (
        <div
          style={{
            top: popupPos.y,
            left: popupPos.x,
            transform: "translateX(-50%)",
          }}
          className="fixed z-50 bg-gray-900 text-white px-3 py-2 rounded-xl shadow-2xl flex items-center space-x-3 transition-all animate-bounce"
        >
          {saveSuccess ? (
            <span className="text-sm font-bold text-green-400">
              ✅ Saved to Notebook!
            </span>
          ) : (
            <>
              <span className="text-xs text-gray-300 truncate max-w-[150px]">
                "{highlightedText}"
              </span>
              <button
                onClick={saveSnippet}
                className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-colors"
              >
                💾 Save That
              </button>
            </>
          )}
        </div>
      )}

      <div className="bg-white p-4 rounded-b-2xl border border-gray-200 shadow-sm">
        <form onSubmit={askConsultant} className="flex space-x-4">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="flex-1 bg-gray-100 px-4 py-3 rounded-xl outline-none"
            placeholder="Ask a question..."
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={isTyping}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl"
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}
